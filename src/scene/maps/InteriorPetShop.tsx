import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  expectedTarget,
  INITIAL,
  isRepeatTap,
  reached,
  tap,
  type PetShopState,
  type PetShopTarget,
} from '../../domain/petShopVisit';
import type { AvatarStyle, SpeechKey, WorldMapId } from '../../domain/types';
import { playRewardFanfare } from '../../services/soundEngine';
import { getCafeTextures } from '../cafeTextures';
import { PET_SHOP_EXIT, PET_SHOP_OBSTACLES, PET_SHOP_TARGETS, PET_SHOP_TOWN_RETURN } from '../petShopLayout';
import { PortalTrigger } from '../PortalTrigger';
import { CafeCatNpc, StylizedHumanoid } from '../StylizedCharacters';
import { WorldMapBase, type WorldMapBaseRenderApi } from '../WorldMapBase';
import { WORLD_MAP_REGISTRY, type AvatarPose } from '../worldNavigation';
import { HintMarker } from './bakeryProps';
import { Target } from './InteriorTarget';
import { Ball, Bowl, Brush, Bubbles, Hearts, PetShopProp, Pop, Puppy, WaterBowl } from './petShopProps';

const HINT_MS = 5000;
const WELCOME_MS = 600;
/** Rings of the play rug, outermost first. */
const RUG = ['#f97316', '#facc15', '#22c55e', '#38bdf8'] as const;

export interface InteriorPetShopProps {
  visible: boolean;
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onExploreObject?: (key: SpeechKey) => void;
  onTravelToMap: (target: WorldMapId, spawn?: AvatarPose) => void;
}

export const InteriorPetShop = memo(function InteriorPetShop({
  visible,
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onExploreObject,
  onTravelToMap,
}: InteriorPetShopProps) {
  const textures = useMemo(() => getCafeTextures(), []);

  const [game, setGame] = useState<PetShopState>(INITIAL);
  const [hint, setHint] = useState(false);
  const [wrong, setWrong] = useState<{ target: PetShopTarget; seq: number } | null>(null);
  // Taps read the ref so two quick taps never act on the same stale state.
  const gameRef = useRef(game);
  const waveRef = useRef(0);
  const welcomeRef = useRef(0);
  const lastTapRef = useRef<{ target: PetShopTarget; at: number } | null>(null);
  const exploreRef = useRef(onExploreObject);
  exploreRef.current = onExploreObject;

  useEffect(() => {
    welcomeRef.current = window.setTimeout(() => {
      waveRef.current = 1.6;
      exploreRef.current?.('petshop_welcome');
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

  const handleTap = (target: PetShopTarget, explore: WorldMapBaseRenderApi['onTriggerExplore']) => {
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
    const [x, y, z] = PET_SHOP_TARGETS[target].at;
    waveRef.current = finished ? 2.8 : 1.6;
    explore(result.say, [x, y + 0.02, z]);
    if (finished) playRewardFanfare();
  };

  const expected = expectedTarget(game);
  const done = expected === null;

  return (
    <WorldMapBase
      config={WORLD_MAP_REGISTRY.interior_pet_shop}
      obstacles={PET_SHOP_OBSTACLES}
      visible={visible}
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      teleportRequest={teleportRequest}
      walkSpeed={2.8}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick, onTriggerExplore }) => {
        const target = (id: PetShopTarget, children?: ReactNode) => (
          <Target
            {...PET_SHOP_TARGETS[id]}
            id={id}
            shake={wrong?.target === id ? wrong.seq : 0}
            onTap={(t) => handleTap(t, onTriggerExplore)}
          >
            {children}
          </Target>
        );
        return (
          <group name="Interior_PetShop">
            {/* Light tiled floor and the colourful play rug */}
            <mesh position={[0, 0, 1.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
              <planeGeometry args={[7, 7.4]} />
              <meshStandardMaterial color="#eef8fb" map={textures.tileColor} bumpMap={textures.tileBump} bumpScale={0.008} roughness={0.6} />
            </mesh>
            {RUG.map((color, i) => (
              <mesh key={color} position={[0.75, 0.006 + i * 0.002, -0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onGroundWalkClick}>
                <circleGeometry args={[1.15 - i * 0.26, 40]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
            ))}

            {/* Pale back wall and low teal side walls */}
            <mesh position={[0, 1.3, -2.3]} receiveShadow>
              <boxGeometry args={[7.3, 2.6, 0.2]} />
              <meshStandardMaterial color="#e0f2fe" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
            </mesh>
            {[-3.55, 3.55].map((x) => (
              <mesh key={x} position={[x, 0.55, 1.2]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 1.1, 7.2]} />
                <meshStandardMaterial color="#5eb8b0" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
              </mesh>
            ))}

            <PetShopProp kind="furniture" />
            <WaterBowl />

            {/* The vet, in a sky-blue coat with a stethoscope round the neck */}
            <StylizedHumanoid
              position={PET_SHOP_TARGETS.vet.at}
              scale={1.3}
              shirtColor="#7dd3fc"
              collarColor="#f8fafc"
              skinColor="#c98f68"
              hairColor="#3b2314"
              waveTimerRef={waveRef}
              blinkOffset={1.4}
            />
            <PetShopProp kind="vetStethoscope" position={PET_SHOP_TARGETS.vet.at} scale={1.3} gloss />
            {target('vet')}

            {target('dog', <Puppy found={reached(game, 'dog')} jumping={done} />)}
            {target(
              'bowl',
              <>
                <Bowl color="#dc2626" />
                <Pop show={reached(game, 'bowl')}>
                  <PetShopProp kind="kibble" />
                </Pop>
              </>,
            )}
            {target(
              'tub',
              <>
                <PetShopProp kind="tub" gloss />
                <Pop show={reached(game, 'tub')}>
                  <PetShopProp kind="foam" />
                  <Bubbles />
                </Pop>
              </>,
            )}
            {target(
              'cat',
              <>
                <PetShopProp kind="cushion" />
                <group position={[0, 0.06, 0]} scale={1.7}>
                  <CafeCatNpc happy={reached(game, 'cat')} />
                </group>
              </>,
            )}
            {target('brush', <Brush moving={reached(game, 'brush')} />)}
            {target('ball', <Ball bouncing={reached(game, 'ball')} />)}
            {target('collar', <PetShopProp kind="collar" gloss />)}
            {target('stethoscope', <PetShopProp kind="stethoscope" gloss />)}

            {done && (
              <>
                <Hearts position={[0, 1.05, -0.65]} />
                <Hearts position={[1.75, 1.75, -1.6]} />
              </>
            )}

            {hint && expected && <HintMarker {...PET_SHOP_TARGETS[expected]} />}

            {/* Doormat and exit back to the street */}
            <mesh position={[0, 0.015, PET_SHOP_EXIT.position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[1.4, 0.9]} />
              <meshStandardMaterial color="#1f7a43" roughness={1} />
            </mesh>
            <PortalTrigger
              {...PET_SHOP_EXIT}
              color="#fbbf24"
              avatarPoseRef={avatarPoseRef}
              enableProximity
              onEnter={() => onTravelToMap('town', { ...PET_SHOP_TOWN_RETURN })}
            />
          </group>
        );
      }}
    </WorldMapBase>
  );
});

export default InteriorPetShop;
