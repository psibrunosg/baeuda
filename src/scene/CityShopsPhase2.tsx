import { useMemo, useRef, useState } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useMapFrame as useFrame } from './mapVisibility';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { InteractiveShopProps } from './CityShops';
import { getCafeTextures } from './cafeTextures';
import { StylizedHumanoid } from './StylizedCharacters';

function setPointer(over: boolean) {
  document.body.style.cursor = over ? 'pointer' : 'auto';
}

/**
 * Unique Pharmacist NPC: crisp white lab coat, emerald scrub collar, warm smile, friendly wave.
 */
function PharmacistNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
  return (
    <StylizedHumanoid
      scale={0.9}
      shirtColor="#ffffff"
      skinColor="#eab996"
      hairColor="#3b261d"
      collarColor="#10b981"
      glasses
      glassesColor="#0f766e"
      waveTimerRef={waveTimerRef}
      blinkOffset={0.2}
    />
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
  onEnterInterior,
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

      {/* Pharmacy Glass Display Window facing street (+z) — tap to enter playable 3D Pharmacy Counter */}
      <group
        position={[0, 0.98, 0.92]}
        onClick={(e) => {
          if (!onEnterInterior) return;
          e.stopPropagation();
          onEnterInterior();
        }}
        onPointerOver={(e) => {
          if (!onEnterInterior) return;
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
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
  return (
    <StylizedHumanoid
      scale={0.9}
      shirtColor="#38bdf8"
      skinColor="#f2c4a2"
      hairColor="#92400e"
      collarColor="#1e293b"
      waveTimerRef={waveTimerRef}
      blinkOffset={0.9}
    />
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

/**
 * Unique Barber NPC: black barber apron, crisp white shirt, neat mustache, friendly wave.
 */
function BarberNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
  return (
    <StylizedHumanoid
      scale={0.9}
      shirtColor="#f8fafc"
      skinColor="#dba57d"
      hairColor="#27272a"
      apronColor="#18181b"
      mustacheColor="#27272a"
      waveTimerRef={waveTimerRef}
      blinkOffset={1.6}
    />
  );
}

/**
 * SHOP 8: Barbearia Interativa (Classic Neighborhood Barber Shop)
 * Mounted on the Far North-East sidewalk facing +z.
 * 4 interactive everyday props + clickable Barber profession:
 * 1) Spinning Red-White-Blue Barber Pole ("Barber shop! Time for a haircut!")
 * 2) Swivel Leather Barber Chair ("Sit in the chair! Cut your hair!")
 * 3) Silver Scissors & Comb Tray -> opens Curiosity Card ("What tool cuts hair?", collects ✂️)
 * 4) Barber NPC -> opens Curiosity Card ("What is this job?" -> Barber)
 */
export function InteractiveBarberShop({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);

  const poleRef = useRef<THREE.Group>(null);
  const chairRef = useRef<THREE.Group>(null);
  const poleBoostRef = useRef(0);
  const chairSpinRef = useRef(0);
  const npcWaveRef = useRef(0);

  const glow = isNight ? 1.5 : 0.65;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (poleBoostRef.current > 0) {
      poleBoostRef.current = Math.max(0, poleBoostRef.current - dt * 1.2);
    }
    if (poleRef.current) {
      poleRef.current.rotation.y += dt * (1.8 + poleBoostRef.current * 6.5);
    }
    if (chairSpinRef.current > 0.04) {
      chairSpinRef.current = Math.max(0, chairSpinRef.current - dt * 1.5);
      if (chairRef.current) {
        chairRef.current.rotation.y += chairSpinRef.current * dt * 6;
      }
    }
  });

  return (
    <group name="Shop_Interactive_BarberShop" position={position} rotation={[0, rotationY, 0]}>
      {/* Classic Cream & Burgundy Barber Storefront */}
      <RoundedBox args={[2.45, 2.02, 1.8]} radius={0.04} smoothness={2} position={[0, 1.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f5ebd8" bumpMap={textures.plasterBump} bumpScale={0.008} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[2.62, 0.24, 1.96]} radius={0.04} smoothness={2} position={[0, 2.13, 0]} castShadow>
        <meshStandardMaterial color="#7f1d1d" roughness={0.78} />
      </RoundedBox>
      {/* Warm Lit Barber Window (+z) */}
      <group position={[0, 0.98, 0.92]}>
        <RoundedBox args={[1.72, 0.9, 0.07]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#451a03" roughness={0.75} />
        </RoundedBox>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.56, 0.76]} />
          <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={glow} />
        </mesh>
      </group>

      {/* INTERACTIVE 1: Spinning Classic Red-White-Blue Barber Pole */}
      <group
        position={[-1.08, 0.78, 1.08]}
        onClick={(e) => {
          e.stopPropagation();
          poleBoostRef.current = 1.6;
          onTriggerAudio('world_barber_pole', [position[0] - 1.08, 0.08, position[2] + 1.08]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Chrome caps */}
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Rotating tricolor pole */}
        <group ref={poleRef}>
          <mesh castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.64, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          <mesh position={[0.075, 0, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.03, 0.6, 0.06]} />
            <meshStandardMaterial color="#dc2626" roughness={0.35} />
          </mesh>
          <mesh position={[-0.075, 0, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.03, 0.6, 0.06]} />
            <meshStandardMaterial color="#2563eb" roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 2: Swivel Burgundy Leather Barber Chair */}
      <group
        position={[-0.28, 0, 1.28]}
        onClick={(e) => {
          e.stopPropagation();
          chairSpinRef.current = 2.4;
          onTriggerAudio('world_barber_chair', [position[0] - 0.28, 0.08, position[2] + 1.28]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Chrome hydraulic pedestal */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.06, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.24, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Spinning seat & backrest */}
        <group ref={chairRef} position={[0, 0.32, 0]}>
          <RoundedBox args={[0.38, 0.1, 0.36]} radius={0.03} smoothness={2} castShadow>
            <meshStandardMaterial color="#991b1b" roughness={0.48} />
          </RoundedBox>
          <RoundedBox args={[0.36, 0.38, 0.09]} radius={0.03} smoothness={2} position={[0, 0.22, -0.15]} castShadow>
            <meshStandardMaterial color="#991b1b" roughness={0.48} />
          </RoundedBox>
        </group>
      </group>

      {/* INTERACTIVE 3: Scissors & Comb Side Table (opens Curiosity Card!) */}
      <group
        position={[0.42, 0, 1.24]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_scissors');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.38, 0.56, 0.32]} radius={0.025} smoothness={2} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#5a3827" roughness={0.8} />
        </RoundedBox>
        {/* Silver scissors blades */}
        <mesh position={[0, 0.59, 0]} rotation={[0, 0.35, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.03]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.59, 0]} rotation={[0, -0.35, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.03]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.18} />
        </mesh>
      </group>

      {/* INTERACTIVE 4: Barber NPC (click to learn Barber profession!) */}
      <group
        position={[0.96, 0, 1.2]}
        onClick={(e) => {
          e.stopPropagation();
          npcWaveRef.current = 2.0;
          onInspectCuriosity?.('job_barber');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <BarberNpc waveTimerRef={npcWaveRef} />
      </group>
    </group>
  );
}

/**
 * Unique Librarian / Bookseller NPC: cozy mustard sweater, round glasses, warm smile.
 */
function LibrarianNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
  return (
    <StylizedHumanoid
      scale={0.9}
      shirtColor="#d97706"
      skinColor="#f0bfa0"
      hairColor="#57534e"
      glasses
      glassesColor="#78350f"
      waveTimerRef={waveTimerRef}
      blinkOffset={2.2}
    />
  );
}

/**
 * SHOP 9: Livraria & Papelaria Interativa (Bookshop & Stationery)
 * Mounted on the Far South-West sidewalk facing -z toward the boulevard.
 * 4 interactive everyday props + clickable Librarian profession:
 * 1) Colorful Outdoor Bookshelf -> opens Curiosity Card ("What do you read here?" -> Book, collects 📖)
 * 2) Notebook & Yellow Pencil Stand -> wiggles pencil ("Notebook and pencil! Write your name!")
 * 3) School Backpack Pedestal -> hops backpack ("Backpack! Ready for school!")
 * 4) Librarian NPC -> opens Curiosity Card ("What is this job?" -> Librarian)
 */
export function InteractiveBookshop({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const pencilRef = useRef<THREE.Group>(null);
  const backpackRef = useRef<THREE.Group>(null);
  const pencilWiggleRef = useRef(0);
  const backpackHopRef = useRef(0);
  const npcWaveRef = useRef(0);

  const glow = isNight ? 1.5 : 0.65;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (pencilWiggleRef.current > 0) {
      pencilWiggleRef.current = Math.max(0, pencilWiggleRef.current - dt * 1.5);
      if (pencilRef.current) {
        pencilRef.current.rotation.z = -0.35 + Math.sin(pencilWiggleRef.current * Math.PI * 6) * 0.25;
      }
    }
    if (backpackHopRef.current > 0) {
      backpackHopRef.current = Math.max(0, backpackHopRef.current - dt * 1.7);
      if (backpackRef.current) {
        backpackRef.current.position.y = 0.56 + Math.sin(backpackHopRef.current * Math.PI) * 0.14;
      }
    } else if (backpackRef.current) {
      backpackRef.current.position.y = 0.56;
    }
  });

  return (
    <group name="Shop_Interactive_Bookshop" position={position} rotation={[0, rotationY, 0]}>
      {/* Warm Forest-Green & Cream Bookshop Building */}
      <RoundedBox args={[2.45, 2.02, 1.8]} radius={0.04} smoothness={2} position={[0, 1.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d9e7dc" bumpMap={textures.plasterBump} bumpScale={0.008} roughness={0.86} />
      </RoundedBox>
      <RoundedBox args={[2.62, 0.24, 1.96]} radius={0.04} smoothness={2} position={[0, 2.13, 0]} castShadow>
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </RoundedBox>

      {/* Iconic 3D Open Book Emblem on Roof (zero text) */}
      <group position={[0, 2.42, -0.62]}>
        <RoundedBox args={[0.26, 0.06, 0.34]} radius={0.01} smoothness={2} position={[-0.13, 0, 0]} rotation={[0, 0, -0.25]} castShadow>
          <meshStandardMaterial color="#fffbeb" roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.26, 0.06, 0.34]} radius={0.01} smoothness={2} position={[0.13, 0, 0]} rotation={[0, 0, 0.25]} castShadow>
          <meshStandardMaterial color="#fffbeb" roughness={0.7} />
        </RoundedBox>
      </group>

      {/* Cozy Lit Bookshop Window facing street (-z) */}
      <group position={[0, 0.98, -0.92]}>
        <RoundedBox args={[1.72, 0.9, 0.07]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#5a3827" roughness={0.78} />
        </RoundedBox>
        <mesh position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.56, 0.76]} />
          <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={glow} />
        </mesh>
      </group>

      {/* INTERACTIVE 1: Outdoor Wooden Bookshelf (opens Curiosity Card: Book!) */}
      <group
        position={[-0.22, 0, -1.24]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_book');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.92, 0.56, 0.38]} radius={0.025} smoothness={2} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#7a4e32" roughness={0.84} />
        </RoundedBox>
        {[
          { x: -0.3, color: '#ef4444', h: 0.26 },
          { x: -0.15, color: '#2563eb', h: 0.3 },
          { x: 0, color: '#eab308', h: 0.25 },
          { x: 0.15, color: '#16a34a', h: 0.28 },
          { x: 0.3, color: '#9333ea', h: 0.27 },
        ].map((b, i) => (
          <RoundedBox
            key={i}
            args={[0.11, b.h, 0.22]}
            radius={0.01}
            smoothness={2}
            position={[b.x, 0.56 + b.h / 2, 0]}
            castShadow
          >
            <meshStandardMaterial color={b.color} roughness={0.65} />
          </RoundedBox>
        ))}
      </group>

      {/* INTERACTIVE 2: Notebook & Giant Yellow Pencil Stand */}
      <group
        position={[0.58, 0, -1.24]}
        onClick={(e) => {
          e.stopPropagation();
          pencilWiggleRef.current = 1;
          onTriggerAudio('world_book_pencil', [position[0] + 0.58, 0.08, position[2] - 1.24]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.42, 0.52, 0.34]} radius={0.02} smoothness={2} position={[0, 0.26, 0]} castShadow>
          <meshStandardMaterial color="#f5ebd8" roughness={0.82} />
        </RoundedBox>
        <group ref={pencilRef} position={[0, 0.72, 0]} rotation={[0, 0, -0.35]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.036, 0.036, 0.36, 8]} />
            <meshStandardMaterial color="#facc15" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.036, 0.09, 8]} />
            <meshStandardMaterial color="#f5d0a9" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.06, 8]} />
            <meshStandardMaterial color="#f472b6" roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 3: School Backpack Pedestal */}
      <group
        position={[1.18, 0, -0.96]}
        onClick={(e) => {
          e.stopPropagation();
          backpackHopRef.current = 1;
          onTriggerAudio('world_book_backpack', [position[0] + 1.18, 0.08, position[2] - 0.96]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.38, 0.42, 0.34]} radius={0.02} smoothness={2} position={[0, 0.21, 0]} castShadow>
          <meshStandardMaterial color="#e7dac5" roughness={0.84} />
        </RoundedBox>
        <group ref={backpackRef} position={[0, 0.56, 0]}>
          <RoundedBox args={[0.28, 0.32, 0.18]} radius={0.05} smoothness={2} castShadow>
            <meshStandardMaterial color="#dc2626" roughness={0.72} />
          </RoundedBox>
          <RoundedBox args={[0.2, 0.14, 0.08]} radius={0.03} smoothness={2} position={[0, -0.05, -0.1]}>
            <meshStandardMaterial color="#2563eb" roughness={0.72} />
          </RoundedBox>
        </group>
      </group>

      {/* INTERACTIVE 4: Librarian NPC facing street (-z) */}
      <group
        position={[-0.98, 0, -1.2]}
        rotation={[0, Math.PI, 0]}
        onClick={(e) => {
          e.stopPropagation();
          npcWaveRef.current = 2.0;
          onInspectCuriosity?.('job_librarian');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <LibrarianNpc waveTimerRef={npcWaveRef} />
      </group>
    </group>
  );
}

/**
 * Unique Pizzeria Chef NPC: white chef jacket, red neckerchief, tall chef hat, friendly wave.
 */
function ChefNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
  return (
    <StylizedHumanoid
      scale={0.9}
      shirtColor="#ffffff"
      skinColor="#e8b896"
      collarColor="#dc2626"
      mustacheColor="#4b2e1e"
      hat="toque"
      hatColor="#ffffff"
      waveTimerRef={waveTimerRef}
      blinkOffset={2.8}
    />
  );
}

/**
 * SHOP 10: Pizzaria Interativa (Neighborhood Italian Pizzeria)
 * Mounted on the Far South-East sidewalk facing -z toward the boulevard.
 * 4 interactive everyday props + clickable Chef profession:
 * 1) Hot Pepperoni Pizza Table -> opens Curiosity Card ("What food is this?" -> Pizza, collects 🍕)
 * 2) Chalkboard Menu Stand -> wiggles ("Menu! What would you like to eat?")
 * 3) Plate, Fork & Knife Bistro Table -> hops plate ("Plate, fork, and knife! Let us eat!")
 * 4) Chef NPC -> opens Curiosity Card ("What is this job?" -> Chef)
 */
export function InteractivePizzeria({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
  onEnterInterior,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const menuRef = useRef<THREE.Group>(null);
  const plateRef = useRef<THREE.Group>(null);
  const menuWiggleRef = useRef(0);
  const plateHopRef = useRef(0);
  const npcWaveRef = useRef(0);

  const glow = isNight ? 1.5 : 0.65;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (menuWiggleRef.current > 0) {
      menuWiggleRef.current = Math.max(0, menuWiggleRef.current - dt * 1.5);
      if (menuRef.current) {
        menuRef.current.rotation.z = Math.sin(menuWiggleRef.current * Math.PI * 6) * 0.14;
      }
    } else if (menuRef.current) {
      menuRef.current.rotation.z = 0;
    }
    if (plateHopRef.current > 0) {
      plateHopRef.current = Math.max(0, plateHopRef.current - dt * 1.7);
      if (plateRef.current) {
        plateRef.current.position.y = 0.56 + Math.sin(plateHopRef.current * Math.PI) * 0.12;
      }
    } else if (plateRef.current) {
      plateRef.current.position.y = 0.56;
    }
  });

  return (
    <group name="Shop_Interactive_Pizzeria" position={position} rotation={[0, rotationY, 0]}>
      {/* Warm Terracotta & Brick Italian Pizzeria */}
      <RoundedBox args={[2.45, 2.02, 1.8]} radius={0.04} smoothness={2} position={[0, 1.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f6d5b0"
          map={textures.plasterColor}
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.86}
        />
      </RoundedBox>
      <RoundedBox args={[2.62, 0.24, 1.96]} radius={0.04} smoothness={2} position={[0, 2.13, 0]} castShadow>
        <meshStandardMaterial
          color="#c2410c"
          map={textures.brickColor}
          bumpMap={textures.brickBump}
          bumpScale={0.016}
          roughness={0.82}
        />
      </RoundedBox>

      {/* Italian Red-White-Green Striped Awning facing street (-z) */}
      <group position={[0, 1.48, -1.14]} rotation={[-0.28, 0, 0]}>
        {['#16a34a', '#ffffff', '#dc2626', '#ffffff', '#16a34a'].map((color, i) => (
          <RoundedBox
            key={i}
            args={[0.43, 0.09, 0.58]}
            radius={0.02}
            smoothness={2}
            position={[-0.86 + i * 0.43, 0, 0]}
            castShadow
          >
            <meshStandardMaterial color={color} bumpMap={textures.awningBump} bumpScale={0.01} roughness={0.84} />
          </RoundedBox>
        ))}
      </group>

      {/* Iconic 3D Pizza Emblem on Roof (zero text) */}
      <group position={[0, 2.44, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.06, 18]} />
          <meshStandardMaterial color="#eab308" roughness={0.55} />
        </mesh>
        {[
          [-0.08, 0.04, -0.05],
          [0.09, 0.04, 0.04],
          [-0.02, 0.04, 0.09],
        ].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 10]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Warm Lit Pizzeria Window (-z) — tap to enter playable 3D Pizzeria Kitchen */}
      <group
        position={[0, 0.96, -0.92]}
        onClick={(e) => {
          if (!onEnterInterior) return;
          e.stopPropagation();
          onEnterInterior();
        }}
        onPointerOver={(e) => {
          if (!onEnterInterior) return;
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[1.68, 0.86, 0.07]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#7c2d12" roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.52, 0.72]} />
          <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={glow} />
        </mesh>
      </group>

      {/* INTERACTIVE 1: Hot Pizza Table (opens Curiosity Card: Pizza!) */}
      <group
        position={[-0.22, 0, -1.26]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_pizza');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.56, 10]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.05, 18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
        {/* Golden cheesy pizza with pepperoni */}
        <mesh position={[0, 0.61, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.25, 0.04, 18]} />
          <meshStandardMaterial color="#facc15" roughness={0.55} />
        </mesh>
        {[
          [-0.09, 0.635, -0.06],
          [0.1, 0.635, 0.04],
          [-0.02, 0.635, 0.1],
          [0.06, 0.635, -0.09],
        ].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <cylinderGeometry args={[0.04, 0.04, 0.015, 10]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* INTERACTIVE 2: Chalkboard Menu Stand */}
      <group
        ref={menuRef}
        position={[-0.92, 0, -1.22]}
        onClick={(e) => {
          e.stopPropagation();
          menuWiggleRef.current = 1;
          onTriggerAudio('world_pizza_menu', [position[0] - 0.92, 0.08, position[2] - 1.22]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.38, 0.62, 0.08]} radius={0.02} smoothness={2} position={[0, 0.34, 0]} castShadow>
          <meshStandardMaterial color="#5a3827" roughness={0.84} />
        </RoundedBox>
        <mesh position={[0, 0.36, -0.044]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.3, 0.48]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* INTERACTIVE 3: Plate, Fork & Knife Table */}
      <group
        position={[0.52, 0, -1.26]}
        onClick={(e) => {
          e.stopPropagation();
          plateHopRef.current = 1;
          onTriggerAudio('world_pizza_plate', [position[0] + 0.52, 0.08, position[2] - 1.26]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.56, 10]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.54, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 18]} />
          <meshStandardMaterial color="#f5ebd8" roughness={0.7} />
        </mesh>
        <group ref={plateRef} position={[0, 0.56, 0]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.15, 0.13, 0.025, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          <mesh position={[-0.2, 0.02, 0]}>
            <boxGeometry args={[0.025, 0.015, 0.18]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0.2, 0.02, 0]}>
            <boxGeometry args={[0.025, 0.015, 0.18]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 4: Chef NPC facing street (-z) */}
      <group
        position={[1.05, 0, -1.2]}
        rotation={[0, Math.PI, 0]}
        onClick={(e) => {
          e.stopPropagation();
          npcWaveRef.current = 2.0;
          onInspectCuriosity?.('job_chef');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <ChefNpc waveTimerRef={npcWaveRef} />
      </group>
    </group>
  );
}

/**
 * Unique Postal Worker NPC: royal-blue uniform, golden messenger strap, postal cap.
 */
function PostalWorkerNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
  return (
    <StylizedHumanoid
      scale={0.9}
      shirtColor="#1d4ed8"
      skinColor="#c98e6b"
      hairColor="#1e293b"
      collarColor="#facc15"
      hat="postal"
      hatColor="#1e40af"
      waveTimerRef={waveTimerRef}
      blinkOffset={3.1}
    />
  );
}

/**
 * SHOP 11: Correios & Banco Interativo (Post Office & Community Bank)
 * Mounted behind the South Pocket Park facing -z toward the crosswalk & Café.
 * 4 interactive everyday props + clickable Postal Worker profession:
 * 1) Cardboard Delivery Package -> opens Curiosity Card ("What do you send by mail?" -> Package, collects 📦)
 * 2) Glowing Blue Bank ATM -> flashes screen ("Bank ATM! Card and money!")
 * 3) Letter & Stamp Counter -> hops letter ("Letter and stamp! Mail it today!")
 * 4) Postal Worker NPC -> opens Curiosity Card ("What is this job?" -> Postal worker)
 */
export function InteractivePostBank({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const [atmActive, setAtmActive] = useState(false);

  const letterRef = useRef<THREE.Group>(null);
  const letterHopRef = useRef(0);
  const npcWaveRef = useRef(0);

  const glow = isNight ? 1.6 : 0.75;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (letterHopRef.current > 0) {
      letterHopRef.current = Math.max(0, letterHopRef.current - dt * 1.8);
      if (letterRef.current) {
        letterRef.current.position.y = 0.59 + Math.sin(letterHopRef.current * Math.PI) * 0.14;
      }
    } else if (letterRef.current) {
      letterRef.current.position.y = 0.59;
    }
  });

  return (
    <group name="Shop_Interactive_PostBank" position={position} rotation={[0, rotationY, 0]}>
      {/* Civic Sandstone & Royal-Blue Post Office / Bank Building */}
      <RoundedBox args={[2.6, 2.08, 1.72]} radius={0.04} smoothness={2} position={[0, 1.04, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#ece4d6"
          map={textures.marbleColor}
          bumpMap={textures.marbleBump}
          bumpScale={0.01}
          roughness={0.78}
        />
      </RoundedBox>
      <RoundedBox args={[2.76, 0.24, 1.88]} radius={0.04} smoothness={2} position={[0, 2.18, 0]} castShadow>
        <meshStandardMaterial color="#1e3a8a" bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.78} />
      </RoundedBox>
      {/* Golden Civic Roof Stripe & Envelope Sign */}
      <mesh position={[0, 1.98, -0.88]}>
        <boxGeometry args={[2.62, 0.1, 0.04]} />
        <meshStandardMaterial color="#eab308" metalness={0.65} roughness={0.3} />
      </mesh>
      <group position={[0, 2.5, -0.62]}>
        <RoundedBox args={[0.56, 0.36, 0.08]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color="#facc15" roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.02, -0.045]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.42, 0.24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </group>

      {/* INTERACTIVE 1: Glowing Blue Bank ATM built into left facade (-z) */}
      <group
        position={[-0.78, 0.92, -0.92]}
        onClick={(e) => {
          e.stopPropagation();
          setAtmActive((prev) => !prev);
          onTriggerAudio('world_bank_atm', [position[0] - 0.78, 0.08, position[2] - 1.15]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.62, 0.92, 0.16]} radius={0.03} smoothness={2} castShadow>
          <meshStandardMaterial color="#1d4ed8" roughness={0.45} />
        </RoundedBox>
        {/* ATM Screen */}
        <mesh position={[0, 0.14, -0.085]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.44, 0.3]} />
          <meshStandardMaterial
            color={atmActive ? '#86efac' : '#7dd3fc'}
            emissive={atmActive ? '#22c55e' : '#0ea5e9'}
            emissiveIntensity={glow + 0.5}
          />
        </mesh>
        {/* Keypad + Green Card Slot */}
        <mesh position={[0, -0.18, -0.085]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.32, 0.18]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
        </mesh>
      </group>

      {/* INTERACTIVE 2: Cardboard Delivery Package Counter (opens Curiosity Card: Package!) */}
      <group
        position={[0.12, 0, -1.16]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_package');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.56, 0.54, 0.44]} radius={0.02} smoothness={2} position={[0, 0.27, 0]} castShadow>
          <meshStandardMaterial color="#7a4e32" roughness={0.84} />
        </RoundedBox>
        <RoundedBox args={[0.38, 0.28, 0.3]} radius={0.02} smoothness={2} position={[0, 0.68, 0]} castShadow>
          <meshStandardMaterial color="#c28b5b" roughness={0.88} />
        </RoundedBox>
        {/* Packing tape stripe */}
        <mesh position={[0, 0.825, 0]}>
          <boxGeometry args={[0.39, 0.015, 0.08]} />
          <meshStandardMaterial color="#fef08a" roughness={0.5} />
        </mesh>
      </group>

      {/* INTERACTIVE 3: Stamped Letter Pedestal */}
      <group
        position={[0.72, 0, -1.16]}
        onClick={(e) => {
          e.stopPropagation();
          letterHopRef.current = 1;
          onTriggerAudio('world_post_letter', [position[0] + 0.72, 0.08, position[2] - 1.16]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.38, 0.54, 0.34]} radius={0.02} smoothness={2} position={[0, 0.27, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.78} />
        </RoundedBox>
        <group ref={letterRef} position={[0, 0.59, 0]}>
          <RoundedBox args={[0.26, 0.04, 0.18]} radius={0.01} smoothness={2} castShadow>
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </RoundedBox>
          <mesh position={[-0.08, 0.025, -0.04]}>
            <boxGeometry args={[0.05, 0.01, 0.05]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 4: Postal Worker NPC facing street (-z) */}
      <group
        position={[1.18, 0, -1.08]}
        rotation={[0, Math.PI, 0]}
        onClick={(e) => {
          e.stopPropagation();
          npcWaveRef.current = 2.0;
          onInspectCuriosity?.('job_postal');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <PostalWorkerNpc waveTimerRef={npcWaveRef} />
      </group>
    </group>
  );
}
