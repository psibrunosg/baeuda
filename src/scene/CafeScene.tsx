import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { HintMode, LessonPhase } from '../domain/lessonEngine';
import type { PropName } from '../domain/types';
import { getCafeGeometries } from './cafeGeometries';
import { getCafeTextures } from './cafeTextures';
import { findPropName, type AssetMode } from './contracts';
import { ModelErrorBoundary } from './ModelErrorBoundary';

export interface CafeSceneProps {
  assetMode: AssetMode;
  phase: LessonPhase;
  highlightedProp: PropName | null;
  hintMode: HintMode;
  customerMood: 'cold' | 'warm' | null;
  activePourLiquid: 'coffee' | 'water' | null;
  pourProgressRef: MutableRefObject<number>;
  isPouringRef: MutableRefObject<boolean>;
  mysteryBoxVisible: boolean;
  visible: boolean;
  onPropTap: (prop: PropName) => void;
  onPourStart: () => void;
  onPourEnd: () => void;
}

const DUST_MOTE_COUNT = 26;

interface DustMoteSeed {
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
  scale: number;
}

const DUST_SEEDS: readonly DustMoteSeed[] = Array.from({ length: DUST_MOTE_COUNT }, (_, i) => {
  const s1 = Math.sin(i * 12.9898) * 43758.5453;
  const s2 = Math.sin(i * 78.233) * 24634.6345;
  const s3 = Math.sin(i * 39.425) * 19283.4712;
  const r1 = s1 - Math.floor(s1);
  const r2 = s2 - Math.floor(s2);
  const r3 = s3 - Math.floor(s3);
  return {
    x: -1.35 + r1 * 2.1,
    y: 1.05 + r2 * 1.1,
    z: -0.9 + r3 * 1.15,
    speed: 0.35 + (i % 5) * 0.11,
    phase: i * 0.85,
    scale: 0.65 + (i % 4) * 0.22,
  };
});

/**
 * Single-draw-call floating golden dust motes drifting inside the morning window sunbeam.
 */
function SunlitDustMotes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < DUST_MOTE_COUNT; i++) {
      const seed = DUST_SEEDS[i];
      dummy.position.set(
        seed.x + Math.sin(t * seed.speed + seed.phase) * 0.06,
        seed.y + Math.cos(t * seed.speed * 0.8 + seed.phase) * 0.05,
        seed.z + Math.sin(t * seed.speed * 0.6 + seed.phase * 1.3) * 0.04,
      );
      const twinkle = seed.scale * (0.7 + Math.sin(t * 2.1 + seed.phase) * 0.3);
      dummy.scale.setScalar(twinkle);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DUST_MOTE_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.0085, 6, 6]} />
      <meshBasicMaterial color="#fef3c7" transparent opacity={0.58} depthWrite={false} />
    </instancedMesh>
  );
}

function SteamParticles({
  position,
  intensity = 1,
}: {
  position: [number, number, number];
  intensity?: number;
}) {
  const s1 = useRef<THREE.Mesh>(null);
  const s2 = useRef<THREE.Mesh>(null);
  const s3 = useRef<THREE.Mesh>(null);
  const s4 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const refs = [s1, s2, s3, s4];
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      const cycle = (t * 0.62 + i * 0.25) % 1;
      ref.current.position.y = cycle * 0.34 * intensity;
      ref.current.position.x = Math.sin(t * 1.9 + i * 1.7) * 0.032 * (0.4 + cycle);
      ref.current.position.z = Math.cos(t * 1.6 + i * 1.3) * 0.022 * cycle;
      const puffScale = Math.sin(cycle * Math.PI) * (0.65 + cycle * 0.65) * intensity;
      ref.current.scale.setScalar(Math.max(0.05, puffScale));
    });
  });

  return (
    <group name="fx_steam_cup" position={position}>
      {[s1, s2, s3, s4].map((ref, idx) => (
        <mesh key={idx} ref={ref}>
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshStandardMaterial color="#fff8ee" transparent opacity={0.44} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function useGlobalPourRelease(phase: LessonPhase, onPourEnd: () => void) {
  useEffect(() => {
    if (phase !== 'action_pour') return;
    const handleRelease = () => onPourEnd();
    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
    return () => {
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('pointercancel', handleRelease);
    };
  }, [phase, onPourEnd]);
}

interface CafeGlbProps {
  phase: LessonPhase;
  activePourLiquid: 'coffee' | 'water' | null;
  mysteryBoxVisible: boolean;
  onPropTap: (prop: PropName) => void;
  onPourStart: () => void;
  onPourEnd: () => void;
}

function CafeGlb({
  phase,
  activePourLiquid,
  mysteryBoxVisible,
  onPropTap,
  onPourStart,
  onPourEnd,
}: CafeGlbProps) {
  const { scene } = useGLTF('/models/cafe_esquina.glb');
  useGlobalPourRelease(phase, onPourEnd);

  useEffect(() => {
    const mysteryBox = scene.getObjectByName('prop_box_mystery');
    if (mysteryBox) {
      mysteryBox.visible = mysteryBoxVisible;
    }
  }, [scene, mysteryBoxVisible]);

  return (
    <primitive
      object={scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const prop = findPropName(e.object);
        if (prop) onPropTap(prop);
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = findPropName(e.object) ? 'pointer' : 'auto';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        if (phase !== 'action_pour') return;
        const prop = findPropName(e.object);
        const expectedVessel: PropName | null =
          activePourLiquid === 'coffee'
            ? 'prop_jar_coffee'
            : activePourLiquid === 'water'
              ? 'prop_water_cold'
              : null;
        if (prop && prop === expectedVessel) {
          e.stopPropagation();
          onPourStart();
        }
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        if (phase !== 'action_pour') return;
        e.stopPropagation();
        onPourEnd();
      }}
    />
  );
}

/**
 * Reusable sculpted Ceramic Mug + Saucer + optional Latte Art + Steam
 */
function SculptedMug({
  color,
  emissive = '#000000',
  emissiveIntensity = 0,
  withLatteArt = false,
  withSaucer = true,
  steamIntensity = 0,
}: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  withLatteArt?: boolean;
  withSaucer?: boolean;
  steamIntensity?: number;
}) {
  const geos = useMemo(() => getCafeGeometries(), []);
  const textures = useMemo(() => getCafeTextures(), []);
  const mugY = withSaucer ? 0.014 : 0;

  return (
    <group>
      {withSaucer && (
        <mesh geometry={geos.saucer} castShadow receiveShadow>
          <meshStandardMaterial
            color="#f9f2e7"
            bumpMap={textures.clayBump}
            bumpScale={0.003}
            roughness={0.28}
          />
        </mesh>
      )}
      <group position={[0, mugY, 0]}>
        <mesh geometry={geos.mug} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            bumpMap={textures.clayBump}
            bumpScale={0.004}
            roughness={0.26}
            clearcoat={0.65}
            clearcoatRoughness={0.22}
          />
        </mesh>
        <mesh geometry={geos.mugHandle} castShadow>
          <meshPhysicalMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            roughness={0.28}
            clearcoat={0.6}
            clearcoatRoughness={0.24}
          />
        </mesh>
        {withLatteArt && (
          <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.082, 24]} />
            <meshStandardMaterial
              color="#ffffff"
              map={textures.latteArtColor}
              roughness={0.35}
            />
          </mesh>
        )}
      </group>
      {steamIntensity > 0 && <SteamParticles position={[0, 0.21, 0]} intensity={steamIntensity} />}
    </group>
  );
}

/**
 * Reusable sculpted Pour-Over Coffee Carafe with visible coffee inside & chrome collar
 */
function SculptedCoffeeCarafe({
  highlighted = false,
  steamIntensity = 0.7,
}: {
  highlighted?: boolean;
  steamIntensity?: number;
}) {
  const geos = useMemo(() => getCafeGeometries(), []);

  return (
    <group>
      {/* Rich brewed coffee volume inside lower carafe */}
      <mesh position={[0, 0.082, 0]} castShadow>
        <cylinderGeometry args={[0.095, 0.112, 0.135, 22]} />
        <meshStandardMaterial
          color="#3a1a0b"
          emissive={highlighted ? '#92400e' : '#000000'}
          emissiveIntensity={highlighted ? 0.25 : 0}
          roughness={0.14}
        />
      </mesh>
      {/* Glossy crema top meniscus */}
      <mesh position={[0, 0.151, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.094, 22]} />
        <meshStandardMaterial color="#6f3b1e" roughness={0.22} />
      </mesh>
      {/* Crystal-clear glossy glass server shell (no transmission so coffee stays crisp) */}
      <mesh geometry={geos.carafe} renderOrder={2} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#fffaf3"
          transparent
          opacity={0.28}
          roughness={0.05}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
          depthWrite={false}
          emissive={highlighted ? '#f59e0b' : '#000000'}
          emissiveIntensity={highlighted ? 0.3 : 0}
        />
      </mesh>
      {/* Brushed steel neck collar */}
      <mesh position={[0, 0.212, 0]}>
        <cylinderGeometry args={[0.077, 0.075, 0.026, 22]} />
        <meshStandardMaterial color="#d6d3d1" metalness={0.85} roughness={0.22} />
      </mesh>
      {/* Hinged walnut lid */}
      <mesh position={[0, 0.275, 0]} castShadow>
        <cylinderGeometry args={[0.078, 0.084, 0.028, 20]} />
        <meshStandardMaterial color="#422618" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.296, 0]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color="#b45309" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Ergonomic arched handle */}
      <mesh geometry={geos.carafeHandle} castShadow>
        <meshStandardMaterial color="#292524" roughness={0.5} />
      </mesh>
      {steamIntensity > 0 && <SteamParticles position={[0, 0.31, 0]} intensity={steamIntensity} />}
    </group>
  );
}

/**
 * Sculpted Glass Cold Water Bottle with vivid aqua core and cork stopper
 */
function SculptedWaterBottle({ highlighted = false }: { highlighted?: boolean }) {
  const geos = useMemo(() => getCafeGeometries(), []);

  return (
    <group>
      {/* Inner cool water volume */}
      <mesh position={[0, 0.105, 0]} renderOrder={1}>
        <cylinderGeometry args={[0.072, 0.075, 0.185, 22]} />
        <meshPhysicalMaterial
          color="#22b8f0"
          transparent
          opacity={0.78}
          emissive={highlighted ? '#0284c7' : '#0ea5e9'}
          emissiveIntensity={highlighted ? 0.42 : 0.12}
          roughness={0.08}
          clearcoat={0.8}
        />
      </mesh>
      {/* Bright water surface meniscus */}
      <mesh position={[0, 0.198, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[0.072, 20]} />
        <meshStandardMaterial color="#bae6fd" roughness={0.1} />
      </mesh>
      {/* Outer clear glossy glass bottle */}
      <mesh geometry={geos.waterBottle} renderOrder={3} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.26}
          roughness={0.05}
          metalness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.04}
          depthWrite={false}
          emissive={highlighted ? '#38bdf8' : '#000000'}
          emissiveIntensity={highlighted ? 0.3 : 0}
        />
      </mesh>
      {/* Cork stopper */}
      <mesh position={[0, 0.324, 0]} castShadow>
        <cylinderGeometry args={[0.036, 0.03, 0.042, 16]} />
        <meshStandardMaterial color="#c49563" roughness={0.92} />
      </mesh>
    </group>
  );
}

/**
 * Fluted Glass Cold Tumbler with crisp bobbing ice cubes (water or iced coffee)
 */
function SculptedIcedGlass({
  variant,
  highlighted = false,
}: {
  variant: 'water' | 'coffee';
  highlighted?: boolean;
}) {
  const geos = useMemo(() => getCafeGeometries(), []);
  const isCoffee = variant === 'coffee';

  return (
    <group>
      {/* Liquid core */}
      <mesh position={[0, 0.112, 0]} renderOrder={1}>
        <cylinderGeometry args={[0.075, 0.063, 0.182, 22]} />
        <meshPhysicalMaterial
          color={isCoffee ? '#5c2d14' : '#22b8f0'}
          transparent={!isCoffee}
          opacity={isCoffee ? 1 : 0.78}
          emissive={highlighted ? (isCoffee ? '#b45309' : '#0284c7') : isCoffee ? '#000000' : '#0ea5e9'}
          emissiveIntensity={highlighted ? 0.34 : isCoffee ? 0 : 0.1}
          roughness={0.12}
          clearcoat={0.7}
        />
      </mesh>
      {/* Top liquid meniscus or creamy iced-latte milk swirl */}
      <mesh position={[0, 0.202, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.076, 0.074, isCoffee ? 0.026 : 0.008, 22]} />
        <meshStandardMaterial color={isCoffee ? '#ecd2b3' : '#bae6fd'} roughness={isCoffee ? 0.32 : 0.12} />
      </mesh>
      {/* Crisp frosted-glossy bobbing ice cubes (visible inside clear glass) */}
      <RoundedBox
        args={[0.046, 0.046, 0.046]}
        radius={0.009}
        smoothness={3}
        position={[-0.024, 0.208, 0.018]}
        rotation={[0.45, 0.5, 0.25]}
        renderOrder={2}
      >
        <meshPhysicalMaterial
          color="#f0f9ff"
          transparent
          opacity={0.86}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.044, 0.044, 0.044]}
        radius={0.009}
        smoothness={3}
        position={[0.028, 0.194, -0.016]}
        rotation={[0.25, 0.95, 0.45]}
        renderOrder={2}
      >
        <meshPhysicalMaterial
          color="#dbeafe"
          transparent
          opacity={0.84}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.036, 0.036, 0.036]}
        radius={0.007}
        smoothness={3}
        position={[0.004, 0.214, 0.028]}
        rotation={[0.7, 0.3, 0.15]}
        renderOrder={2}
      >
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.88}
          roughness={0.06}
          clearcoat={1}
        />
      </RoundedBox>
      {/* Outer clear glossy glass shell */}
      <mesh geometry={geos.tallGlass} renderOrder={3} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={isCoffee ? '#fffdf9' : '#eef9ff'}
          transparent
          opacity={0.26}
          roughness={0.05}
          metalness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.04}
          depthWrite={false}
          emissive={highlighted ? '#38bdf8' : '#000000'}
          emissiveIntensity={highlighted ? 0.25 : 0}
        />
      </mesh>
      {/* Striped straw for iced coffee / lemon slice for cold water */}
      {isCoffee ? (
        <group position={[0.028, 0.23, 0.01]} rotation={[0.08, 0, -0.18]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.22, 10]} />
            <meshStandardMaterial color="#f5ebe0" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.0086, 0.0086, 0.03, 10]} />
            <meshStandardMaterial color="#e07a5f" roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.0086, 0.0086, 0.03, 10]} />
            <meshStandardMaterial color="#e07a5f" roughness={0.45} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0.072, 0.235, 0]} rotation={[0.2, 0.3, -0.55]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.009, 16]} />
          <meshStandardMaterial color="#fde047" roughness={0.55} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Shared warm Café interior backdrop: plank floor, lime-wash wall, subway tiles,
 * sunlit window + dust motes, shelf, espresso machine, pendant lamp, and fluted oak counter.
 * Reused across Lesson 1 (CafeScene) and Cycles 2/3/Shift/A1 (CafeDynamicSession).
 */
export function CafeEnvironmentStatic({ showCloche = true }: { showCloche?: boolean }) {
  const geos = useMemo(() => getCafeGeometries(), []);
  const textures = useMemo(() => getCafeTextures(), []);

  return (
    <group name="ENV_Static">
      {/* Plank wooden floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.5, 8.5]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.floorPlankColor}
          bumpMap={textures.floorPlankBump}
          bumpScale={0.008}
          roughness={0.85}
        />
      </mesh>

      {/* Handmade lime-wash plaster back wall */}
      <mesh position={[0, 1.9, -1.65]} receiveShadow>
        <boxGeometry args={[6.8, 3.8, 0.18]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.plasterColor}
          bumpMap={textures.plasterBump}
          bumpScale={0.012}
          roughness={0.92}
        />
      </mesh>

      {/* Warm ceramic subway-tile backsplash behind counter */}
      <mesh position={[0, 1.18, -1.53]} receiveShadow>
        <boxGeometry args={[6.8, 0.72, 0.04]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.tileColor}
          bumpMap={textures.tileBump}
          bumpScale={0.01}
          roughness={0.42}
        />
      </mesh>

      {/* Warm wooden wainscoting lower back-wall trim */}
      <mesh position={[0, 0.41, -1.52]} receiveShadow>
        <boxGeometry args={[6.8, 0.82, 0.06]} />
        <meshStandardMaterial
          color="#8b5a3c"
          bumpMap={textures.woodCounterBump}
          bumpScale={0.008}
          roughness={0.82}
        />
      </mesh>

      {/* Sunlit Café Window on left back wall + soft morning sunbeam shaft */}
      <group position={[-1.62, 1.86, -1.53]}>
        <RoundedBox args={[1.05, 1.2, 0.08]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color="#6b4226" roughness={0.78} />
        </RoundedBox>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.9, 1.04]} />
          <meshStandardMaterial
            color="#fff6d6"
            emissive="#fde68a"
            emissiveIntensity={0.82}
            roughness={0.2}
          />
        </mesh>
        {/* Mullion cross bars */}
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[0.04, 1.06, 0.03]} />
          <meshStandardMaterial color="#6b4226" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[0.92, 0.04, 0.03]} />
          <meshStandardMaterial color="#6b4226" roughness={0.78} />
        </mesh>
        {/* Soft morning light shaft */}
        {textures.sunbeamAlpha && (
          <mesh position={[0.45, -0.35, 0.75]} rotation={[0.62, 0.28, -0.32]} renderOrder={4}>
            <planeGeometry args={[1.15, 2.2]} />
            <meshBasicMaterial
              map={textures.sunbeamAlpha}
              transparent
              opacity={0.45}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Floating golden dust motes drifting in the morning light */}
      <SunlitDustMotes />

      {/* Floating wooden wall shelf + bean jars + potted terracotta plant */}
      <group position={[-0.78, 1.84, -1.4]}>
        <RoundedBox args={[1.4, 0.075, 0.32]} radius={0.015} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial
            color="#9a633c"
            map={textures.woodCounterColor}
            bumpMap={textures.woodCounterBump}
            bumpScale={0.006}
            roughness={0.76}
          />
        </RoundedBox>
        {/* Coffee bean glass jars */}
        <group position={[-0.4, 0.04, 0]}>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.064, 0.064, 0.16, 14]} />
            <meshStandardMaterial color="#4a2511" bumpMap={textures.clayBump} bumpScale={0.01} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.11, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.22, 16]} />
            <meshPhysicalMaterial
              color="#fef3c7"
              transparent
              opacity={0.28}
              roughness={0.06}
              clearcoat={1}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.23, 0]}>
            <cylinderGeometry args={[0.068, 0.068, 0.03, 16]} />
            <meshStandardMaterial color="#c49563" roughness={0.88} />
          </mesh>
        </group>
        <group position={[-0.14, 0.04, 0.02]}>
          <mesh position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.18, 16]} />
            <meshStandardMaterial color="#e07a5f" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.068, 0.068, 0.024, 16]} />
            <meshStandardMaterial color="#f5e6d3" roughness={0.4} />
          </mesh>
        </group>
        {/* Cute potted terracotta plant */}
        <group position={[0.38, 0.04, 0]}>
          <mesh position={[0, 0.075, 0]} castShadow>
            <cylinderGeometry args={[0.082, 0.058, 0.15, 16]} />
            <meshStandardMaterial
              color="#c96548"
              bumpMap={textures.clayBump}
              bumpScale={0.008}
              roughness={0.85}
            />
          </mesh>
          <mesh position={[0, 0.19, 0]} castShadow>
            <sphereGeometry args={[0.078, 12, 12]} />
            <meshStandardMaterial color="#4d7c5b" bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.88} />
          </mesh>
          <mesh position={[-0.065, 0.16, 0.03]} castShadow>
            <sphereGeometry args={[0.058, 10, 10]} />
            <meshStandardMaterial color="#3d6b4b" roughness={0.88} />
          </mesh>
          <mesh position={[0.065, 0.17, -0.02]} castShadow>
            <sphereGeometry args={[0.054, 10, 10]} />
            <meshStandardMaterial color="#5a8f69" roughness={0.88} />
          </mesh>
          {/* Trailing ivy vine draping off shelf */}
          <mesh position={[0.09, 0.02, 0.07]} castShadow>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshStandardMaterial color="#4d7c5b" roughness={0.88} />
          </mesh>
          <mesh position={[0.12, -0.06, 0.09]} castShadow>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#5a8f69" roughness={0.88} />
          </mesh>
        </group>
      </group>

      {/* Framed geometric icon menu board (zero text, pure visual café craft) */}
      <group position={[0.96, 1.9, -1.52]}>
        <RoundedBox args={[0.92, 0.68, 0.05]} radius={0.015} smoothness={3} castShadow>
          <meshStandardMaterial color="#7a4e32" roughness={0.78} />
        </RoundedBox>
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[0.8, 0.56]} />
          <meshStandardMaterial color="#27312f" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.95} />
        </mesh>
        {/* Minimalist chalk-style geometric cup & steam icon */}
        <mesh position={[-0.18, -0.02, 0.032]}>
          <cylinderGeometry args={[0.065, 0.052, 0.11, 14]} />
          <meshBasicMaterial color="#fef3c7" />
        </mesh>
        <mesh position={[0.14, 0.06, 0.032]}>
          <boxGeometry args={[0.26, 0.025, 0.005]} />
          <meshBasicMaterial color="#fde68a" />
        </mesh>
        <mesh position={[0.14, -0.03, 0.032]}>
          <boxGeometry args={[0.2, 0.022, 0.005]} />
          <meshBasicMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0.14, -0.12, 0.032]}>
          <boxGeometry args={[0.24, 0.022, 0.005]} />
          <meshBasicMaterial color="#93c5fd" />
        </mesh>
      </group>

      {/* Overhead Mid-Century Copper Pendant Lamp */}
      <group position={[0, 2.08, 0.12]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.9, 8]} />
          <meshStandardMaterial color="#292524" roughness={0.7} />
        </mesh>
        <mesh geometry={geos.pendantShade} castShadow>
          <meshStandardMaterial color="#c86f46" metalness={0.62} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#fbbf24"
            emissiveIntensity={1.6}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Detailed Retro Terracotta & Chrome Espresso Machine */}
      <group position={[1.04, 0.97, -0.22]} rotation={[0, -0.34, 0]}>
        {/* Brushed chrome base & drip tray */}
        <RoundedBox args={[0.56, 0.07, 0.48]} radius={0.015} smoothness={3} position={[0, 0.035, 0.02]} castShadow>
          <meshStandardMaterial color="#d4d4d8" metalness={0.82} roughness={0.22} />
        </RoundedBox>
        {/* Main enamel housing */}
        <RoundedBox args={[0.54, 0.44, 0.4]} radius={0.04} smoothness={4} position={[0, 0.27, -0.02]} castShadow>
          <meshPhysicalMaterial
            color="#c9563c"
            roughness={0.28}
            metalness={0.18}
            clearcoat={0.75}
            clearcoatRoughness={0.2}
          />
        </RoundedBox>
        {/* Chrome cup-warmer top plate + stacked mini cups */}
        <RoundedBox args={[0.55, 0.035, 0.42]} radius={0.01} smoothness={2} position={[0, 0.5, -0.02]} castShadow>
          <meshStandardMaterial color="#e4e4e7" metalness={0.86} roughness={0.18} />
        </RoundedBox>
        <mesh position={[-0.13, 0.55, -0.02]} castShadow>
          <cylinderGeometry args={[0.045, 0.038, 0.075, 14]} />
          <meshStandardMaterial color="#fff7ed" roughness={0.25} />
        </mesh>
        <mesh position={[0.02, 0.55, -0.04]} castShadow>
          <cylinderGeometry args={[0.045, 0.038, 0.075, 14]} />
          <meshStandardMaterial color="#fff7ed" roughness={0.25} />
        </mesh>
        {/* Pressure gauge dial */}
        <mesh position={[0.13, 0.36, 0.185]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.044, 0.044, 0.02, 16]} />
          <meshStandardMaterial color="#fefce8" roughness={0.25} />
        </mesh>
        <mesh position={[0.13, 0.36, 0.182]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.046, 0.008, 8, 20]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.88} roughness={0.2} />
        </mesh>
        {/* Grouphead & portafilter with walnut handle */}
        <mesh position={[-0.08, 0.26, 0.21]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.08, 16]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.88} roughness={0.18} />
        </mesh>
        <mesh position={[-0.08, 0.22, 0.32]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.018, 0.15, 10]} />
          <meshStandardMaterial color="#4a2b18" roughness={0.62} />
        </mesh>
        {/* Steam wand + stainless milk pitcher on drip tray + glowing power LED */}
        <mesh position={[0.16, 0.19, 0.22]} rotation={[0.25, 0, -0.22]}>
          <cylinderGeometry args={[0.008, 0.008, 0.18, 8]} />
          <meshStandardMaterial color="#e4e4e7" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[-0.17, 0.115, 0.19]} castShadow>
          <cylinderGeometry args={[0.036, 0.044, 0.095, 14]} />
          <meshStandardMaterial color="#e4e4e7" metalness={0.88} roughness={0.18} />
        </mesh>
        <mesh position={[-0.17, 0.37, 0.185]}>
          <sphereGeometry args={[0.011, 8, 8]} />
          <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={1.6} />
        </mesh>
      </group>

      {/* Decorative Glass Pastry Cloche Dome with Golden Croissant */}
      {showCloche && (
        <group position={[-0.98, 0.973, -0.26]}>
          <mesh position={[0, 0.014, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.145, 0.13, 0.028, 22]} />
            <meshStandardMaterial color="#8b5a3c" roughness={0.65} />
          </mesh>
          {/* Golden croissant */}
          <mesh position={[0, 0.05, 0]} rotation={[0.2, 0.4, 0]} scale={[1.25, 0.72, 0.85]} castShadow>
            <torusGeometry args={[0.042, 0.022, 8, 16, Math.PI * 1.4]} />
            <meshStandardMaterial color="#d98a36" bumpMap={textures.clayBump} bumpScale={0.006} roughness={0.72} />
          </mesh>
          {/* Clear glass cloche bell */}
          <mesh position={[0, 0.028, 0]} renderOrder={3}>
            <sphereGeometry args={[0.125, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial
              color="#fffdf9"
              transparent
              opacity={0.24}
              roughness={0.04}
              clearcoat={1}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.018, 10, 10]} />
            <meshPhysicalMaterial color="#fffdf9" transparent opacity={0.45} roughness={0.06} clearcoat={1} />
          </mesh>
        </group>
      )}

      {/* Ceramic Barista Utensil Crock with Wooden Stirrers */}
      <group position={[0.31, 0.973, -0.32]}>
        <mesh position={[0, 0.065, 0]} castShadow>
          <cylinderGeometry args={[0.048, 0.042, 0.13, 16]} />
          <meshStandardMaterial color="#2a6f62" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.45} />
        </mesh>
        {[-0.012, 0.004, 0.016].map((sx, idx) => (
          <mesh key={idx} position={[sx, 0.145, idx * 0.006]} rotation={[0.08 * (idx - 1), 0, -0.12 + idx * 0.11]}>
            <cylinderGeometry args={[0.0045, 0.0045, 0.11, 6]} />
            <meshStandardMaterial color="#d4a373" roughness={0.82} />
          </mesh>
        ))}
      </group>

      {/* Main Wooden Café Counter (0.95m height) with fluted front slats & beveled grained top */}
      <mesh position={[0, 0.455, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[3.24, 0.91, 0.9]} />
        <meshStandardMaterial
          color="#6f462c"
          bumpMap={textures.woodCounterBump}
          bumpScale={0.01}
          roughness={0.85}
        />
      </mesh>
      {/* Front vertical decorative wood slats */}
      {Array.from({ length: 13 }, (_, idx) => (
        <mesh
          key={idx}
          position={[-1.44 + idx * 0.24, 0.455, 0.505]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.14, 0.84, 0.025]} />
          <meshStandardMaterial
            color="#7f5134"
            bumpMap={textures.woodCounterBump}
            bumpScale={0.008}
            roughness={0.82}
          />
        </mesh>
      ))}
      {/* Brass kick-plate along counter base */}
      <mesh position={[0, 0.04, 0.512]}>
        <boxGeometry args={[3.26, 0.07, 0.02]} />
        <meshStandardMaterial color="#b48a3e" metalness={0.78} roughness={0.3} />
      </mesh>
      {/* Beveled Oak Countertop with wood grain PBR maps */}
      <RoundedBox
        args={[3.38, 0.075, 1.08]}
        radius={0.022}
        smoothness={4}
        position={[0, 0.935, 0.06]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#ffffff"
          map={textures.woodCounterColor}
          bumpMap={textures.woodCounterBump}
          bumpScale={0.009}
          roughnessMap={textures.woodCounterRoughness}
          roughness={0.62}
        />
      </RoundedBox>
    </group>
  );
}

function CafeGreybox({
  phase,
  highlightedProp,
  hintMode,
  customerMood,
  activePourLiquid,
  pourProgressRef,
  isPouringRef,
  mysteryBoxVisible,
  onPropTap,
  onPourStart,
  onPourEnd,
}: Omit<CafeSceneProps, 'assetMode' | 'visible'>) {
  const jarPourRef = useRef<THREE.Group>(null);
  const waterPourRef = useRef<THREE.Group>(null);
  const fillMeshRef = useRef<THREE.Mesh>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const boxRef = useRef<THREE.Group>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);

  const geos = useMemo(() => getCafeGeometries(), []);
  const textures = useMemo(() => getCafeTextures(), []);

  useGlobalPourRelease(phase, onPourEnd);

  const showIntroProps = phase === 'counter_intro' || phase === 'map_arrival';
  const showContrastProps = phase === 'thermal_contrast';
  const showPourProps = phase === 'action_pour';
  const showChoiceProps =
    phase === 'personal_choice' || phase === 'micro_echo' || phase === 'farewell_constellation';

  useLayoutEffect(() => {
    if (fillMeshRef.current) {
      fillMeshRef.current.visible = false;
    }
    if (streamRef.current) {
      streamRef.current.visible = false;
    }
  }, [showPourProps, activePourLiquid]);

  useLayoutEffect(() => {
    if (boxRef.current) {
      boxRef.current.position.y = mysteryBoxVisible ? 0.97 : 1.9;
    }
  }, [showChoiceProps]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const pouring = isPouringRef.current && phase === 'action_pour';
    const progress = pourProgressRef.current;

    if (jarPourRef.current) {
      const active = pouring && activePourLiquid === 'coffee';
      jarPourRef.current.position.x = THREE.MathUtils.damp(
        jarPourRef.current.position.x,
        active ? -0.21 : 0,
        8,
        dt,
      );
      jarPourRef.current.position.y = THREE.MathUtils.damp(
        jarPourRef.current.position.y,
        active ? 0.28 : 0,
        8,
        dt,
      );
      jarPourRef.current.rotation.z = THREE.MathUtils.damp(
        jarPourRef.current.rotation.z,
        active ? 0.72 : 0,
        8,
        dt,
      );
    }

    if (waterPourRef.current) {
      const active = pouring && activePourLiquid === 'water';
      waterPourRef.current.position.x = THREE.MathUtils.damp(
        waterPourRef.current.position.x,
        active ? -0.21 : 0,
        8,
        dt,
      );
      waterPourRef.current.position.y = THREE.MathUtils.damp(
        waterPourRef.current.position.y,
        active ? 0.3 : 0,
        8,
        dt,
      );
      waterPourRef.current.rotation.z = THREE.MathUtils.damp(
        waterPourRef.current.rotation.z,
        active ? 0.75 : 0,
        8,
        dt,
      );
    }

    if (fillMeshRef.current) {
      const clamped = Math.max(0.01, Math.min(1, progress));
      fillMeshRef.current.scale.y = clamped;
      fillMeshRef.current.position.y = 0.025 + clamped * 0.062;
      fillMeshRef.current.visible = progress > 0.02;
    }

    if (streamRef.current) {
      streamRef.current.visible = pouring && progress < 1;
    }

    if (boxRef.current) {
      const targetY = mysteryBoxVisible ? 0.97 : 1.9;
      boxRef.current.position.y = THREE.MathUtils.damp(boxRef.current.position.y, targetY, 6, dt);
    }

    if (glowRingRef.current) {
      const pulse = 1 + Math.sin(t * 4.5) * 0.1;
      glowRingRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const handleGroupClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const prop = findPropName(e.object);
    if (prop) onPropTap(prop);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = findPropName(e.object) ? 'pointer' : 'auto';
  };

  const isHighlighted = (prop: PropName) => highlightedProp === prop;
  const contrastBoost = hintMode === 'contrast';

  const highlightX =
    highlightedProp === 'prop_cup_empty'
      ? showPourProps
        ? 0
        : -0.52
      : highlightedProp === 'prop_cup_hot'
        ? -0.45
        : highlightedProp === 'prop_jar_coffee'
          ? showPourProps
            ? 0.45
            : 0
          : highlightedProp === 'prop_water_cold'
            ? showIntroProps
              ? 0.52
              : 0.45
            : highlightedProp === 'prop_iced_coffee'
              ? 0
              : 0.42;

  const highlightZ = highlightedProp === 'prop_box_mystery' ? 0.22 : 0.12;

  return (
    <group
      name="Cafe_Interior_Greybox"
      onClick={handleGroupClick}
      onPointerMove={handlePointerMove}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Grounded contact AO baked once per phase transition (Badge Factory technique) */}
      <ContactShadows
        key={phase}
        frames={1}
        position={[0, 0.973, 0.12]}
        opacity={0.42}
        scale={3.6}
        blur={2.1}
        far={0.65}
        color="#3b1d0f"
      />

      {/* ENV_Static: shared warm textured café interior, fluted wood counter, pendant lamp, espresso machine */}
      <CafeEnvironmentStatic showCloche={phase !== 'thermal_contrast'} />

      {/* Subtle highlight halo rendered beneath whichever prop is currently highlighted */}
      {highlightedProp && highlightedProp !== 'prop_cafe_door' && (
        <mesh
          ref={glowRingRef}
          position={[highlightX, 0.977, highlightZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.165, 0.225, 32]} />
          <meshBasicMaterial
            color={contrastBoost ? '#f97316' : '#fbbf24'}
            transparent
            opacity={0.88}
          />
        </mesh>
      )}

      {/* SCREEN 2: Counter Intro Props (sculpted mug, pour-over coffee carafe, glass water bottle) */}
      {showIntroProps && (
        <group name="PROPS_Intro">
          <group name="prop_cup_empty" position={[-0.52, 0.973, 0.12]}>
            <SculptedMug
              color="#fdf6ea"
              emissive={isHighlighted('prop_cup_empty') ? '#f59e0b' : '#000000'}
              emissiveIntensity={isHighlighted('prop_cup_empty') ? 0.3 : 0}
            />
          </group>

          <group name="prop_jar_coffee" position={[0, 0.973, 0.12]}>
            <SculptedCoffeeCarafe
              highlighted={isHighlighted('prop_jar_coffee')}
              steamIntensity={0.75}
            />
          </group>

          <group name="prop_water_cold" position={[0.52, 0.973, 0.12]}>
            <SculptedWaterBottle highlighted={isHighlighted('prop_water_cold')} />
          </group>
        </group>
      )}

      {/* SCREEN 3: Thermal Contrast Props (steaming hot latte mug vs frosted iced glass + customer) */}
      {showContrastProps && (
        <group name="PROPS_Contrast">
          <group name="prop_cup_hot" position={[-0.45, 0.973, 0.12]}>
            <SculptedMug
              color="#dc5a2c"
              emissive="#f97316"
              emissiveIntensity={contrastBoost || isHighlighted('prop_cup_hot') ? 0.36 : 0.1}
              withLatteArt
              steamIntensity={contrastBoost ? 1.45 : 1.15}
            />
          </group>

          <group name="prop_water_cold" position={[0.45, 0.973, 0.12]}>
            <SculptedIcedGlass
              variant="water"
              highlighted={contrastBoost || isHighlighted('prop_water_cold')}
            />
          </group>

          {/* Expressive Claybound-style customer cue silhouette (framed cleanly inside counter view) */}
          {customerMood && (
            <group position={[-0.86, 1.14, -0.24]} rotation={[0, 0.36, 0]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.145, 0.28, 8, 14]} />
                <meshStandardMaterial
                  color={customerMood === 'cold' ? '#3b82f6' : '#f59e0b'}
                  bumpMap={textures.clayBump}
                  bumpScale={0.006}
                  roughness={0.85}
                />
              </mesh>
              {/* Cozy scarf for cold customer */}
              {customerMood === 'cold' && (
                <mesh position={[0, 0.2, 0.01]} rotation={[0.1, 0, 0]} castShadow>
                  <torusGeometry args={[0.115, 0.036, 10, 20]} />
                  <meshStandardMaterial color="#93c5fd" roughness={0.92} />
                </mesh>
              )}
              <mesh position={[0, 0.35, 0]} castShadow>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial
                  color="#f3c6a0"
                  bumpMap={textures.clayBump}
                  bumpScale={0.004}
                  roughness={0.82}
                />
              </mesh>
              {/* Expressive glossy customer eyes */}
              <mesh position={[-0.045, 0.36, 0.125]}>
                <sphereGeometry args={[0.016, 10, 10]} />
                <meshStandardMaterial color="#1c1917" roughness={0.15} />
              </mesh>
              <mesh position={[0.045, 0.36, 0.125]}>
                <sphereGeometry args={[0.016, 10, 10]} />
                <meshStandardMaterial color="#1c1917" roughness={0.15} />
              </mesh>
              {/* Beanie (cold) or sporty visor cap (warm) */}
              <mesh position={[0, 0.43, 0]} castShadow>
                <sphereGeometry args={[0.142, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial
                  color={customerMood === 'cold' ? '#1d4ed8' : '#ea580c'}
                  roughness={0.88}
                />
              </mesh>
              {/* Floating mood cue gem (blue ice crystal vs golden sun) */}
              <mesh position={[0, 0.66, 0]}>
                <octahedronGeometry args={[0.088, 0]} />
                <meshStandardMaterial
                  color={customerMood === 'cold' ? '#bae6fd' : '#fef08a'}
                  emissive={customerMood === 'cold' ? '#38bdf8' : '#f97316'}
                  emissiveIntensity={0.85}
                  roughness={0.2}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* SCREEN 4: Action Pour (empty glass/mug center + hold-to-pour sculpted vessel) */}
      {showPourProps && (
        <group name="PROPS_Pour">
          <group name="prop_cup_empty" position={[0, 0.973, 0.12]}>
            {/* Dynamic liquid level rising inside cup */}
            <mesh ref={fillMeshRef} renderOrder={1}>
              <cylinderGeometry args={[0.082, 0.068, 0.135, 20]} />
              <meshPhysicalMaterial
                color={activePourLiquid === 'water' ? '#22b8f0' : '#4a2511'}
                roughness={0.12}
                clearcoat={0.7}
              />
            </mesh>
            {/* Clear glossy tumbler shell (no transmission so rising liquid stays vivid) */}
            <mesh geometry={geos.tallGlass} scale={[1.05, 0.78, 1.05]} renderOrder={2} castShadow receiveShadow>
              <meshPhysicalMaterial
                color="#fffdf9"
                transparent
                opacity={0.28}
                roughness={0.05}
                metalness={0.04}
                clearcoat={1}
                clearcoatRoughness={0.04}
                depthWrite={false}
              />
            </mesh>
          </group>

          {/* Pouring stream */}
          <group position={[0.03, 1.19, 0.12]}>
            <mesh ref={streamRef} renderOrder={2}>
              <cylinderGeometry args={[0.013, 0.018, 0.25, 12]} />
              <meshPhysicalMaterial
                color={activePourLiquid === 'water' ? '#38bdf8' : '#5c2e14'}
                transparent={activePourLiquid === 'water'}
                opacity={activePourLiquid === 'water' ? 0.85 : 1}
                roughness={0.08}
                clearcoat={1}
              />
            </mesh>
          </group>

          {activePourLiquid === 'coffee' && (
            <group position={[0.45, 0.973, 0.12]}>
              <group
                ref={jarPourRef}
                name="prop_jar_coffee"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPourStart();
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  onPourEnd();
                }}
              >
                <SculptedCoffeeCarafe highlighted steamIntensity={0.65} />
              </group>
            </group>
          )}

          {activePourLiquid === 'water' && (
            <group position={[0.45, 0.973, 0.12]}>
              <group
                ref={waterPourRef}
                name="prop_water_cold"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPourStart();
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  onPourEnd();
                }}
              >
                <SculptedWaterBottle highlighted />
              </group>
            </group>
          )}
        </group>
      )}

      {/* SCREENS 5, 6, 7: Personal Choice Sculpted Drinks + Wooden Mystery Crate */}
      {showChoiceProps && (
        <group name="PROPS_Choice">
          <group name="prop_cup_hot" position={[-0.45, 0.973, 0.12]}>
            <SculptedMug
              color="#dc5a2c"
              emissive={isHighlighted('prop_cup_hot') ? '#f97316' : '#000000'}
              emissiveIntensity={isHighlighted('prop_cup_hot') ? 0.35 : 0}
              withLatteArt
              steamIntensity={0.95}
            />
          </group>

          {/* Creative combo: Tall Iced Coffee with layered milk foam, ice & striped straw */}
          <group name="prop_iced_coffee" position={[0, 0.973, 0.12]}>
            <SculptedIcedGlass
              variant="coffee"
              highlighted={isHighlighted('prop_iced_coffee')}
            />
          </group>

          <group name="prop_water_cold" position={[0.45, 0.973, 0.12]}>
            <SculptedIcedGlass
              variant="water"
              highlighted={isHighlighted('prop_water_cold')}
            />
          </group>

          {/* Slatted wooden mystery parcel crate hook for Lesson 2 */}
          <group name="prop_box_mystery" position={[0.42, 0, 0.22]} visible={mysteryBoxVisible}>
            <group ref={boxRef}>
              <RoundedBox args={[0.31, 0.22, 0.25]} radius={0.015} smoothness={3} position={[0, 0.11, 0]} castShadow receiveShadow>
                <meshStandardMaterial
                  color="#ffffff"
                  map={textures.woodCrateColor}
                  bumpMap={textures.woodCrateBump}
                  bumpScale={0.01}
                  roughness={0.82}
                />
              </RoundedBox>
              {/* Crossed crimson ribbon + double bow loops */}
              <mesh position={[0, 0.112, 0]}>
                <boxGeometry args={[0.32, 0.036, 0.26]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.62} />
              </mesh>
              <mesh position={[0, 0.112, 0]}>
                <boxGeometry args={[0.04, 0.23, 0.26]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.62} />
              </mesh>
              <mesh position={[-0.038, 0.24, 0]} rotation={[0, 0, 0.45]} castShadow>
                <torusGeometry args={[0.032, 0.011, 8, 16]} />
                <meshStandardMaterial color="#dc2626" roughness={0.58} />
              </mesh>
              <mesh position={[0.038, 0.24, 0]} rotation={[0, 0, -0.45]} castShadow>
                <torusGeometry args={[0.032, 0.011, 8, 16]} />
                <meshStandardMaterial color="#dc2626" roughness={0.58} />
              </mesh>
              <SteamParticles position={[0, 0.27, 0]} intensity={0.85} />
            </group>
          </group>
        </group>
      )}
    </group>
  );
}

export function CafeScene(props: CafeSceneProps) {
  const { assetMode, visible, ...greyboxProps } = props;

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [visible]);

  if (!visible) return null;

  const greybox = <CafeGreybox {...greyboxProps} />;
  if (assetMode === 'glb') {
    return (
      <ModelErrorBoundary fallback={greybox}>
        <Suspense fallback={greybox}>
          <CafeGlb
            phase={greyboxProps.phase}
            activePourLiquid={greyboxProps.activePourLiquid}
            mysteryBoxVisible={greyboxProps.mysteryBoxVisible}
            onPropTap={greyboxProps.onPropTap}
            onPourStart={greyboxProps.onPourStart}
            onPourEnd={greyboxProps.onPourEnd}
          />
        </Suspense>
      </ModelErrorBoundary>
    );
  }

  return greybox;
}
