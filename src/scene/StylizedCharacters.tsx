import { useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { useMapFrame as useFrame } from './mapVisibility';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarStyle } from '../domain/types';
import { getCafeTextures } from './cafeTextures';

/**
 * Shared expressive glossy eyes with white specular catchlights and optional glasses rims.
 */
function CharacterEyes({
  z = 0.125,
  y = 0.015,
  spread = 0.044,
  glasses = false,
  glassesColor = '#0f766e',
  eyesRef,
}: {
  z?: number;
  y?: number;
  spread?: number;
  glasses?: boolean;
  glassesColor?: string;
  eyesRef?: MutableRefObject<THREE.Group | null>;
}) {
  return (
    <group ref={eyesRef} position={[0, y, 0]}>
      <group position={[-spread, 0, z]}>
        <mesh>
          <sphereGeometry args={[0.019, 12, 12]} />
          <meshStandardMaterial color="#1c1917" roughness={0.12} metalness={0.05} />
        </mesh>
        <mesh position={[0.006, 0.007, 0.015]}>
          <sphereGeometry args={[0.006, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {glasses && (
          <mesh position={[0, 0, 0.014]}>
            <torusGeometry args={[0.032, 0.004, 8, 18]} />
            <meshStandardMaterial color={glassesColor} metalness={0.55} roughness={0.32} />
          </mesh>
        )}
      </group>
      <group position={[spread, 0, z]}>
        <mesh>
          <sphereGeometry args={[0.019, 12, 12]} />
          <meshStandardMaterial color="#1c1917" roughness={0.12} metalness={0.05} />
        </mesh>
        <mesh position={[0.006, 0.007, 0.015]}>
          <sphereGeometry args={[0.006, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {glasses && (
          <mesh position={[0, 0, 0.014]}>
            <torusGeometry args={[0.032, 0.004, 8, 18]} />
            <meshStandardMaterial color={glassesColor} metalness={0.55} roughness={0.32} />
          </mesh>
        )}
      </group>
      {glasses && (
        <mesh position={[0, 0, z + 0.014]}>
          <boxGeometry args={[spread * 0.72, 0.007, 0.006]} />
          <meshStandardMaterial color={glassesColor} metalness={0.55} roughness={0.32} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Unique Mini Leo Greeter standing outside Café da Esquina:
 * cream collared shirt, olive apron with brass studs & pocket, hair quiff, rosy cheeks, waving hand.
 */
export function MiniLeoGreeter() {
  const waveArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (waveArmRef.current) {
      waveArmRef.current.rotation.z = -2.15 + Math.sin(t * 5.8) * 0.34;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.05;
    }
  });

  return (
    <group>
      {/* Shoes */}
      <mesh position={[-0.06, 0.045, 0.02]} castShadow>
        <sphereGeometry args={[0.048, 10, 10]} />
        <meshStandardMaterial color="#422618" roughness={0.85} />
      </mesh>
      <mesh position={[0.06, 0.045, 0.02]} castShadow>
        <sphereGeometry args={[0.048, 10, 10]} />
        <meshStandardMaterial color="#422618" roughness={0.85} />
      </mesh>

      {/* Cream Barista Shirt Torso + Collar */}
      <mesh position={[0, 0.31, 0]} castShadow>
        <capsuleGeometry args={[0.135, 0.24, 8, 14]} />
        <meshStandardMaterial color="#f7ead6" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.48, 0.01]} rotation={[0.12, 0, 0]}>
        <torusGeometry args={[0.072, 0.016, 8, 16]} />
        <meshStandardMaterial color="#fff9f0" roughness={0.9} />
      </mesh>

      {/* Olive Linen Apron + Brass Studs + Pocket */}
      <RoundedBox args={[0.21, 0.28, 0.095]} radius={0.025} smoothness={3} position={[0, 0.29, 0.1]} castShadow>
        <meshStandardMaterial color="#355f4e" bumpMap={textures.clayBump} bumpScale={0.007} roughness={0.92} />
      </RoundedBox>
      <mesh position={[-0.065, 0.4, 0.148]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0.065, 0.4, 0.148]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
      </mesh>
      <RoundedBox args={[0.13, 0.075, 0.02]} radius={0.008} smoothness={2} position={[0, 0.24, 0.148]}>
        <meshStandardMaterial color="#2b4f41" roughness={0.94} />
      </RoundedBox>

      {/* Left Arm (resting) */}
      <group position={[-0.16, 0.43, 0]} rotation={[0.1, 0, 0.2]}>
        <mesh position={[0, -0.09, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.14, 6, 10]} />
          <meshStandardMaterial color="#f7ead6" roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.19, 0]}>
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshStandardMaterial color="#f3c6a0" roughness={0.82} />
        </mesh>
      </group>

      {/* Right Arm (enthusiastic wave) */}
      <group ref={waveArmRef} position={[0.155, 0.44, 0]}>
        <mesh position={[0, -0.09, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.14, 6, 10]} />
          <meshStandardMaterial color="#f7ead6" roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.19, 0]}>
          <sphereGeometry args={[0.044, 10, 10]} />
          <meshStandardMaterial color="#f3c6a0" roughness={0.82} />
        </mesh>
      </group>

      {/* Expressive Head + Hair Quiff */}
      <group ref={headRef} position={[0, 0.68, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 18, 18]} />
          <meshStandardMaterial color="#f3c6a0" bumpMap={textures.clayBump} bumpScale={0.004} roughness={0.82} />
        </mesh>
        <CharacterEyes z={0.132} y={0.015} spread={0.048} />
        {/* Rosy cheeks */}
        <mesh position={[-0.082, -0.025, 0.115]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#f29489" transparent opacity={0.48} roughness={0.9} />
        </mesh>
        <mesh position={[0.082, -0.025, 0.115]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#f29489" transparent opacity={0.48} roughness={0.9} />
        </mesh>
        {/* Warm smile */}
        <mesh position={[0, -0.048, 0.136]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.01, 0.026, 4, 8]} />
          <meshStandardMaterial color="#8c2d2d" roughness={0.55} />
        </mesh>
        {/* Hair cap + quiff tufts */}
        <mesh position={[0, 0.045, -0.01]} castShadow>
          <sphereGeometry args={[0.156, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#4b2e1e" bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.88} />
        </mesh>
        <mesh position={[0.025, 0.16, 0.075]} rotation={[0.3, -0.2, -0.3]} castShadow>
          <capsuleGeometry args={[0.036, 0.055, 6, 10]} />
          <meshStandardMaterial color="#553523" roughness={0.88} />
        </mesh>
        <mesh position={[-0.04, 0.15, 0.08]} rotation={[0.35, 0.15, 0.25]} castShadow>
          <capsuleGeometry args={[0.032, 0.045, 6, 10]} />
          <meshStandardMaterial color="#4b2e1e" roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Walkable Learner Avatar:
 * mustard knit sweater, cream scarf, coral beret, leather messenger satchel, articulated legs & arms.
 */
export function LearnerAvatar({
  isWalkingRef,
  blockedBumpRef,
  avatarStyle,
}: {
  isWalkingRef: React.MutableRefObject<boolean>;
  blockedBumpRef: React.MutableRefObject<number>;
  avatarStyle?: AvatarStyle;
}) {
  const coatColor = avatarStyle?.coatColor ?? '#e09f3e';
  const hatColor = avatarStyle?.hatColor ?? '#e05a47';
  const hairColor = avatarStyle?.hairColor ?? '#292524';
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group | null>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  const hatVariant: 'beret' | 'sunhat' | 'cap' | 'beanie' =
    hatColor.toLowerCase() === '#facc15'
      ? 'sunhat'
      : hatColor.toLowerCase() === '#1e3a8a'
        ? 'cap'
        : hatColor.toLowerCase() === '#34d399'
          ? 'beanie'
          : 'beret';

  const hairVariant: 'crop' | 'bob' | 'quiff' | 'bun' =
    hairColor.toLowerCase() === '#78350f'
      ? 'bob'
      : hairColor.toLowerCase() === '#eab308'
        ? 'quiff'
        : hairColor.toLowerCase() === '#b45309'
          ? 'bun'
          : 'crop';

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const walking = isWalkingRef.current;

    if (blockedBumpRef.current > 0) {
      blockedBumpRef.current = Math.max(0, blockedBumpRef.current - dt * 2.8);
    }
    const bump = Math.sin(blockedBumpRef.current * Math.PI);

    const stride = walking ? Math.sin(t * 11) * 0.55 : 0;
    const bob = walking ? Math.abs(Math.sin(t * 11)) * 0.035 : Math.sin(t * 2.2) * 0.01;

    if (bodyRef.current) {
      bodyRef.current.position.y = bob + bump * 0.04;
    }
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = THREE.MathUtils.damp(leftLegRef.current.rotation.x, stride, 14, dt);
      rightLegRef.current.rotation.x = THREE.MathUtils.damp(rightLegRef.current.rotation.x, -stride, 14, dt);
    }
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.damp(leftArmRef.current.rotation.x, -stride * 0.75, 14, dt);
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(rightArmRef.current.rotation.x, stride * 0.75, 14, dt);
    }
    if (headRef.current) {
      const curiousTilt = bump * 0.24;
      headRef.current.rotation.z = THREE.MathUtils.damp(headRef.current.rotation.z, curiousTilt, 12, dt);
    }
    if (eyesRef.current) {
      const blinkCycle = (t + 0.8) % 3.8;
      const targetScaleY = blinkCycle > 3.66 ? 0.12 : 1;
      eyesRef.current.scale.y = THREE.MathUtils.damp(eyesRef.current.scale.y, targetScaleY, 24, dt);
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Articulated Legs & Boots */}
      <group ref={leftLegRef} position={[-0.058, 0.16, 0]}>
        <mesh position={[0, -0.07, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.08, 6, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.135, 0.02]} castShadow>
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshStandardMaterial color="#5a3827" roughness={0.85} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.058, 0.16, 0]}>
        <mesh position={[0, -0.07, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.08, 6, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.135, 0.02]} castShadow>
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshStandardMaterial color="#5a3827" roughness={0.85} />
        </mesh>
      </group>

      {/* Knit Sweater Torso (live customizable color!) */}
      <mesh position={[0, 0.34, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.22, 8, 14]} />
        <meshStandardMaterial color={coatColor} bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.9} />
      </mesh>
      {/* Cream traveler scarf */}
      <mesh position={[0, 0.48, 0.01]} rotation={[0.1, 0, 0]} castShadow>
        <torusGeometry args={[0.092, 0.03, 10, 18]} />
        <meshStandardMaterial color="#fdf6ea" roughness={0.92} />
      </mesh>
      {/* Leather Messenger Satchel */}
      <RoundedBox args={[0.06, 0.13, 0.14]} radius={0.015} smoothness={2} position={[-0.14, 0.28, -0.01]} castShadow>
        <meshStandardMaterial color="#7c4732" roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 0.36, 0]} rotation={[0, 0, -0.68]}>
        <torusGeometry args={[0.135, 0.012, 6, 20]} />
        <meshStandardMaterial color="#5a3322" roughness={0.82} />
      </mesh>

      {/* Articulated Arms */}
      <group ref={leftArmRef} position={[-0.155, 0.42, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.12, 6, 10]} />
          <meshStandardMaterial color={coatColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#eab890" roughness={0.82} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.155, 0.42, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.12, 6, 10]} />
          <meshStandardMaterial color={coatColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshStandardMaterial color="#eab890" roughness={0.82} />
        </mesh>
      </group>

      {/* Expressive Head + Coral Traveler Beret */}
      <group ref={headRef} position={[0, 0.64, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.142, 18, 18]} />
          <meshStandardMaterial color="#eab890" bumpMap={textures.clayBump} bumpScale={0.004} roughness={0.82} />
        </mesh>
        <CharacterEyes z={0.126} y={0.01} spread={0.044} eyesRef={eyesRef} />
        <mesh position={[-0.078, -0.025, 0.108]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#f29489" transparent opacity={0.45} roughness={0.9} />
        </mesh>
        <mesh position={[0.078, -0.025, 0.108]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#f29489" transparent opacity={0.45} roughness={0.9} />
        </mesh>
        {/* Hair with distinct 3D silhouettes per Barber style */}
        <mesh position={[0, 0.04, -0.01]} castShadow>
          <sphereGeometry args={[0.146, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
          <meshStandardMaterial color={hairColor} bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.9} />
        </mesh>
        {hairVariant === 'bob' && (
          <>
            <mesh position={[-0.125, -0.02, -0.02]} castShadow>
              <sphereGeometry args={[0.058, 10, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
            <mesh position={[0.125, -0.02, -0.02]} castShadow>
              <sphereGeometry args={[0.058, 10, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.9} />
            </mesh>
          </>
        )}
        {hairVariant === 'quiff' && (
          <>
            <mesh position={[0.02, 0.14, 0.09]} rotation={[0.35, -0.15, -0.25]} castShadow>
              <capsuleGeometry args={[0.032, 0.052, 6, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.86} />
            </mesh>
            <mesh position={[-0.035, 0.135, 0.088]} rotation={[0.32, 0.15, 0.2]} castShadow>
              <capsuleGeometry args={[0.026, 0.04, 6, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.86} />
            </mesh>
          </>
        )}
        {hairVariant === 'bun' && (
          <mesh position={[0, 0.06, -0.155]} castShadow>
            <sphereGeometry args={[0.068, 12, 12]} />
            <meshStandardMaterial color={hairColor} bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.88} />
          </mesh>
        )}

        {/* Boutique Headwear with 4 distinct 3D silhouettes */}
        {hatVariant === 'beret' && (
          <group position={[0.02, 0.135, -0.01]} rotation={[0.08, 0, -0.22]}>
            <mesh scale={[1.15, 0.55, 1.15]} castShadow>
              <sphereGeometry args={[0.135, 16, 12]} />
              <meshStandardMaterial color={hatColor} bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.88} />
            </mesh>
            <mesh position={[0, 0.085, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.035, 8]} />
              <meshStandardMaterial color="#b93829" roughness={0.88} />
            </mesh>
          </group>
        )}
        {hatVariant === 'sunhat' && (
          <group position={[0, 0.11, -0.005]} rotation={[-0.06, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.23, 0.25, 0.024, 22]} />
              <meshStandardMaterial color={hatColor} bumpMap={textures.awningBump} bumpScale={0.008} roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.058, 0]} castShadow>
              <cylinderGeometry args={[0.118, 0.138, 0.095, 18]} />
              <meshStandardMaterial color={hatColor} bumpMap={textures.awningBump} bumpScale={0.008} roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.024, 0]}>
              <cylinderGeometry args={[0.138, 0.142, 0.026, 18]} />
              <meshStandardMaterial color="#e05a47" roughness={0.78} />
            </mesh>
          </group>
        )}
        {hatVariant === 'cap' && (
          <group position={[0, 0.105, 0]} rotation={[-0.08, 0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.148, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
              <meshStandardMaterial color={hatColor} bumpMap={textures.awningBump} bumpScale={0.006} roughness={0.82} />
            </mesh>
            {/* Curved front visor */}
            <mesh position={[0, 0.006, 0.145]} rotation={[0.12, 0, 0]} scale={[1.1, 0.24, 0.95]} castShadow>
              <cylinderGeometry args={[0.105, 0.11, 0.04, 16]} />
              <meshStandardMaterial color={hatColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.7} />
            </mesh>
          </group>
        )}
        {hatVariant === 'beanie' && (
          <group position={[0, 0.1, -0.01]} rotation={[-0.1, 0, 0]}>
            <mesh scale={[1.02, 1.12, 1.02]} castShadow>
              <sphereGeometry args={[0.146, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshStandardMaterial color={hatColor} bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.92} />
            </mesh>
            {/* Ribbed cuff */}
            <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.142, 0.024, 8, 22]} />
              <meshStandardMaterial color={hatColor} bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.92} />
            </mesh>
            {/* Fluffy pom-pom */}
            <mesh position={[0, 0.185, -0.01]} castShadow>
              <sphereGeometry args={[0.042, 12, 12]} />
              <meshStandardMaterial color="#fdf6ea" bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.95} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

/**
 * Unique Market Vendor NPC:
 * olive shirt, terracotta apron, woven straw sunhat, warm smile.
 */
export function MarketVendorNpc({ fogged = false }: { fogged?: boolean }) {
  const opacity = fogged ? 0.45 : 1;
  return (
    <group>
      <mesh position={[0, 0.34, 0]} castShadow={!fogged}>
        <capsuleGeometry args={[0.13, 0.24, 8, 12]} />
        <meshStandardMaterial color={fogged ? '#cbd5e1' : '#5f8d5b'} transparent={fogged} opacity={opacity} roughness={0.88} />
      </mesh>
      <RoundedBox args={[0.2, 0.25, 0.09]} radius={0.02} smoothness={2} position={[0, 0.3, 0.09]}>
        <meshStandardMaterial color={fogged ? '#cbd5e1' : '#c9563c'} transparent={fogged} opacity={opacity} roughness={0.9} />
      </RoundedBox>
      <group position={[0, 0.67, 0]}>
        <mesh castShadow={!fogged}>
          <sphereGeometry args={[0.138, 16, 16]} />
          <meshStandardMaterial color={fogged ? '#e2e8f0' : '#d9a47e'} transparent={fogged} opacity={opacity} roughness={0.82} />
        </mesh>
        {!fogged && <CharacterEyes z={0.122} y={0.01} spread={0.042} />}
        {/* Wide-brimmed straw sunhat */}
        <mesh position={[0, 0.1, 0]} rotation={[0.08, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.025, 18]} />
          <meshStandardMaterial color={fogged ? '#e2e8f0' : '#e6c280'} transparent={fogged} opacity={opacity} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.09, 16]} />
          <meshStandardMaterial color={fogged ? '#e2e8f0' : '#d4aa63'} transparent={fogged} opacity={opacity} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Unique Plaza Musician NPC sitting by the fountain:
 * navy striped sweater, curly auburn hair, wooden acoustic guitar.
 */
export function PlazaMusicianNpc({ fogged = false }: { fogged?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const opacity = fogged ? 0.45 : 1;

  useFrame((state) => {
    if (groupRef.current && !fogged) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.1) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.34, 0]} castShadow={!fogged}>
        <capsuleGeometry args={[0.13, 0.24, 8, 12]} />
        <meshStandardMaterial color={fogged ? '#cbd5e1' : '#334e68'} transparent={fogged} opacity={opacity} roughness={0.88} />
      </mesh>
      {/* Tiny wooden guitar */}
      <group position={[0.06, 0.33, 0.14]} rotation={[0, 0, -0.45]}>
        <mesh>
          <sphereGeometry args={[0.085, 10, 10]} />
          <meshStandardMaterial color={fogged ? '#cbd5e1' : '#b46a3c'} transparent={fogged} opacity={opacity} roughness={0.65} />
        </mesh>
        <mesh position={[0.12, 0.08, 0]} rotation={[0, 0, -0.8]}>
          <boxGeometry args={[0.024, 0.18, 0.018]} />
          <meshStandardMaterial color={fogged ? '#cbd5e1' : '#5a3827'} transparent={fogged} opacity={opacity} roughness={0.7} />
        </mesh>
      </group>
      <group position={[0, 0.67, 0]}>
        <mesh castShadow={!fogged}>
          <sphereGeometry args={[0.138, 16, 16]} />
          <meshStandardMaterial color={fogged ? '#e2e8f0' : '#f3c6a0'} transparent={fogged} opacity={opacity} roughness={0.82} />
        </mesh>
        {!fogged && <CharacterEyes z={0.122} y={0.01} spread={0.042} />}
        {/* Curly auburn hair puffs */}
        <mesh position={[0, 0.07, -0.02]}>
          <sphereGeometry args={[0.145, 14, 12]} />
          <meshStandardMaterial color={fogged ? '#cbd5e1' : '#9a3412'} transparent={fogged} opacity={opacity} roughness={0.9} />
        </mesh>
        <mesh position={[-0.09, 0.09, 0.03]}>
          <sphereGeometry args={[0.068, 10, 10]} />
          <meshStandardMaterial color={fogged ? '#cbd5e1' : '#9a3412'} transparent={fogged} opacity={opacity} roughness={0.9} />
        </mesh>
        <mesh position={[0.09, 0.09, 0.03]}>
          <sphereGeometry args={[0.068, 10, 10]} />
          <meshStandardMaterial color={fogged ? '#cbd5e1' : '#9a3412'} transparent={fogged} opacity={opacity} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Cute Café Cat NPC for the emergent outdoor water-bowl micro-event:
 * warm caramel body, pointed ears, wagging tail, happy hop when hydrated.
 */
export function CafeCatNpc({ happy = false }: { happy?: boolean }) {
  const catRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (catRef.current) {
      catRef.current.position.y = happy
        ? Math.abs(Math.sin(t * 7.5)) * 0.09
        : Math.sin(t * 2.4) * 0.008;
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * (happy ? 10 : 3.2)) * 0.35;
    }
  });

  return (
    <group ref={catRef}>
      {/* Sitting cat body */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <capsuleGeometry args={[0.085, 0.1, 8, 12]} />
        <meshStandardMaterial color="#e69f5c" bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.88} />
      </mesh>
      {/* Cream belly patch */}
      <mesh position={[0, 0.11, 0.068]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.9} />
      </mesh>
      {/* Head + triangular ears */}
      <group position={[0, 0.27, 0.02]}>
        <mesh castShadow>
          <sphereGeometry args={[0.092, 14, 14]} />
          <meshStandardMaterial color="#e69f5c" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.86} />
        </mesh>
        <mesh position={[-0.055, 0.085, 0]} rotation={[0, 0, 0.25]} castShadow>
          <coneGeometry args={[0.032, 0.065, 4]} />
          <meshStandardMaterial color="#d9823b" roughness={0.88} />
        </mesh>
        <mesh position={[0.055, 0.085, 0]} rotation={[0, 0, -0.25]} castShadow>
          <coneGeometry args={[0.032, 0.065, 4]} />
          <meshStandardMaterial color="#d9823b" roughness={0.88} />
        </mesh>
        <CharacterEyes z={0.08} y={0.01} spread={0.032} />
        {/* Tiny pink nose */}
        <mesh position={[0, -0.012, 0.09]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#f472b6" roughness={0.6} />
        </mesh>
      </group>
      {/* Wagging tail */}
      <mesh ref={tailRef} position={[0, 0.13, -0.09]} rotation={[0.55, 0, 0]} castShadow>
        <capsuleGeometry args={[0.018, 0.14, 4, 8]} />
        <meshStandardMaterial color="#d9823b" roughness={0.88} />
      </mesh>
    </group>
  );
}

export type HumanoidHatPreset = 'none' | 'toque' | 'cap' | 'hardhat' | 'beret' | 'sunhat' | 'postal';

export interface StylizedHumanoidProps {
  shirtColor: string;
  skinColor?: string;
  hairColor?: string;
  apronColor?: string;
  collarColor?: string;
  hat?: HumanoidHatPreset;
  hatColor?: string;
  glasses?: boolean;
  glassesColor?: string;
  mustacheColor?: string;
  waveTimerRef?: MutableRefObject<number>;
  blinkOffset?: number;
  position?: [number, number, number];
  scale?: number;
  leftHandProp?: ReactNode;
  rightHandProp?: ReactNode;
}

/**
 * Unified parametric humanoid rig shared across interiors and street shop NPCs:
 * includes tactile clay shading, natural idle breathing, desynchronized blinking,
 * optional wave reaction, glasses, mustache, apron, collar, and 3D hat presets.
 */
export function StylizedHumanoid({
  shirtColor,
  skinColor = '#f3c6a5',
  hairColor = '#292524',
  apronColor,
  collarColor,
  hat = 'none',
  hatColor = '#ffffff',
  glasses = false,
  glassesColor = '#0f766e',
  mustacheColor,
  waveTimerRef,
  blinkOffset = 0,
  position = [0, 0, 0],
  scale = 1,
  leftHandProp,
  rightHandProp,
}: StylizedHumanoidProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group | null>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 2.1 + blinkOffset) * 0.011;
      rootRef.current.rotation.z = Math.sin(t * 1.05 + blinkOffset) * 0.018;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.85 + blinkOffset) * 0.06;
    }
    if (eyesRef.current) {
      const cycle = (t + blinkOffset) % 3.6;
      const targetScaleY = cycle > 3.46 ? 0.1 : 1;
      eyesRef.current.scale.y = THREE.MathUtils.damp(eyesRef.current.scale.y, targetScaleY, 24, dt);
    }
    if (rightArmRef.current) {
      let targetZ = -0.18;
      let targetX = 0.32;
      if (waveTimerRef && waveTimerRef.current > 0) {
        waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
        targetX = -0.35;
        targetZ = -2.25 + Math.sin(t * 9.5) * 0.35;
      }
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(rightArmRef.current.rotation.x, targetX, 10, dt);
      rightArmRef.current.rotation.z = THREE.MathUtils.damp(rightArmRef.current.rotation.z, targetZ, 10, dt);
    }
  });

  return (
    <group position={position} scale={scale}>
      <group ref={rootRef}>
        {/* Torso */}
        <mesh position={[0, 0.34, 0]} castShadow>
          <capsuleGeometry args={[0.155, 0.26, 8, 14]} />
          <meshStandardMaterial color={shirtColor} bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.82} />
        </mesh>

        {/* Optional front apron */}
        {apronColor && (
          <RoundedBox args={[0.22, 0.28, 0.1]} radius={0.025} smoothness={3} position={[0, 0.3, 0.105]} castShadow>
            <meshStandardMaterial color={apronColor} bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.9} />
          </RoundedBox>
        )}

        {/* Optional collar / neckerchief */}
        {collarColor && (
          <mesh position={[0, 0.5, 0.045]} rotation={[0.24, 0, 0]}>
            <torusGeometry args={[0.108, 0.024, 8, 16]} />
            <meshStandardMaterial color={collarColor} roughness={0.68} />
          </mesh>
        )}

        {/* Left Arm */}
        <group position={[-0.195, 0.38, 0.04]} rotation={[0.32, 0, 0.18]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <capsuleGeometry args={[0.044, 0.15, 6, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.15, 0.015]} castShadow>
            <sphereGeometry args={[0.041, 10, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.78} />
          </mesh>
          {leftHandProp && <group position={[0, -0.16, 0.03]}>{leftHandProp}</group>}
        </group>

        {/* Right Arm (animated wave when waveTimerRef > 0) */}
        <group ref={rightArmRef} position={[0.195, 0.38, 0.04]} rotation={[0.32, 0, -0.18]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <capsuleGeometry args={[0.044, 0.15, 6, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.15, 0.015]} castShadow>
            <sphereGeometry args={[0.041, 10, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.78} />
          </mesh>
          {rightHandProp && <group position={[0, -0.16, 0.03]}>{rightHandProp}</group>}
        </group>

        {/* Expressive Head */}
        <group ref={headRef} position={[0, 0.68, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.145, 18, 18]} />
            <meshStandardMaterial color={skinColor} bumpMap={textures.clayBump} bumpScale={0.004} roughness={0.78} />
          </mesh>
          <CharacterEyes
            z={0.128}
            y={0.018}
            spread={0.046}
            glasses={glasses}
            glassesColor={glassesColor}
            eyesRef={eyesRef}
          />
          {/* Blush cheeks */}
          {[-0.08, 0.08].map((cx, i) => (
            <mesh key={i} position={[cx, -0.02, 0.118]}>
              <sphereGeometry args={[0.021, 8, 8]} />
              <meshStandardMaterial color="#f29489" transparent opacity={0.44} roughness={0.9} />
            </mesh>
          ))}
          {/* Cute nose */}
          <mesh position={[0, -0.008, 0.142]}>
            <sphereGeometry args={[0.017, 10, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.82} />
          </mesh>
          {/* Optional Mustache */}
          {mustacheColor && (
            <mesh position={[0, -0.035, 0.136]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.012, 0.054, 4, 8]} />
              <meshStandardMaterial color={mustacheColor} roughness={0.85} />
            </mesh>
          )}
          {/* Warm smile */}
          <mesh position={[0, mustacheColor ? -0.056 : -0.048, 0.131]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.0095, 0.03, 4, 8]} />
            <meshStandardMaterial color="#991b1b" roughness={0.5} />
          </mesh>

          {/* Hair Cap */}
          {hat !== 'toque' && (
            <mesh position={[0, 0.048, -0.015]} castShadow>
              <sphereGeometry args={[0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
              <meshStandardMaterial color={hairColor} bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.86} />
            </mesh>
          )}

          {/* Hat Presets */}
          {hat === 'toque' && (
            <group position={[0, 0.14, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.132, 0.112, 0.14, 16]} />
                <meshStandardMaterial color={hatColor} roughness={0.82} />
              </mesh>
              <mesh position={[0, 0.11, 0]} castShadow>
                <sphereGeometry args={[0.156, 16, 14]} />
                <meshStandardMaterial color={hatColor} bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.82} />
              </mesh>
            </group>
          )}
          {hat === 'cap' && (
            <group position={[0, 0.1, 0]} rotation={[-0.06, 0, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.152, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
                <meshStandardMaterial color={hatColor} roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.006, 0.145]} rotation={[0.12, 0, 0]} scale={[1.1, 0.24, 0.95]} castShadow>
                <cylinderGeometry args={[0.105, 0.11, 0.04, 16]} />
                <meshStandardMaterial color={hatColor} roughness={0.8} />
              </mesh>
            </group>
          )}
          {hat === 'hardhat' && (
            <group position={[0, 0.105, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.158, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshPhysicalMaterial color={hatColor} roughness={0.28} clearcoat={0.7} />
              </mesh>
              <mesh position={[0, -0.005, 0]}>
                <cylinderGeometry args={[0.175, 0.18, 0.02, 18]} />
                <meshPhysicalMaterial color={hatColor} roughness={0.28} clearcoat={0.7} />
              </mesh>
            </group>
          )}
          {hat === 'beret' && (
            <group position={[0.02, 0.135, -0.01]} rotation={[0.08, 0, -0.22]}>
              <mesh scale={[1.15, 0.55, 1.15]} castShadow>
                <sphereGeometry args={[0.135, 16, 12]} />
                <meshStandardMaterial color={hatColor} bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.88} />
              </mesh>
            </group>
          )}
          {hat === 'postal' && (
            <group position={[0, 0.115, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.155, 0.135, 0.09, 16]} />
                <meshStandardMaterial color={hatColor} roughness={0.75} />
              </mesh>
              <mesh position={[0, -0.032, 0.12]} rotation={[0.18, 0, 0]} scale={[1, 0.2, 0.8]}>
                <cylinderGeometry args={[0.11, 0.11, 0.04, 14]} />
                <meshStandardMaterial color="#0f172a" roughness={0.4} />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
}
