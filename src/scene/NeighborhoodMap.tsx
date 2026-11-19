import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { LocationStatus } from '../domain/types';
import { getCafeGeometries } from './cafeGeometries';
import { getCafeTextures } from './cafeTextures';

interface NeighborhoodMapProps {
  cafeStatus: LocationStatus;
  visible: boolean;
  onEnterCafe: () => void;
}

function StylizedTree({
  position,
  scale = 1,
  fogged = false,
}: {
  position: [number, number, number];
  scale?: number;
  fogged?: boolean;
}) {
  const textures = useMemo(() => getCafeTextures(), []);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.34, 0]} castShadow={!fogged}>
        <cylinderGeometry args={[0.09, 0.13, 0.68, 10]} />
        <meshStandardMaterial
          color={fogged ? '#94a3b8' : '#7c5234'}
          transparent={fogged}
          opacity={fogged ? 0.45 : 1}
          roughness={0.92}
        />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow={!fogged}>
        <sphereGeometry args={[0.42, 14, 14]} />
        <meshStandardMaterial
          color={fogged ? '#cbd5e1' : '#5f8d5b'}
          bumpMap={fogged ? null : textures.clayBump}
          bumpScale={0.01}
          transparent={fogged}
          opacity={fogged ? 0.48 : 1}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[-0.22, 0.76, 0.15]} castShadow={!fogged}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial
          color={fogged ? '#cbd5e1' : '#4d7c4a'}
          transparent={fogged}
          opacity={fogged ? 0.45 : 1}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0.24, 0.82, -0.1]} castShadow={!fogged}>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial
          color={fogged ? '#cbd5e1' : '#73a36d'}
          transparent={fogged}
          opacity={fogged ? 0.45 : 1}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
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

  const geos = useMemo(() => getCafeGeometries(), []);
  const textures = useMemo(() => getCafeTextures(), []);

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [visible]);

  useLayoutEffect(() => {
    if (puff1Ref.current) puff1Ref.current.position.y = 0.1;
    if (puff2Ref.current) puff2Ref.current.position.y = 0.45;
  }, [visible]);

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.elapsedTime;
    if (pulseRingRef.current) {
      const s = 1 + Math.sin(t * 3.2) * 0.14;
      pulseRingRef.current.scale.set(s, s, 1);
    }
    if (puff1Ref.current) {
      const cycle = (t * 0.45) % 1;
      puff1Ref.current.position.y = cycle * 0.92;
      puff1Ref.current.scale.setScalar(0.18 + cycle * 0.24);
    }
    if (puff2Ref.current) {
      const cycle = (t * 0.45 + 0.5) % 1;
      puff2Ref.current.position.y = cycle * 0.92;
      puff2Ref.current.scale.setScalar(0.18 + cycle * 0.24);
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
      {/* Grounded studio AO across the whole diorama island */}
      <ContactShadows
        frames={1}
        position={[0, 0.012, 0]}
        opacity={0.34}
        scale={13}
        blur={2.4}
        far={3.5}
        color="#4a3728"
      />

      {/* Sculpted miniature diorama island: warm terracotta soil rim + sage turf top */}
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <cylinderGeometry args={[6.45, 6.1, 0.44, 40]} />
        <meshStandardMaterial
          color="#a67c52"
          bumpMap={textures.clayBump}
          bumpScale={0.015}
          roughness={0.95}
        />
      </mesh>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[6.42, 6.48, 0.12, 40]} />
        <meshStandardMaterial
          color="#b9c698"
          bumpMap={textures.clayBump}
          bumpScale={0.012}
          roughness={0.94}
        />
      </mesh>

      {/* Cobblestone street + raised warm stone sidewalk & curb */}
      <mesh position={[0, 0.015, 1.55]} receiveShadow>
        <boxGeometry args={[11.2, 0.04, 1.5]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.018}
          roughness={0.9}
        />
      </mesh>
      <RoundedBox args={[5.2, 0.075, 2.75]} radius={0.03} smoothness={3} position={[0, 0.025, -0.42]} receiveShadow>
        <meshStandardMaterial
          color="#dfd3be"
          bumpMap={textures.plasterBump}
          bumpScale={0.008}
          roughness={0.88}
        />
      </RoundedBox>

      {/* Café da Esquina — tactile artisan diorama hero */}
      <group position={[0, 0.06, -0.55]}>
        {/* Main textured terracotta stucco building */}
        <RoundedBox args={[2.56, 2.12, 2.04]} radius={0.05} smoothness={3} position={[0, 1.06, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#ffffff"
            map={textures.terracottaColor}
            bumpMap={textures.terracottaBump}
            bumpScale={0.016}
            roughness={0.84}
          />
        </RoundedBox>

        {/* Cream stone base plinth & cornice molding */}
        <RoundedBox args={[2.64, 0.22, 2.12]} radius={0.03} smoothness={2} position={[0, 0.11, 0]} receiveShadow>
          <meshStandardMaterial color="#e7dac5" roughness={0.88} />
        </RoundedBox>
        <RoundedBox args={[2.7, 0.1, 2.18]} radius={0.025} smoothness={2} position={[0, 2.08, 0]} castShadow>
          <meshStandardMaterial color="#f2e4ce" roughness={0.85} />
        </RoundedBox>

        {/* Pitched roof cap with warm clay overhang */}
        <RoundedBox args={[2.86, 0.24, 2.34]} radius={0.05} smoothness={3} position={[0, 2.24, 0]} castShadow>
          <meshStandardMaterial
            color="#5a3827"
            bumpMap={textures.clayBump}
            bumpScale={0.012}
            roughness={0.86}
          />
        </RoundedBox>
        {/* Terracotta rooftop trim */}
        <RoundedBox args={[2.5, 0.18, 1.98]} radius={0.04} smoothness={3} position={[0, 2.42, 0]} castShadow>
          <meshStandardMaterial color="#7c4732" roughness={0.85} />
        </RoundedBox>

        {/* Brick chimney with collar + rising steam puffs */}
        <group position={[0.82, 2.52, -0.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.5, 0.34]} />
            <meshStandardMaterial color="#8f4f3c" bumpMap={textures.terracottaBump} bumpScale={0.012} roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <boxGeometry args={[0.42, 0.08, 0.42]} />
            <meshStandardMaterial color="#5c3527" roughness={0.88} />
          </mesh>
        </group>
        <group position={[0.82, 2.84, -0.45]}>
          <mesh ref={puff1Ref}>
            <sphereGeometry args={[0.34, 12, 12]} />
            <meshStandardMaterial color="#fff8ee" transparent opacity={0.55} roughness={1} depthWrite={false} />
          </mesh>
        </group>
        <group position={[0.9, 2.84, -0.45]}>
          <mesh ref={puff2Ref}>
            <sphereGeometry args={[0.34, 12, 12]} />
            <meshStandardMaterial color="#fff8ee" transparent opacity={0.42} roughness={1} depthWrite={false} />
          </mesh>
        </group>

        {/* Scalloped 7-stripe awning */}
        <group position={[0, 1.65, 1.26]} rotation={[0.32, 0, 0]}>
          {Array.from({ length: 7 }, (_, i) => (
            <RoundedBox
              key={i}
              args={[0.35, 0.12, 0.76]}
              radius={0.03}
              smoothness={3}
              position={[-1.05 + i * 0.35, 0, 0]}
              castShadow
            >
              <meshStandardMaterial
                color={i % 2 === 0 ? '#f6e7cc' : '#2a6f62'}
                bumpMap={textures.clayBump}
                bumpScale={0.006}
                roughness={0.84}
              />
            </RoundedBox>
          ))}
        </group>

        {/* Framed warm glowing café window + wooden flower box with colorful blooms */}
        <group position={[-0.64, 1.06, 1.03]}>
          <RoundedBox args={[0.92, 0.82, 0.08]} radius={0.02} smoothness={2}>
            <meshStandardMaterial color="#f5ebd8" roughness={0.82} />
          </RoundedBox>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.78, 0.68]} />
            <meshStandardMaterial
              color="#ffe9a6"
              emissive="#f59e0b"
              emissiveIntensity={cafeStatus === 'familiar' ? 0.95 : 0.62}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[0.04, 0.7, 0.03]} />
            <meshStandardMaterial color="#f5ebd8" />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[0.8, 0.04, 0.03]} />
            <meshStandardMaterial color="#f5ebd8" />
          </mesh>
          {/* Flower box */}
          <RoundedBox args={[0.92, 0.18, 0.22]} radius={0.02} smoothness={2} position={[0, -0.44, 0.09]} castShadow>
            <meshStandardMaterial color="#7a4e32" roughness={0.85} />
          </RoundedBox>
          {[-0.28, -0.08, 0.12, 0.28].map((fx, idx) => (
            <group key={idx} position={[fx, -0.32, 0.11]}>
              <mesh>
                <sphereGeometry args={[0.075, 10, 10]} />
                <meshStandardMaterial color="#4d7c54" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.055, 0.02]}>
                <sphereGeometry args={[0.036, 8, 8]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? '#f472b6' : '#facc15'}
                  roughness={0.7}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Hanging wrought-iron café sign with miniature 3D ceramic mug (0 text!) */}
        <group position={[1.3, 1.66, 0.84]}>
          <mesh position={[0.14, 0.14, 0]}>
            <boxGeometry args={[0.38, 0.035, 0.035]} />
            <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.4} />
          </mesh>
          <RoundedBox args={[0.34, 0.3, 0.045]} radius={0.03} smoothness={3} position={[0.2, -0.04, 0]} castShadow>
            <meshStandardMaterial color="#fef3c7" roughness={0.75} />
          </RoundedBox>
          <mesh
            geometry={geos.mug}
            position={[0.2, -0.1, 0.03]}
            scale={0.72}
            rotation={[0, 0.3, 0]}
          >
            <meshStandardMaterial color="#c9563c" roughness={0.35} />
          </mesh>
        </group>

        {/* Clickable Paneled Wooden Café Door + Raised Golden Pulsing Ring */}
        <group
          name="prop_cafe_door"
          position={[0.56, 0.65, 1.03]}
          onClick={handleDoorClick}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          {/* Doorframe */}
          <RoundedBox args={[0.84, 1.38, 0.09]} radius={0.02} smoothness={2} position={[0, 0.02, -0.01]}>
            <meshStandardMaterial color="#f5ebd8" roughness={0.82} />
          </RoundedBox>
          {/* Door leaf */}
          <RoundedBox args={[0.72, 1.28, 0.08]} radius={0.02} smoothness={2} castShadow>
            <meshStandardMaterial
              color="#693e22"
              bumpMap={textures.woodCounterBump}
              bumpScale={0.008}
              roughness={0.72}
            />
          </RoundedBox>
          {/* Small upper door window pane */}
          <mesh position={[0, 0.28, 0.045]}>
            <planeGeometry args={[0.42, 0.36]} />
            <meshStandardMaterial
              color="#fde68a"
              emissive="#f59e0b"
              emissiveIntensity={0.65}
            />
          </mesh>
          {/* Brass doorknob */}
          <mesh position={[0.24, -0.04, 0.062]}>
            <sphereGeometry args={[0.044, 12, 12]} />
            <meshStandardMaterial color="#facc15" metalness={0.78} roughness={0.22} />
          </mesh>
          {/* Pulsing floor ring cleanly above sidewalk/road (zero z-fighting) */}
          <mesh ref={pulseRingRef} position={[0, -0.59, 0.38]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.54, 36]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
          </mesh>
        </group>

        {/* Expressive Mini Leo waving outside the door */}
        <group
          name="prop_cafe_door"
          position={[1.18, 0.02, 1.38]}
          onClick={handleDoorClick}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <mesh position={[0, 0.36, 0]} castShadow>
            <capsuleGeometry args={[0.135, 0.26, 8, 14]} />
            <meshStandardMaterial color="#355f4e" bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <sphereGeometry args={[0.155, 16, 16]} />
            <meshStandardMaterial color="#f3c6a0" bumpMap={textures.clayBump} bumpScale={0.004} roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.78, -0.01]} castShadow>
            <sphereGeometry args={[0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshStandardMaterial color="#4b2e1e" roughness={0.88} />
          </mesh>
          <mesh ref={miniLeoArmRef} position={[0.19, 0.52, 0]} castShadow>
            <capsuleGeometry args={[0.044, 0.19, 6, 10]} />
            <meshStandardMaterial color="#f3c6a0" roughness={0.82} />
          </mesh>
        </group>

        {/* Outdoor Sidewalk Bistro Table & Chairs */}
        <group position={[-1.62, 0.02, 0.92]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.56, 10]} />
            <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.32, 0.3, 0.045, 20]} />
            <meshStandardMaterial color="#f7ead6" roughness={0.6} />
          </mesh>
          <mesh geometry={geos.mug} position={[0.05, 0.58, 0.04]} scale={0.65} castShadow>
            <meshStandardMaterial color="#dc5a2c" roughness={0.3} />
          </mesh>
          {/* Two little bistro chairs */}
          {[-0.44, 0.44].map((cx, idx) => (
            <group key={idx} position={[cx, 0, 0]} rotation={[0, idx === 0 ? 0.25 : -0.25, 0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.14, 0.035, 14]} />
                <meshStandardMaterial color="#2a6f62" roughness={0.78} />
              </mesh>
              <mesh position={[0, 0.15, 0]} castShadow>
                <cylinderGeometry args={[0.022, 0.03, 0.3, 8]} />
                <meshStandardMaterial color="#27272a" metalness={0.5} roughness={0.5} />
              </mesh>
              <mesh position={[idx === 0 ? -0.13 : 0.13, 0.48, 0]} castShadow>
                <boxGeometry args={[0.03, 0.34, 0.24]} />
                <meshStandardMaterial color="#2a6f62" roughness={0.78} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Cozy Vintage Streetlamp on left sidewalk corner (keeps hanging café sign unobstructed) */}
        <group position={[-2.28, 0.02, 1.48]}>
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.06, 1.9, 10]} />
            <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.38} />
          </mesh>
          <mesh position={[0, 1.98, 0]}>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial
              color="#fef9c3"
              emissive="#fbbf24"
              emissiveIntensity={1.25}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 2.13, 0]} castShadow>
            <coneGeometry args={[0.18, 0.12, 12]} />
            <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Cozy green neighborhood trees framing the café */}
      <StylizedTree position={[-2.15, 0, -2.3]} scale={0.95} />
      <StylizedTree position={[2.45, 0, -2.1]} scale={1.08} />

      {/* Unexplored Local Market (Lesson 2 teaser: stall + crates under dreamy translucent fog) */}
      <group position={[-3.55, 0, -0.35]}>
        <RoundedBox args={[1.95, 1.15, 1.35]} radius={0.05} smoothness={2} position={[0, 0.58, 0]}>
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.42} roughness={0.95} />
        </RoundedBox>
        <mesh position={[0, 1.32, 0.1]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[2.15, 0.14, 1.55]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.48} roughness={0.9} />
        </mesh>
        <mesh position={[-0.45, 0.22, 0.85]}>
          <boxGeometry args={[0.42, 0.36, 0.36]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0.15, 1.72, 0.2]}>
          <sphereGeometry args={[1.05, 14, 14]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.64} roughness={1} depthWrite={false} />
        </mesh>
        <mesh position={[-0.75, 1.48, -0.15]}>
          <sphereGeometry args={[0.78, 12, 12]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.58} roughness={1} depthWrite={false} />
        </mesh>
      </group>

      {/* Unexplored Central Plaza (trees + fountain silhouette under translucent fog) */}
      <group position={[3.55, 0, -0.65]}>
        <StylizedTree position={[0.35, 0, -0.3]} scale={0.92} fogged />
        <mesh position={[-0.35, 0.22, 0.3]}>
          <cylinderGeometry args={[0.52, 0.58, 0.32, 16]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.42} />
        </mesh>
        <mesh position={[-0.1, 1.35, 0.25]}>
          <sphereGeometry args={[1.02, 14, 14]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.62} roughness={1} depthWrite={false} />
        </mesh>
        <mesh position={[0.65, 1.25, -0.25]}>
          <sphereGeometry args={[0.76, 12, 12]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.56} roughness={1} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
