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

/**
 * Unique Veterinarian NPC: sky-blue scrubs, stethoscope around neck, warm smile.
 */
function VetNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
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
      const targetZ = waving ? -2.15 + Math.sin(t * 10) * 0.35 : -0.22 + Math.sin(t * 2) * 0.05;
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetZ, dt * 8);
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.9) * 0.04;
    }
  });

  return (
    <group>
      <mesh position={[-0.052, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#0369a1" roughness={0.7} />
      </mesh>
      <mesh position={[0.052, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#0369a1" roughness={0.7} />
      </mesh>
      {/* Sky-blue vet scrubs */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.22, 8, 12]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.84} />
      </mesh>
      {/* Dark stethoscope around neck */}
      <mesh position={[0, 0.44, 0.02]} rotation={[0.35, 0, 0]}>
        <torusGeometry args={[0.082, 0.014, 8, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>
      <group position={[-0.15, 0.4, 0.01]} rotation={[0.15, 0, 0.2]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.84} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.037, 10, 10]} />
          <meshStandardMaterial color="#f2c4a2" roughness={0.82} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.15, 0.41, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.84} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.037, 10, 10]} />
          <meshStandardMaterial color="#f2c4a2" roughness={0.82} />
        </mesh>
      </group>
      <group ref={headRef} position={[0, 0.64, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.132, 16, 16]} />
          <meshStandardMaterial color="#f2c4a2" roughness={0.82} />
        </mesh>
        <mesh position={[-0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.06, -0.015]} castShadow>
          <sphereGeometry args={[0.138, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SHOP 7: Pet Shop & Clínica Veterinária (Vet & Pet Shop)
 * Mounted on the Far North-West boulevard facing +z.
 * 4 interactive everyday props + clickable Vet profession:
 * 1) Vet NPC -> opens "What is this job?" (Vet)
 * 2) Wagging Golden Puppy -> hops & opens "What animal is this?" (Dog)
 * 3) Pet Food Bowl & Bag -> fills kibble ("Pet food! Feed the puppy!", collects 🦴)
 * 4) Red Rubber Toy Ball -> bounces ("Red ball! Play with the dog!")
 */
export function InteractivePetShop({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const [bowlFilled, setBowlFilled] = useState(false);

  const dogRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const dogHopRef = useRef(0);
  const ballBounceRef = useRef(0);
  const npcWaveRef = useRef(0);

  const glow = isNight ? 1.5 : 0.65;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (tailRef.current) {
      const speed = dogHopRef.current > 0 ? 18 : 8;
      tailRef.current.rotation.z = Math.sin(t * speed) * 0.45;
    }
    if (dogHopRef.current > 0) {
      dogHopRef.current = Math.max(0, dogHopRef.current - dt * 1.6);
      if (dogRef.current) {
        dogRef.current.position.y = Math.sin(dogHopRef.current * Math.PI) * 0.16;
      }
    } else if (dogRef.current) {
      dogRef.current.position.y = 0;
    }
    if (ballBounceRef.current > 0) {
      ballBounceRef.current = Math.max(0, ballBounceRef.current - dt * 1.4);
      if (ballRef.current) {
        ballRef.current.position.y = 0.12 + Math.abs(Math.sin(ballBounceRef.current * Math.PI * 2)) * 0.24;
      }
    } else if (ballRef.current) {
      ballRef.current.position.y = 0.12;
    }
  });

  return (
    <group name="Shop_Interactive_PetShop" position={position} rotation={[0, rotationY, 0]}>
      {/* Warm Cream & Sky-Blue Pet Shop Building */}
      <RoundedBox args={[2.45, 2.02, 1.8]} radius={0.04} smoothness={2} position={[0, 1.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e0f2fe" bumpMap={textures.plasterBump} bumpScale={0.008} roughness={0.84} />
      </RoundedBox>
      {/* Warm Orange Roof Cap */}
      <RoundedBox args={[2.62, 0.24, 1.96]} radius={0.04} smoothness={2} position={[0, 2.13, 0]} castShadow>
        <meshStandardMaterial color="#ea580c" roughness={0.78} />
      </RoundedBox>

      {/* Iconic 3D Golden Paw Print Roof Emblem (zero text) */}
      <group position={[0, 2.48, 0.65]}>
        <mesh castShadow>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#facc15" roughness={0.45} />
        </mesh>
        {[
          [-0.14, 0.14, 0],
          [0, 0.19, 0],
          [0.14, 0.14, 0],
        ].map(([px, py, pz], idx) => (
          <mesh key={idx} position={[px, py, pz]} castShadow>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color="#facc15" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* Warm Lit Pet Shop Window (+z) */}
      <group position={[0, 0.98, 0.92]}>
        <RoundedBox args={[1.72, 0.9, 0.07]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#fff8ee" roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.56, 0.76]} />
          <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={glow} />
        </mesh>
      </group>

      {/* INTERACTIVE 1: Wagging Golden Puppy (opens Curiosity Card: Dog!) */}
      <group
        ref={dogRef}
        position={[-0.25, 0, 1.28]}
        onClick={(e) => {
          e.stopPropagation();
          dogHopRef.current = 1;
          onInspectCuriosity?.('city_dog');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Puppy body */}
        <mesh position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.1, 0.18, 8, 12]} />
          <meshStandardMaterial color="#d97706" roughness={0.85} />
        </mesh>
        {/* Puppy head + floppy ears */}
        <mesh position={[0.14, 0.28, 0]} castShadow>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.85} />
        </mesh>
        <mesh position={[0.13, 0.27, 0.095]} castShadow>
          <boxGeometry args={[0.055, 0.11, 0.03]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} />
        </mesh>
        <mesh position={[0.13, 0.27, -0.095]} castShadow>
          <boxGeometry args={[0.055, 0.11, 0.03]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} />
        </mesh>
        {/* Wagging tail */}
        <mesh ref={tailRef} position={[-0.17, 0.24, 0]} rotation={[0, 0, 0.5]} castShadow>
          <capsuleGeometry args={[0.024, 0.11, 6, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.85} />
        </mesh>
      </group>

      {/* INTERACTIVE 2: Pet Food Bowl & Kibble Bag */}
      <group
        position={[-0.86, 0, 1.24]}
        onClick={(e) => {
          e.stopPropagation();
          setBowlFilled(true);
          onTriggerAudio('world_pet_food', [position[0] - 0.86, 0.08, position[2] + 1.24]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.05, 0.12]} castShadow>
          <cylinderGeometry args={[0.14, 0.17, 0.09, 14]} />
          <meshStandardMaterial color="#2563eb" roughness={0.45} />
        </mesh>
        {bowlFilled && (
          <mesh position={[0, 0.1, 0.12]}>
            <sphereGeometry args={[0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        )}
        {/* Pet food bag */}
        <RoundedBox args={[0.26, 0.36, 0.16]} radius={0.03} smoothness={2} position={[0, 0.18, -0.14]} castShadow>
          <meshStandardMaterial color="#f97316" roughness={0.8} />
        </RoundedBox>
      </group>

      {/* INTERACTIVE 3: Bouncing Red Rubber Toy Ball */}
      <mesh
        ref={ballRef}
        position={[0.32, 0.12, 1.3]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          ballBounceRef.current = 1;
          onTriggerAudio('world_pet_toy', [position[0] + 0.32, 0.08, position[2] + 1.3]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color="#ef4444" roughness={0.35} />
      </mesh>

      {/* INTERACTIVE 4: Vet NPC (click to learn Vet profession!) */}
      <group
        position={[0.92, 0, 1.2]}
        onClick={(e) => {
          e.stopPropagation();
          npcWaveRef.current = 2.0;
          onInspectCuriosity?.('job_vet');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <VetNpc waveTimerRef={npcWaveRef} />
      </group>
    </group>
  );
}
