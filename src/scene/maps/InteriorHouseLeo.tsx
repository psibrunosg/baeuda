import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import {
  expectedTarget,
  finish,
  initialState,
  isRepeatTap,
  ROUTINE,
  tapPerson,
  tapTarget,
  type FamilyPerson,
  type FamilyState,
  type FamilyTarget,
  type FamilyTime,
} from '../../domain/familyRoutine';
import type { AvatarStyle, SpeechKey, WorldMapId } from '../../domain/types';
import { playRewardFanfare } from '../../services/soundEngine';
import { getCafeGeometries } from '../cafeGeometries';
import { getCafeTextures } from '../cafeTextures';
import {
  EAST_DOOR,
  EAST_WALL_X,
  FAMILY_PEOPLE,
  FAMILY_TARGETS,
  HOUSE_EXIT,
  HOUSE_OBSTACLES,
  HOUSE_TOWN_RETURN,
  TV_SPOT,
} from '../familyHomeLayout';
import { PortalTrigger } from '../PortalTrigger';
import { StylizedHumanoid } from '../StylizedCharacters';
import { WorldMapBase, type WorldMapBaseRenderApi } from '../WorldMapBase';
import { WORLD_MAP_REGISTRY, type AvatarPose } from '../worldNavigation';
import { HintMarker } from './bakeryProps';
import {
  Barbecue,
  CookingPot,
  Fence,
  GlassDoor,
  KitchenFloor,
  StudyDesk,
  Swing,
  TapArea,
  Television,
  WallClock,
  WashingMachine,
} from './familyHomeProps';

const HINT_MS = 5000;
const DONE_MS = 4000;

const SKY: Record<FamilyTime, { color: string; emissive: string }> = {
  morning: { color: '#bae6fd', emissive: '#fef3c7' },
  afternoon: { color: '#fdba74', emissive: '#ea580c' },
  night: { color: '#1e3a5f', emissive: '#1e3a8a' },
};

const isPerson = (id: FamilyPerson | FamilyTarget): id is FamilyPerson => id in FAMILY_PEOPLE;
const spotOf = (id: FamilyPerson | FamilyTarget) => (isPerson(id) ? FAMILY_PEOPLE[id] : FAMILY_TARGETS[id]);

export interface InteriorHouseLeoProps {
  visible: boolean;
  timeOfDay?: 'day' | 'night';
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onExploreObject?: (key: SpeechKey) => void;
  onInspectCuriosity?: (curiosityId: string) => void;
  onOpenWardrobe?: () => void;
  onTravelToMap: (target: WorldMapId, spawn?: AvatarPose) => void;
}

export const InteriorHouseLeo = memo(function InteriorHouseLeo({
  visible,
  timeOfDay = 'day',
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onExploreObject,
  onInspectCuriosity,
  onOpenWardrobe,
  onTravelToMap,
}: InteriorHouseLeoProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const geos = useMemo(() => getCafeGeometries(), []);
  const [lampOn, setLampOn] = useState(true);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [routine, setRoutine] = useState<FamilyState>(() => initialState(timeOfDay));
  const [hint, setHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  // Taps read the ref so two quick taps never act on the same stale state.
  const routineRef = useRef(routine);
  const waveRef = useRef(0);
  const lastTapRef = useRef<{ target: string; at: number } | null>(null);

  const commit = (next: FamilyState) => {
    routineRef.current = next;
    setRoutine(next);
  };

  // `routine` keeps its identity unless there is progress, so wrong taps do not restart the wait.
  useEffect(() => {
    setHint(false);
    const id = window.setTimeout(() => setHint(true), HINT_MS);
    return () => window.clearTimeout(id);
  }, [routine]);

  useEffect(() => {
    if (routine.step !== ROUTINE.length) return;
    const id = window.setTimeout(() => commit(finish(routineRef.current)), DONE_MS);
    return () => window.clearTimeout(id);
  }, [routine.step]);

  const handleTap = (id: FamilyPerson | FamilyTarget, explore: WorldMapBaseRenderApi['onTriggerExplore']) => {
    const now = performance.now();
    if (isRepeatTap(lastTapRef.current, id, now)) return;
    lastTapRef.current = { target: id, at: now };
    const previous = routineRef.current;
    const result = isPerson(id) ? tapPerson(previous, id) : tapTarget(previous, id);
    commit(result.state);
    if (result.wrong) setHint(true);
    const done = result.state.step === ROUTINE.length && previous.step !== ROUTINE.length;
    if (done) {
      setCompleted(true);
      playRewardFanfare();
    }
    // Mom says every line except the other people's introductions.
    if (id !== 'grandma' && id !== 'brother') waveRef.current = done ? 2.8 : 1.6;
    const [x, y, z] = spotOf(id).at;
    explore(result.say, [x, y + 0.04, z]);
  };
  const expected = expectedTarget(routine);

  const config = WORLD_MAP_REGISTRY.interior_house_leo;
  const setPointer = () => {
    document.body.style.cursor = 'pointer';
  };
  const clearPointer = () => {
    document.body.style.cursor = 'auto';
  };

  return (
    <WorldMapBase
      config={config}
      obstacles={HOUSE_OBSTACLES}
      visible={visible}
      weather="sunny"
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      teleportRequest={teleportRequest}
      walkSpeed={2.8}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick, onTriggerExplore }) => {
        const family = (id: FamilyPerson | FamilyTarget, children?: ReactNode) => (
          <TapArea {...spotOf(id)} onTap={() => handleTap(id, onTriggerExplore)}>
            {children}
          </TapArea>
        );
        return (
          <group name="Interior_House_Leo">
            {/* Warm hardwood floor */}
            <RoundedBox
              args={[11.6, 0.16, 8.6]}
              radius={0.05}
              smoothness={2}
              position={[0, -0.06, 0]}
              receiveShadow
              onClick={onGroundWalkClick}
            >
              <meshStandardMaterial
                color="#c89d72"
                bumpMap={textures.woodCounterBump}
                bumpScale={0.012}
                roughness={0.82}
              />
            </RoundedBox>

            {/* Cutaway Plaster Walls (North, West, East) */}
            <RoundedBox args={[11.8, 2.6, 0.28]} radius={0.04} smoothness={2} position={[0, 1.3, -4.2]} castShadow receiveShadow>
              <meshStandardMaterial color="#f5ebd8" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.88} />
            </RoundedBox>
            <RoundedBox args={[0.28, 2.6, 8.6]} radius={0.04} smoothness={2} position={[-5.75, 1.3, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#efe2cb" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.88} />
            </RoundedBox>
            {/* Low east wall with the doorway to the backyard */}
            {[
              [-4.3, EAST_DOOR.minZ],
              [EAST_DOOR.maxZ, 4.3],
            ].map(([from, to]) => (
              <mesh key={from} position={[EAST_WALL_X, 0.6, (from + to) / 2]} castShadow receiveShadow>
                <boxGeometry args={[0.28, 1.2, to - from]} />
                <meshStandardMaterial color="#efe2cb" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.88} />
              </mesh>
            ))}
            <GlassDoor />

            {/* Subtle room divider half-wall between Bedroom & Kitchen */}
            <RoundedBox args={[0.2, 1.25, 2.4]} radius={0.03} smoothness={2} position={[0.2, 0.62, -2.9]} castShadow receiveShadow>
              <meshStandardMaterial color="#e7dac5" roughness={0.86} />
            </RoundedBox>

            {/* North Wall Windows reflecting Day/Night outside */}
            {[-3.4, 2.6].map((wx, idx) => (
              <group key={idx} position={[wx, 1.55, -4.04]}>
                <RoundedBox args={[1.3, 0.95, 0.08]} radius={0.02} smoothness={2}>
                  <meshStandardMaterial color="#7a4e32" roughness={0.8} />
                </RoundedBox>
                <mesh position={[0, 0, 0.045]}>
                  <planeGeometry args={[1.12, 0.78]} />
                  <meshStandardMaterial
                    {...SKY[routine.time]}
                    emissiveIntensity={routine.time === 'night' ? 0.4 : 0.35}
                  />
                </mesh>
              </group>
            ))}

            {/* Woven Living Room Rug */}
            <mesh position={[-3.3, 0.03, 1.85]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
              <planeGeometry args={[3.4, 2.5]} />
              <meshStandardMaterial color="#d97757" roughness={0.95} />
            </mesh>
            <mesh position={[-3.3, 0.034, 1.85]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
              <planeGeometry args={[2.9, 2.0]} />
              <meshStandardMaterial color="#f6e7cc" roughness={0.95} />
            </mesh>

            {/* ===== BEDROOM (NORTHWEST) ===== */}
            {/* Cozy Bed (curiosity: home_bed) */}
            <group
              position={[-3.8, 0.04, -2.5]}
              onClick={(e) => {
                e.stopPropagation();
                onInspectCuriosity?.('home_bed');
                onTriggerExplore('home_bed', [-3.8, 0.08, -1.35]);
              }}
              onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
              onPointerOut={clearPointer}
            >
              <RoundedBox args={[1.9, 0.38, 1.65]} radius={0.06} smoothness={2} position={[0, 0.22, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#7a4e32" roughness={0.82} />
              </RoundedBox>
              <RoundedBox args={[1.76, 0.28, 1.52]} radius={0.08} smoothness={2} position={[0, 0.44, 0.04]} castShadow>
                <meshStandardMaterial color="#2a6f62" roughness={0.9} />
              </RoundedBox>
              {/* Pillows */}
              {[-0.42, 0.42].map((px, i) => (
                <RoundedBox key={i} args={[0.62, 0.16, 0.38]} radius={0.06} smoothness={2} position={[px, 0.62, -0.45]} castShadow>
                  <meshStandardMaterial color="#fffbeb" roughness={0.9} />
                </RoundedBox>
              ))}
              {/* Headboard */}
              <RoundedBox args={[1.95, 0.95, 0.14]} radius={0.04} smoothness={2} position={[0, 0.52, -0.78]} castShadow>
                <meshStandardMaterial color="#6b4226" roughness={0.8} />
              </RoundedBox>
            </group>

            {/* Wooden Wardrobe (opens Avatar Customizer!) */}
            <group
              position={[-1.6, 0.04, -2.9]}
              onClick={(e) => {
                e.stopPropagation();
                onTriggerExplore('home_wardrobe', [-1.6, 0.08, -2.1]);
                onOpenWardrobe?.();
              }}
              onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
              onPointerOut={clearPointer}
            >
              <RoundedBox args={[1.2, 1.75, 0.78]} radius={0.04} smoothness={2} position={[0, 0.88, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b5a3c" roughness={0.78} />
              </RoundedBox>
              {[-0.12, 0.12].map((hx, i) => (
                <mesh key={i} position={[hx, 0.92, 0.41]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.25} />
                </mesh>
              ))}
            </group>

            {/* ===== KITCHEN (NORTHEAST) ===== */}
            {/* Kitchen Counter + Kettle (curiosity: home_kettle) */}
            <group position={[2.4, 0.04, -2.9]}>
              <RoundedBox args={[2.5, 0.82, 0.95]} radius={0.04} smoothness={2} position={[0, 0.41, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5ebd8" roughness={0.8} />
              </RoundedBox>
              <RoundedBox args={[2.58, 0.08, 1.02]} radius={0.02} smoothness={2} position={[0, 0.84, 0]} castShadow>
                <meshStandardMaterial color="#9c6644" roughness={0.7} />
              </RoundedBox>
              {/* Stove burners */}
              {[-0.6, -0.2].map((bx, i) => (
                <mesh key={i} position={[bx, 0.89, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.14, 14]} />
                  <meshStandardMaterial color="#27272a" roughness={0.5} />
                </mesh>
              ))}
              {/* Clickable Kettle */}
              <group
                position={[-0.6, 0.98, 0.05]}
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectCuriosity?.('home_kettle');
                  onTriggerExplore('home_kettle', [1.8, 0.08, -2.0]);
                }}
                onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
                onPointerOut={clearPointer}
              >
                <mesh castShadow>
                  <sphereGeometry args={[0.16, 14, 14]} />
                  <meshStandardMaterial color="#dc2626" roughness={0.28} metalness={0.35} />
                </mesh>
                <mesh position={[0, 0.17, 0]}>
                  <torusGeometry args={[0.09, 0.02, 8, 14, Math.PI]} />
                  <meshStandardMaterial color="#27272a" roughness={0.5} />
                </mesh>
              </group>
              {/* Sink basin */}
              <mesh position={[0.68, 0.89, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.64, 0.46]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.25} />
              </mesh>
            </group>

            {/* Retro Mint Fridge (curiosity: home_fridge) */}
            <group
              position={[4.35, 0.04, -2.7]}
              onClick={(e) => {
                e.stopPropagation();
                setFridgeOpen((prev) => !prev);
                onInspectCuriosity?.('home_fridge');
                onTriggerExplore('home_fridge', [4.35, 0.08, -1.85]);
              }}
              onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
              onPointerOut={clearPointer}
            >
              <RoundedBox args={[0.98, 1.72, 0.92]} radius={0.07} smoothness={3} position={[0, 0.86, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#a7f3d0" roughness={0.32} metalness={0.15} />
              </RoundedBox>
              <RoundedBox
                args={[0.92, 1.56, 0.08]}
                radius={0.04}
                smoothness={2}
                position={[fridgeOpen ? 0.38 : 0, 0.86, fridgeOpen ? 0.62 : 0.48]}
                rotation={[0, fridgeOpen ? 0.65 : 0, 0]}
                castShadow
              >
                <meshStandardMaterial color="#6ee7b7" roughness={0.3} />
              </RoundedBox>
            </group>

            {/* ===== LIVING ROOM (WEST & EAST) ===== */}
            {/* Plush Teal Sofa (curiosity: home_sofa) */}
            <group
              position={[-3.8, 0.04, 1.2]}
              onClick={(e) => {
                e.stopPropagation();
                onInspectCuriosity?.('home_sofa');
                onTriggerExplore('home_sofa', [-3.8, 0.08, 2.0]);
              }}
              onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
              onPointerOut={clearPointer}
            >
              <RoundedBox args={[1.95, 0.44, 0.88]} radius={0.08} smoothness={2} position={[0, 0.24, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#0f766e" roughness={0.86} />
              </RoundedBox>
              <RoundedBox args={[1.95, 0.56, 0.24]} radius={0.07} smoothness={2} position={[0, 0.62, -0.34]} castShadow>
                <meshStandardMaterial color="#115e59" roughness={0.86} />
              </RoundedBox>
              {[-0.9, 0.9].map((ax, i) => (
                <RoundedBox key={i} args={[0.2, 0.5, 0.88]} radius={0.06} smoothness={2} position={[ax, 0.42, 0]} castShadow>
                  <meshStandardMaterial color="#115e59" roughness={0.86} />
                </RoundedBox>
              ))}
            </group>

            {/* Coffee Table with Leo's Ceramic Mug */}
            <group position={[-3.6, 0.04, 2.35]}>
              <RoundedBox args={[1.1, 0.08, 0.64]} radius={0.025} smoothness={2} position={[0, 0.36, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b5a3c" roughness={0.76} />
              </RoundedBox>
              <mesh geometry={geos.mug} position={[0.18, 0.4, 0.04]} scale={0.75} castShadow>
                <meshStandardMaterial color="#c9563c" roughness={0.32} />
              </mesh>
            </group>

            {/* Interactive Standing Lamp (Parallel Talk: Turn on / Turn off) */}
            <group
              position={[-2.2, 0.04, 1.0]}
              onClick={(e) => {
                e.stopPropagation();
                const next = !lampOn;
                setLampOn(next);
                onTriggerExplore(next ? 'home_lamp_on' : 'home_lamp_off', [-2.2, 0.08, 1.45]);
              }}
              onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
              onPointerOut={clearPointer}
            >
              <mesh position={[0, 0.72, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.05, 1.44, 10]} />
                <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, 1.5, 0]} castShadow>
                <coneGeometry args={[0.28, 0.34, 14]} />
                <meshStandardMaterial
                  color={lampOn ? '#fef3c7' : '#cbd5e1'}
                  emissive="#fbbf24"
                  emissiveIntensity={lampOn ? 1.45 : 0}
                  roughness={0.4}
                />
              </mesh>
            </group>

            {/* Tall Bookshelf (East wall) */}
            <group
              position={[4.4, 0.04, 2.4]}
              onClick={(e) => {
                e.stopPropagation();
                onTriggerExplore('home_bookshelf', [3.6, 0.08, 2.4]);
              }}
              onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
              onPointerOut={clearPointer}
            >
              <RoundedBox args={[0.68, 1.85, 1.95]} radius={0.04} smoothness={2} position={[0, 0.92, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#7a4e32" roughness={0.82} />
              </RoundedBox>
              {[-0.55, 0, 0.55].map((bz, idx) => (
                <RoundedBox key={idx} args={[0.2, 0.28, 0.36]} radius={0.02} smoothness={2} position={[-0.28, 1.25, bz]}>
                  <meshStandardMaterial color={idx === 0 ? '#ef4444' : idx === 1 ? '#2563eb' : '#16a34a'} roughness={0.65} />
                </RoundedBox>
              ))}
            </group>

            {/* ===== FAMILY ROUTINE ===== */}
            <KitchenFloor onClick={onGroundWalkClick} />
            <CookingPot position={[2.2, 0.93, -2.85]} />
            {/* Bed and stove only take taps during the routine; otherwise the curiosities stay */}
            {routine.step !== null && (
              <>
                {family('bed')}
                {family('stove')}
              </>
            )}
            {family('clock', <WallClock position={[0, 0.55, -0.08]} time={routine.time} />)}
            {family('washer', <WashingMachine />)}
            {family('desk', <StudyDesk />)}
            {family(
              'mother',
              <StylizedHumanoid scale={1.25} shirtColor="#d9694f" apronColor="#fdf0d5" hairColor="#5b3420" waveTimerRef={waveRef} />,
            )}
            {family(
              'grandma',
              <StylizedHumanoid scale={1.2} shirtColor="#7c6bb0" hairColor="#cbd5e1" glasses blinkOffset={1.4} />,
            )}
            {family('brother', <StylizedHumanoid scale={0.95} shirtColor="#2563eb" blinkOffset={2.3} />)}

            {hint && expected && <HintMarker {...FAMILY_TARGETS[expected]} />}
            {routine.step === null && !completed && <HintMarker {...FAMILY_PEOPLE.mother} />}

            <TapArea
              {...TV_SPOT}
              onTap={() => onTriggerExplore('family_tv', [-3.5, 0.08, 0.2])}
            >
              <group rotation={[0, Math.PI / 4, 0]}>
                <Television />
              </group>
            </TapArea>

            {/* ===== BACKYARD ===== */}
            <mesh position={[7.75, -0.06, 0]} receiveShadow onClick={onGroundWalkClick}>
              <boxGeometry args={[3.9, 0.16, 8.6]} />
              <meshStandardMaterial color="#7cb35c" roughness={0.95} />
            </mesh>
            <Fence />
            <TapArea
              at={[8.0, 0.02, -2.4]}
              hit={[1.8, 1.6, 0.8]}
              onTap={() => onTriggerExplore('family_swing', [8.0, 0.08, -1.6])}
            >
              <Swing />
            </TapArea>
            <TapArea
              at={[8.3, 0.02, 2.0]}
              hit={[1.85, 1.0, 0.8]}
              onTap={() => onTriggerExplore('family_grill', [8.3, 0.08, 2.8])}
            >
              <Barbecue />
            </TapArea>

            {/* Welcome Mat + Exit Door Portal back to Baeuda Town */}
            <mesh position={[0, 0.035, 3.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[1.3, 0.72]} />
              <meshStandardMaterial color="#c49563" roughness={0.92} />
            </mesh>
            <PortalTrigger
              {...HOUSE_EXIT}
              color="#fbbf24"
              avatarPoseRef={avatarPoseRef}
              enableProximity
              onEnter={() =>
                onTravelToMap('town', { ...HOUSE_TOWN_RETURN })
              }
            />
          </group>
        );
      }}
    </WorldMapBase>
  );
});

export default InteriorHouseLeo;
