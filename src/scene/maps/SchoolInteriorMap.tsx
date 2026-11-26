import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import {
  expectedTarget,
  INITIAL,
  isRepeatTap,
  reached,
  tap,
  type SchoolState,
  type SchoolTarget,
} from '../../domain/schoolLesson';
import type { AvatarStyle, SpeechKey, WorldMapId } from '../../domain/types';
import { playRewardFanfare } from '../../services/soundEngine';
import { getCafeTextures } from '../cafeTextures';
import { useMapFrame } from '../mapVisibility';
import { PortalTrigger } from '../PortalTrigger';
import { SCHOOL_EXIT, SCHOOL_OBSTACLES, SCHOOL_TARGETS, SCHOOL_TOWN_RETURN } from '../schoolLayout';
import { StylizedHumanoid } from '../StylizedCharacters';
import { WorldMapBase, type WorldMapBaseRenderApi } from '../WorldMapBase';
import { WORLD_MAP_REGISTRY, type AvatarPose } from '../worldNavigation';
import { HintMarker } from './bakeryProps';
import {
  Backpack,
  Blackboard,
  Easel,
  Globe,
  HomeworkSheet,
  Microscope,
  Notebook,
  Pencil,
  SchoolProp,
  SchoolWindows,
  SpareDesks,
  TestTubes,
  WallClock,
} from './schoolProps';

const HINT_MS = 5000;
const WELCOME_MS = 600;

export interface SchoolInteriorMapProps {
  visible: boolean;
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onExploreObject?: (key: SpeechKey) => void;
  onTravelToMap: (target: WorldMapId, spawn?: AvatarPose) => void;
}

// shortcut: copy of the bakery Target; extract when a third interior needs it or the bakery file is free to edit.
/** A clickable object: generous invisible hit box plus a short wobble after a wrong tap. */
function Target({
  id,
  shake,
  onTap,
  children,
}: {
  id: SchoolTarget;
  shake: number;
  onTap: (id: SchoolTarget) => void;
  children?: ReactNode;
}) {
  const { at, hit } = SCHOOL_TARGETS[id];
  const ref = useRef<THREE.Group>(null);
  const shakeRef = useRef(0);
  useEffect(() => {
    if (shake) shakeRef.current = 1;
  }, [shake]);
  useMapFrame((_, delta) => {
    if (!ref.current) return;
    shakeRef.current = Math.max(0, shakeRef.current - Math.min(delta, 0.05) * 1.8);
    ref.current.rotation.z = Math.sin(shakeRef.current * Math.PI * 6) * 0.18 * shakeRef.current;
  });

  return (
    <group
      position={at}
      onClick={(e) => {
        e.stopPropagation();
        onTap(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, hit[1] / 2, 0]}>
        <boxGeometry args={hit} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={ref}>{children}</group>
    </group>
  );
}

/** Offset from one target's base point to another's, for things that move between them. */
const between = (from: SchoolTarget, to: SchoolTarget, lift: [number, number, number]): [number, number, number] => {
  const a = SCHOOL_TARGETS[from].at;
  const b = SCHOOL_TARGETS[to].at;
  return [b[0] - a[0] + lift[0], b[1] - a[1] + lift[1], b[2] - a[2] + lift[2]];
};

// The board is high on screen: an arrow above its full height would sit under the desktop HUD.
const BOARD_HINT = {
  at: [SCHOOL_TARGETS.board.at[0], SCHOOL_TARGETS.board.at[1], -1.9] as [number, number, number],
  hit: [2.6, 0.6, 0.16] as [number, number, number],
};

// A taken object only rises over its own spot: moved elsewhere, tapping it would name another one.
const TAKEN: [number, number, number] = [0, 0.16, 0];
const SHEET_IN_BAG = between('homework', 'backpack', [0, 0.4, 0]);

export const SchoolInteriorMap = memo(function SchoolInteriorMap({
  visible,
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onExploreObject,
  onTravelToMap,
}: SchoolInteriorMapProps) {
  const textures = useMemo(() => getCafeTextures(), []);

  const [game, setGame] = useState<SchoolState>(INITIAL);
  const [hint, setHint] = useState(false);
  const [wrong, setWrong] = useState<{ target: SchoolTarget; seq: number } | null>(null);
  // Taps read the ref so two quick taps never act on the same stale state.
  const gameRef = useRef(game);
  const waveRef = useRef(0);
  const welcomeRef = useRef(0);
  const lastTapRef = useRef<{ target: SchoolTarget; at: number } | null>(null);
  const exploreRef = useRef(onExploreObject);
  exploreRef.current = onExploreObject;

  useEffect(() => {
    welcomeRef.current = window.setTimeout(() => {
      waveRef.current = 1.6;
      exploreRef.current?.('school_welcome');
    }, WELCOME_MS);
    return () => window.clearTimeout(welcomeRef.current);
    // Once per visit; only refs are read.
  }, []);

  // `game` keeps its identity unless there is progress, so wrong taps do not restart the wait.
  useEffect(() => {
    setHint(false);
    const id = window.setTimeout(() => setHint(true), HINT_MS);
    return () => window.clearTimeout(id);
  }, [game]);

  const handleTap = (target: SchoolTarget, explore: WorldMapBaseRenderApi['onTriggerExplore']) => {
    window.clearTimeout(welcomeRef.current);
    const previous = gameRef.current;
    const wasDone = expectedTarget(previous) === null;
    const now = performance.now();
    if (isRepeatTap(lastTapRef.current, target, wasDone, now)) return;
    lastTapRef.current = { target, at: now };
    const result = tap(previous, target);
    gameRef.current = result.state;
    setGame(result.state);
    if (result.wrong) {
      setWrong((w) => ({ target, seq: (w?.seq ?? 0) + 1 }));
      setHint(true);
    }
    const finished = !wasDone && expectedTarget(result.state) === null;
    const [x, y, z] = SCHOOL_TARGETS[target].at;
    waveRef.current = finished ? 2.8 : 1.6;
    explore(result.say, [x, y + 0.02, z]);
    if (finished) playRewardFanfare();
  };

  const expected = expectedTarget(game);
  const packed = reached(game, 'backpack');
  const handedOut = reached(game, 'homework');

  return (
    <WorldMapBase
      config={WORLD_MAP_REGISTRY.school}
      obstacles={SCHOOL_OBSTACLES}
      visible={visible}
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      teleportRequest={teleportRequest}
      walkSpeed={2.8}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick, onTriggerExplore }) => {
        const target = (id: SchoolTarget, children?: ReactNode) => (
          <Target
            id={id}
            shake={wrong?.target === id ? wrong.seq : 0}
            onTap={(t) => handleTap(t, onTriggerExplore)}
          >
            {children}
          </Target>
        );
        return (
          <group name="Interior_School">
            {/* Pale plank floor */}
            <mesh position={[0, 0, 1.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
              <planeGeometry args={[7, 7.4]} />
              <meshStandardMaterial map={textures.floorPlankColor} bumpMap={textures.floorPlankBump} bumpScale={0.01} roughness={0.8} />
            </mesh>

            {/* Plaster back wall with a painted dado, and low side walls */}
            <mesh position={[0, 1.3, -2.3]} receiveShadow>
              <boxGeometry args={[7.3, 2.6, 0.2]} />
              <meshStandardMaterial color="#f6e3b8" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.23, -2.19]} receiveShadow>
              <boxGeometry args={[7, 0.46, 0.03]} />
              <meshStandardMaterial color="#7fb5a8" roughness={0.85} />
            </mesh>
            {[-3.55, 3.55].map((x) => (
              <mesh key={x} position={[x, 0.55, 1.2]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.1, 7.2]} />
                <meshStandardMaterial color="#a9d0c4" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
              </mesh>
            ))}

            <SchoolProp kind="furniture" />
            <SchoolWindows />
            <Blackboard monday={reached(game, 'board')} />
            <WallClock position={[1.95, 1.7, -2.16]} />
            <SpareDesks />
            <SchoolProp kind="bookStack" position={[-1.55, 0.57, 2.5]} />

            <StylizedHumanoid
              position={SCHOOL_TARGETS.teacher.at}
              scale={1.3}
              shirtColor="#be5a7c"
              skinColor="#c98d66"
              hairColor="#3b2314"
              collarColor="#fdf6ea"
              glasses
              leftHandProp={<SchoolProp kind="teacherBook" rotation={[0.2, 0.3, 0.4]} />}
              waveTimerRef={waveRef}
              blinkOffset={1.1}
            />
            {target('teacher')}
            {target('board')}

            {target('notebook', <Notebook open={reached(game, 'notebook')} />)}
            {target('pencil', <Pencil to={reached(game, 'pencil') ? TAKEN : [0, 0, 0]} />)}
            {target(
              'homework',
              <HomeworkSheet to={packed ? SHEET_IN_BAG : handedOut ? TAKEN : [0, 0, 0]} size={packed ? 0.001 : 1} />,
            )}
            {target('globe', <Globe fast={reached(game, 'globe')} />)}
            {target(
              'science',
              <>
                <group position={[-0.22, 0, 0]} rotation={[0, 0.5, 0]}>
                  <Microscope lightOn={reached(game, 'science')} />
                </group>
                <group position={[0.22, 0, 0.06]}>
                  <TestTubes />
                </group>
              </>,
            )}
            {target('art', <Easel painted={reached(game, 'art')} />)}
            {target('backpack', <Backpack filled={packed} />)}

            {hint && expected && <HintMarker {...(expected === 'board' ? BOARD_HINT : SCHOOL_TARGETS[expected])} />}

            {/* Doormat and exit back to the street */}
            <mesh position={[0, 0.015, SCHOOL_EXIT.position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[1.4, 0.9]} />
              <meshStandardMaterial color="#2a6f62" roughness={1} />
            </mesh>
            <PortalTrigger
              {...SCHOOL_EXIT}
              color="#fbbf24"
              avatarPoseRef={avatarPoseRef}
              enableProximity
              onEnter={() => onTravelToMap('town', { ...SCHOOL_TOWN_RETURN })}
            />
          </group>
        );
      }}
    </WorldMapBase>
  );
});

export default SchoolInteriorMap;
