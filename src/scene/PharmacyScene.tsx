import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';
import { getCafeTextures } from './cafeTextures';

export interface PharmacySceneProps {
  visible: boolean;
  onPlayAudio: (key: SpeechKey) => void;
  onComplete: () => void;
}

function setPointer(active: boolean) {
  document.body.style.cursor = active ? 'pointer' : 'auto';
}

export const PharmacyScene = memo(function PharmacyScene({
  visible,
  onPlayAudio,
  onComplete,
}: PharmacySceneProps) {
  // 0: empty tray, 1: thermometer checked, 2: band-aid added, 3: medicine added (done!)
  const [step, setStep] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const crossRef = useRef<THREE.Group>(null);
  const trayGroupRef = useRef<THREE.Group>(null);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setHintVisible(false);
      completedRef.current = false;
      onPlayAudio('pharm_intro');
    } else {
      document.body.style.cursor = 'auto';
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, onPlayAudio]);

  // 5s hesitation delay before highlighting the target medical item (no t=0s spoiler)
  useEffect(() => {
    if (!visible || step >= 3) {
      setHintVisible(false);
      return;
    }
    setHintVisible(false);
    const id = setTimeout(() => setHintVisible(true), 5000);
    return () => clearTimeout(id);
  }, [visible, step]);

  useFrame((state, delta) => {
    if (!visible) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (crossRef.current) {
      crossRef.current.rotation.y = Math.sin(t * 1.1) * 0.25;
    }
    if (trayGroupRef.current) {
      if (step >= 3) {
        trayGroupRef.current.position.y = 0.9 + Math.sin(t * 4.2) * 0.016;
        trayGroupRef.current.rotation.y += dt * 0.9;
      } else {
        trayGroupRef.current.position.y = 0.9;
        trayGroupRef.current.rotation.y = THREE.MathUtils.damp(trayGroupRef.current.rotation.y, 0, 6, dt);
      }
    }
  });

  if (!visible) return null;

  const handleItemClick = (requiredStep: number, audioKey: SpeechKey) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (completedRef.current) return;
    if (step !== requiredStep) {
      playSoftErrorTone();
      setHintVisible(true);
      const hints: SpeechKey[] = [
        'pharm_intro',
        'pharm_step_thermo',
        'pharm_step_bandaid',
        'pharm_step_done',
      ];
      onPlayAudio(hints[step] ?? 'pharm_intro');
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    onPlayAudio(audioKey);
    if (nextStep >= 3) {
      playRewardFanfare();
      if (!completedRef.current) {
        completedRef.current = true;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          onComplete();
        }, 1600);
      }
    } else {
      playSuccessChime();
    }
  };

  const ringColor = (targetStep: number) => (hintVisible && step === targetStep ? '#10b981' : '#cbd5e1');

  return (
    <group name="Pharmacy_Interior_Scene">
      <ContactShadows
        frames={1}
        position={[0, 0.896, 0.16]}
        opacity={0.34}
        scale={3.6}
        blur={2.0}
        far={0.8}
        color="#0f3f3c"
      />
      {/* Clean Mint & White Clinical Floor & Back Wall */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial
          color="#e2e8f0"
          bumpMap={textures.plasterBump}
          bumpScale={0.006}
          roughness={0.75}
        />
      </mesh>
      <mesh position={[0, 2.2, -1.75]} receiveShadow>
        <boxGeometry args={[9.5, 4.6, 0.2]} />
        <meshStandardMaterial
          color="#f0fdf4"
          map={textures.plasterColor}
          bumpMap={textures.plasterBump}
          bumpScale={0.008}
          roughness={0.82}
        />
      </mesh>

      {/* Glowing Green Pharmacy Cross Wall Emblem */}
      <group ref={crossRef} position={[0, 2.1, -1.55]}>
        <RoundedBox args={[0.7, 0.22, 0.08]} radius={0.03} smoothness={2}>
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.7, 0.08]} radius={0.03} smoothness={2}>
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.85} />
        </RoundedBox>
      </group>

      {/* Medicine Wall Shelves */}
      {[-1.55, 1.55].map((sx, i) => (
        <group key={i} position={[sx, 1.55, -1.52]}>
          <RoundedBox args={[1.2, 0.08, 0.28]} radius={0.02} smoothness={2} castShadow>
            <meshStandardMaterial color="#0f766e" roughness={0.65} />
          </RoundedBox>
          {[-0.35, 0, 0.35].map((bx, j) => (
            <mesh key={j} position={[bx, 0.16, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.22, 12]} />
              <meshStandardMaterial color={j === 1 ? '#38bdf8' : '#f8fafc'} roughness={0.45} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Pharmacist NPC Behind Counter (expressive face, glasses & arms) */}
      <group position={[0, 0.85, -0.68]}>
        <mesh position={[0, 0.34, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.26, 8, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.78} />
        </mesh>
        {/* Arms & hands */}
        {[-0.2, 0.2].map((ax, i) => (
          <group key={i} position={[ax, 0.36, 0.04]} rotation={[0.32, 0, i === 0 ? 0.18 : -0.18]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.044, 0.16, 6, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.78} />
            </mesh>
            <mesh position={[0, -0.12, 0.02]} castShadow>
              <sphereGeometry args={[0.04, 10, 10]} />
              <meshStandardMaterial color="#e9b896" roughness={0.75} />
            </mesh>
          </group>
        ))}
        {/* Mint collar */}
        <mesh position={[0, 0.5, 0.05]} rotation={[0.25, 0, 0]}>
          <torusGeometry args={[0.11, 0.025, 8, 16]} />
          <meshStandardMaterial color="#10b981" roughness={0.6} />
        </mesh>
        {/* Head + expressive face */}
        <group position={[0, 0.68, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.145, 18, 18]} />
            <meshStandardMaterial color="#e9b896" roughness={0.75} />
          </mesh>
          {/* Eyes with glossy catchlights + subtle glasses rims */}
          {[-0.048, 0.048].map((ex, i) => (
            <group key={i} position={[ex, 0.02, 0.128]}>
              <mesh>
                <sphereGeometry args={[0.018, 12, 12]} />
                <meshStandardMaterial color="#1c1917" roughness={0.15} />
              </mesh>
              <mesh position={[0.005, 0.006, 0.014]}>
                <sphereGeometry args={[0.006, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0, 0.014]}>
                <torusGeometry args={[0.032, 0.004, 8, 18]} />
                <meshStandardMaterial color="#0f766e" metalness={0.5} roughness={0.35} />
              </mesh>
            </group>
          ))}
          {/* Blush cheeks + cute nose + warm smile */}
          {[-0.08, 0.08].map((cx, i) => (
            <mesh key={`c-${i}`} position={[cx, -0.02, 0.118]}>
              <sphereGeometry args={[0.022, 10, 10]} />
              <meshStandardMaterial color="#f29489" transparent opacity={0.45} roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, -0.008, 0.142]}>
            <sphereGeometry args={[0.017, 10, 10]} />
            <meshStandardMaterial color="#d8a27c" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.048, 0.132]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.01, 0.032, 4, 8]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.5} />
          </mesh>
        </group>
        {/* Neat dark hair */}
        <mesh position={[0, 0.74, -0.02]} castShadow>
          <sphereGeometry args={[0.15, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#292524" roughness={0.85} />
        </mesh>
      </group>

      {/* Pharmacy Counter */}
      <RoundedBox args={[3.4, 0.86, 1.15]} radius={0.04} smoothness={3} position={[0, 0.43, 0.15]} castShadow receiveShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.65} />
      </RoundedBox>
      <RoundedBox args={[3.5, 0.07, 1.24]} radius={0.02} smoothness={2} position={[0, 0.86, 0.15]} receiveShadow>
        <meshStandardMaterial color="#10b981" roughness={0.45} />
      </RoundedBox>

      {/* Center Care Tray (assembled progressively) */}
      <group ref={trayGroupRef} position={[0, 0.9, 0.26]}>
        <RoundedBox args={[0.88, 0.035, 0.52]} radius={0.015} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.45} />
        </RoundedBox>
        {/* Collected 1: Thermometer */}
        {step >= 1 && (
          <group position={[-0.26, 0.05, 0]} rotation={[0, 0.2, Math.PI / 2]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.026, 0.22, 8, 12]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.03, 0.024]}>
              <boxGeometry args={[0.03, 0.09, 0.01]} />
              <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}
        {/* Collected 2: Band-aid Box */}
        {step >= 2 && (
          <group position={[0.02, 0.08, 0]}>
            <RoundedBox args={[0.24, 0.13, 0.16]} radius={0.02} smoothness={2} castShadow>
              <meshStandardMaterial color="#fef2f2" roughness={0.6} />
            </RoundedBox>
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[0.09, 0.01, 0.03]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[0.03, 0.01, 0.09]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </group>
        )}
        {/* Collected 3: Medicine Bottle */}
        {step >= 3 && (
          <group position={[0.28, 0.13, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.075, 0.075, 0.2, 16]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.125, 0]} castShadow>
              <cylinderGeometry args={[0.058, 0.058, 0.05, 14]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          </group>
        )}
      </group>

      {/* STATION 1: Digital Thermometer (left) */}
      <group
        position={[-1.08, 0.91, 0.1]}
        onClick={handleItemClick(0, 'pharm_step_thermo')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 24]} />
          <meshBasicMaterial color={ringColor(0)} transparent opacity={step === 0 ? 0.95 : 0.35} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[0, 0, -0.25]} castShadow>
          <capsuleGeometry args={[0.045, 0.26, 8, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
        <mesh position={[0.02, 0.18, 0.044]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.05, 0.11, 0.012]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* STATION 2: First-Aid Band-Aid Box (center-back) */}
      <group
        position={[0, 0.91, -0.22]}
        onClick={handleItemClick(1, 'pharm_step_bandaid')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.27, 24]} />
          <meshBasicMaterial color={ringColor(1)} transparent opacity={step === 1 ? 0.95 : 0.35} />
        </mesh>
        <RoundedBox args={[0.34, 0.2, 0.22]} radius={0.025} smoothness={2} position={[0, 0.11, 0]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0.12, 0.115]}>
          <boxGeometry args={[0.14, 0.04, 0.01]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0, 0.12, 0.115]}>
          <boxGeometry args={[0.04, 0.14, 0.01]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* STATION 3: Medicine Bottle (right) */}
      <group
        position={[1.08, 0.91, 0.1]}
        onClick={handleItemClick(2, 'pharm_step_done')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 24]} />
          <meshBasicMaterial color={ringColor(2)} transparent opacity={step === 2 ? 0.95 : 0.35} />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.26, 16]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.085, 0.07, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
});
