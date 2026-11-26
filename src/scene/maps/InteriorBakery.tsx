import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import {
  baked,
  BASKET_ORDER,
  expectedTarget,
  INITIAL,
  isRepeatTap,
  tap,
  type BakeryState,
  type BakeryTarget,
} from '../../domain/bakeryBasket';
import type { AvatarStyle, SpeechKey, WorldMapId } from '../../domain/types';
import { playRewardFanfare } from '../../services/soundEngine';
import { BAKERY_BASKET_AT, BAKERY_EXIT, BAKERY_TARGETS, BAKERY_TOWN_RETURN } from '../bakeryLayout';
import { getCafeTextures } from '../cafeTextures';
import { useMapFrame } from '../mapVisibility';
import { PortalTrigger } from '../PortalTrigger';
import { StylizedHumanoid } from '../StylizedCharacters';
import { WorldMapBase, type WorldMapBaseRenderApi } from '../WorldMapBase';
import { lotBox, WORLD_MAP_REGISTRY, type Aabb, type AvatarPose } from '../worldNavigation';
import { getWorldGeometries } from '../worldGeometries';
import { Basket, BrassBell, BreadShelf, FlourSack, HintMarker, Prop, Steam } from './bakeryProps';

const BAKE_MS = 3500;
const HINT_MS = 5000;
const WELCOME_MS = 600;

export interface InteriorBakeryProps {
  visible: boolean;
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onExploreObject?: (key: SpeechKey) => void;
  onTravelToMap: (target: WorldMapId, spawn?: AvatarPose) => void;
}

const BAKERY_OBSTACLES: readonly Aabb[] = [
  lotBox(0, -0.95, 3.4, 2.15), // counter, display case and the whole staff side
  lotBox(-2.75, 1.6, 0.35, 0.35), // flour sacks
  lotBox(2.75, 1.6, 0.35, 0.35),
];

const noRaycast = () => null;

/** A clickable counter object: generous invisible hit box plus a short wobble after a wrong tap. */
function Target({
  id,
  shake,
  onTap,
  children,
}: {
  id: BakeryTarget;
  shake: number;
  onTap: (id: BakeryTarget) => void;
  children?: ReactNode;
}) {
  const { at, hit } = BAKERY_TARGETS[id];
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

export const InteriorBakery = memo(function InteriorBakery({
  visible,
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onExploreObject,
  onTravelToMap,
}: InteriorBakeryProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  const worldGeos = useMemo(() => getWorldGeometries(), []);
  // Cloned so the wall repeat does not change the shared brick texture.
  const wallBrick = useMemo(() => {
    const clone = (source: THREE.Texture | null) => {
      if (!source) return null;
      const copy = source.clone();
      copy.repeat.set(3, 2);
      copy.needsUpdate = true;
      return copy;
    };
    return { color: clone(textures.brickColor), bump: clone(textures.brickBump) };
  }, [textures]);
  useEffect(
    () => () => {
      wallBrick.color?.dispose();
      wallBrick.bump?.dispose();
    },
    [wallBrick],
  );

  const [game, setGame] = useState<BakeryState>(INITIAL);
  const [hint, setHint] = useState(false);
  const [wrong, setWrong] = useState<{ target: BakeryTarget; seq: number } | null>(null);
  // Taps read the ref so two quick taps never act on the same stale state.
  const gameRef = useRef(game);
  const waveRef = useRef(0);
  const welcomeRef = useRef(0);
  const lastTapRef = useRef<{ target: BakeryTarget; at: number } | null>(null);
  const exploreRef = useRef(onExploreObject);
  exploreRef.current = onExploreObject;

  const commit = (next: BakeryState) => {
    gameRef.current = next;
    setGame(next);
  };
  const say = (key: SpeechKey) => {
    waveRef.current = 1.6;
    exploreRef.current?.(key);
  };

  useEffect(() => {
    welcomeRef.current = window.setTimeout(() => say('bakery_welcome'), WELCOME_MS);
    return () => window.clearTimeout(welcomeRef.current);
    // Once per visit; `say` only touches refs.
  }, []);

  useEffect(() => {
    if (game.stage !== 'baking') return;
    const id = window.setTimeout(() => {
      const result = baked(gameRef.current);
      commit(result.state);
      if (result.say) say(result.say);
    }, BAKE_MS);
    return () => window.clearTimeout(id);
  }, [game.stage]);

  // `game` keeps its identity unless there is progress, so wrong taps do not restart the wait.
  useEffect(() => {
    setHint(false);
    const id = window.setTimeout(() => setHint(true), HINT_MS);
    return () => window.clearTimeout(id);
  }, [game]);

  const handleTap = (target: BakeryTarget, explore: WorldMapBaseRenderApi['onTriggerExplore']) => {
    window.clearTimeout(welcomeRef.current);
    const previous = gameRef.current;
    const now = performance.now();
    if (isRepeatTap(lastTapRef.current, target, previous.stage, now)) return;
    lastTapRef.current = { target, at: now };
    const result = tap(previous, target);
    commit(result.state);
    if (result.wrong) {
      setWrong((w) => ({ target, seq: (w?.seq ?? 0) + 1 }));
      setHint(true);
    }
    const [x, y, z] = BAKERY_TARGETS[target].at;
    waveRef.current = result.state.stage === 'done' ? 2.8 : 1.6;
    explore(result.say, [x, y + 0.02, z]);
    if (result.state.stage === 'done' && previous.stage !== 'done') playRewardFanfare();
  };

  const { stage, packed } = game;
  const expected = expectedTarget(game);
  const loafInOven = stage === 'baking' || stage === 'ready';
  const loafOnTray = stage === 'basket' && packed === 0;
  const ovenX = BAKERY_TARGETS.oven.at[0];
  const config = WORLD_MAP_REGISTRY.interior_bakery;

  return (
    <WorldMapBase
      config={config}
      obstacles={BAKERY_OBSTACLES}
      visible={visible}
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      teleportRequest={teleportRequest}
      walkSpeed={2.8}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick, onTriggerExplore }) => {
        const target = (id: BakeryTarget, children?: ReactNode) => (
          <Target
            id={id}
            shake={wrong?.target === id ? wrong.seq : 0}
            onTap={(t) => handleTap(t, onTriggerExplore)}
          >
            {children}
          </Target>
        );
        return (
          <group name="Interior_Bakery">
            {/* Plank floor */}
            <mesh position={[0, 0, 0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
              <planeGeometry args={[7, 7.4]} />
              <meshStandardMaterial map={textures.floorPlankColor} bumpMap={textures.floorPlankBump} bumpScale={0.01} roughness={0.8} />
            </mesh>

            {/* Exposed brick back wall and low plaster side walls */}
            <mesh position={[0, 1.35, -2.75]} receiveShadow>
              <boxGeometry args={[7, 2.7, 0.2]} />
              <meshStandardMaterial color="#d98b66" map={wallBrick.color} bumpMap={wallBrick.bump} bumpScale={0.025} roughness={0.9} />
            </mesh>
            {[-3.55, 3.55].map((x) => (
              <mesh key={x} position={[x, 0.7, 0.9]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.4, 7.4]} />
                <meshStandardMaterial color="#f0dfc0" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
              </mesh>
            ))}

            {/* Oak shelves */}
            <BreadShelf position={[1.6, 1.32, -2.48]} width={2.1} />
            <BreadShelf position={[1.6, 1.92, -2.48]} width={2.1} />
            <BreadShelf position={[-2.82, 1.5, -2.48]} width={1.1} />

            {/* Deck oven: stone plinth, brick body, arched mouth */}
            <group position={[ovenX, 0, 0]}>
              <mesh position={[0, 0.25, -2.27]} castShadow receiveShadow>
                <boxGeometry args={[1.52, 0.5, 0.76]} />
                <meshStandardMaterial color="#cfc2ad" map={textures.marbleColor} roughness={0.85} />
              </mesh>
              <mesh position={[0, 1.075, -2.29]} castShadow receiveShadow>
                <boxGeometry args={[1.42, 1.15, 0.72]} />
                <meshStandardMaterial color="#b65a3c" map={textures.brickColor} bumpMap={textures.brickBump} bumpScale={0.02} roughness={0.88} />
              </mesh>
              <mesh position={[0.35, 2.15, -2.45]} castShadow>
                <boxGeometry args={[0.34, 1.0, 0.34]} />
                <meshStandardMaterial color="#8f4f3c" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.81, -1.915]}>
                <planeGeometry args={[0.66, 0.54]} />
                {/* above the Bloom threshold only while baking */}
                <meshStandardMaterial
                  color="#3b1206"
                  emissive="#ffa53a"
                  emissiveIntensity={stage === 'baking' ? 2.8 : stage === 'ready' ? 1.2 : 0.7}
                />
              </mesh>
              <mesh geometry={worldGeos.ovenArchFrame} position={[0, 0.5, -1.9]} scale={0.68} castShadow receiveShadow>
                <meshStandardMaterial color="#d97a58" map={textures.brickColor} bumpMap={textures.brickBump} bumpScale={0.022} roughness={0.85} />
              </mesh>
              {loafInOven && <Prop kind="loaf" position={[0, 0.55, -1.8]} />}
              {stage === 'baking' && <Steam position={[0, 1.2, -1.62]} size={0.17} rise={0.9} />}
              {stage === 'ready' && <Steam position={[0, 0.78, -1.68]} size={0.09} rise={0.5} />}
            </group>

            {/* Work table with the baker's peel and the dough */}
            <group position={[BAKERY_TARGETS.dough.at[0], 0, BAKERY_TARGETS.dough.at[2]]}>
              <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.1, 0.08, 0.84]} />
                <meshStandardMaterial map={textures.woodCounterColor} bumpMap={textures.woodCounterBump} bumpScale={0.012} roughness={0.75} />
              </mesh>
              {[-0.46, 0.46].flatMap((x) =>
                [-0.32, 0.32].map((z) => (
                  <mesh key={`${x}:${z}`} position={[x, 0.27, z]} castShadow>
                    <boxGeometry args={[0.09, 0.54, 0.09]} />
                    <meshStandardMaterial color="#6b4226" roughness={0.85} />
                  </mesh>
                )),
              )}
            </group>
            {target(
              'dough',
              <>
                <Prop kind="peel" position={[0, 0, 0.02]} />
                {stage === 'dough' && <Prop kind="dough" position={[0, 0.025, 0.02]} scale={1.15} />}
              </>,
            )}
            {target('oven')}

            {/* Baker on a small step behind the counter */}
            <mesh position={[0, 0.1, -0.95]}>
              <boxGeometry args={[0.8, 0.2, 0.5]} />
              <meshStandardMaterial color="#6b4226" roughness={0.9} />
            </mesh>
            <StylizedHumanoid
              position={[0, 0.2, -0.95]}
              scale={1.3}
              shirtColor="#fffaf2"
              skinColor="#f0bfa0"
              apronColor="#c86b45"
              collarColor="#b45309"
              hat="toque"
              waveTimerRef={waveRef}
              blinkOffset={0.3}
            />
            {target('baker')}

            {/* Counter */}
            <mesh position={[0, 0.28, 0.14]} castShadow receiveShadow>
              <boxGeometry args={[4, 0.56, 1.16]} />
              <meshStandardMaterial color="#c98f62" map={textures.woodCrateColor} bumpMap={textures.woodCrateBump} bumpScale={0.01} roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.59, 0.15]} castShadow receiveShadow>
              <boxGeometry args={[4.12, 0.06, 1.28]} />
              <meshStandardMaterial map={textures.woodCounterColor} bumpMap={textures.woodCounterBump} bumpScale={0.012} roughness={0.6} />
            </mesh>

            {/* Curved glass display case on the front; the glass never takes taps */}
            <mesh position={[0, 0.2, 0.91]} receiveShadow>
              <boxGeometry args={[4, 0.06, 0.4]} />
              <meshStandardMaterial color="#6b4226" roughness={0.8} />
            </mesh>
            {[-1.6, -0.8, 0, 0.8, 1.6].map((x, i) => (
              <Prop key={x} kind={i % 2 ? 'slicePlate' : 'croissantPlate'} position={[x, 0.23, 0.9]} scale={0.7} />
            ))}
            <mesh position={[0, 0.23, 0.73]} rotation={[0, 0, Math.PI / 2]} raycast={noRaycast}>
              <cylinderGeometry args={[0.37, 0.37, 4, 24, 1, true, 0, Math.PI / 2]} />
              <meshPhysicalMaterial
                color="#dff3ff"
                transparent
                opacity={0.2}
                roughness={0.05}
                clearcoat={1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {target(
              'bread',
              <>
                <Prop kind="tray" />
                {loafOnTray && (
                  <>
                    <Prop kind="loaf" position={[0, 0.04, 0]} />
                    <Steam position={[0, 0.28, 0]} size={0.07} rise={0.4} />
                  </>
                )}
              </>,
            )}
            {target('butter', <Prop kind="butterDish" />)}
            {target('croissant', <Prop kind="croissantPlate" />)}
            {target('slice', <Prop kind="slicePlate" />)}
            {target('bell', <BrassBell />)}
            <Basket position={BAKERY_BASKET_AT} items={BASKET_ORDER.slice(0, packed)} done={stage === 'done'} />

            {hint && expected && <HintMarker {...BAKERY_TARGETS[expected]} />}

            <FlourSack position={[-2.75, 0, 1.6]} />
            <FlourSack position={[2.75, 0, 1.6]} />

            {/* Doormat and exit back to the street */}
            <mesh position={[BAKERY_EXIT.position[0], 0.02, BAKERY_EXIT.position[2] + 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[1.4, 0.76]} />
              <meshStandardMaterial color="#7c2d12" roughness={1} />
            </mesh>
            <PortalTrigger
              {...BAKERY_EXIT}
              color="#fbbf24"
              avatarPoseRef={avatarPoseRef}
              enableProximity
              onEnter={() => onTravelToMap('town', { ...BAKERY_TOWN_RETURN })}
            />
          </group>
        );
      }}
    </WorldMapBase>
  );
});

export default InteriorBakery;
