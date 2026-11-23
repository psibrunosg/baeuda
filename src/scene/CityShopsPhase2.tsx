import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { InteractiveShopProps } from './CityShops';
import { getCafeTextures } from './cafeTextures';

function setPointer(over: boolean) {
  document.body.style.cursor = over ? 'pointer' : 'auto';
}

/**
 * Unique Pharmacist NPC: crisp white lab coat, emerald scrub collar, warm smile, friendly wave.
 */
function PharmacistNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (waveTimerRef.current > 0) {
      waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
    }
    if (rightArmRef.current) {
      const waving = waveTimerRef.current > 0;
      const targetZ = waving ? -2.2 + Math.sin(t * 9.5) * 0.36 : -0.22 + Math.sin(t * 2) * 0.05;
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetZ, dt * 8);
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.04;
    }
  });

  return (
    <group>
      {/* Clean white clinic shoes */}
      <mesh position={[-0.052, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      <mesh position={[0.052, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      {/* Crisp White Lab Coat */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.23, 8, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.82} />
      </mesh>
      {/* Mint Scrub V-neck & Green Cross Pocket Emblem */}
      <mesh position={[0, 0.43, 0.095]}>
        <boxGeometry args={[0.09, 0.09, 0.04]} />
        <meshStandardMaterial color="#10b981" roughness={0.8} />
      </mesh>
      <mesh position={[-0.055, 0.33, 0.132]}>
        <boxGeometry args={[0.045, 0.015, 0.01]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
      <mesh position={[-0.055, 0.33, 0.132]}>
        <boxGeometry args={[0.015, 0.045, 0.01]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
      {/* Left Arm */}
      <group position={[-0.15, 0.4, 0.01]} rotation={[0.15, 0, 0.2]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.037, 10, 10]} />
          <meshStandardMaterial color="#eab996" roughness={0.82} />
        </mesh>
      </group>
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.15, 0.41, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.037, 10, 10]} />
          <meshStandardMaterial color="#eab996" roughness={0.82} />
        </mesh>
      </group>
      {/* Head + Neat Hair Bun */}
      <group ref={headRef} position={[0, 0.64, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.132, 16, 16]} />
          <meshStandardMaterial color="#eab996" roughness={0.82} />
        </mesh>
        <mesh position={[-0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.06, -0.02]} castShadow>
          <sphereGeometry args={[0.138, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#3b261d" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.12, -0.11]} castShadow>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#3b261d" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SHOP 6: Farmácia Interativa (Neighborhood Pharmacy)
 * Mounted on the North-West sidewalk facing +z toward the boulevard.
 * 4 interactive everyday props + clickable Pharmacist profession:
 * 1) Pharmacist NPC -> opens "What is this job?" (Pharmacist)
 * 2) First-Aid Box -> opens "What is in the first-aid box?" (Band-aid, collects 🩹)
 * 3) Medicine Bottle & Cup -> bounces bottle ("Medicine! Feel better soon!", collects 💊)
 * 4) Digital Thermometer Stand -> pulses glowing green/warm readout ("Thermometer! Check your temperature!")
 */
export function InteractivePharmacy({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const [tempWarm, setTempWarm] = useState(false);

  const crossRef = useRef<THREE.Group>(null);
  const bottleRef = useRef<THREE.Group>(null);
  const bottleHopRef = useRef(0);
  const npcWaveRef = useRef(0);

  const glow = isNight ? 1.8 : 0.95;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (crossRef.current) {
      crossRef.current.rotation.y = Math.sin(t * 0.9) * 0.35;
    }
    if (bottleHopRef.current > 0) {
      bottleHopRef.current = Math.max(0, bottleHopRef.current - dt * 1.8);
      if (bottleRef.current) {
        bottleRef.current.position.y = 0.72 + Math.sin(bottleHopRef.current * Math.PI) * 0.15;
      }
    } else if (bottleRef.current) {
      bottleRef.current.position.y = 0.72;
    }
  });

  const handleMedicineClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    bottleHopRef.current = 1;
    onTriggerAudio('world_pharmacy_medicine', [position[0] - 0.35, 0.08, position[2] + 1.25]);
  };

  const handleThermometerClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setTempWarm((prev) => !prev);
    onTriggerAudio('world_pharmacy_thermometer', [position[0] + 0.35, 0.08, position[2] + 1.25]);
  };

  return (
    <group name="Shop_Interactive_Pharmacy" position={position} rotation={[0, rotationY, 0]}>
      {/* Clean White & Mint Pharmacy Building */}
      <RoundedBox args={[2.45, 2.05, 1.8]} radius={0.04} smoothness={2} position={[0, 1.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f8fafc" bumpMap={textures.plasterBump} bumpScale={0.008} roughness={0.8} />
      </RoundedBox>
      {/* Emerald Roof Trim & Mint Accent Stripe */}
      <RoundedBox args={[2.62, 0.22, 1.96]} radius={0.04} smoothness={2} position={[0, 2.14, 0]} castShadow>
        <meshStandardMaterial color="#059669" roughness={0.72} />
      </RoundedBox>
      <mesh position={[0, 1.94, 0.92]}>
        <boxGeometry args={[2.46, 0.1, 0.04]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={glow * 0.6} />
      </mesh>

      {/* Iconic 3D Glowing Green Pharmacy Cross Emblem on Roof (zero text) */}
      <group ref={crossRef} position={[0, 2.55, 0.65]}>
        <RoundedBox args={[0.42, 0.15, 0.1]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color="#10b981" emissive="#22c55e" emissiveIntensity={glow} />
        </RoundedBox>
        <RoundedBox args={[0.15, 0.42, 0.1]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color="#10b981" emissive="#22c55e" emissiveIntensity={glow} />
        </RoundedBox>
      </group>

      {/* Pharmacy Glass Display Window facing street (+z) */}
      <group position={[0, 0.98, 0.92]}>
        <RoundedBox args={[1.76, 0.92, 0.07]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#0f766e" roughness={0.65} />
        </RoundedBox>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.6, 0.78]} />
          <meshStandardMaterial color="#d1fae5" emissive="#10b981" emissiveIntensity={isNight ? 1.1 : 0.4} />
        </mesh>
      </group>

      {/* Outdoor Pharmacy Counter (+z) */}
      <RoundedBox args={[1.46, 0.62, 0.46]} radius={0.03} smoothness={2} position={[-0.08, 0.31, 1.24]} castShadow receiveShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.05, 0.5]} radius={0.015} smoothness={2} position={[-0.08, 0.64, 1.24]} castShadow>
        <meshStandardMaterial color="#10b981" roughness={0.55} />
      </RoundedBox>

      {/* INTERACTIVE 1: Medicine Bottle & Cup */}
      <group
        ref={bottleRef}
        position={[-0.42, 0.72, 1.24]}
        onClick={handleMedicineClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.09, 0.22, 14]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.06, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        {/* White medicine label band */}
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.09, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </group>

      {/* INTERACTIVE 2: Digital Thermometer Stand */}
      <group
        position={[0.26, 0.68, 1.24]}
        onClick={handleThermometerClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.24, 0.28, 0.08]} radius={0.02} smoothness={2} position={[0, 0.14, 0]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.16, 0.044]}>
          <planeGeometry args={[0.16, 0.12]} />
          <meshStandardMaterial
            color={tempWarm ? '#fca5a5' : '#86efac'}
            emissive={tempWarm ? '#ef4444' : '#22c55e'}
            emissiveIntensity={1.6}
          />
        </mesh>
      </group>

      {/* INTERACTIVE 3: First-Aid Band-Aid Box on Left Pedestal (opens Curiosity Card!) */}
      <group
        position={[-1.24, 0, 0.96]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_bandaid');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.38, 0.46, 0.34]} radius={0.02} smoothness={2} position={[0, 0.23, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[0.32, 0.22, 0.22]} radius={0.025} smoothness={2} position={[0, 0.56, 0]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.45} />
        </RoundedBox>
        {/* Red First-Aid Cross */}
        <mesh position={[0, 0.56, 0.114]}>
          <boxGeometry args={[0.12, 0.04, 0.01]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0.56, 0.114]}>
          <boxGeometry args={[0.04, 0.12, 0.01]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* INTERACTIVE 4: Pharmacist NPC (click to learn Pharmacist profession!) */}
      <group
        position={[0.98, 0, 1.18]}
        onClick={(e) => {
          e.stopPropagation();
          npcWaveRef.current = 2.0;
          onInspectCuriosity?.('job_pharmacist');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <PharmacistNpc waveTimerRef={npcWaveRef} />
      </group>
    </group>
  );
}
