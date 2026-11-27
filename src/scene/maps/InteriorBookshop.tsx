import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import {
  expectedTarget,
  INITIAL,
  isRepeatTap,
  reached,
  tap,
  type BookshopState,
  type BookshopTarget,
} from '../../domain/bookshopVisit';
import type { AvatarStyle, SpeechKey, WorldMapId } from '../../domain/types';
import { playRewardFanfare } from '../../services/soundEngine';
import { BOOKSHOP_EXIT, BOOKSHOP_OBSTACLES, BOOKSHOP_TARGETS, BOOKSHOP_TOWN_RETURN } from '../bookshopLayout';
import { getCafeTextures } from '../cafeTextures';
import { useMapFrame } from '../mapVisibility';
import { PortalTrigger } from '../PortalTrigger';
import { StylizedHumanoid } from '../StylizedCharacters';
import { toyMaterial } from '../toyKit';
import { armchairGeometry } from '../toyProps';
import { WorldMapBase, type WorldMapBaseRenderApi } from '../WorldMapBase';
import { WORLD_MAP_REGISTRY, type AvatarPose } from '../worldNavigation';
import { HintMarker } from './bakeryProps';
import { Bookcases, BookshopProp, FillerBooks, Ladder, LampLight, Lift, Storybook } from './bookshopProps';
import { Globe, SchoolProp } from './schoolProps';

const HINT_MS = 5000;
const WELCOME_MS = 600;

export interface InteriorBookshopProps {
  visible: boolean;
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onExploreObject?: (key: SpeechKey) => void;
  onTravelToMap: (target: WorldMapId, spawn?: AvatarPose) => void;
}

// shortcut: third copy of the bakery Target; extract when those interior files are free to edit.
/** A clickable object: generous invisible hit box plus a short wobble after a wrong tap. */
function Target({
  id,
  shake,
  onTap,
  children,
}: {
  id: BookshopTarget;
  shake: number;
  onTap: (id: BookshopTarget) => void;
  children?: ReactNode;
}) {
  const { at, hit } = BOOKSHOP_TARGETS[id];
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

export const InteriorBookshop = memo(function InteriorBookshop({
  visible,
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onExploreObject,
  onTravelToMap,
}: InteriorBookshopProps) {
  const textures = useMemo(() => getCafeTextures(), []);

  const [game, setGame] = useState<BookshopState>(INITIAL);
  const [hint, setHint] = useState(false);
  const [wrong, setWrong] = useState<{ target: BookshopTarget; seq: number } | null>(null);
  // Taps read the ref so two quick taps never act on the same stale state.
  const gameRef = useRef(game);
  const waveRef = useRef(0);
  const welcomeRef = useRef(0);
  const lastTapRef = useRef<{ target: BookshopTarget; at: number } | null>(null);
  const exploreRef = useRef(onExploreObject);
  exploreRef.current = onExploreObject;

  useEffect(() => {
    welcomeRef.current = window.setTimeout(() => {
      waveRef.current = 1.6;
      exploreRef.current?.('bookshop_welcome');
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

  const handleTap = (target: BookshopTarget, explore: WorldMapBaseRenderApi['onTriggerExplore']) => {
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
    const [x, y, z] = BOOKSHOP_TARGETS[target].at;
    waveRef.current = finished ? 2.8 : 1.6;
    explore(result.say, [x, y + 0.02, z]);
    if (finished) playRewardFanfare();
  };

  const expected = expectedTarget(game);

  return (
    <WorldMapBase
      config={WORLD_MAP_REGISTRY.interior_bookshop}
      obstacles={BOOKSHOP_OBSTACLES}
      visible={visible}
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      teleportRequest={teleportRequest}
      walkSpeed={2.8}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick, onTriggerExplore }) => {
        const target = (id: BookshopTarget, children?: ReactNode) => (
          <Target
            id={id}
            shake={wrong?.target === id ? wrong.seq : 0}
            onTap={(t) => handleTap(t, onTriggerExplore)}
          >
            {children}
          </Target>
        );
        return (
          <group name="Interior_Bookshop">
            {/* Plank floor and the reading-corner rug */}
            <mesh position={[0, 0, 1.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
              <planeGeometry args={[7, 7.4]} />
              <meshStandardMaterial map={textures.floorPlankColor} bumpMap={textures.floorPlankBump} bumpScale={0.01} roughness={0.8} />
            </mesh>
            <mesh position={[2.3, 0.008, -0.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
              <circleGeometry args={[1.1, 36]} />
              <meshStandardMaterial color="#a4473a" roughness={1} />
            </mesh>

            {/* Plaster back wall and low green side walls */}
            <mesh position={[0, 1.3, -2.3]} receiveShadow>
              <boxGeometry args={[7.3, 2.6, 0.2]} />
              <meshStandardMaterial color="#e9dcc0" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
            </mesh>
            {[-3.55, 3.55].map((x) => (
              <mesh key={x} position={[x, 0.55, 1.2]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.1, 7.2]} />
                <meshStandardMaterial color="#6f9e83" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
              </mesh>
            ))}

            <Bookcases />
            <FillerBooks />
            <Ladder />
            <BookshopProp kind="furniture" />
            <mesh geometry={armchairGeometry('#2f6f62')} material={toyMaterial()} position={[2.55, 0, -1.2]} rotation={[0, 1.15, 0]} scale={1.1} castShadow receiveShadow />
            <LampLight />
            <BookshopProp kind="stock" position={[2.15, 0.4, 1.5]} />
            <BookshopProp kind="magnifier" position={[2.18, 0.4, 1.76]} rotation={[0, -0.4, 0]} gloss />
            <SchoolProp kind="backpack" position={[-2.1, 0, 1.45]} rotation={[0, 0.35, 0]} />

            <StylizedHumanoid
              position={BOOKSHOP_TARGETS.librarian.at}
              scale={1.3}
              shirtColor="#d97706"
              skinColor="#f0bfa0"
              hairColor="#57534e"
              glasses
              glassesColor="#78350f"
              waveTimerRef={waveRef}
              blinkOffset={2.2}
            />
            {target('librarian')}

            {target(
              'book',
              <Lift by={reached(game, 'book') ? 0.04 : 0}>
                <BookshopProp kind="book" gloss />
              </Lift>,
            )}
            {target(
              'notebook',
              <Lift by={reached(game, 'notebook') ? 0.16 : 0}>
                <BookshopProp kind="notebook" />
              </Lift>,
            )}
            {target(
              'pen',
              <Lift by={reached(game, 'pen') ? 0.16 : 0}>
                <BookshopProp kind="pen" rotation={[0, 0.4, 0]} gloss />
              </Lift>,
            )}
            {target('pencil', <SchoolProp kind="pencil" rotation={[0, -0.4, 0]} scale={[1.6, 1.6, 1.12]} />)}
            {target('storybook', <Storybook turned={reached(game, 'storybook')} />)}
            {target('globe', <Globe fast={false} />)}

            {hint && expected && <HintMarker {...BOOKSHOP_TARGETS[expected]} />}

            {/* Doormat and exit back to the street */}
            <mesh position={[0, 0.015, BOOKSHOP_EXIT.position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[1.4, 0.9]} />
              <meshStandardMaterial color="#1f7a43" roughness={1} />
            </mesh>
            <PortalTrigger
              {...BOOKSHOP_EXIT}
              color="#fbbf24"
              avatarPoseRef={avatarPoseRef}
              enableProximity
              onEnter={() => onTravelToMap('town', { ...BOOKSHOP_TOWN_RETURN })}
            />
          </group>
        );
      }}
    </WorldMapBase>
  );
});

export default InteriorBookshop;
