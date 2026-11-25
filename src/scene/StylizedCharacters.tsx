import { useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { useMapFrame as useFrame } from './mapVisibility';
import * as THREE from 'three';
import type { AvatarStyle } from '../domain/types';
import { getCafeTextures } from './cafeTextures';
import { armGeometry, eyesGeometry, headGeometry, learnerGeometry, torsoGeometry } from './toyCharacters';
import { BlobShadow, toyMaterial } from './toyKit';

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
      <mesh geometry={eyesGeometry(z, spread, glasses, glassesColor)} material={toyMaterial('glow')} />
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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (waveArmRef.current) {
      waveArmRef.current.rotation.z = -2.15 + Math.sin(t * 5.8) * 0.34;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 1.8) * 0.05;
    }
  });

  const arm = armGeometry('#f7ead6', '#f3c6a0');
  return (
    <group>
      <mesh geometry={torsoGeometry('#f7ead6', '#355f4e', '#fff9f0')} material={toyMaterial()} castShadow />
      {/* Left Arm (resting) */}
      <group position={[-0.195, 0.42, 0.02]} rotation={[0.1, 0, -0.2]}>
        <mesh geometry={arm} material={toyMaterial()} castShadow />
      </group>
      {/* Right Arm (enthusiastic wave) */}
      <group ref={waveArmRef} position={[0.19, 0.44, 0.02]}>
        <mesh geometry={arm} material={toyMaterial()} castShadow />
      </group>
      <group ref={headRef} position={[0, 0.68, 0]}>
        <mesh geometry={headGeometry({ skin: '#f3c6a0', hair: '#4b2e1e', hat: 'quiff', hatColor: '#4b2e1e' })} material={toyMaterial()} castShadow />
        <CharacterEyes z={0.128} y={0.018} spread={0.048} />
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

  const parts = learnerGeometry(coatColor, hatColor, hairColor, hatVariant, hairVariant);
  const material = toyMaterial();

  return (
    <>
      <BlobShadow size={[0.55, 0.46]} />
      <group ref={bodyRef}>
        <group ref={leftLegRef} position={[-0.058, 0.16, 0]}>
          <mesh geometry={parts.leg} material={material} castShadow />
        </group>
        <group ref={rightLegRef} position={[0.058, 0.16, 0]}>
          <mesh geometry={parts.leg} material={material} castShadow />
        </group>
        <mesh geometry={parts.torso} material={material} castShadow />
        <group ref={leftArmRef} position={[-0.155, 0.42, 0]}>
          <mesh geometry={parts.arm} material={material} castShadow />
        </group>
        <group ref={rightArmRef} position={[0.155, 0.42, 0]}>
          <mesh geometry={parts.arm} material={material} castShadow />
        </group>
        <group ref={headRef} position={[0, 0.64, 0]}>
          <mesh geometry={parts.head} material={material} castShadow />
          <CharacterEyes z={0.126} y={0.01} spread={0.044} eyesRef={eyesRef} />
        </group>
      </group>
    </>
  );
}

/**
 * Unique Market Vendor NPC:
 * olive shirt, terracotta apron, woven straw sunhat, warm smile.
 */
export function MarketVendorNpc({ fogged = false }: { fogged?: boolean }) {
  if (!fogged) {
    return <StylizedHumanoid shirtColor="#5f8d5b" apronColor="#c9563c" hat="sunhat" hatColor="#e6c280" skinColor="#d9a47e" />;
  }
  return (
    <group>
      <mesh geometry={torsoGeometry('#5f8d5b', '#c9563c')} material={toyMaterial('fog')} />
      <mesh geometry={headGeometry({ skin: '#d9a47e', hair: '#292524', hat: 'sunhat', hatColor: '#e6c280' })} material={toyMaterial('fog')} position={[0, 0.68, 0]} />
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

  const material = toyMaterial();
  const arm = armGeometry(shirtColor, skinColor);

  return (
    <group position={position} scale={scale}>
      <group ref={rootRef}>
        <mesh geometry={torsoGeometry(shirtColor, apronColor, collarColor)} material={material} castShadow />

        {/* Left Arm */}
        <group position={[-0.195, 0.38, 0.04]} rotation={[0.32, 0, 0.18]}>
          <mesh geometry={arm} material={material} castShadow />
          {leftHandProp && <group position={[0, -0.16, 0.03]}>{leftHandProp}</group>}
        </group>

        {/* Right Arm (animated wave when waveTimerRef > 0) */}
        <group ref={rightArmRef} position={[0.195, 0.38, 0.04]} rotation={[0.32, 0, -0.18]}>
          <mesh geometry={arm} material={material} castShadow />
          {rightHandProp && <group position={[0, -0.16, 0.03]}>{rightHandProp}</group>}
        </group>

        <group ref={headRef} position={[0, 0.68, 0]}>
          <mesh geometry={headGeometry({ skin: skinColor, hair: hairColor, hat, hatColor, mustache: mustacheColor })} material={material} castShadow />
          <CharacterEyes
            z={0.128}
            y={0.018}
            spread={0.046}
            glasses={glasses}
            glassesColor={glassesColor}
            eyesRef={eyesRef}
          />
        </group>
      </group>
    </group>
  );
}
