import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';

const RAIN_COUNT = 140;

const RAIN_SEEDS = Array.from({ length: RAIN_COUNT }, (_, i) => {
  const r1 = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const r2 = ((Math.sin(i * 78.233) * 24634.6345) % 1 + 1) % 1;
  const r3 = ((Math.sin(i * 39.425) * 19283.4712) % 1 + 1) % 1;
  return {
    x: (r1 - 0.5) * 15,
    y: r2 * 6.5,
    z: (r3 - 0.5) * 11,
    speed: 6.2 + (i % 5) * 0.7,
  };
});

/**
 * Single draw-call city-wide angled rainfall (real weather across the whole neighborhood).
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
      const y = 6.5 - ((s.y + t * s.speed) % 6.5);
      const x = s.x - (6.5 - y) * 0.08;
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
 * Warm festoon string lights draped cleanly from the café corner to the streetlamp.
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
  const { curveGeo, bulbs } = useMemo(() => {
    const p0 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const mid = p0.clone().lerp(p2, 0.5);
    mid.y -= 0.28;
    const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
    const geo = new THREE.TubeGeometry(curve, 18, 0.009, 6, false);
    const pts: THREE.Vector3[] = [];
    for (let i = 1; i <= 7; i++) {
      pts.push(curve.getPoint(i / 8));
    }
    return { curveGeo: geo, bulbs: pts };
  }, [start, end]);

  return (
    <group>
      <mesh geometry={curveGeo}>
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>
      {bulbs.map((pt, idx) => (
        <mesh key={idx} position={[pt.x, pt.y - 0.035, pt.z]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial
            color="#fef9c3"
            emissive="#fbbf24"
            emissiveIntensity={isNight ? 2.2 : 0.85}
            roughness={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Detailed Artisan Bakery framing the back-left skyline (windows, awning, cornice, door, chimney).
 */
export function BackgroundBakery({
  position,
  isNight,
}: {
  position: [number, number, number];
  isNight: boolean;
}) {
  const textures = useMemo(() => getCafeTextures(), []);
  const glow = isNight ? 1.35 : 0.55;

  return (
    <group position={position}>
      {/* Main warm cream-ochre stucco facade */}
      <RoundedBox args={[2.8, 2.55, 1.8]} radius={0.05} smoothness={2} position={[0, 1.28, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f1dab5"
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.88}
        />
      </RoundedBox>
      {/* Stone plinth & cornice */}
      <RoundedBox args={[2.9, 0.24, 1.9]} radius={0.03} smoothness={2} position={[0, 0.12, 0]}>
        <meshStandardMaterial color="#d6c7b2" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[2.98, 0.14, 1.98]} radius={0.03} smoothness={2} position={[0, 2.56, 0]} castShadow>
        <meshStandardMaterial color="#f8efe0" roughness={0.86} />
      </RoundedBox>
      {/* Terracotta pitched roof */}
      <RoundedBox args={[3.05, 0.34, 2.05]} radius={0.05} smoothness={2} position={[0, 2.78, 0]} castShadow>
        <meshStandardMaterial color="#9c533c" bumpMap={textures.clayBump} bumpScale={0.01} roughness={0.86} />
      </RoundedBox>
      {/* Upper arched windows + flower boxes */}
      {[-0.72, 0.72].map((wx, idx) => (
        <group key={idx} position={[wx, 1.82, 0.91]}>
          <RoundedBox args={[0.64, 0.72, 0.07]} radius={0.02} smoothness={2}>
            <meshStandardMaterial color="#fff8ee" roughness={0.82} />
          </RoundedBox>
          <mesh position={[0, 0, 0.039]}>
            <planeGeometry args={[0.5, 0.58]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={glow} />
          </mesh>
          <mesh position={[0, 0, 0.044]}>
            <boxGeometry args={[0.035, 0.58, 0.02]} />
            <meshStandardMaterial color="#fff8ee" />
          </mesh>
          <mesh position={[0, 0, 0.044]}>
            <boxGeometry args={[0.52, 0.035, 0.02]} />
            <meshStandardMaterial color="#fff8ee" />
          </mesh>
          <RoundedBox args={[0.62, 0.12, 0.16]} radius={0.02} smoothness={2} position={[0, -0.38, 0.07]}>
            <meshStandardMaterial color="#7a4e32" roughness={0.85} />
          </RoundedBox>
        </group>
      ))}
      {/* Ground floor bakery awning & warm display window */}
      <mesh position={[0, 1.12, 1.08]} rotation={[0.28, 0, 0]} castShadow>
        <boxGeometry args={[2.3, 0.1, 0.55]} />
        <meshStandardMaterial color="#d97757" roughness={0.85} />
      </mesh>
      <mesh position={[-0.45, 0.68, 0.91]}>
        <planeGeometry args={[0.95, 0.65]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={glow + 0.15} />
      </mesh>
      <RoundedBox args={[0.56, 0.96, 0.07]} radius={0.02} smoothness={2} position={[0.68, 0.54, 0.91]}>
        <meshStandardMaterial color="#6b4226" roughness={0.78} />
      </RoundedBox>
    </group>
  );
}

/**
 * Detailed Bookshop & Clocktower framing the back-right skyline.
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
      {/* Main slate-blue & cream town building */}
      <RoundedBox args={[2.5, 3.15, 1.8]} radius={0.05} smoothness={2} position={[0, 1.58, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#b8c7d4"
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.88}
        />
      </RoundedBox>
      {/* Stone base & roof cornice */}
      <RoundedBox args={[2.6, 0.28, 1.9]} radius={0.03} smoothness={2} position={[0, 0.14, 0]}>
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[2.68, 0.14, 1.98]} radius={0.03} smoothness={2} position={[0, 3.16, 0]} castShadow>
        <meshStandardMaterial color="#f1f5f9" roughness={0.85} />
      </RoundedBox>
      {/* Stepped slate-blue spire roof */}
      <mesh position={[0, 3.72, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.65, 1.0, 4]} />
        <meshStandardMaterial color="#475569" roughness={0.82} />
      </mesh>
      {/* Brass-rimmed town clock face with hands */}
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
        {/* Clock hands */}
        <mesh position={[0, 0.09, 0.048]}>
          <boxGeometry args={[0.025, 0.2, 0.01]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.08, 0, 0.048]} rotation={[0, 0, -Math.PI / 2]}>
          <boxGeometry args={[0.022, 0.16, 0.01]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
      {/* Lit bookshop windows */}
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
 * Pastel European Townhouse for filling out the city skyline with authentic variety.
 */
export function BackgroundTownhouse({
  position,
  wallColor,
  roofColor,
  height = 2.6,
  isNight,
}: {
  position: [number, number, number];
  wallColor: string;
  roofColor: string;
  height?: number;
  isNight: boolean;
}) {
  const textures = useMemo(() => getCafeTextures(), []);
  const glow = isNight ? 1.35 : 0.45;

  return (
    <group position={position}>
      <RoundedBox args={[2.3, height, 1.75]} radius={0.05} smoothness={2} position={[0, height / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={wallColor} bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[2.46, 0.24, 1.92]} radius={0.04} smoothness={2} position={[0, height + 0.12, 0]} castShadow>
        <meshStandardMaterial color={roofColor} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[2.1, 0.22, 1.56]} radius={0.04} smoothness={2} position={[0, height + 0.32, 0]} castShadow>
        <meshStandardMaterial color={roofColor} roughness={0.85} />
      </RoundedBox>
      {/* Chimney */}
      <mesh position={[0.65, height + 0.52, -0.35]} castShadow>
        <boxGeometry args={[0.28, 0.42, 0.28]} />
        <meshStandardMaterial color="#7c4732" roughness={0.88} />
      </mesh>
      {/* Shuttered windows */}
      {[-0.56, 0.56].map((wx, idx) => (
        <group key={idx} position={[wx, height * 0.65, 0.89]}>
          <RoundedBox args={[0.52, 0.66, 0.06]} radius={0.015} smoothness={2}>
            <meshStandardMaterial color="#fff8ee" roughness={0.82} />
          </RoundedBox>
          <mesh position={[0, 0, 0.035]}>
            <planeGeometry args={[0.4, 0.54]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={glow} />
          </mesh>
        </group>
      ))}
      {/* Ground door */}
      <RoundedBox args={[0.54, 0.92, 0.06]} radius={0.02} smoothness={2} position={[0, 0.48, 0.89]}>
        <meshStandardMaterial color="#5a3827" roughness={0.8} />
      </RoundedBox>
    </group>
  );
}

/**
 * Charming Retro Compact City Car parked neatly along the south curb.
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
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Car body */}
      <RoundedBox args={[1.28, 0.34, 0.66]} radius={0.08} smoothness={3} position={[0, 0.28, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={color} roughness={0.28} clearcoat={0.8} />
      </RoundedBox>
      {/* Cream cabin roof */}
      <RoundedBox args={[0.72, 0.28, 0.56]} radius={0.07} smoothness={3} position={[-0.04, 0.54, 0]} castShadow>
        <meshStandardMaterial color="#fdf6ea" roughness={0.35} />
      </RoundedBox>
      {/* Tinted windows */}
      <mesh position={[-0.04, 0.54, 0.285]}>
        <planeGeometry args={[0.54, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.15} metalness={0.3} />
      </mesh>
      <mesh position={[-0.04, 0.54, -0.285]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.54, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.15} metalness={0.3} />
      </mesh>
      {/* 4 Wheels */}
      {[
        [-0.38, 0.14, 0.32],
        [0.38, 0.14, 0.32],
        [-0.38, 0.14, -0.32],
        [0.38, 0.14, -0.32],
      ].map(([wx, wy, wz], idx) => (
        <mesh key={idx} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.09, 16]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
      ))}
      {/* Warm headlights */}
      {[-0.2, 0.2].map((hz, idx) => (
        <mesh key={idx} position={[0.64, 0.3, hz]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial
            color="#fef9c3"
            emissive="#fbbf24"
            emissiveIntensity={isNight ? 2.2 : 0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Full Across-the-Street South Promenade (z > 2.7):
 * pocket park with benches, flower beds, bus stop shelter, newsstand/florist kiosk,
 * vintage streetlamp, bollards, and flanking corner townhouses that frame the street
 * without blocking the central Café view.
 */
export function AcrossStreetPromenade({
  isNight,
  onExploreStreet,
}: {
  isNight: boolean;
  onExploreStreet?: (key: SpeechKey) => void;
}) {
  const textures = useMemo(() => getCafeTextures(), []);
  const glow = isNight ? 1.6 : 0.6;

  return (
    <group name="South_Side_Of_Street">
      {/* Raised South Sidewalk spanning the entire boulevard (depth 4.0 covers PostBank cleanly) */}
      <RoundedBox args={[22.4, 0.08, 4.0]} radius={0.03} smoothness={2} position={[0, 0.025, 4.72]} receiveShadow>
        <meshStandardMaterial
          color="#dfd3be"
          bumpMap={textures.plasterBump}
          bumpScale={0.008}
          roughness={0.88}
        />
      </RoundedBox>

      {/* Sidewalk Iron Bollards along the south curb */}
      {[-3.2, -1.6, 1.5, 3.3].map((bx, idx) => (
        <group key={idx} position={[bx, 0.06, 2.86]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.045, 0.36, 10]} />
            <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.37, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#b48a3e" metalness={0.75} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Cozy South Pocket Park (center-left across from crosswalk, kept low so Café stays clear) */}
      <group position={[-1.05, 0.06, 3.55]}>
        {/* Raised stone flower bed + lush hedge + colorful blooms */}
        <RoundedBox args={[1.65, 0.22, 0.85]} radius={0.04} smoothness={2} position={[0, 0.11, 0.55]} receiveShadow>
          <meshStandardMaterial color="#cfc3ae" roughness={0.88} />
        </RoundedBox>
        {[-0.52, 0, 0.52].map((hx, idx) => (
          <group key={idx} position={[hx, 0.28, 0.55]}>
            <mesh castShadow>
              <sphereGeometry args={[0.24, 12, 12]} />
              <meshStandardMaterial color={idx === 1 ? '#5f8d5b' : '#4d7c54'} bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.9} />
            </mesh>
            <mesh position={[0.06, 0.16, 0.08]}>
              <sphereGeometry args={[0.048, 8, 8]} />
              <meshStandardMaterial color={idx % 2 === 0 ? '#f472b6' : '#facc15'} roughness={0.7} />
            </mesh>
          </group>
        ))}
        {/* Wooden park bench facing the street (clickable: "Sit down! Rest on the bench!") */}
        <group
          position={[0, 0, -0.18]}
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
          <RoundedBox args={[1.05, 0.24, 0.06]} radius={0.02} smoothness={2} position={[0, 0.44, 0.15]} castShadow>
            <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
          </RoundedBox>
          {[-0.42, 0.42].map((lx, idx) => (
            <mesh key={idx} position={[lx, 0.14, 0]} castShadow>
              <boxGeometry args={[0.06, 0.28, 0.28]} />
              <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.45} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Charming City Bus Stop Shelter + Icon Sign (clickable: "Bus stop! Wait for the bus!") */}
      <group
        position={[1.45, 0.06, 3.62]}
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
        {/* Shelter frame & glass back */}
        {[-0.65, 0.65].map((px, idx) => (
          <mesh key={idx} position={[px, 0.62, 0.22]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 1.24, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
          </mesh>
        ))}
        <RoundedBox args={[1.5, 0.08, 0.68]} radius={0.025} smoothness={2} position={[0, 1.24, 0.06]} castShadow>
          <meshStandardMaterial color="#2a6f62" roughness={0.65} />
        </RoundedBox>
        <mesh position={[0, 0.65, 0.24]}>
          <boxGeometry args={[1.22, 0.92, 0.03]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.32} roughness={0.08} clearcoat={1} depthWrite={false} />
        </mesh>
        {/* Shelter bench */}
        <RoundedBox args={[0.96, 0.07, 0.28]} radius={0.015} smoothness={2} position={[0, 0.28, 0.08]} castShadow>
          <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
        </RoundedBox>
        {/* Round bus-stop post */}
        <mesh position={[-0.86, 0.68, -0.22]} castShadow>
          <cylinderGeometry args={[0.024, 0.028, 1.36, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.86, 1.32, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 16]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
      </group>

      {/* Vintage South Streetlamp */}
      <group position={[-2.65, 0.06, 3.05]}>
        <mesh position={[0, 0.92, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.058, 1.84, 10]} />
          <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.38} />
        </mesh>
        <mesh position={[0, 1.92, 0]}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fbbf24" emissiveIntensity={glow} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.06, 0]} castShadow>
          <coneGeometry args={[0.17, 0.11, 12]} />
          <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.4} />
        </mesh>
      </group>

      {/* Parked Retro City Car along the south curb (clickable: "Blue car! Drive on the street!") */}
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
        <RetroParkedCar position={[-2.95, 0.06, 2.25]} rotationY={0.04} color="#60a5fa" isNight={isNight} />
      </group>
    </group>
  );
}
