import { Suspense, useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { HintMode, LessonPhase } from '../domain/lessonEngine';
import type { PropName } from '../domain/types';
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

function SteamParticles({ position, intensity = 1 }: { position: [number, number, number]; intensity?: number }) {
  const s1 = useRef<THREE.Mesh>(null);
  const s2 = useRef<THREE.Mesh>(null);
  const s3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const refs = [s1, s2, s3];
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      const cycle = (t * 0.7 + i * 0.33) % 1;
      ref.current.position.y = cycle * 0.32 * intensity;
      ref.current.position.x = Math.sin(t * 2 + i * 2) * 0.03;
      ref.current.scale.setScalar((0.55 + cycle * 0.75) * intensity);
    });
  });

  return (
    <group name="fx_steam_cup" position={position}>
      {[s1, s2, s3].map((ref, idx) => (
        <mesh key={idx} ref={ref}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#fff7ed" transparent opacity={0.55} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function useGlobalPourRelease(active: boolean, onPourEnd: () => void) {
  useEffect(() => {
    if (!active) return;
    const handleRelease = () => {
      onPourEnd();
    };
    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
    return () => {
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('pointercancel', handleRelease);
    };
  }, [active, onPourEnd]);
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

  useGlobalPourRelease(phase === 'action_pour', onPourEnd);

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

  const showIntroProps = phase === 'counter_intro' || phase === 'map_arrival';
  const showContrastProps = phase === 'thermal_contrast';
  const showPourProps = phase === 'action_pour';
  const showChoiceProps = phase === 'personal_choice' || phase === 'micro_echo' || phase === 'farewell_constellation';

  useGlobalPourRelease(phase === 'action_pour', onPourEnd);

  useLayoutEffect(() => {
    if (!showPourProps) return;
    if (fillMeshRef.current) {
      fillMeshRef.current.visible = false;
    }
    if (streamRef.current) {
      streamRef.current.visible = false;
    }
  }, [showPourProps]);

  useLayoutEffect(() => {
    if (showChoiceProps && boxRef.current) {
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
        active ? -0.23 : 0,
        8,
        dt,
      );
      jarPourRef.current.position.y = THREE.MathUtils.damp(
        jarPourRef.current.position.y,
        active ? 0.27 : 0,
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
        active ? -0.23 : 0,
        8,
        dt,
      );
      waterPourRef.current.position.y = THREE.MathUtils.damp(
        waterPourRef.current.position.y,
        active ? 0.29 : 0,
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
      fillMeshRef.current.position.y = 0.02 + clamped * 0.065;
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
      const pulse = 1 + Math.sin(t * 4.5) * 0.12;
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

  return (
    <group
      name="Cafe_Interior_Greybox"
      onClick={handleGroupClick}
      onPointerMove={handlePointerMove}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* ENV_Static: warm café walls, floor, wooden counter & espresso machine */}
      <group name="ENV_Static">
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color="#e8dcc8" roughness={0.92} />
        </mesh>
        {/* Back wall */}
        <mesh position={[0, 1.8, -1.65]} receiveShadow>
          <boxGeometry args={[6.4, 3.6, 0.18]} />
          <meshStandardMaterial color="#f5ebe0" roughness={0.88} />
        </mesh>
        {/* Warm wooden shelf */}
        <mesh position={[-1.1, 1.85, -1.42]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.08, 0.34]} />
          <meshStandardMaterial color="#8c5a3c" roughness={0.78} />
        </mesh>
        {/* Decorative espresso machine */}
        <group position={[1.25, 1.18, -0.35]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.44, 0.42]} />
            <meshStandardMaterial color="#c85a44" roughness={0.42} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[0.58, 0.05, 0.45]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
        {/* Main Wooden Counter (0.95m height per Blender guide) */}
        <mesh position={[0, 0.46, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.92, 0.92]} />
          <meshStandardMaterial color="#7a4e32" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.94, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[3.32, 0.06, 1.02]} />
          <meshStandardMaterial color="#b07d56" roughness={0.68} />
        </mesh>
      </group>

      {/* Subtle highlight halo rendered beneath whichever prop is currently highlighted */}
      {highlightedProp && (
        <mesh
          ref={glowRingRef}
          position={[
            highlightedProp === 'prop_cup_empty'
              ? showPourProps ? 0 : -0.52
              : highlightedProp === 'prop_cup_hot'
                ? -0.45
                : highlightedProp === 'prop_jar_coffee'
                  ? showPourProps ? 0.45 : 0
                  : highlightedProp === 'prop_water_cold'
                    ? showIntroProps ? 0.52 : showPourProps ? 0.45 : 0.45
                    : highlightedProp === 'prop_iced_coffee'
                      ? 0
                      : 0.42,
            0.975,
            0.12,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.16, 0.23, 28]} />
          <meshBasicMaterial color={contrastBoost ? '#f97316' : '#fbbf24'} transparent opacity={0.9} />
        </mesh>
      )}

      {/* SCREEN 2: Counter Intro Props (cup, coffee jar, water bottle) */}
      {showIntroProps && (
        <group name="PROPS_Intro">
          {/* Empty ceramic cup */}
          <group name="prop_cup_empty" position={[-0.52, 0.97, 0.12]}>
            <mesh position={[0, 0.085, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.078, 0.17, 18]} />
              <meshStandardMaterial
                color="#fff7ed"
                emissive={isHighlighted('prop_cup_empty') ? '#f59e0b' : '#000000'}
                emissiveIntensity={isHighlighted('prop_cup_empty') ? 0.35 : 0}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0.105, 0.085, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.048, 0.015, 8, 16]} />
              <meshStandardMaterial color="#fff7ed" roughness={0.25} />
            </mesh>
          </group>

          {/* Coffee carafe */}
          <group name="prop_jar_coffee" position={[0, 0.97, 0.12]}>
            <mesh position={[0, 0.13, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.12, 0.26, 18]} />
              <meshStandardMaterial
                color="#4b2e1e"
                emissive={isHighlighted('prop_jar_coffee') ? '#f59e0b' : '#000000'}
                emissiveIntensity={isHighlighted('prop_jar_coffee') ? 0.35 : 0}
                roughness={0.22}
              />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.03, 16]} />
              <meshStandardMaterial color="#1f2937" roughness={0.5} />
            </mesh>
            <SteamParticles position={[0, 0.3, 0]} intensity={0.75} />
          </group>

          {/* Cold water glass bottle */}
          <group name="prop_water_cold" position={[0.52, 0.97, 0.12]}>
            <mesh position={[0, 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.072, 0.082, 0.3, 18]} />
              <meshStandardMaterial
                color="#7dd3fc"
                transparent
                opacity={0.78}
                emissive={isHighlighted('prop_water_cold') ? '#38bdf8' : '#000000'}
                emissiveIntensity={isHighlighted('prop_water_cold') ? 0.4 : 0}
                roughness={0.12}
              />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.038, 0.042, 0.06, 12]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* SCREEN 3: Thermal Contrast Props (hot coffee vs iced cold water + customer visual silhouette) */}
      {showContrastProps && (
        <group name="PROPS_Contrast">
          {/* Steaming Hot Coffee */}
          <group name="prop_cup_hot" position={[-0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.09, 0]} castShadow>
              <cylinderGeometry args={[0.105, 0.085, 0.18, 18]} />
              <meshStandardMaterial
                color="#ea580c"
                emissive="#f97316"
                emissiveIntensity={contrastBoost || isHighlighted('prop_cup_hot') ? 0.5 : 0.18}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, 0.175, 0]}>
              <cylinderGeometry args={[0.092, 0.092, 0.015, 16]} />
              <meshStandardMaterial color="#3b1d0f" roughness={0.2} />
            </mesh>
            <SteamParticles position={[0, 0.22, 0]} intensity={contrastBoost ? 1.5 : 1.15} />
          </group>

          {/* Iced Cold Water */}
          <group name="prop_water_cold" position={[0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.082, 0.24, 18]} />
              <meshStandardMaterial
                color="#38bdf8"
                transparent
                opacity={0.72}
                emissive="#0ea5e9"
                emissiveIntensity={contrastBoost || isHighlighted('prop_water_cold') ? 0.5 : 0.18}
                roughness={0.1}
              />
            </mesh>
            {/* Ice cubes inside */}
            <mesh position={[-0.025, 0.17, 0.02]} rotation={[0.4, 0.5, 0.2]}>
              <boxGeometry args={[0.048, 0.048, 0.048]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.1} />
            </mesh>
            <mesh position={[0.03, 0.14, -0.015]} rotation={[0.2, 0.9, 0.5]}>
              <boxGeometry args={[0.045, 0.045, 0.045]} />
              <meshStandardMaterial color="#f0f9ff" roughness={0.1} />
            </mesh>
          </group>

          {/* Subtle customer visual cue on the left side of the counter */}
          {customerMood && (
            <group position={[-1.08, 1.18, -0.15]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.14, 0.3, 8, 12]} />
                <meshStandardMaterial
                  color={customerMood === 'cold' ? '#3b82f6' : '#f59e0b'}
                  roughness={0.7}
                />
              </mesh>
              <mesh position={[0, 0.36, 0]} castShadow>
                <sphereGeometry args={[0.14, 14, 14]} />
                <meshStandardMaterial color="#f5cba7" roughness={0.75} />
              </mesh>
              {/* Visual mood badge orb above customer (blue snowflake aura vs warm sun aura) */}
              <mesh position={[0, 0.64, 0]}>
                <octahedronGeometry args={[0.09, 0]} />
                <meshStandardMaterial
                  color={customerMood === 'cold' ? '#93c5fd' : '#fcd34d'}
                  emissive={customerMood === 'cold' ? '#38bdf8' : '#f97316'}
                  emissiveIntensity={0.8}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* SCREEN 4: Action Pour (empty cup center + hold-to-pour vessel) */}
      {showPourProps && (
        <group name="PROPS_Pour">
          <group name="prop_cup_empty" position={[0, 0.97, 0.12]}>
            <mesh position={[0, 0.09, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.09, 0.18, 18]} />
              <meshStandardMaterial color="#fff7ed" transparent opacity={0.85} roughness={0.2} />
            </mesh>
            {/* Dynamic liquid level rising inside cup */}
            <mesh ref={fillMeshRef}>
              <cylinderGeometry args={[0.092, 0.078, 0.14, 16]} />
              <meshStandardMaterial
                color={activePourLiquid === 'water' ? '#38bdf8' : '#4a2511'}
                roughness={0.2}
              />
            </mesh>
          </group>

          {/* Pouring stream */}
          <group position={[0.03, 1.19, 0.12]}>
            <mesh ref={streamRef}>
              <cylinderGeometry args={[0.014, 0.018, 0.24, 10]} />
              <meshStandardMaterial
                color={activePourLiquid === 'water' ? '#7dd3fc' : '#5c2e14'}
                roughness={0.15}
              />
            </mesh>
          </group>

          {activePourLiquid === 'coffee' && (
            <group position={[0.45, 0.97, 0.12]}>
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
                <mesh position={[0, 0.14, 0]} castShadow>
                  <cylinderGeometry args={[0.09, 0.12, 0.28, 18]} />
                  <meshStandardMaterial
                    color="#4b2e1e"
                    emissive="#f59e0b"
                    emissiveIntensity={0.25}
                    roughness={0.25}
                  />
                </mesh>
              </group>
            </group>
          )}

          {activePourLiquid === 'water' && (
            <group position={[0.45, 0.97, 0.12]}>
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
                <mesh position={[0, 0.15, 0]} castShadow>
                  <cylinderGeometry args={[0.075, 0.085, 0.3, 18]} />
                  <meshStandardMaterial
                    color="#7dd3fc"
                    transparent
                    opacity={0.82}
                    emissive="#38bdf8"
                    emissiveIntensity={0.28}
                    roughness={0.12}
                  />
                </mesh>
              </group>
            </group>
          )}
        </group>
      )}

      {/* SCREENS 5, 6, 7: Personal Choice Drinks + Mystery Box Hook */}
      {showChoiceProps && (
        <group name="PROPS_Choice">
          <group name="prop_cup_hot" position={[-0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.085, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.08, 0.17, 18]} />
              <meshStandardMaterial
                color="#ea580c"
                emissive={isHighlighted('prop_cup_hot') ? '#f97316' : '#000000'}
                emissiveIntensity={0.4}
                roughness={0.25}
              />
            </mesh>
            <SteamParticles position={[0, 0.2, 0]} intensity={0.95} />
          </group>

          {/* Creative combo: Cold Coffee (tall glass with dark coffee + ice cubes) */}
          <group name="prop_iced_coffee" position={[0, 0.97, 0.12]}>
            <mesh position={[0, 0.13, 0]} castShadow>
              <cylinderGeometry args={[0.085, 0.072, 0.26, 18]} />
              <meshStandardMaterial
                color="#7c4727"
                transparent
                opacity={0.88}
                emissive={isHighlighted('prop_iced_coffee') ? '#38bdf8' : '#000000'}
                emissiveIntensity={0.4}
                roughness={0.18}
              />
            </mesh>
            <mesh position={[-0.02, 0.21, 0.015]} rotation={[0.4, 0.4, 0.2]}>
              <boxGeometry args={[0.044, 0.044, 0.044]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.1} />
            </mesh>
            <mesh position={[0.025, 0.19, -0.02]} rotation={[0.2, 0.8, 0.5]}>
              <boxGeometry args={[0.042, 0.042, 0.042]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.1} />
            </mesh>
          </group>

          <group name="prop_water_cold" position={[0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.115, 0]} castShadow>
              <cylinderGeometry args={[0.088, 0.078, 0.23, 18]} />
              <meshStandardMaterial
                color="#38bdf8"
                transparent
                opacity={0.74}
                emissive={isHighlighted('prop_water_cold') ? '#38bdf8' : '#000000'}
                emissiveIntensity={0.4}
                roughness={0.12}
              />
            </mesh>
          </group>

          {/* Mystery box hook for Lesson 2 */}
          <group
            name="prop_box_mystery"
            position={[0.42, 0, 0.22]}
            visible={mysteryBoxVisible}
          >
            <group ref={boxRef}>
              <mesh position={[0, 0.11, 0]} castShadow>
                <boxGeometry args={[0.3, 0.22, 0.24]} />
                <meshStandardMaterial color="#d4a373" roughness={0.82} />
              </mesh>
              <mesh position={[0, 0.11, 0]}>
                <boxGeometry args={[0.31, 0.04, 0.25]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.65} />
              </mesh>
              <SteamParticles position={[0, 0.25, 0]} intensity={0.8} />
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
