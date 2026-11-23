import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';

export interface InteractiveShopProps {
  position: [number, number, number];
  rotationY?: number;
  isNight: boolean;
  onTriggerAudio: (key: SpeechKey, ringPos: [number, number, number]) => void;
  onInspectCuriosity?: (curiosityId: string) => void;
}

function setPointer(over: boolean) {
  document.body.style.cursor = over ? 'pointer' : 'auto';
}

/**
 * Unique Baker NPC: tall pleated white chef toque, warm cream jacket, terracotta neckerchief,
 * rosy cheeks, friendly wave when the bakery bell rings.
 */
function BakerNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
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
      const targetZ = waving ? -2.2 + Math.sin(t * 10) * 0.35 : -0.25 + Math.sin(t * 2) * 0.06;
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetZ, dt * 8);
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.9) * 0.04;
    }
  });

  return (
    <group>
      {/* Shoes */}
      <mesh position={[-0.055, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.044, 10, 10]} />
        <meshStandardMaterial color="#422618" roughness={0.85} />
      </mesh>
      <mesh position={[0.055, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.044, 10, 10]} />
        <meshStandardMaterial color="#422618" roughness={0.85} />
      </mesh>
      {/* White Double-Breasted Baker Jacket */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.22, 8, 12]} />
        <meshStandardMaterial color="#fffaf2" roughness={0.88} />
      </mesh>
      {/* Warm Terracotta Apron & Neckerchief */}
      <RoundedBox args={[0.19, 0.2, 0.08]} radius={0.02} smoothness={2} position={[0, 0.24, 0.095]} castShadow>
        <meshStandardMaterial color="#c86b45" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.45, 0.02]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.07, 0.018, 8, 16]} />
        <meshStandardMaterial color="#b45309" roughness={0.85} />
      </mesh>
      {/* Left arm holding small wooden bread peel */}
      <group position={[-0.15, 0.4, 0.02]} rotation={[0.35, 0, 0.2]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.13, 6, 10]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#f0bfa0" roughness={0.82} />
        </mesh>
      </group>
      {/* Right arm (waves warmly) */}
      <group ref={rightArmRef} position={[0.15, 0.41, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.13, 6, 10]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#f0bfa0" roughness={0.82} />
        </mesh>
      </group>
      {/* Head + Tall White Baker Toque Hat */}
      <group ref={headRef} position={[0, 0.64, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.135, 16, 16]} />
          <meshStandardMaterial color="#f0bfa0" roughness={0.82} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.017, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.017, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        {/* Rosy cheeks */}
        <mesh position={[-0.075, -0.018, 0.105]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#f4978e" roughness={0.9} />
        </mesh>
        <mesh position={[0.075, -0.018, 0.105]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#f4978e" roughness={0.9} />
        </mesh>
        {/* Chef Toque Band & Puffy Crown */}
        <mesh position={[0, 0.13, 0]} castShadow>
          <cylinderGeometry args={[0.115, 0.11, 0.09, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.21, 0]} castShadow>
          <sphereGeometry args={[0.12, 14, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.88} />
        </mesh>
        <mesh position={[-0.06, 0.19, 0.02]} castShadow>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.9} />
        </mesh>
        <mesh position={[0.06, 0.19, -0.02]} castShadow>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SHOP 1: Padaria Artesanal Interativa (Artisan Neighborhood Bakery)
 * 3 tactile real-world learning interactions:
 * 1) Bread & Croissant Counter -> bounces fresh loaves ("Fresh bread! Warm and soft!")
 * 2) Wood-Fired Brick Oven -> flares ember glow & baking steam ("Hot oven! Baking bread!")
 * 3) Brass Counter Bell & Baker -> rings bell & baker waves ("Ding! Welcome to the bakery!")
 */
export function InteractiveBakery({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const [ovenBoost, setOvenBoost] = useState(false);

  const breadTrayRef = useRef<THREE.Group>(null);
  const bellRef = useRef<THREE.Group>(null);
  const puff1Ref = useRef<THREE.Mesh>(null);
  const puff2Ref = useRef<THREE.Mesh>(null);
  const breadBounceRef = useRef(0);
  const bellRingRef = useRef(0);
  const bakerWaveRef = useRef(0);

  const glow = isNight ? 1.5 : 0.65;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (breadBounceRef.current > 0) {
      breadBounceRef.current = Math.max(0, breadBounceRef.current - dt * 1.8);
      if (breadTrayRef.current) {
        const lift = Math.sin(breadBounceRef.current * Math.PI) * 0.14;
        breadTrayRef.current.position.y = 0.66 + lift;
        breadTrayRef.current.rotation.z = Math.sin(breadBounceRef.current * Math.PI * 3) * 0.06;
      }
    } else if (breadTrayRef.current) {
      breadTrayRef.current.position.y = 0.66;
      breadTrayRef.current.rotation.z = 0;
    }

    if (bellRingRef.current > 0) {
      bellRingRef.current = Math.max(0, bellRingRef.current - dt * 1.6);
      if (bellRef.current) {
        bellRef.current.rotation.z = Math.sin(bellRingRef.current * Math.PI * 6) * 0.25;
        bellRef.current.position.y = 0.69 + Math.sin(bellRingRef.current * Math.PI) * 0.06;
      }
    } else if (bellRef.current) {
      bellRef.current.rotation.z = 0;
      bellRef.current.position.y = 0.69;
    }

    // Rising bakery chimney steam (faster and fuller when oven is boosted)
    const speed = ovenBoost ? 0.85 : 0.45;
    if (puff1Ref.current) {
      const c = (t * speed) % 1;
      puff1Ref.current.position.y = c * 0.78;
      puff1Ref.current.scale.setScalar((ovenBoost ? 0.2 : 0.13) + c * 0.2);
    }
    if (puff2Ref.current) {
      const c = (t * speed + 0.5) % 1;
      puff2Ref.current.position.y = c * 0.78;
      puff2Ref.current.scale.setScalar((ovenBoost ? 0.2 : 0.13) + c * 0.2);
    }
  });

  const handleBreadClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    breadBounceRef.current = 1;
    onTriggerAudio('world_bakery_bread', [position[0], 0.08, position[2] - 1.25]);
  };

  const handleOvenClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setOvenBoost((prev) => !prev);
    onTriggerAudio('world_bakery_oven', [position[0] + 1.1, 0.08, position[2] - 0.85]);
  };

  const handleBellClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    bellRingRef.current = 1;
    bakerWaveRef.current = 2.0;
    onTriggerAudio('world_bakery_bell', [position[0] - 0.65, 0.08, position[2] - 1.2]);
  };

  return (
    <group name="Shop_Interactive_Bakery" position={position} rotation={[0, rotationY, 0]}>
      {/* Warm Honey-Ochre Stucco Building */}
      <RoundedBox args={[2.55, 2.05, 1.8]} radius={0.05} smoothness={2} position={[0, 1.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f3d6a4"
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.86}
        />
      </RoundedBox>
      {/* Stone Plinth & Cream Cornice */}
      <RoundedBox args={[2.65, 0.22, 1.9]} radius={0.03} smoothness={2} position={[0, 0.11, 0]} receiveShadow>
        <meshStandardMaterial color="#d6c7b2" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[2.72, 0.24, 1.98]} radius={0.04} smoothness={2} position={[0, 2.14, 0]} castShadow>
        <meshStandardMaterial color="#a65239" bumpMap={textures.clayBump} bumpScale={0.01} roughness={0.85} />
      </RoundedBox>

      {/* Brick Chimney + Rising Baking Steam */}
      <mesh position={[0.78, 2.48, -0.35]} castShadow>
        <boxGeometry args={[0.32, 0.48, 0.32]} />
        <meshStandardMaterial color="#8f4f3c" roughness={0.88} />
      </mesh>
      <group position={[0.78, 2.74, -0.35]}>
        <mesh ref={puff1Ref}>
          <sphereGeometry args={[0.24, 10, 10]} />
          <meshStandardMaterial color="#fff8ee" transparent opacity={0.62} roughness={1} depthWrite={false} />
        </mesh>
        <mesh ref={puff2Ref}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color="#fff8ee" transparent opacity={0.55} roughness={1} depthWrite={false} />
        </mesh>
      </group>

      {/* Iconic 3D Golden Croissant Emblem Sign above Awning (zero text) */}
      <group position={[0, 1.86, -0.96]}>
        <RoundedBox args={[0.72, 0.42, 0.08]} radius={0.04} smoothness={2} castShadow>
          <meshStandardMaterial color="#5a3827" roughness={0.78} />
        </RoundedBox>
        <mesh position={[0, -0.04, -0.06]} rotation={[0, 0, Math.PI * 0.15]}>
          <torusGeometry args={[0.13, 0.05, 10, 18, Math.PI * 1.15]} />
          <meshStandardMaterial color="#e09f3e" roughness={0.48} />
        </mesh>
      </group>

      {/* Striped Terracotta & Cream Bakery Awning facing the street (-z) */}
      <group position={[0, 1.48, -1.16]} rotation={[-0.28, 0, 0]}>
        {Array.from({ length: 5 }, (_, i) => (
          <RoundedBox
            key={i}
            args={[0.45, 0.09, 0.62]}
            radius={0.02}
            smoothness={2}
            position={[-0.9 + i * 0.45, 0, 0]}
            castShadow
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#d96b47' : '#fdf6ea'} roughness={0.85} />
          </RoundedBox>
        ))}
      </group>

      {/* Warm Lit Display Window facing street (-z) */}
      <group position={[0.22, 0.96, -0.92]}>
        <RoundedBox args={[1.38, 0.86, 0.08]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#fff8ee" roughness={0.82} />
        </RoundedBox>
        <mesh position={[0, 0, -0.044]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.22, 0.72]} />
          <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={glow} />
        </mesh>
      </group>

      {/* INTERACTIVE 1: Outdoor Bakery Counter & Fresh Bread / Croissant Display */}
      <group
        position={[0.18, 0, -1.24]}
        onClick={handleBreadClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Wooden sidewalk bread counter */}
        <RoundedBox args={[1.26, 0.62, 0.44]} radius={0.03} smoothness={2} position={[0, 0.31, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#ffffff"
            map={textures.woodCrateColor}
            bumpMap={textures.woodCrateBump}
            bumpScale={0.01}
            roughness={0.84}
          />
        </RoundedBox>
        {/* Animated Bread & Pastry Tray */}
        <group ref={breadTrayRef} position={[0, 0.66, 0]}>
          {/* Wooden tray */}
          <RoundedBox args={[1.1, 0.05, 0.34]} radius={0.015} smoothness={2} castShadow>
            <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
          </RoundedBox>
          {/* Crusty Round Sourdough Loaf */}
          <mesh position={[-0.32, 0.085, 0]} scale={[1.15, 0.72, 1]} castShadow>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial color="#c97d3c" bumpMap={textures.clayBump} bumpScale={0.012} roughness={0.78} />
          </mesh>
          {/* Two Golden Baguettes */}
          <mesh position={[0.08, 0.065, -0.05]} rotation={[0, 0.12, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.042, 0.28, 6, 12]} />
            <meshStandardMaterial color="#d89242" roughness={0.72} />
          </mesh>
          <mesh position={[0.1, 0.065, 0.06]} rotation={[0, -0.08, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.042, 0.28, 6, 12]} />
            <meshStandardMaterial color="#e09f4c" roughness={0.72} />
          </mesh>
          {/* Golden Croissant */}
          <mesh position={[0.42, 0.07, 0]} rotation={[Math.PI / 2, 0, 0.5]} castShadow>
            <torusGeometry args={[0.065, 0.032, 8, 14, Math.PI * 1.15]} />
            <meshStandardMaterial color="#e5a446" roughness={0.62} />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 2: Side Wood-Fired Brick Oven */}
      <group
        position={[1.38, 0, -0.68]}
        onClick={handleOvenClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Stone oven base */}
        <RoundedBox args={[0.64, 0.52, 0.64]} radius={0.03} smoothness={2} position={[0, 0.26, 0]} castShadow>
          <meshStandardMaterial color="#b7a994" roughness={0.9} />
        </RoundedBox>
        {/* Brick dome */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <sphereGeometry args={[0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#9c4a35" bumpMap={textures.terracottaBump} bumpScale={0.015} roughness={0.86} />
        </mesh>
        {/* Glowing Fire Mouth facing street (-z) */}
        <mesh position={[0, 0.64, -0.29]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.13, 14]} />
          <meshStandardMaterial
            color={ovenBoost ? '#fef08a' : '#fb923c'}
            emissive={ovenBoost ? '#f97316' : '#ea580c'}
            emissiveIntensity={ovenBoost ? 2.8 : 1.1}
          />
        </mesh>
      </group>

      {/* INTERACTIVE 3: Brass Counter Bell + Friendly Baker NPC */}
      <group
        position={[-0.76, 0, -1.16]}
        onClick={handleBellClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Small side pedestal with brass shop bell */}
        <RoundedBox args={[0.32, 0.64, 0.32]} radius={0.025} smoothness={2} position={[0.32, 0.32, -0.05]} castShadow>
          <meshStandardMaterial color="#7a4e32" roughness={0.84} />
        </RoundedBox>
        <group ref={bellRef} position={[0.32, 0.69, -0.05]}>
          <mesh castShadow>
            <sphereGeometry args={[0.075, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#eab308" metalness={0.78} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.085, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.03, 10]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* Baker NPC facing the street (-z -> rotate Y by PI) — click to learn Baker profession */}
        <group
          position={[-0.14, 0, -0.04]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            bakerWaveRef.current = 2.0;
            onInspectCuriosity?.('job_baker');
          }}
        >
          <BakerNpc waveTimerRef={bakerWaveRef} />
        </group>
      </group>

      {/* INTERACTIVE 4: Sidewalk Chocolate Cake & Pink Donut Pedestal (opens Curiosity Card!) */}
      <group
        position={[-1.32, 0, -0.82]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_cake');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.26, 0.56, 14]} />
          <meshStandardMaterial color="#f5ebd8" roughness={0.82} />
        </mesh>
        {/* Two-tier chocolate cake with cherry */}
        <mesh position={[0, 0.64, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.17, 0.14, 16]} />
          <meshStandardMaterial color="#5c3527" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.165, 0.165, 0.03, 16]} />
          <meshStandardMaterial color="#fde68a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.77, 0]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Unique Mechanic NPC: navy denim overalls, red oil rag, mechanic cap, friendly wrench-turn motion.
 */
function MechanicNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (waveTimerRef.current > 0) {
      waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
    }
    if (rightArmRef.current) {
      const working = waveTimerRef.current > 0;
      const targetZ = working ? -2.0 + Math.sin(t * 11) * 0.42 : -0.3 + Math.sin(t * 2.2) * 0.06;
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetZ, dt * 8);
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.7) * 0.04;
    }
  });

  return (
    <group>
      {/* Heavy work boots */}
      <mesh position={[-0.055, 0.042, 0.015]} castShadow>
        <sphereGeometry args={[0.046, 10, 10]} />
        <meshStandardMaterial color="#1f2937" roughness={0.88} />
      </mesh>
      <mesh position={[0.055, 0.042, 0.015]} castShadow>
        <sphereGeometry args={[0.046, 10, 10]} />
        <meshStandardMaterial color="#1f2937" roughness={0.88} />
      </mesh>
      {/* Light gray tee + Navy Blue Overalls */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.22, 8, 12]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.86} />
      </mesh>
      {/* Overall front bib + brass buckles */}
      <RoundedBox args={[0.17, 0.2, 0.09]} radius={0.02} smoothness={2} position={[0, 0.28, 0.09]} castShadow>
        <meshStandardMaterial color="#1d4ed8" roughness={0.88} />
      </RoundedBox>
      <mesh position={[-0.055, 0.36, 0.138]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.055, 0.36, 0.138]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Red mechanic shop rag tucked in pocket */}
      <mesh position={[0.09, 0.22, 0.12]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.045, 0.09, 0.025]} />
        <meshStandardMaterial color="#dc2626" roughness={0.9} />
      </mesh>
      {/* Left arm */}
      <group position={[-0.15, 0.4, 0.01]} rotation={[0.15, 0, 0.22]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.13, 6, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#d8a27c" roughness={0.82} />
        </mesh>
      </group>
      {/* Right arm holding silver wrench */}
      <group ref={rightArmRef} position={[0.15, 0.41, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.13, 6, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#d8a27c" roughness={0.82} />
        </mesh>
        {/* Silver wrench */}
        <mesh position={[0.02, -0.22, 0.04]} rotation={[0.4, 0, 0.2]}>
          <boxGeometry args={[0.024, 0.14, 0.014]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
      {/* Head + Mechanic Cap */}
      <group ref={headRef} position={[0, 0.64, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.135, 16, 16]} />
          <meshStandardMaterial color="#d8a27c" roughness={0.82} />
        </mesh>
        <mesh position={[-0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.017, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.017, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        {/* Navy cap dome + visor */}
        <mesh position={[0, 0.075, 0]} castShadow>
          <sphereGeometry args={[0.138, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.068, 0.11]} rotation={[0.15, 0, 0]} castShadow>
          <boxGeometry args={[0.17, 0.022, 0.12]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SHOP 2: Borracharia Interativa (Neighborhood Tire & Repair Shop)
 * 3 tactile real-world learning interactions:
 * 1) Air Compressor & Service Tire -> inflates flat tire & vibrates tank ("Pump air! Full tire!")
 * 2) Wheel on Balancing Stand -> spins rubber tire & alloy rim briskly ("Spin the wheel! Ready to drive!")
 * 3) Hydraulic Car Jack & Mechanic -> lifts red jack arm & mechanic waves wrench ("Wrench! Fix the car!")
 */
export function InteractiveTireShop({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const [tireInflated, setTireInflated] = useState(false);
  const [jackRaised, setJackRaised] = useState(false);

  const roofSignWheelRef = useRef<THREE.Group>(null);
  const standWheelRef = useRef<THREE.Group>(null);
  const serviceTireRef = useRef<THREE.Mesh>(null);
  const compressorRef = useRef<THREE.Group>(null);
  const jackArmRef = useRef<THREE.Group>(null);

  const wheelSpinSpeedRef = useRef(0);
  const pumpTimerRef = useRef(0);
  const mechanicWaveRef = useRef(0);

  const glow = isNight ? 1.5 : 0.65;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (roofSignWheelRef.current) {
      roofSignWheelRef.current.rotation.z = t * 0.65;
    }

    if (wheelSpinSpeedRef.current > 0.05) {
      wheelSpinSpeedRef.current = Math.max(0, wheelSpinSpeedRef.current - dt * 2.8);
      if (standWheelRef.current) {
        standWheelRef.current.rotation.z += wheelSpinSpeedRef.current * dt * 8;
      }
    }

    if (pumpTimerRef.current > 0) {
      pumpTimerRef.current = Math.max(0, pumpTimerRef.current - dt * 1.4);
      if (compressorRef.current) {
        compressorRef.current.position.x = -0.82 + Math.sin(t * 48) * 0.015;
      }
    } else if (compressorRef.current) {
      compressorRef.current.position.x = -0.82;
    }

    if (serviceTireRef.current) {
      const targetScaleY = tireInflated ? 1.0 : 0.64;
      const targetScaleXZ = tireInflated ? 1.0 : 1.14;
      serviceTireRef.current.scale.y = THREE.MathUtils.lerp(serviceTireRef.current.scale.y, targetScaleY, dt * 7);
      serviceTireRef.current.scale.x = THREE.MathUtils.lerp(serviceTireRef.current.scale.x, targetScaleXZ, dt * 7);
      serviceTireRef.current.scale.z = THREE.MathUtils.lerp(serviceTireRef.current.scale.z, targetScaleXZ, dt * 7);
    }

    if (jackArmRef.current) {
      const targetAngle = jackRaised ? 0.52 : 0.08;
      jackArmRef.current.rotation.x = THREE.MathUtils.lerp(jackArmRef.current.rotation.x, targetAngle, dt * 6);
    }
  });

  const handlePumpClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setTireInflated((prev) => !prev);
    pumpTimerRef.current = 1.0;
    onTriggerAudio('world_tire_pump', [position[0] - 0.7, 0.08, position[2] - 1.2]);
  };

  const handleWheelClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    wheelSpinSpeedRef.current = 4.2;
    onTriggerAudio('world_tire_wheel', [position[0] + 0.1, 0.08, position[2] - 1.25]);
  };

  const handleJackClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setJackRaised((prev) => !prev);
    mechanicWaveRef.current = 2.0;
    onTriggerAudio('world_tire_fix', [position[0] + 0.8, 0.08, position[2] - 1.2]);
  };

  return (
    <group name="Shop_Interactive_TireShop" position={position} rotation={[0, rotationY, 0]}>
      {/* Clean Concrete & Steel-Blue Neighborhood Garage Building */}
      <RoundedBox args={[2.55, 2.02, 1.82]} radius={0.04} smoothness={2} position={[0, 1.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#e2e8f0"
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.86}
        />
      </RoundedBox>
      {/* Safety Yellow Accent Stripe around Building */}
      <mesh position={[0, 1.62, -0.92]}>
        <boxGeometry args={[2.56, 0.18, 0.04]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      {/* Corrugated Navy-Blue Garage Roof */}
      <RoundedBox args={[2.72, 0.22, 1.98]} radius={0.04} smoothness={2} position={[0, 2.12, 0]} castShadow>
        <meshStandardMaterial color="#1e3a8a" roughness={0.78} />
      </RoundedBox>

      {/* Open Garage Bay Recessed Interior facing street (-z) */}
      <mesh position={[0, 0.74, -0.92]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.68, 1.32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.92} />
      </mesh>
      {/* Warm Overhead Garage Work Lamp */}
      <mesh position={[0, 1.32, -0.94]}>
        <boxGeometry args={[0.92, 0.06, 0.08]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fbbf24" emissiveIntensity={glow} />
      </mesh>

      {/* Iconic 3D Rotating Black Tire & Silver Rim Sign on Roof (zero text) */}
      <group ref={roofSignWheelRef} position={[0, 2.48, -0.68]}>
        <mesh castShadow>
          <torusGeometry args={[0.24, 0.095, 12, 22]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.12, 14]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.22} />
        </mesh>
      </group>

      {/* Stacked Black Rubber Tires on Left Corner */}
      {[0.1, 0.28, 0.46].map((ty, idx) => (
        <mesh key={idx} position={[-1.08, ty, -1.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.19, 0.08, 10, 18]} />
          <meshStandardMaterial color="#18181b" roughness={0.88} />
        </mesh>
      ))}

      {/* INTERACTIVE 1: Red Air Compressor & Inflating Service Tire */}
      <group
        onClick={handlePumpClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <group ref={compressorRef} position={[-0.82, 0.24, -1.32]}>
          {/* Red pressurized air tank */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.14, 0.28, 8, 14]} />
            <meshStandardMaterial color="#dc2626" roughness={0.42} metalness={0.25} />
          </mesh>
          {/* Yellow pressure gauge & top motor */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.16, 0.12, 0.14]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0.14, 0.14, -0.06]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 12]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={0.4} />
          </mesh>
        </group>
        {/* Flat -> Plump Inflating Service Tire lying on apron */}
        <mesh
          ref={serviceTireRef}
          position={[-0.38, 0.14, -1.36]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.2, 0.085, 12, 20]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} />
        </mesh>
      </group>

      {/* INTERACTIVE 2: Spinning Wheel on Metal Balancer Stand */}
      <group
        position={[0.18, 0, -1.28]}
        onClick={handleWheelClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Heavy steel balancer pedestal */}
        <RoundedBox args={[0.38, 0.52, 0.32]} radius={0.025} smoothness={2} position={[0, 0.26, 0.08]} castShadow>
          <meshStandardMaterial color="#2563eb" roughness={0.55} metalness={0.3} />
        </RoundedBox>
        {/* Spinning Tire & 5-spoke Alloy Rim */}
        <group ref={standWheelRef} position={[0, 0.42, -0.14]}>
          <mesh castShadow>
            <torusGeometry args={[0.21, 0.085, 12, 22]} />
            <meshStandardMaterial color="#18181b" roughness={0.86} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.135, 0.135, 0.1, 14]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Contrast spoke bar so rotation is unmistakable */}
          <mesh position={[0, 0, -0.055]}>
            <boxGeometry args={[0.24, 0.04, 0.02]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.055]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.24, 0.04, 0.02]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 3: Red Hydraulic Car Jack & Friendly Mechanic NPC */}
      <group
        position={[0.88, 0, -1.22]}
        onClick={handleJackClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Red Floor Car Jack */}
        <group position={[-0.22, 0.05, -0.12]}>
          <RoundedBox args={[0.22, 0.08, 0.44]} radius={0.015} smoothness={2} castShadow>
            <meshStandardMaterial color="#dc2626" roughness={0.45} metalness={0.3} />
          </RoundedBox>
          <group ref={jackArmRef} position={[0, 0.04, 0.12]}>
            <mesh position={[0, 0.06, -0.16]} rotation={[0.3, 0, 0]} castShadow>
              <boxGeometry args={[0.08, 0.05, 0.34]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.12, -0.3]}>
              <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
          </group>
        </group>

        {/* Mechanic NPC facing the street (-z) — click to learn Mechanic profession */}
        <group
          position={[0.16, 0, 0]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            mechanicWaveRef.current = 2.0;
            onInspectCuriosity?.('job_mechanic');
          }}
        >
          <MechanicNpc waveTimerRef={mechanicWaveRef} />
        </group>
      </group>

      {/* INTERACTIVE 4: Yellow Motor Oil Can & Red Toolbox */}
      <group
        position={[1.34, 0, -0.82]}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAudio('world_tire_oil', [position[0] + 1.34, 0.08, position[2] - 0.82]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.42, 0.24, 0.24]} radius={0.02} smoothness={2} position={[0, 0.12, 0]} castShadow>
          <meshStandardMaterial color="#dc2626" roughness={0.45} metalness={0.3} />
        </RoundedBox>
        <RoundedBox args={[0.16, 0.26, 0.1]} radius={0.02} smoothness={2} position={[0, 0.36, 0]} castShadow>
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0.04, 0.52, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 10]} />
          <meshStandardMaterial color="#18181b" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

const OUTFIT_COLORS = ['#f43f5e', '#2563eb', '#10b981', '#eab308'] as const;

/**
 * Unique Boutique Owner NPC: mint-green cardigan, cream scarf, dark bob hair, friendly wave.
 */
function BoutiqueNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
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
      const targetZ = waving ? -2.2 + Math.sin(t * 9.5) * 0.35 : -0.22 + Math.sin(t * 2.1) * 0.06;
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetZ, dt * 8);
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.04;
    }
  });

  return (
    <group>
      {/* Shoes */}
      <mesh position={[-0.05, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>
      {/* Mint-Green Cardigan Dress Torso */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.125, 0.22, 8, 12]} />
        <meshStandardMaterial color="#34d399" roughness={0.85} />
      </mesh>
      {/* Cream Scarf */}
      <mesh position={[0, 0.45, 0.02]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.068, 0.018, 8, 16]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.88} />
      </mesh>
      {/* Left Arm */}
      <group position={[-0.145, 0.4, 0.01]} rotation={[0.15, 0, 0.2]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.034, 0.13, 6, 10]} />
          <meshStandardMaterial color="#34d399" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.036, 10, 10]} />
          <meshStandardMaterial color="#f2c4a2" roughness={0.82} />
        </mesh>
      </group>
      {/* Right Arm (waves warmly) */}
      <group ref={rightArmRef} position={[0.145, 0.41, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.034, 0.13, 6, 10]} />
          <meshStandardMaterial color="#34d399" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.036, 10, 10]} />
          <meshStandardMaterial color="#f2c4a2" roughness={0.82} />
        </mesh>
      </group>
      {/* Head + Styled Bob Hair */}
      <group ref={headRef} position={[0, 0.63, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#f2c4a2" roughness={0.82} />
        </mesh>
        <mesh position={[-0.04, 0.01, 0.115]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0.04, 0.01, 0.115]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        {/* Dark auburn bob hair cap */}
        <mesh position={[0, 0.03, -0.025]} castShadow>
          <sphereGeometry args={[0.142, 16, 14]} />
          <meshStandardMaterial color="#4a2511" roughness={0.85} />
        </mesh>
        {/* Rose headband */}
        <mesh position={[0, 0.1, 0.03]} rotation={[0.45, 0, 0]}>
          <torusGeometry args={[0.115, 0.014, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#fb7185" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SHOP 3: Loja de Roupas Interativa (Neighborhood Clothing Boutique)
 * 3 tactile real-world learning interactions:
 * 1) Outdoor Wooden Clothing Rack -> sways red shirt, blue coat, green sweater ("Red shirt! Blue coat! Nice clothes!")
 * 2) Display Mannequin -> spins & changes outfit color ("Try it on! New outfit!")
 * 3) Yellow Sun Hat Stand & Boutique Owner -> hops hat & owner waves ("Yellow hat! Looks great!")
 */
export function InteractiveClothingStore({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const [outfitIndex, setOutfitIndex] = useState(0);

  const rackGarmentsRef = useRef<THREE.Group>(null);
  const mannequinRef = useRef<THREE.Group>(null);
  const hatRef = useRef<THREE.Group>(null);

  const rackSwayRef = useRef(0);
  const mannequinSpinRef = useRef(0);
  const hatHopRef = useRef(0);
  const npcWaveRef = useRef(0);

  const glow = isNight ? 1.5 : 0.65;
  const currentOutfitColor = OUTFIT_COLORS[outfitIndex];

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (rackSwayRef.current > 0) {
      rackSwayRef.current = Math.max(0, rackSwayRef.current - dt * 1.4);
      if (rackGarmentsRef.current) {
        rackGarmentsRef.current.rotation.x = Math.sin(rackSwayRef.current * Math.PI * 5) * 0.24 * rackSwayRef.current;
      }
    } else if (rackGarmentsRef.current) {
      rackGarmentsRef.current.rotation.x = 0;
    }

    if (mannequinSpinRef.current > 0) {
      mannequinSpinRef.current = Math.max(0, mannequinSpinRef.current - dt * 1.2);
      if (mannequinRef.current) {
        mannequinRef.current.rotation.y += dt * 7.5 * mannequinSpinRef.current;
      }
    }

    if (hatHopRef.current > 0) {
      hatHopRef.current = Math.max(0, hatHopRef.current - dt * 1.6);
      if (hatRef.current) {
        hatRef.current.position.y = 0.72 + Math.sin(hatHopRef.current * Math.PI) * 0.16;
        hatRef.current.rotation.y += dt * 6;
      }
    } else if (hatRef.current) {
      hatRef.current.position.y = 0.72;
    }
  });

  const handleRackClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    rackSwayRef.current = 1;
    onTriggerAudio('world_clothes_shirt', [position[0] - 0.15, 0.08, position[2] - 1.25]);
  };

  const handleMannequinClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setOutfitIndex((prev) => (prev + 1) % OUTFIT_COLORS.length);
    mannequinSpinRef.current = 1;
    onTriggerAudio('world_clothes_dress', [position[0] + 0.72, 0.08, position[2] - 1.2]);
  };

  const handleHatClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    hatHopRef.current = 1;
    npcWaveRef.current = 2.0;
    onTriggerAudio('world_clothes_hat', [position[0] - 0.85, 0.08, position[2] - 1.2]);
  };

  return (
    <group name="Shop_Interactive_ClothingStore" position={position} rotation={[0, rotationY, 0]}>
      {/* Blush-Cream Boutique Building */}
      <RoundedBox args={[2.45, 2.05, 1.8]} radius={0.05} smoothness={2} position={[0, 1.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f8dce0"
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.86}
        />
      </RoundedBox>
      {/* Stone Plinth & Sage-Teal Mansard Roof */}
      <RoundedBox args={[2.55, 0.2, 1.9]} radius={0.03} smoothness={2} position={[0, 0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#e7e5e4" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[2.62, 0.24, 1.98]} radius={0.04} smoothness={2} position={[0, 2.14, 0]} castShadow>
        <meshStandardMaterial color="#2f6f62" roughness={0.82} />
      </RoundedBox>

      {/* Iconic 3D Golden Coat Hanger Emblem Sign above Awning (zero text) */}
      <group position={[0, 1.84, -0.96]}>
        <RoundedBox args={[0.72, 0.4, 0.08]} radius={0.04} smoothness={2} castShadow>
          <meshStandardMaterial color="#2f6f62" roughness={0.75} />
        </RoundedBox>
        {/* Golden Hanger Triangle + Hook */}
        <mesh position={[0, -0.02, -0.06]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.24, 0.032, 0.03]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.02, -0.06]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.24, 0.032, 0.03]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.08, -0.06]}>
          <boxGeometry args={[0.38, 0.032, 0.03]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.75} roughness={0.25} />
        </mesh>
      </group>

      {/* Striped Rose & Cream Boutique Awning facing street (-z) */}
      <group position={[0, 1.48, -1.14]} rotation={[-0.28, 0, 0]}>
        {Array.from({ length: 5 }, (_, i) => (
          <RoundedBox
            key={i}
            args={[0.43, 0.09, 0.58]}
            radius={0.02}
            smoothness={2}
            position={[-0.86 + i * 0.43, 0, 0]}
            castShadow
          >
            <meshStandardMaterial color={i % 2 === 0 ? '#e11d48' : '#fff5f7'} roughness={0.85} />
          </RoundedBox>
        ))}
      </group>

      {/* Warm Boutique Display Window */}
      <group position={[0, 0.94, -0.92]}>
        <RoundedBox args={[1.68, 0.88, 0.08]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#fff8ee" roughness={0.82} />
        </RoundedBox>
        <mesh position={[0, 0, -0.044]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.52, 0.74]} />
          <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={glow} />
        </mesh>
      </group>

      {/* INTERACTIVE 1: Outdoor Wooden Clothing Rack (Red Shirt, Blue Coat, Green Sweater) */}
      <group
        position={[-0.12, 0, -1.26]}
        onClick={handleRackClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Rack A-frame wooden legs + brass crossbar */}
        {[-0.48, 0.48].map((rx, idx) => (
          <mesh key={idx} position={[rx, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.028, 0.88, 8]} />
            <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
          </mesh>
        ))}
        <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.02, 10]} />
          <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
        </mesh>
        {/* Swaying Hanging Garments */}
        <group ref={rackGarmentsRef} position={[0, 0.85, 0]}>
          {/* Red Shirt */}
          <RoundedBox args={[0.24, 0.36, 0.08]} radius={0.02} smoothness={2} position={[-0.28, -0.24, 0]} castShadow>
            <meshStandardMaterial color="#ef4444" roughness={0.86} />
          </RoundedBox>
          {/* Blue Coat */}
          <RoundedBox args={[0.26, 0.46, 0.09]} radius={0.02} smoothness={2} position={[0, -0.29, 0]} castShadow>
            <meshStandardMaterial color="#2563eb" roughness={0.86} />
          </RoundedBox>
          {/* Emerald Sweater */}
          <RoundedBox args={[0.24, 0.38, 0.08]} radius={0.02} smoothness={2} position={[0.28, -0.25, 0]} castShadow>
            <meshStandardMaterial color="#10b981" roughness={0.86} />
          </RoundedBox>
        </group>
      </group>

      {/* INTERACTIVE 2: Spinning Boutique Mannequin (changes outfit color on click) */}
      <group
        position={[0.76, 0, -1.24]}
        onClick={handleMannequinClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Round brass pedestal */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.16, 16]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.75} />
        </mesh>
        <group ref={mannequinRef} position={[0, 0.16, 0]}>
          {/* Wooden stand pole */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.36, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          {/* Dress skirt & bodice (cycles color!) */}
          <mesh position={[0, 0.42, 0]} castShadow>
            <coneGeometry args={[0.17, 0.38, 14]} />
            <meshStandardMaterial color={currentOutfitColor} roughness={0.76} />
          </mesh>
          <mesh position={[0, 0.64, 0]} castShadow>
            <capsuleGeometry args={[0.095, 0.14, 8, 12]} />
            <meshStandardMaterial color={currentOutfitColor} roughness={0.76} />
          </mesh>
          {/* Cream wooden finial head */}
          <mesh position={[0, 0.82, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color="#e7dac5" roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 3: Yellow Sun Hat Stand & Boutique Owner NPC */}
      <group
        position={[-0.92, 0, -1.2]}
        onClick={handleHatClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Hat Stand Pole */}
        <mesh position={[0.16, 0.35, -0.08]} castShadow>
          <cylinderGeometry args={[0.025, 0.06, 0.7, 10]} />
          <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
        </mesh>
        {/* Bouncing Yellow Sun Hat with Rose Ribbon */}
        <group ref={hatRef} position={[0.16, 0.72, -0.08]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.19, 0.21, 0.03, 18]} />
            <meshStandardMaterial color="#facc15" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.1, 16]} />
            <meshStandardMaterial color="#eab308" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.122, 0.122, 0.025, 16]} />
            <meshStandardMaterial color="#e11d48" roughness={0.6} />
          </mesh>
        </group>

        {/* Boutique Owner NPC facing street (-z) — click to learn Shopkeeper profession */}
        <group
          position={[-0.18, 0, 0.02]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            npcWaveRef.current = 2.0;
            onInspectCuriosity?.('job_shopkeeper');
          }}
        >
          <BoutiqueNpc waveTimerRef={npcWaveRef} />
        </group>
      </group>

      {/* INTERACTIVE 4: White Sneakers Display Pedestal (opens Curiosity Card!) */}
      <group
        position={[1.3, 0, -0.82]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_shoes');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.48, 0.34, 0.32]} radius={0.025} smoothness={2} position={[0, 0.17, 0]} castShadow>
          <meshStandardMaterial color="#f5ebd8" roughness={0.82} />
        </RoundedBox>
        {[-0.11, 0.11].map((sx, i) => (
          <group key={i} position={[sx, 0.39, 0]}>
            <RoundedBox args={[0.12, 0.09, 0.22]} radius={0.02} smoothness={2} castShadow>
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </RoundedBox>
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[0.125, 0.025, 0.225]} />
              <meshStandardMaterial color="#e11d48" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Unique Tech & Phone Shop Technician NPC: teal polo shirt, dark-rimmed glasses, ID lanyard, friendly wave.
 */
function TechNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
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
      headRef.current.rotation.z = Math.sin(t * 1.7) * 0.04;
    }
  });

  return (
    <group>
      {/* Sneakers */}
      <mesh position={[-0.052, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.044, 10, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.75} />
      </mesh>
      <mesh position={[0.052, 0.04, 0.015]} castShadow>
        <sphereGeometry args={[0.044, 10, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.75} />
      </mesh>
      {/* Teal Tech Polo Shirt */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.128, 0.22, 8, 12]} />
        <meshStandardMaterial color="#0284c7" roughness={0.82} />
      </mesh>
      {/* White ID Lanyard Badge */}
      <mesh position={[0, 0.29, 0.132]}>
        <boxGeometry args={[0.06, 0.08, 0.014]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      {/* Left Arm */}
      <group position={[-0.148, 0.4, 0.01]} rotation={[0.15, 0, 0.2]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color="#0284c7" roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.037, 10, 10]} />
          <meshStandardMaterial color="#f0c2a0" roughness={0.82} />
        </mesh>
      </group>
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.148, 0.41, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color="#0284c7" roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.037, 10, 10]} />
          <meshStandardMaterial color="#f0c2a0" roughness={0.82} />
        </mesh>
      </group>
      {/* Head + Dark Glasses */}
      <group ref={headRef} position={[0, 0.64, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.132, 16, 16]} />
          <meshStandardMaterial color="#f0c2a0" roughness={0.82} />
        </mesh>
        {/* Glasses frames */}
        <mesh position={[-0.044, 0.012, 0.126]}>
          <torusGeometry args={[0.028, 0.007, 8, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </mesh>
        <mesh position={[0.044, 0.012, 0.126]}>
          <torusGeometry args={[0.028, 0.007, 8, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.012, 0.128]}>
          <boxGeometry args={[0.03, 0.008, 0.008]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Neat dark hair */}
        <mesh position={[0, 0.06, -0.015]} castShadow>
          <sphereGeometry args={[0.136, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SHOP 4: Loja de Informática & Celular (Neighborhood Computer & Smartphone Shop)
 * Mounted on the North-East sidewalk facing +z toward the boulevard.
 * 3 tactile real-world learning interactions:
 * 1) Hinged 3D Laptop on Display Desk -> opens/closes lid & illuminates screen ("Computer! Screen on!")
 * 2) Smartphone on Charging Stand -> lights green battery bar & hops ("Phone! Battery full!")
 * 3) Wi-Fi Router & Technician NPC -> pulses glowing signal waves & technician waves ("Wi-Fi connected! Ready to work!")
 */
export function InteractiveTechShop({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const [laptopOpen, setLaptopOpen] = useState(true);
  const [phoneCharged, setPhoneCharged] = useState(true);

  const laptopLidRef = useRef<THREE.Group>(null);
  const phoneGroupRef = useRef<THREE.Group>(null);
  const wifiRing1Ref = useRef<THREE.Mesh>(null);
  const wifiRing2Ref = useRef<THREE.Mesh>(null);

  const phoneHopRef = useRef(0);
  const wifiPulseRef = useRef(0);
  const techWaveRef = useRef(0);

  const glow = isNight ? 1.8 : 0.9;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (laptopLidRef.current) {
      const targetRot = laptopOpen ? -1.85 : -0.08;
      laptopLidRef.current.rotation.x = THREE.MathUtils.lerp(laptopLidRef.current.rotation.x, targetRot, dt * 7);
    }

    if (phoneHopRef.current > 0) {
      phoneHopRef.current = Math.max(0, phoneHopRef.current - dt * 1.8);
      if (phoneGroupRef.current) {
        phoneGroupRef.current.position.y = 0.72 + Math.sin(phoneHopRef.current * Math.PI) * 0.14;
      }
    } else if (phoneGroupRef.current) {
      phoneGroupRef.current.position.y = 0.72;
    }

    if (wifiPulseRef.current > 0) {
      wifiPulseRef.current = Math.max(0, wifiPulseRef.current - dt * 1.2);
    }
    const pulseBoost = wifiPulseRef.current > 0 ? 1.45 : 1.0;
    if (wifiRing1Ref.current) {
      const s = (1 + Math.sin(t * 4) * 0.12) * pulseBoost;
      wifiRing1Ref.current.scale.set(s, s, 1);
    }
    if (wifiRing2Ref.current) {
      const s = (1 + Math.sin(t * 4 - 1.2) * 0.14) * pulseBoost;
      wifiRing2Ref.current.scale.set(s, s, 1);
    }
  });

  const handleLaptopClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setLaptopOpen((prev) => !prev);
    onTriggerAudio('world_tech_laptop', [position[0] - 0.35, 0.08, position[2] + 1.28]);
  };

  const handlePhoneClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setPhoneCharged((prev) => !prev);
    phoneHopRef.current = 1;
    onTriggerAudio('world_tech_phone', [position[0] + 0.35, 0.08, position[2] + 1.28]);
  };

  const handleWifiClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    wifiPulseRef.current = 1.6;
    techWaveRef.current = 2.0;
    onTriggerAudio('world_tech_wifi', [position[0] + 0.95, 0.08, position[2] + 1.2]);
  };

  return (
    <group name="Shop_Interactive_TechShop" position={position} rotation={[0, rotationY, 0]}>
      {/* Modern White & Slate-Graphite Tech Storefront */}
      <RoundedBox args={[2.45, 2.05, 1.8]} radius={0.04} smoothness={2} position={[0, 1.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f1f5f9"
          bumpMap={textures.plasterBump}
          bumpScale={0.008}
          roughness={0.78}
        />
      </RoundedBox>
      {/* Dark Slate Roof & Electric Cyan LED Accent Stripe */}
      <RoundedBox args={[2.62, 0.22, 1.96]} radius={0.04} smoothness={2} position={[0, 2.14, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.65} />
      </RoundedBox>
      <mesh position={[0, 1.96, 0.92]}>
        <boxGeometry args={[2.46, 0.08, 0.04]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={glow} />
      </mesh>

      {/* Iconic 3D Glowing Smartphone Roof Emblem (zero text) */}
      <group position={[0, 2.52, 0.62]}>
        <RoundedBox args={[0.32, 0.54, 0.07]} radius={0.03} smoothness={2} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.038]}>
          <planeGeometry args={[0.24, 0.42]} />
          <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={glow} />
        </mesh>
      </group>

      {/* Wide Tech Showcase Window facing street (+z) */}
      <group position={[0, 0.98, 0.92]}>
        <RoundedBox args={[1.76, 0.94, 0.07]} radius={0.02} smoothness={2}>
          <meshStandardMaterial color="#334155" roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.6, 0.8]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#0ea5e9" emissiveIntensity={isNight ? 1.15 : 0.45} />
        </mesh>
      </group>

      {/* Outdoor Sleek Tech Demo Counter (+z) */}
      <RoundedBox args={[1.48, 0.62, 0.48]} radius={0.03} smoothness={2} position={[-0.08, 0.31, 1.24]} castShadow receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[1.52, 0.05, 0.52]} radius={0.015} smoothness={2} position={[-0.08, 0.64, 1.24]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.45} />
      </RoundedBox>

      {/* INTERACTIVE 1: Hinged 3D Laptop Computer on Left of Demo Desk */}
      <group
        position={[-0.42, 0.68, 1.24]}
        onClick={handleLaptopClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Aluminum laptop keyboard base */}
        <RoundedBox args={[0.42, 0.03, 0.28]} radius={0.01} smoothness={2} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.28} />
        </RoundedBox>
        <mesh position={[0, 0.018, 0.02]}>
          <boxGeometry args={[0.34, 0.008, 0.16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* Hinged screen lid */}
        <group ref={laptopLidRef} position={[0, 0.015, -0.13]} rotation={[-1.85, 0, 0]}>
          <RoundedBox args={[0.42, 0.025, 0.28]} radius={0.01} smoothness={2} position={[0, 0, 0.14]} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.72} roughness={0.25} />
          </RoundedBox>
          <mesh position={[0, -0.015, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.36, 0.22]} />
            <meshStandardMaterial
              color={laptopOpen ? '#7dd3fc' : '#0f172a'}
              emissive={laptopOpen ? '#0ea5e9' : '#000000'}
              emissiveIntensity={laptopOpen ? 1.6 : 0}
            />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 2: Smartphone on Charging Stand on Right of Demo Desk */}
      <group
        onClick={handlePhoneClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Charging dock base */}
        <mesh position={[0.26, 0.68, 1.24]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.04, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} />
        </mesh>
        <group ref={phoneGroupRef} position={[0.26, 0.72, 1.24]} rotation={[-0.25, 0, 0]}>
          <RoundedBox args={[0.16, 0.28, 0.03]} radius={0.015} smoothness={2} position={[0, 0.12, 0]} castShadow>
            <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
          </RoundedBox>
          {/* Glowing phone screen + green battery bar */}
          <mesh position={[0, 0.12, 0.017]}>
            <planeGeometry args={[0.125, 0.23]} />
            <meshStandardMaterial
              color={phoneCharged ? '#86efac' : '#fde047'}
              emissive={phoneCharged ? '#22c55e' : '#eab308'}
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 3: Wi-Fi Router Station + Friendly Technician NPC */}
      <group
        position={[0.96, 0, 1.2]}
        onClick={handleWifiClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Wi-Fi Router Pedestal */}
        <RoundedBox args={[0.3, 0.56, 0.26]} radius={0.02} smoothness={2} position={[-0.28, 0.28, 0.06]} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </RoundedBox>
        {/* Glowing Wi-Fi Signal Rings */}
        <mesh ref={wifiRing1Ref} position={[-0.28, 0.68, 0.06]}>
          <torusGeometry args={[0.09, 0.016, 8, 14, Math.PI]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1.6} />
        </mesh>
        <mesh ref={wifiRing2Ref} position={[-0.28, 0.68, 0.06]}>
          <torusGeometry args={[0.15, 0.016, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={1.4} />
        </mesh>

        {/* Technician NPC facing street (+z) — click to learn Technician profession */}
        <group
          position={[0.14, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            techWaveRef.current = 2.0;
            onInspectCuriosity?.('job_technician');
          }}
        >
          <TechNpc waveTimerRef={techWaveRef} />
        </group>
      </group>

      {/* INTERACTIVE 4: Over-Ear Headphones Stand on Side Pedestal (opens Curiosity Card!) */}
      <group
        position={[-1.28, 0, 0.92]}
        onClick={(e) => {
          e.stopPropagation();
          onInspectCuriosity?.('city_headphones');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[0.34, 0.56, 0.34]} radius={0.025} smoothness={2} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </RoundedBox>
        {/* Headphones arch + earcups */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <torusGeometry args={[0.12, 0.022, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.35} />
        </mesh>
        {[-0.12, 0.12].map((hx, i) => (
          <mesh key={i} position={[hx, 0.66, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.045, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.45} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Unique Construction Worker NPC: high-vis neon-yellow safety vest with reflective stripes,
 * bright yellow hard hat, work boots, friendly wave.
 */
function ConstructionWorkerNpc({ waveTimerRef }: { waveTimerRef: React.MutableRefObject<number> }) {
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
      const targetZ = waving ? -2.2 + Math.sin(t * 10) * 0.38 : -0.25 + Math.sin(t * 2.1) * 0.06;
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetZ, dt * 8);
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.04;
    }
  });

  return (
    <group>
      {/* Heavy tan work boots */}
      <mesh position={[-0.055, 0.042, 0.015]} castShadow>
        <sphereGeometry args={[0.046, 10, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.88} />
      </mesh>
      <mesh position={[0.055, 0.042, 0.015]} castShadow>
        <sphereGeometry args={[0.046, 10, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.88} />
      </mesh>
      {/* High-Vis Safety Vest Torso */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.132, 0.22, 8, 12]} />
        <meshStandardMaterial color="#eab308" roughness={0.78} />
      </mesh>
      {/* Silver Reflective Vest Stripes */}
      <mesh position={[0, 0.28, 0.128]}>
        <boxGeometry args={[0.18, 0.03, 0.014]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#f8fafc" emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.22, 0.128]}>
        <boxGeometry args={[0.18, 0.03, 0.014]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#f8fafc" emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
      {/* Left Arm */}
      <group position={[-0.15, 0.4, 0.01]} rotation={[0.15, 0, 0.22]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.13, 6, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#e2ab83" roughness={0.82} />
        </mesh>
      </group>
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.15, 0.41, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.13, 6, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#e2ab83" roughness={0.82} />
        </mesh>
      </group>
      {/* Head + Bright Yellow Hard Hat */}
      <group ref={headRef} position={[0, 0.64, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.134, 16, 16]} />
          <meshStandardMaterial color="#e2ab83" roughness={0.82} />
        </mesh>
        <mesh position={[-0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.017, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        <mesh position={[0.042, 0.01, 0.12]}>
          <sphereGeometry args={[0.017, 10, 10]} />
          <meshStandardMaterial color="#1c1917" roughness={0.15} />
        </mesh>
        {/* Hard hat dome + brim */}
        <mesh position={[0, 0.078, 0]} castShadow>
          <sphereGeometry args={[0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
          <meshStandardMaterial color="#facc15" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.068, 0.03]} castShadow>
          <cylinderGeometry args={[0.165, 0.17, 0.022, 18]} />
          <meshStandardMaterial color="#eab308" roughness={0.38} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * SHOP 5: Canteiro de Obras Interativo (Neighborhood Construction Site)
 * 3 tactile real-world learning interactions:
 * 1) Yellow Concrete Mixer -> spins drum briskly ("Work! Mix and build!")
 * 2) Red Brick Wall & Pallet -> raises extra brick row smoothly ("Red bricks! Build the wall!")
 * 3) Hard Hat Barrel, Safety Cones & Worker NPC -> hops hard hat & worker waves ("Careful! Wear a hard hat!")
 */
export function InteractiveConstructionSite({
  position,
  rotationY = 0,
  isNight,
  onTriggerAudio,
  onInspectCuriosity,
}: InteractiveShopProps) {
  const [brickTiers, setBrickTiers] = useState(1);

  const mixerDrumRef = useRef<THREE.Group>(null);
  const helmetRef = useRef<THREE.Group>(null);
  const mixerSpinRef = useRef(0);
  const helmetHopRef = useRef(0);
  const workerWaveRef = useRef(0);

  const glow = isNight ? 1.8 : 0.7;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (mixerSpinRef.current > 0.05) {
      mixerSpinRef.current = Math.max(0, mixerSpinRef.current - dt * 1.4);
      if (mixerDrumRef.current) {
        mixerDrumRef.current.rotation.y += mixerSpinRef.current * dt * 9;
      }
    } else if (mixerDrumRef.current) {
      mixerDrumRef.current.rotation.y += dt * 0.6;
    }

    if (helmetHopRef.current > 0) {
      helmetHopRef.current = Math.max(0, helmetHopRef.current - dt * 1.7);
      if (helmetRef.current) {
        helmetRef.current.position.y = 0.62 + Math.sin(helmetHopRef.current * Math.PI) * 0.18;
        helmetRef.current.rotation.y += dt * 5;
      }
    } else if (helmetRef.current) {
      helmetRef.current.position.y = 0.62;
    }
  });

  const handleMixerClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    mixerSpinRef.current = 3.2;
    onTriggerAudio('world_construction_mixer', [position[0] - 0.55, 0.08, position[2] - 1.15]);
  };

  const handleBricksClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setBrickTiers((prev) => (prev >= 3 ? 1 : prev + 1));
    onTriggerAudio('world_construction_bricks', [position[0] + 0.35, 0.08, position[2] - 1.05]);
  };

  const handleHelmetClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    helmetHopRef.current = 1;
    workerWaveRef.current = 2.0;
    onTriggerAudio('world_construction_helmet', [position[0] + 0.95, 0.08, position[2] - 1.18]);
  };

  return (
    <group name="Shop_Interactive_ConstructionSite" position={position} rotation={[0, rotationY, 0]}>
      {/* Poured Concrete Foundation Slab */}
      <RoundedBox args={[2.55, 0.14, 1.9]} radius={0.03} smoothness={2} position={[0, 0.07, 0]} receiveShadow>
        <meshStandardMaterial color="#cbd5e1" roughness={0.92} />
      </RoundedBox>

      {/* Timber Framing & Wooden Scaffolding Structure */}
      {[
        [-1.08, 1.02, -0.75],
        [1.08, 1.02, -0.75],
        [-1.08, 1.02, 0.75],
        [1.08, 1.02, 0.75],
      ].map(([px, py, pz], idx) => (
        <mesh key={idx} position={[px, py, pz]} castShadow>
          <boxGeometry args={[0.11, 1.9, 0.11]} />
          <meshStandardMaterial color="#b47b4e" roughness={0.88} />
        </mesh>
      ))}
      {/* Top Wooden Framing Beams & Plank Deck */}
      <mesh position={[0, 1.92, -0.75]} castShadow>
        <boxGeometry args={[2.28, 0.1, 0.1]} />
        <meshStandardMaterial color="#a16207" roughness={0.86} />
      </mesh>
      <mesh position={[0, 1.92, 0.75]} castShadow>
        <boxGeometry args={[2.28, 0.1, 0.1]} />
        <meshStandardMaterial color="#a16207" roughness={0.86} />
      </mesh>
      <mesh position={[-1.08, 1.92, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 1.62]} />
        <meshStandardMaterial color="#a16207" roughness={0.86} />
      </mesh>
      <mesh position={[1.08, 1.92, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 1.62]} />
        <meshStandardMaterial color="#a16207" roughness={0.86} />
      </mesh>
      {/* Mid-level wooden scaffold walkway */}
      <RoundedBox args={[2.24, 0.08, 0.52]} radius={0.015} smoothness={2} position={[0, 1.12, 0.48]} castShadow>
        <meshStandardMaterial color="#c28b5b" roughness={0.88} />
      </RoundedBox>
      {/* Warm Amber Construction Work Beacon on top corner */}
      <mesh position={[-1.08, 2.08, -0.75]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={glow} />
      </mesh>

      {/* Two Orange & White Safety Cones along front curb */}
      {[-1.18, 0.56].map((cx, idx) => (
        <group key={idx} position={[cx, 0, -1.26]}>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.24, 0.04, 0.24]} />
            <meshStandardMaterial color="#ea580c" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.17, 0]} castShadow>
            <coneGeometry args={[0.095, 0.28, 12]} />
            <meshStandardMaterial color="#f97316" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.045, 0.06, 0.06, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* INTERACTIVE 1: Yellow Concrete Mixer with Spinning Drum */}
      <group
        position={[-0.62, 0.14, -0.58]}
        onClick={handleMixerClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Mixer axle + 2 wheels */}
        <mesh position={[-0.24, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 14]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} />
        </mesh>
        <mesh position={[0.24, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 14]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.24, 0]} castShadow>
          <boxGeometry args={[0.42, 0.22, 0.28]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {/* Tilted Spinning Yellow Drum */}
        <group position={[0, 0.44, -0.02]} rotation={[-0.45, 0, 0]}>
          <group ref={mixerDrumRef}>
            <mesh castShadow>
              <cylinderGeometry args={[0.18, 0.25, 0.42, 16]} />
              <meshStandardMaterial color="#facc15" roughness={0.45} metalness={0.2} />
            </mesh>
            {/* Dark stripe band to make rotation clearly visible */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.52, 0.06, 0.06]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>

      {/* INTERACTIVE 2: Growing Red Brick Wall on Wooden Pallet */}
      <group
        position={[0.35, 0.14, -0.35]}
        onClick={handleBricksClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Wooden pallet */}
        <RoundedBox args={[0.96, 0.08, 0.48]} radius={0.015} smoothness={2} position={[0, 0.04, 0]} castShadow>
          <meshStandardMaterial color="#92400e" roughness={0.9} />
        </RoundedBox>
        {/* Dynamic stacked tiers of terracotta red bricks (1 -> 2 -> 3 tiers on click!) */}
        {Array.from({ length: brickTiers }, (_, tier) => (
          <group key={tier} position={[0, 0.16 + tier * 0.17, 0]}>
            {[-0.28, 0, 0.28].map((bx, bIdx) => (
              <RoundedBox
                key={bIdx}
                args={[0.25, 0.14, 0.26]}
                radius={0.015}
                smoothness={2}
                position={[bx + (tier % 2 === 1 ? 0.05 : -0.05), 0, 0]}
                castShadow
              >
                <meshStandardMaterial color={bIdx === 1 ? '#b91c1c' : '#c2410c'} roughness={0.86} />
              </RoundedBox>
            ))}
          </group>
        ))}
      </group>

      {/* INTERACTIVE 3: Tool Barrel with Bouncing Hard Hat + Construction Worker NPC */}
      <group
        position={[0.98, 0, -1.16]}
        onClick={handleHelmetClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {/* Blue industrial tool barrel */}
        <mesh position={[-0.22, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.56, 16]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.5} metalness={0.25} />
        </mesh>
        {/* Bouncing Yellow Hard Hat on top of barrel */}
        <group ref={helmetRef} position={[-0.22, 0.62, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.13, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshStandardMaterial color="#facc15" roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.01, 0.02]}>
            <cylinderGeometry args={[0.15, 0.155, 0.02, 16]} />
            <meshStandardMaterial color="#eab308" roughness={0.38} />
          </mesh>
        </group>

        {/* Construction Worker NPC facing street (-z) — click to learn Builder profession */}
        <group
          position={[0.18, 0, -0.04]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            workerWaveRef.current = 2.0;
            onInspectCuriosity?.('job_builder');
          }}
        >
          <ConstructionWorkerNpc waveTimerRef={workerWaveRef} />
        </group>
      </group>

      {/* INTERACTIVE 4: Tall Wooden Ladder leaning on scaffold */}
      <group
        position={[-1.32, 0, -0.35]}
        rotation={[0, 0, -0.22]}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAudio('world_construction_ladder', [position[0] - 1.32, 0.08, position[2] - 0.35]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPointer(true);
        }}
        onPointerOut={() => setPointer(false)}
      >
        {[-0.15, 0.15].map((lx, i) => (
          <mesh key={i} position={[lx, 0.88, 0]} castShadow>
            <boxGeometry args={[0.045, 1.76, 0.045]} />
            <meshStandardMaterial color="#b47b4e" roughness={0.86} />
          </mesh>
        ))}
        {[0.25, 0.55, 0.85, 1.15, 1.45].map((ry, i) => (
          <mesh key={i} position={[0, ry, 0]}>
            <boxGeometry args={[0.3, 0.035, 0.035]} />
            <meshStandardMaterial color="#d97706" roughness={0.82} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
