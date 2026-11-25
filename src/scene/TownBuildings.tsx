import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';
import { houseGeometry, houseGlassMaterial } from './toyBuildings';
import { BlobShadow, toyMaterial } from './toyKit';
import { carGeometry } from './toyProps';

const RAIN_COUNT = 180;

const RAIN_SEEDS = Array.from({ length: RAIN_COUNT }, (_, i) => {
  const r1 = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const r2 = ((Math.sin(i * 78.233) * 24634.6345) % 1 + 1) % 1;
  const r3 = ((Math.sin(i * 39.425) * 19283.4712) % 1 + 1) % 1;
  return {
    x: (r1 - 0.5) * 40,
    y: r2 * 7.5,
    z: (r3 - 0.5) * 30,
    speed: 6.2 + (i % 5) * 0.7,
  };
});

/**
 * Single draw-call city-wide angled rainfall across the 2.5D neighborhood.
 */
export function CityRainParticles({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || !active) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < RAIN_COUNT; i++) {
      const s = RAIN_SEEDS[i];
      const y = 7.5 - ((s.y + t * s.speed) % 7.5);
      const x = s.x - (7.5 - y) * 0.08;
      dummy.position.set(x, y, s.z);
      dummy.rotation.set(0, 0, -0.08);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RAIN_COUNT]} frustumCulled={false}>
      <cylinderGeometry args={[0.008, 0.008, 0.34, 4]} />
      <meshBasicMaterial color="#bae6fd" transparent opacity={0.48} depthWrite={false} />
    </instancedMesh>
  );
}

/**
 * Warm festoon string lights draped cleanly between café corner and streetlamps.
 */
export function PatioStringLights({
  start,
  end,
  isNight,
}: {
  start: [number, number, number];
  end: [number, number, number];
  isNight: boolean;
}) {
  const [sx, sy, sz] = start;
  const [ex, ey, ez] = end;
  const { curveGeo, bulbs } = useMemo(() => {
    const p0 = new THREE.Vector3(sx, sy, sz);
    const p2 = new THREE.Vector3(ex, ey, ez);
    const mid = p0.clone().lerp(p2, 0.5);
    mid.y -= 0.26;
    const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
    const geo = new THREE.TubeGeometry(curve, 18, 0.009, 6, false);
    const pts: THREE.Vector3[] = [];
    for (let i = 1; i <= 7; i++) {
      pts.push(curve.getPoint(i / 8));
    }
    return { curveGeo: geo, bulbs: pts };
  }, [sx, sy, sz, ex, ey, ez]);

  const bulbsRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    return () => {
      curveGeo.dispose();
    };
  }, [curveGeo]);

  useLayoutEffect(() => {
    const mesh = bulbsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < bulbs.length; i++) {
      const pt = bulbs[i];
      dummy.position.set(pt.x, pt.y - 0.035, pt.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [bulbs]);

  return (
    <group>
      <mesh geometry={curveGeo}>
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>
      <instancedMesh ref={bulbsRef} args={[undefined, undefined, bulbs.length]}>
        <sphereGeometry args={[0.038, 10, 10]} />
        <meshStandardMaterial
          color="#fef9c3"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 2.2 : 0.85}
          roughness={0.15}
        />
      </instancedMesh>
    </group>
  );
}

/**
 * Northern Landmark Clocktower standing in the North Forest / Park horizon.
 */
export function BackgroundClocktower({
  position,
  isNight,
}: {
  position: [number, number, number];
  isNight: boolean;
}) {
  const textures = useMemo(() => getCafeTextures(), []);
  const glow = isNight ? 1.4 : 0.5;

  return (
    <group position={position}>
      <RoundedBox args={[2.5, 3.15, 1.8]} radius={0.05} smoothness={2} position={[0, 1.58, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#b8c7d4"
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.88}
        />
      </RoundedBox>
      <RoundedBox args={[2.6, 0.28, 1.9]} radius={0.03} smoothness={2} position={[0, 0.14, 0]}>
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[2.68, 0.14, 1.98]} radius={0.03} smoothness={2} position={[0, 3.16, 0]} castShadow>
        <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
      </RoundedBox>
      <mesh position={[0, 3.72, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.65, 1.0, 4]} />
        <meshStandardMaterial color="#475569" roughness={0.82} />
      </mesh>
      <group position={[0, 2.45, 0.92]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.05, 24]} />
          <meshStandardMaterial color="#b48a3e" metalness={0.72} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.02, 24]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#fef08a"
            emissiveIntensity={isNight ? 0.95 : 0.2}
          />
        </mesh>
        <mesh position={[0, 0.09, 0.048]}>
          <boxGeometry args={[0.025, 0.2, 0.01]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.08, 0, 0.048]} rotation={[0, 0, -Math.PI / 2]}>
          <boxGeometry args={[0.022, 0.16, 0.01]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
      {[-0.62, 0.62].map((wx, idx) => (
        <group key={idx} position={[wx, 1.25, 0.91]}>
          <RoundedBox args={[0.68, 0.88, 0.07]} radius={0.02} smoothness={2}>
            <meshStandardMaterial color="#f8fafc" roughness={0.82} />
          </RoundedBox>
          <mesh position={[0, 0, 0.039]}>
            <planeGeometry args={[0.54, 0.74]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={glow} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Cozy 2.5D Residential House facing South (+Z) with garden flower box, chimney, and welcome mat.
 */
export function ResidentialHouse({
  position,
  wallColor,
  roofColor,
  doorColor = '#6b4226',
  isNight,
  onExplore,
}: {
  position: [number, number, number];
  wallColor: string;
  roofColor: string;
  doorColor?: string;
  isNight: boolean;
  onExplore?: () => void;
}) {
  const house = houseGeometry(wallColor, roofColor, doorColor);

  return (
    <group
      position={position}
      onClick={(e) => {
        if (!onExplore) return;
        e.stopPropagation();
        onExplore();
      }}
      onPointerOver={(e) => {
        if (!onExplore) return;
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh geometry={house.solid} material={toyMaterial()} castShadow receiveShadow />
      <mesh geometry={house.glow} material={houseGlassMaterial(isNight)} />
    </group>
  );
}

/**
 * Charming Retro Compact City Car parked neatly along the promenade.
 */
export function RetroParkedCar({
  position,
  rotationY = 0,
  color = '#60a5fa',
  isNight = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
  isNight?: boolean;
}) {
  const car = carGeometry(color, 1);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <BlobShadow size={[1.75, 1.05]} y={0.004} />
      <group scale={1.5}>
        <mesh geometry={car.body} material={toyMaterial('gloss')} castShadow receiveShadow />
        {/* parked: lamps only light up at night */}
        <mesh geometry={car.lights} material={toyMaterial(isNight ? 'glow' : 'gloss')} />
      </group>
    </group>
  );
}

/**
 * North-Center Park Lake with stone rim, lily pads, and small wooden viewing deck.
 */
export function ParkLake({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stone rim */}
      <mesh position={[0, 0.02, 0]} scale={[1.45, 1, 0.95]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.2, 0.1, 28]} />
        <meshStandardMaterial color="#d6cab6" roughness={0.9} />
      </mesh>
      {/* Sparkling water surface */}
      <mesh position={[0, 0.06, 0]} scale={[1.38, 1, 0.88]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.0, 28]} />
        <meshPhysicalMaterial color="#38bdf8" roughness={0.12} clearcoat={0.9} />
      </mesh>
      {/* Lily pads */}
      {[
        [-0.9, 0.08, 0.35],
        [-0.55, 0.08, 0.6],
        [1.1, 0.08, -0.4],
        [0.75, 0.08, -0.65],
      ].map(([lx, ly, lz], idx) => (
        <mesh key={idx} position={[lx, ly, lz]} rotation={[-Math.PI / 2, 0, idx * 0.8]}>
          <circleGeometry args={[0.22, 12, 0, Math.PI * 1.82]} />
          <meshStandardMaterial color="#4d7c4a" roughness={0.8} />
        </mesh>
      ))}
      {/* Wooden lakeside viewing deck */}
      <RoundedBox args={[1.3, 0.1, 0.9]} radius={0.02} smoothness={2} position={[-1.95, 0.1, 0.85]} castShadow receiveShadow>
        <meshStandardMaterial color="#9c6644" roughness={0.86} />
      </RoundedBox>
    </group>
  );
}

/**
 * East River channel separating Downtown from the Services District, crossed by 2 wooden bridges.
 */
export function EastRiverAndBridges({
  onWalkClick,
}: {
  onWalkClick?: (x: number, z: number) => void;
}) {
  return (
    <group name="East_River_And_Bridges">
      {/* River channel from Lake (Z=-8.2) down to South Sea (Z=13.5) */}
      <mesh position={[10.6, 0.02, 2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 22.0]} />
        <meshPhysicalMaterial color="#38bdf8" roughness={0.14} clearcoat={0.85} />
      </mesh>
      {/* Stone riverbanks */}
      <mesh position={[9.52, 0.035, 2.6]} receiveShadow>
        <boxGeometry args={[0.18, 0.08, 22.0]} />
        <meshStandardMaterial color="#cfc3ae" roughness={0.9} />
      </mesh>
      <mesh position={[11.68, 0.035, 2.6]} receiveShadow>
        <boxGeometry args={[0.18, 0.08, 22.0]} />
        <meshStandardMaterial color="#cfc3ae" roughness={0.9} />
      </mesh>

      {/* 2 Wooden Plank Bridges (Main Ave Z=-0.5 and South Ave Z=6.5) */}
      {[-0.5, 6.5].map((bz, idx) => (
        <group
          key={idx}
          position={[10.6, 0.08, bz]}
          onClick={(e) => {
            if (!onWalkClick) return;
            e.stopPropagation();
            onWalkClick(e.point.x, e.point.z);
          }}
        >
          <RoundedBox args={[2.65, 0.12, 2.1]} radius={0.03} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color="#a47148" roughness={0.86} />
          </RoundedBox>
          {/* Bridge wooden railings (North & South edges) */}
          {[-0.98, 0.98].map((rz, rIdx) => (
            <group key={rIdx} position={[0, 0.28, rz]}>
              <RoundedBox args={[2.6, 0.07, 0.07]} radius={0.015} smoothness={2} castShadow>
                <meshStandardMaterial color="#7a4e32" roughness={0.85} />
              </RoundedBox>
              {[-1.15, 0, 1.15].map((px, pIdx) => (
                <mesh key={pIdx} position={[px, -0.14, 0]} castShadow>
                  <boxGeometry args={[0.09, 0.34, 0.09]} />
                  <meshStandardMaterial color="#6b4226" roughness={0.88} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * South Beach Promenade (Z5): sandy shore, shimmering sea, wooden pier, bus stop, bench, and parked car.
 */
export function SouthBeachAndPier({
  isNight,
  onExploreStreet,
  onWalkClick,
}: {
  isNight: boolean;
  onExploreStreet?: (key: SpeechKey) => void;
  onWalkClick?: (x: number, z: number) => void;
}) {
  return (
    <group name="South_Beach_And_Pier">
      {/* Golden sand beach strip */}
      <mesh
        position={[0, 0.012, 11.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => {
          if (!onWalkClick) return;
          e.stopPropagation();
          onWalkClick(e.point.x, e.point.z);
        }}
      >
        <planeGeometry args={[40, 3.0]} />
        <meshStandardMaterial color="#f3dfb6" roughness={0.95} />
      </mesh>

      {/* Shimmering turquoise South Sea */}
      <mesh position={[0, 0.005, 14.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[42, 3.6]} />
        <meshPhysicalMaterial color="#0ea5e9" roughness={0.14} clearcoat={0.85} />
      </mesh>

      {/* Walkable Wooden Pier extending into the sea */}
      <group
        position={[0, 0.08, 13.4]}
        onClick={(e) => {
          if (!onWalkClick) return;
          e.stopPropagation();
          onWalkClick(e.point.x, e.point.z);
        }}
      >
        <RoundedBox args={[2.6, 0.12, 3.8]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color="#9c6644" roughness={0.88} />
        </RoundedBox>
        {[-1.15, 1.15].map((px) =>
          [-1.5, 0, 1.5].map((pz) => (
            <mesh key={`${px}_${pz}`} position={[px, 0.22, pz]} castShadow>
              <cylinderGeometry args={[0.07, 0.08, 0.52, 8]} />
              <meshStandardMaterial color="#6b4226" roughness={0.9} />
            </mesh>
          )),
        )}
      </group>

      {/* Coastal Bus Stop Shelter (clickable: "Bus stop! Wait for the bus!") */}
      <group
        position={[-4.0, 0.06, 9.2]}
        onClick={(e) => {
          e.stopPropagation();
          onExploreStreet?.('world_bus_stop');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {[-0.65, 0.65].map((px, idx) => (
          <mesh key={idx} position={[px, 0.62, -0.22]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 1.24, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
          </mesh>
        ))}
        <RoundedBox args={[1.5, 0.08, 0.68]} radius={0.025} smoothness={2} position={[0, 1.24, -0.06]} castShadow>
          <meshStandardMaterial color="#2a6f62" roughness={0.65} />
        </RoundedBox>
        <mesh position={[0, 0.65, -0.24]}>
          <boxGeometry args={[1.22, 0.92, 0.03]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.32} roughness={0.08} clearcoat={1} depthWrite={false} />
        </mesh>
        <RoundedBox args={[0.96, 0.07, 0.28]} radius={0.015} smoothness={2} position={[0, 0.28, -0.08]} castShadow>
          <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
        </RoundedBox>
        <mesh position={[-0.86, 0.68, 0.22]} castShadow>
          <cylinderGeometry args={[0.024, 0.028, 1.36, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.86, 1.32, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 16]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
      </group>

      {/* Seaside Bench & Flower Bed (clickable: "Sit down! Rest on the bench!") */}
      <group
        position={[4.2, 0.06, 9.3]}
        onClick={(e) => {
          e.stopPropagation();
          onExploreStreet?.('world_bench_sit');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <RoundedBox args={[1.05, 0.08, 0.34]} radius={0.02} smoothness={2} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
        </RoundedBox>
        <RoundedBox args={[1.05, 0.24, 0.06]} radius={0.02} smoothness={2} position={[0, 0.44, -0.15]} castShadow>
          <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
        </RoundedBox>
        {[-0.42, 0.42].map((lx, idx) => (
          <mesh key={idx} position={[lx, 0.14, 0]} castShadow>
            <boxGeometry args={[0.06, 0.28, 0.28]} />
            <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* Parked Retro City Car along the South Avenue curb */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onExploreStreet?.('world_parked_car');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <RetroParkedCar position={[4.2, 0.06, 8.15]} rotationY={0.02} color="#60a5fa" isNight={isNight} />
      </group>
    </group>
  );
}
