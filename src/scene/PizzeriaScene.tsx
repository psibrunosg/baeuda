import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';
import { getCafeTextures } from './cafeTextures';
import { StylizedHumanoid } from './StylizedCharacters';
import { getWorldGeometries } from './worldGeometries';

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
  const chefWaveRef = useRef(0);
  const steamGroupRef = useRef<THREE.Group>(null);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textures = useMemo(() => getCafeTextures(), []);
  const worldGeos = useMemo(() => getWorldGeometries(), []);

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
      ovenGlowRef.current.emissiveIntensity = 1.45 + Math.sin(t * 6) * 0.35;
    }
    if (steamGroupRef.current && step >= 4) {
      steamGroupRef.current.children.forEach((child, idx) => {
        const phase = (t * 0.75 + idx * 0.33) % 1;
        child.position.y = 0.14 + phase * 0.42;
        child.position.x = Math.sin(t * 2.2 + idx * 2.1) * 0.08;
        const s = 0.55 + Math.sin(phase * Math.PI) * 0.65;
        child.scale.setScalar(s);
      });
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
      chefWaveRef.current = 2.2;
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
  const ringOpacity = (targetStep: number) => (hintVisible && step === targetStep ? 0.95 : 0.25);

  return (
    <group name="Pizzeria_Interior_Scene">
      <ContactShadows
        key={step}
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

      {/* Sculpted Domed Tuscan Brick Pizza Oven with Arched Firebox & Glowing Logs */}
      <group position={[0, 0.58, -1.34]}>
        {/* Stone hearth base */}
        <RoundedBox args={[2.28, 0.16, 1.18]} radius={0.03} smoothness={2} position={[0, 0.08, 0.1]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#e7dfd3"
            map={textures.marbleColor}
            bumpMap={textures.marbleBump}
            bumpScale={0.012}
            roughness={0.62}
          />
        </RoundedBox>
        {/* Rounded brick masonry dome behind the arch */}
        <mesh position={[0, 0.78, -0.18]} scale={[1.04, 0.92, 0.85]} castShadow receiveShadow>
          <sphereGeometry args={[0.98, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial
            color="#d67858"
            map={textures.brickColor}
            bumpMap={textures.brickBump}
            bumpScale={0.022}
            roughness={0.86}
          />
        </mesh>
        {/* Arched brick front facade */}
        <mesh geometry={worldGeos.ovenArchFrame} position={[0, 0.16, 0.18]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#d97a58"
            map={textures.brickColor}
            bumpMap={textures.brickBump}
            bumpScale={0.022}
            roughness={0.85}
          />
        </mesh>
        {/* Recessed dark fire chamber + glowing embers & crossed oak logs */}
        <mesh position={[0, 0.54, 0.06]}>
          <boxGeometry args={[0.98, 0.72, 0.22]} />
          <meshStandardMaterial color="#1f120b" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.34, 0.24]} rotation={[0.1, 0.4, 0.12]}>
          <cylinderGeometry args={[0.045, 0.05, 0.44, 10]} />
          <meshStandardMaterial color="#451a03" roughness={0.92} />
        </mesh>
        <mesh position={[0.04, 0.36, 0.22]} rotation={[-0.1, -0.5, -0.14]}>
          <cylinderGeometry args={[0.042, 0.048, 0.42, 10]} />
          <meshStandardMaterial color="#3b1504" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.48, 0.24]} scale={[1.15, 0.9, 0.55]}>
          <sphereGeometry args={[0.26, 16, 12]} />
          <meshStandardMaterial
            ref={ovenGlowRef}
            color="#fb923c"
            emissive="#f97316"
            emissiveIntensity={1.55}
            toneMapped={false}
            roughness={0.3}
          />
        </mesh>
        {/* Flue chimney */}
        <mesh position={[0, 1.82, -0.05]} castShadow>
          <cylinderGeometry args={[0.24, 0.32, 0.85, 16]} />
          <meshStandardMaterial
            color="#a94a2b"
            map={textures.brickColor}
            bumpMap={textures.brickBump}
            bumpScale={0.018}
            roughness={0.86}
          />
        </mesh>
      </group>

      {/* Unified StylizedHumanoid Chef Behind the Counter (blinking, breathing, waving on pizza completion) */}
      <StylizedHumanoid
        position={[0, 0.85, -0.68]}
        shirtColor="#ffffff"
        skinColor="#f3c6a5"
        collarColor="#dc2626"
        mustacheColor="#4b2e1e"
        hat="toque"
        hatColor="#ffffff"
        waveTimerRef={chefWaveRef}
        blinkOffset={0.4}
      />

      {/* Wooden Marble Prep Counter */}
      <RoundedBox args={[3.4, 0.86, 1.15]} radius={0.04} smoothness={3} position={[0, 0.43, 0.15]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#a36238"
          map={textures.woodCounterColor}
          bumpMap={textures.woodCounterBump}
          bumpScale={0.014}
          roughness={0.8}
        />
      </RoundedBox>
      <RoundedBox args={[3.5, 0.07, 1.24]} radius={0.02} smoothness={2} position={[0, 0.86, 0.15]} receiveShadow>
        <meshPhysicalMaterial
          color="#ffffff"
          map={textures.marbleColor}
          bumpMap={textures.marbleBump}
          bumpScale={0.005}
          roughness={0.28}
          clearcoat={0.38}
        />
      </RoundedBox>

      {/* Rising Steam Puffs when hot pizza is complete */}
      {step >= 4 && (
        <group ref={steamGroupRef} position={[0, 0.96, 0.24]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.15 + i * 0.12, 0]}>
              <sphereGeometry args={[0.065, 10, 10]} />
              <meshStandardMaterial color="#fffbeb" transparent opacity={0.42} roughness={1} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}

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
        {/* Layer 3: Melted Mozzarella Cheese with organic pools */}
        {step >= 3 && (
          <group position={[0, 0.062, 0]}>
            <mesh>
              <cylinderGeometry args={[0.295, 0.3, 0.014, 24]} />
              <meshStandardMaterial
                color="#fde047"
                bumpMap={textures.clayBump}
                bumpScale={0.006}
                roughness={0.42}
              />
            </mesh>
            {[
              [-0.14, 0.06],
              [0.14, 0.05],
              [0.02, -0.14],
              [-0.08, -0.11],
              [0.09, 0.14],
            ].map(([mx, mz], i) => (
              <mesh key={`m-${i}`} position={[mx, 0.008, mz]} scale={[1.2, 0.32, 0.95]}>
                <sphereGeometry args={[0.062, 12, 10]} />
                <meshStandardMaterial color="#fef9c3" roughness={0.38} />
              </mesh>
            ))}
          </group>
        )}
        {/* Layer 4: Pepperoni Slices + Sculpted Organic Basil Leaves */}
        {step >= 4 && (
          <group position={[0, 0.076, 0]}>
            {[
              [-0.12, -0.1],
              [0.13, -0.08],
              [-0.14, 0.11],
              [0.11, 0.13],
              [0, 0],
              [0, -0.18],
            ].map(([px, pz], i) => (
              <mesh key={i} position={[px, 0, pz]} castShadow>
                <cylinderGeometry args={[0.055, 0.055, 0.012, 14]} />
                <meshStandardMaterial color="#b91c1c" bumpMap={textures.clayBump} bumpScale={0.004} roughness={0.44} />
              </mesh>
            ))}
            {[
              [-0.06, 0.05],
              [0.07, -0.02],
              [-0.04, -0.12],
              [0.05, 0.12],
            ].map(([bx, bz], i) => (
              <mesh
                key={`b-${i}`}
                geometry={worldGeos.organicLeaf}
                position={[bx, 0.008, bz]}
                rotation={[0.08, i * 1.35, 0]}
                scale={1.3}
                castShadow
              >
                <meshStandardMaterial color="#15803d" roughness={0.52} />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* BOWL 1: Dough (left outer) */}
      <group
        position={[-1.12, 0.896, 0.18]}
        onClick={handleIngredientClick(0, 'pizza_step_dough')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.27, 24]} />
          <meshBasicMaterial color={ringColor(0)} transparent opacity={ringOpacity(0)} />
        </mesh>
        <mesh geometry={worldGeos.prepBowl} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#f5efe6"
            bumpMap={textures.clayBump}
            bumpScale={0.004}
            roughness={0.3}
            clearcoat={0.55}
          />
        </mesh>
        <mesh position={[0, 0.125, 0]} scale={[1.05, 0.78, 1.05]} castShadow>
          <sphereGeometry args={[0.145, 16, 14]} />
          <meshStandardMaterial color="#f5d093" bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.85} />
        </mesh>
      </group>

      {/* BOWL 2: Red Tomato Sauce (left inner) */}
      <group
        position={[-0.68, 0.896, -0.14]}
        onClick={handleIngredientClick(1, 'pizza_step_sauce')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 24]} />
          <meshBasicMaterial color={ringColor(1)} transparent opacity={ringOpacity(1)} />
        </mesh>
        <mesh geometry={worldGeos.prepBowl} scale={0.92} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#ffffff"
            bumpMap={textures.clayBump}
            bumpScale={0.003}
            roughness={0.25}
            clearcoat={0.65}
          />
        </mesh>
        <mesh position={[0, 0.104, 0]}>
          <cylinderGeometry args={[0.155, 0.14, 0.022, 20]} />
          <meshPhysicalMaterial color="#dc2626" roughness={0.22} clearcoat={0.75} />
        </mesh>
      </group>

      {/* BOWL 3: Yellow Cheese (right inner) */}
      <group
        position={[0.68, 0.896, -0.14]}
        onClick={handleIngredientClick(2, 'pizza_step_cheese')}
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
        <mesh geometry={worldGeos.prepBowl} scale={0.92} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#ffffff"
            bumpMap={textures.clayBump}
            bumpScale={0.003}
            roughness={0.25}
            clearcoat={0.65}
          />
        </mesh>
        <mesh position={[0, 0.115, 0]} scale={[1.06, 0.72, 1.06]} castShadow>
          <sphereGeometry args={[0.132, 14, 12]} />
          <meshStandardMaterial color="#fde047" bumpMap={textures.clayBump} bumpScale={0.009} roughness={0.62} />
        </mesh>
      </group>

      {/* BOWL 4: Pepperoni & Organic Basil (right outer) */}
      <group
        position={[1.12, 0.896, 0.18]}
        onClick={handleIngredientClick(3, 'pizza_step_done')}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.27, 24]} />
          <meshBasicMaterial color={ringColor(3)} transparent opacity={ringOpacity(3)} />
        </mesh>
        <mesh geometry={worldGeos.prepBowl} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#f5efe6"
            bumpMap={textures.clayBump}
            bumpScale={0.004}
            roughness={0.3}
            clearcoat={0.55}
          />
        </mesh>
        {[
          [-0.06, 0.118, -0.04],
          [0.06, 0.118, 0.03],
          [0, 0.13, -0.01],
        ].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.015, 14]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.48} />
          </mesh>
        ))}
        <mesh
          geometry={worldGeos.organicLeaf}
          position={[0.05, 0.145, -0.05]}
          rotation={[0.25, 0.5, 0]}
          scale={1.55}
          castShadow
        >
          <meshStandardMaterial color="#15803d" roughness={0.52} />
        </mesh>
      </group>
    </group>
  );
});
