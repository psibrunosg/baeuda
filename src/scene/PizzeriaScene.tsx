import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';
import { getCafeTextures } from './cafeTextures';

export interface PizzeriaSceneProps {
  visible: boolean;
  onPlayAudio: (key: SpeechKey) => void;
  onComplete: () => void;
}

function setPointer(active: boolean) {
  document.body.style.cursor = active ? 'pointer' : 'auto';
}

export const PizzeriaScene = memo(function PizzeriaScene({
  visible,
  onPlayAudio,
  onComplete,
}: PizzeriaSceneProps) {
  // 0: empty peel, 1: dough, 2: sauce, 3: cheese, 4: pepperoni+basil (done!)
  const [step, setStep] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const pizzaGroupRef = useRef<THREE.Group>(null);
  const ovenGlowRef = useRef<THREE.MeshStandardMaterial>(null);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setHintVisible(false);
      completedRef.current = false;
      onPlayAudio('pizza_kitchen_intro');
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

  // 5s hesitation delay before highlighting the target bowl (no t=0s spoiler)
  useEffect(() => {
    if (!visible || step >= 4) {
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
    if (pizzaGroupRef.current && step >= 1) {
      pizzaGroupRef.current.rotation.y += dt * (step >= 4 ? 1.4 : 0.35);
      if (step >= 4) {
        pizzaGroupRef.current.position.y = 0.89 + Math.sin(t * 4) * 0.018;
      } else {
        pizzaGroupRef.current.position.y = 0.89;
      }
    }
    if (ovenGlowRef.current) {
      ovenGlowRef.current.emissiveIntensity = 1.1 + Math.sin(t * 6) * 0.28;
    }
  });

  if (!visible) return null;

  const handleIngredientClick = (requiredStep: number, audioKey: SpeechKey) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (completedRef.current) return;
    if (step !== requiredStep) {
      playSoftErrorTone();
      setHintVisible(true);
      const hints: SpeechKey[] = [
        'pizza_kitchen_intro',
        'pizza_step_dough',
        'pizza_step_sauce',
        'pizza_step_cheese',
        'pizza_step_done',
      ];
      onPlayAudio(hints[step] ?? 'pizza_kitchen_intro');
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    onPlayAudio(audioKey);
    if (nextStep >= 4) {
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

  const ringColor = (targetStep: number) => (hintVisible && step === targetStep ? '#fbbf24' : '#cbd5e1');

  return (
    <group name="Pizzeria_Interior_Scene">
      <ContactShadows
        frames={1}
        position={[0, 0.895, 0.16]}
        opacity={0.38}
        scale={3.6}
        blur={2.1}
        far={0.8}
        color="#3b1d0f"
      />
      {/* Warm Tuscan Brick Floor & Back Wall */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial
          color="#e2c9af"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.012}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0, 2.2, -1.75]} receiveShadow>
        <boxGeometry args={[9.5, 4.6, 0.2]} />
        <meshStandardMaterial
          color="#f5e6d3"
          map={textures.plasterColor}
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.88}
        />
      </mesh>

      {/* Brick Pizza Oven Dome in Background */}
      <group position={[0, 1.05, -1.3]}>
        <RoundedBox args={[2.1, 1.5, 0.9]} radius={0.12} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color="#9a3412" roughness={0.86} />
        </RoundedBox>
        {/* Glowing Oven Arch */}
        <mesh position={[0, -0.08, 0.44]}>
          <boxGeometry args={[1.1, 0.68, 0.08]} />
          <meshStandardMaterial
            ref={ovenGlowRef}
            color="#f97316"
            emissive="#ea580c"
            emissiveIntensity={1.2}
            roughness={0.4}
          />
        </mesh>
        {/* Chimney */}
        <mesh position={[0, 1.15, -0.1]} castShadow>
          <cylinderGeometry args={[0.26, 0.34, 1.0, 14]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.85} />
        </mesh>
      </group>

      {/* Chef Character Behind the Counter */}
      <group position={[0, 0.85, -0.68]}>
        <mesh position={[0, 0.34, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.26, 8, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.82} />
        </mesh>
        {/* Red neckerchief */}
        <mesh position={[0, 0.5, 0.05]} rotation={[0.25, 0, 0]}>
          <torusGeometry args={[0.11, 0.025, 8, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <sphereGeometry args={[0.145, 16, 16]} />
          <meshStandardMaterial color="#f3c6a5" roughness={0.75} />
        </mesh>
        {/* Tall Chef Toque Hat */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.11, 0.14, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.96, 0]} castShadow>
          <sphereGeometry args={[0.155, 14, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* Wooden Marble Prep Counter */}
      <RoundedBox args={[3.4, 0.86, 1.15]} radius={0.04} smoothness={3} position={[0, 0.43, 0.15]} castShadow receiveShadow>
        <meshStandardMaterial color="#78350f" roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[3.5, 0.07, 1.24]} radius={0.02} smoothness={2} position={[0, 0.86, 0.15]} receiveShadow>
        <meshStandardMaterial color="#f5f5f4" roughness={0.45} />
      </RoundedBox>

      {/* Center Wooden Pizza Peel + Progressive 3D Pizza */}
      <group position={[0, 0.9, 0.24]}>
        {/* Wooden peel board */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.028, 24]} />
          <meshStandardMaterial color="#d4a373" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[0.1, 0.025, 0.28]} />
          <meshStandardMaterial color="#b07d4f" roughness={0.8} />
        </mesh>
      </group>

      <group ref={pizzaGroupRef} position={[0, 0.89, 0.24]}>
        {/* Layer 1: Golden Dough */}
        {step >= 1 && (
          <group>
            <mesh position={[0, 0.032, 0]} castShadow>
              <cylinderGeometry args={[0.35, 0.36, 0.03, 24]} />
              <meshStandardMaterial color="#f5d093" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.34, 0.028, 10, 24]} />
              <meshStandardMaterial color="#eab364" roughness={0.8} />
            </mesh>
          </group>
        )}
        {/* Layer 2: Red Tomato Sauce */}
        {step >= 2 && (
          <mesh position={[0, 0.052, 0]}>
            <cylinderGeometry args={[0.31, 0.31, 0.012, 22]} />
            <meshStandardMaterial color="#dc2626" roughness={0.55} />
          </mesh>
        )}
        {/* Layer 3: Melted Yellow Cheese */}
        {step >= 3 && (
          <mesh position={[0, 0.062, 0]}>
            <cylinderGeometry args={[0.295, 0.3, 0.014, 22]} />
            <meshStandardMaterial color="#facc15" roughness={0.48} />
          </mesh>
        )}
        {/* Layer 4: Pepperoni Slices + Green Basil Leaves */}
        {step >= 4 && (
          <group position={[0, 0.074, 0]}>
            {[
              [-0.12, -0.1],
              [0.13, -0.08],
              [-0.14, 0.11],
              [0.11, 0.13],
              [0, 0],
              [0, -0.18],
            ].map(([px, pz], i) => (
              <mesh key={i} position={[px, 0, pz]} castShadow>
                <cylinderGeometry args={[0.055, 0.055, 0.012, 12]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.5} />
              </mesh>
            ))}
            {[
              [-0.06, 0.05],
              [0.07, -0.02],
              [-0.04, -0.12],
            ].map(([bx, bz], i) => (
              <mesh key={`b-${i}`} position={[bx, 0.01, bz]} rotation={[0, i * 1.1, 0]}>
                <boxGeometry args={[0.05, 0.008, 0.028]} />
                <meshStandardMaterial color="#16a34a" roughness={0.6} />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* BOWL 1: Dough (left outer) */}
      <group
        position={[-1.12, 0.91, 0.18]}
        onClick={handleIngredientClick(0, 'pizza_step_dough')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.21, 0.26, 24]} />
          <meshBasicMaterial color={ringColor(0)} transparent opacity={step === 0 ? 0.95 : 0.35} />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.14, 0.12, 16]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <sphereGeometry args={[0.15, 14, 14]} />
          <meshStandardMaterial color="#f5d093" roughness={0.85} />
        </mesh>
      </group>

      {/* BOWL 2: Red Tomato Sauce (left inner) */}
      <group
        position={[-0.68, 0.91, -0.14]}
        onClick={handleIngredientClick(1, 'pizza_step_sauce')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.19, 0.24, 24]} />
          <meshBasicMaterial color={ringColor(1)} transparent opacity={step === 1 ? 0.95 : 0.35} />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.13, 0.12, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.125, 0]}>
          <cylinderGeometry args={[0.155, 0.155, 0.02, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>

      {/* BOWL 3: Yellow Cheese (right inner) */}
      <group
        position={[0.68, 0.91, -0.14]}
        onClick={handleIngredientClick(2, 'pizza_step_cheese')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.19, 0.24, 24]} />
          <meshBasicMaterial color={ringColor(2)} transparent opacity={step === 2 ? 0.95 : 0.35} />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.13, 0.12, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.13, 0]} castShadow>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial color="#facc15" roughness={0.65} />
        </mesh>
      </group>

      {/* BOWL 4: Pepperoni & Basil (right outer) */}
      <group
        position={[1.12, 0.91, 0.18]}
        onClick={handleIngredientClick(3, 'pizza_step_done')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.21, 0.26, 24]} />
          <meshBasicMaterial color={ringColor(3)} transparent opacity={step === 3 ? 0.95 : 0.35} />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.14, 0.12, 16]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.65} />
        </mesh>
        {[
          [-0.06, 0.135, -0.04],
          [0.06, 0.135, 0.03],
          [0, 0.145, -0.01],
        ].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.015, 12]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0.05, 0.155, -0.05]} rotation={[0.3, 0.5, 0]}>
          <boxGeometry args={[0.07, 0.01, 0.04]} />
          <meshStandardMaterial color="#16a34a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
});
