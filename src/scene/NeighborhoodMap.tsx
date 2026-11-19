import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type * as THREE from 'three';
import type { LocationStatus } from '../domain/types';

interface NeighborhoodMapProps {
  cafeStatus: LocationStatus;
  visible: boolean;
  onEnterCafe: () => void;
}

export function NeighborhoodMap({
  cafeStatus,
  visible,
  onEnterCafe,
}: NeighborhoodMapProps) {
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const puff1Ref = useRef<THREE.Mesh>(null);
  const puff2Ref = useRef<THREE.Mesh>(null);
  const miniLeoArmRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [visible]);

  useLayoutEffect(() => {
    if (puff1Ref.current) puff1Ref.current.position.y = 2.75;
    if (puff2Ref.current) puff2Ref.current.position.y = 3.1;
  }, []);

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.elapsedTime;
    if (pulseRingRef.current) {
      const s = 1 + Math.sin(t * 3.2) * 0.14;
      pulseRingRef.current.scale.set(s, s, 1);
    }
    if (puff1Ref.current) {
      const cycle = (t * 0.45) % 1;
      puff1Ref.current.position.y = 2.65 + cycle * 0.9;
      puff1Ref.current.scale.setScalar(0.18 + cycle * 0.22);
    }
    if (puff2Ref.current) {
      const cycle = (t * 0.45 + 0.5) % 1;
      puff2Ref.current.position.y = 2.65 + cycle * 0.9;
      puff2Ref.current.scale.setScalar(0.18 + cycle * 0.22);
    }
    if (miniLeoArmRef.current) {
      miniLeoArmRef.current.rotation.z = -0.6 + Math.sin(t * 5.5) * 0.35;
    }
  });

  if (!visible) return null;

  const handleDoorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onEnterCafe();
  };

  const handleDoorPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handleDoorPointerOut = () => {
    document.body.style.cursor = 'auto';
  };

  return (
    <group name="Neighborhood_Diorama">
      {/* Ground island */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[6.4, 6.7, 0.3, 32]} />
        <meshStandardMaterial color="#d9cfb8" roughness={0.95} />
      </mesh>

      {/* Cobblestone street cross */}
      <mesh position={[0, 0.01, 1.4]} receiveShadow>
        <boxGeometry args={[10.5, 0.04, 1.4]} />
        <meshStandardMaterial color="#b4aa9c" roughness={0.92} />
      </mesh>

      {/* Café da Esquina — illuminated hero diorama */}
      <group position={[0, 0, -0.5]}>
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.1, 2.0]} />
          <meshStandardMaterial color="#e07a5f" roughness={0.78} />
        </mesh>

        {/* Roof & chimney */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[2.75, 0.24, 2.25]} />
          <meshStandardMaterial color="#5c4033" roughness={0.85} />
        </mesh>
        <mesh position={[0.8, 2.48, -0.45]} castShadow>
          <boxGeometry args={[0.32, 0.5, 0.32]} />
          <meshStandardMaterial color="#8d5b4c" roughness={0.85} />
        </mesh>

        {/* Chimney steam puffs */}
        <group position={[0.8, 0, -0.45]}>
          <mesh ref={puff1Ref}>
            <sphereGeometry args={[0.35, 10, 10]} />
            <meshStandardMaterial color="#fff8ee" transparent opacity={0.55} roughness={1} />
          </mesh>
        </group>
        <group position={[0.88, 0, -0.45]}>
          <mesh ref={puff2Ref}>
            <sphereGeometry args={[0.35, 10, 10]} />
            <meshStandardMaterial color="#fff8ee" transparent opacity={0.4} roughness={1} />
          </mesh>
        </group>

        {/* Striped awning */}
        <mesh position={[0, 1.62, 1.25]} rotation={[0.32, 0, 0]} castShadow>
          <boxGeometry args={[2.45, 0.12, 0.72]} />
          <meshStandardMaterial color="#f4e4c1" roughness={0.8} />
        </mesh>
        <mesh position={[-0.6, 1.65, 1.25]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.36, 0.13, 0.73]} />
          <meshStandardMaterial color="#2a6f68" roughness={0.8} />
        </mesh>
        <mesh position={[0.6, 1.65, 1.25]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.36, 0.13, 0.73]} />
          <meshStandardMaterial color="#2a6f68" roughness={0.8} />
        </mesh>

        {/* Warm glowing window */}
        <mesh position={[-0.65, 1.05, 1.01]}>
          <boxGeometry args={[0.82, 0.72, 0.05]} />
          <meshStandardMaterial
            color="#ffe599"
            emissive="#f59e0b"
            emissiveIntensity={cafeStatus === 'familiar' ? 0.85 : 0.55}
            roughness={0.3}
          />
        </mesh>

        {/* Clickable Café Door */}
        <group
          name="prop_cafe_door"
          position={[0.55, 0.65, 1.02]}
          onClick={handleDoorClick}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <mesh castShadow>
            <boxGeometry args={[0.72, 1.28, 0.08]} />
            <meshStandardMaterial color="#6b4423" roughness={0.7} />
          </mesh>
          <mesh position={[0.22, 0, 0.06]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Pulsing floor ring beneath the door */}
          <mesh ref={pulseRingRef} position={[0, -0.62, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.42, 0.56, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
          </mesh>
        </group>

        {/* Mini Leo waving in front of the door */}
        <group
          name="prop_cafe_door"
          position={[1.15, 0, 1.38]}
          onClick={handleDoorClick}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <mesh position={[0, 0.38, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.28, 6, 12]} />
            <meshStandardMaterial color="#3d6b59" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.74, 0]} castShadow>
            <sphereGeometry args={[0.15, 14, 14]} />
            <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
          </mesh>
          <mesh ref={miniLeoArmRef} position={[0.19, 0.52, 0]} castShadow>
            <capsuleGeometry args={[0.045, 0.2, 4, 8]} />
            <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
          </mesh>
        </group>
      </group>

      {/* Unexplored Neighborhood Blocks in Soft Translucent Fog (Market & Plaza silhouettes) */}
      <group position={[-3.3, 0, -0.4]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.9, 1.4, 1.5]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.45} roughness={0.95} />
        </mesh>
        {/* Translucent fog clouds */}
        <mesh position={[0, 1.65, 0.2]}>
          <sphereGeometry args={[0.95, 12, 12]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.68} roughness={1} />
        </mesh>
        <mesh position={[0.7, 1.45, -0.2]}>
          <sphereGeometry args={[0.72, 12, 12]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.62} roughness={1} />
        </mesh>
      </group>

      <group position={[3.3, 0, -0.8]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.22, 0.25, 0.7, 10]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.65, 12, 12]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.45} />
        </mesh>
        <mesh position={[-0.2, 1.35, 0.35]}>
          <sphereGeometry args={[0.92, 12, 12]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.65} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
