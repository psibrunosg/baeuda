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

        {/* Baker NPC facing the street (-z -> rotate Y by PI) */}
        <group position={[-0.14, 0, -0.04]} rotation={[0, Math.PI, 0]}>
          <BakerNpc waveTimerRef={bakerWaveRef} />
        </group>
      </group>
    </group>
  );
}
