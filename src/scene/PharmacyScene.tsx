import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';
import { getCafeTextures } from './cafeTextures';
import { StylizedHumanoid } from './StylizedCharacters';
import { getWorldGeometries } from './worldGeometries';

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
  const pharmacistWaveRef = useRef(0);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textures = useMemo(() => getCafeTextures(), []);
  const worldGeos = useMemo(() => getWorldGeometries(), []);

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
      pharmacistWaveRef.current = 2.2;
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
  const ringOpacity = (targetStep: number) => (hintVisible && step === targetStep ? 0.95 : 0.25);

  return (
    <group name="Pharmacy_Interior_Scene">
      <ContactShadows
        key={step}
        frames={1}
        position={[0, 0.896, 0.16]}
        opacity={0.34}
        scale={3.6}
        blur={2.0}
        far={0.8}
        color="#0f3f3c"
      />
      {/* Clean Mint & White Clinical Tiled Floor & Back Wall */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial
          color="#e2e8f0"
          map={textures.tileColor}
          bumpMap={textures.tileBump}
          bumpScale={0.008}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0, 2.2, -1.75]} receiveShadow>
        <boxGeometry args={[9.5, 4.6, 0.2]} />
        <meshStandardMaterial
          color="#f0fdf4"
          map={textures.tileColor}
          bumpMap={textures.tileBump}
          bumpScale={0.006}
          roughness={0.72}
        />
      </mesh>

      {/* Glowing Green Pharmacy Cross Wall Emblem (triggers selective Bloom) */}
      <group ref={crossRef} position={[0, 2.1, -1.55]}>
        <RoundedBox args={[0.7, 0.22, 0.08]} radius={0.03} smoothness={2}>
          <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.4} toneMapped={false} />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.7, 0.08]} radius={0.03} smoothness={2}>
          <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.4} toneMapped={false} />
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

      {/* Unified StylizedHumanoid Pharmacist Behind Counter (glasses, blinking, celebration wave) */}
      <StylizedHumanoid
        position={[0, 0.85, -0.68]}
        shirtColor="#ffffff"
        skinColor="#e9b896"
        hairColor="#292524"
        collarColor="#10b981"
        glasses
        glassesColor="#0f766e"
        waveTimerRef={pharmacistWaveRef}
        blinkOffset={1.3}
      />

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
        {/* Collected 1: Sculpted Digital Thermometer */}
        {step >= 1 && (
          <group position={[-0.26, 0.048, 0]} rotation={[0, 0.2, Math.PI / 2]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.024, 0.2, 8, 12]} />
              <meshPhysicalMaterial color="#f8fafc" roughness={0.22} clearcoat={0.7} />
            </mesh>
            {/* Stainless metallic sensor tip */}
            <mesh position={[0, -0.135, 0]} castShadow>
              <coneGeometry args={[0.014, 0.045, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.18} />
            </mesh>
            <mesh position={[0, 0.03, 0.024]}>
              <boxGeometry args={[0.028, 0.088, 0.008]} />
              <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}
        {/* Collected 2: First-Aid Band-Aid Box (zero Z-fighting cross + handle) */}
        {step >= 2 && (
          <group position={[0.02, 0.08, 0]}>
            <RoundedBox args={[0.24, 0.13, 0.16]} radius={0.02} smoothness={2} castShadow>
              <meshPhysicalMaterial color="#fef2f2" roughness={0.42} clearcoat={0.35} />
            </RoundedBox>
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[0.09, 0.01, 0.03]} />
              <meshStandardMaterial color="#dc2626" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.0715, 0]}>
              <boxGeometry args={[0.03, 0.01, 0.09]} />
              <meshStandardMaterial color="#dc2626" roughness={0.45} />
            </mesh>
          </group>
        )}
        {/* Collected 3: Sculpted Amber Apothecary Medicine Bottle */}
        {step >= 3 && (
          <group position={[0.28, 0.018, 0]} scale={0.78}>
            <mesh geometry={worldGeos.medicineBottle} castShadow>
              <meshPhysicalMaterial
                color="#d97706"
                roughness={0.14}
                clearcoat={0.92}
                clearcoatRoughness={0.1}
              />
            </mesh>
            {/* Crisp paper prescription label */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.101, 0.101, 0.1, 20, 1, true]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.78} />
            </mesh>
            {/* Safety cap */}
            <mesh position={[0, 0.278, 0]} castShadow>
              <cylinderGeometry args={[0.062, 0.062, 0.048, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.45} />
            </mesh>
          </group>
        )}
      </group>

      {/* STATION 1: Sculpted Digital Thermometer in Charging Dock (left) */}
      <group
        position={[-1.08, 0.896, 0.1]}
        onClick={handleItemClick(0, 'pharm_step_thermo')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 24]} />
          <meshBasicMaterial color={ringColor(0)} transparent opacity={ringOpacity(0)} />
        </mesh>
        {/* Weighted dock stand */}
        <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.075, 0.092, 0.05, 18]} />
          <meshStandardMaterial color="#0f766e" roughness={0.48} />
        </mesh>
        {/* Angled sculpted thermometer */}
        <group position={[0, 0.17, 0]} rotation={[0, 0, -0.22]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.042, 0.24, 8, 14]} />
            <meshPhysicalMaterial color="#f8fafc" roughness={0.22} clearcoat={0.72} />
          </mesh>
          {/* Metallic probe tip */}
          <mesh position={[0, -0.165, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.02, 0.06, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.16} />
          </mesh>
          {/* Recessed digital LCD screen */}
          <mesh position={[0, 0.025, 0.041]}>
            <boxGeometry args={[0.052, 0.115, 0.01]} />
            <meshStandardMaterial color="#0f172a" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.025, 0.047]}>
            <planeGeometry args={[0.04, 0.095]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.85} />
          </mesh>
        </group>
      </group>

      {/* STATION 2: First-Aid Band-Aid Box (center-back) */}
      <group
        position={[0, 0.896, -0.22]}
        onClick={handleItemClick(1, 'pharm_step_bandaid')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.27, 24]} />
          <meshBasicMaterial color={ringColor(1)} transparent opacity={ringOpacity(1)} />
        </mesh>
        <RoundedBox args={[0.34, 0.2, 0.22]} radius={0.025} smoothness={3} position={[0, 0.1, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#ffffff" roughness={0.4} clearcoat={0.4} />
        </RoundedBox>
        {/* Top carry handle */}
        <mesh position={[0, 0.215, 0]} rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.055, 0.012, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#dc2626" roughness={0.5} />
        </mesh>
        {/* Zero Z-fighting embossed red cross */}
        <mesh position={[0, 0.105, 0.114]}>
          <boxGeometry args={[0.14, 0.04, 0.01]} />
          <meshStandardMaterial color="#dc2626" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.105, 0.1155]}>
          <boxGeometry args={[0.04, 0.14, 0.01]} />
          <meshStandardMaterial color="#dc2626" roughness={0.45} />
        </mesh>
      </group>

      {/* STATION 3: Sculpted Amber Medicine Bottle (right) */}
      <group
        position={[1.08, 0.896, 0.1]}
        onClick={handleItemClick(2, 'pharm_step_done')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 24]} />
          <meshBasicMaterial color={ringColor(2)} transparent opacity={ringOpacity(2)} />
        </mesh>
        <group scale={1.15}>
          <mesh geometry={worldGeos.medicineBottle} castShadow receiveShadow>
            <meshPhysicalMaterial
              color="#d97706"
              roughness={0.12}
              clearcoat={0.95}
              clearcoatRoughness={0.08}
            />
          </mesh>
          {/* Crisp prescription label wrap + green accent stripe */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.101, 0.101, 0.105, 22, 1, true]} />
            <meshStandardMaterial color="#fffbeb" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.135, 0]}>
            <cylinderGeometry args={[0.102, 0.102, 0.018, 22, 1, true]} />
            <meshStandardMaterial color="#10b981" roughness={0.6} />
          </mesh>
          {/* Child-proof ribbed white safety cap */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.064, 0.064, 0.052, 18]} />
            <meshStandardMaterial color="#f8fafc" bumpMap={textures.clayBump} bumpScale={0.004} roughness={0.42} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
