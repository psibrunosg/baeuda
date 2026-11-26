import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import {
  expectedTarget,
  INITIAL,
  isRepeatTap,
  tap,
  type BarberStage,
  type BarberTarget,
} from '../../domain/barberSalon';
import type { AvatarStyle, SpeechKey, WorldMapId } from '../../domain/types';
import { playRewardFanfare } from '../../services/soundEngine';
import { BARBER_EXIT, BARBER_TARGETS, BARBER_TOWN_RETURN } from '../barberLayout';
import { getCafeTextures } from '../cafeTextures';
import { useMapFrame } from '../mapVisibility';
import { PortalTrigger } from '../PortalTrigger';
import { StylizedHumanoid } from '../StylizedCharacters';
import { pottedPlantGeometry } from '../toyProps';
import { toyMaterial } from '../toyKit';
import { WorldMapBase, type WorldMapBaseRenderApi } from '../WorldMapBase';
import { lotBox, WORLD_MAP_REGISTRY, type Aabb, type AvatarPose } from '../worldNavigation';
import { BarberChair, BarberProp, BulbMirror, checkerMaterial, Swivel, WallStripes } from './barberProps';
import { HintMarker, Steam } from './bakeryProps';

const HINT_MS = 5000;
const WELCOME_MS = 600;

export interface InteriorBarberProps {
  visible: boolean;
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onExploreObject?: (key: SpeechKey) => void;
  onOpenWardrobe?: () => void;
  /** Open the barber travel dialogue once the job is done. */
  onOpenDialogue?: () => void;
  onTravelToMap: (target: WorldMapId, spawn?: AvatarPose) => void;
}

const BARBER_OBSTACLES: readonly Aabb[] = [
  lotBox(0, -1.0, 2.1, 1.95), // tool counter, chair, barber, mirror and shelf cabinet
  lotBox(-2.75, 1.6, 0.35, 0.35), // plants
  lotBox(2.75, 1.6, 0.35, 0.35),
];

const MANNEQUINS = ['curly', 'straight', 'long', 'short'] as const;
const CHAIR_AT: [number, number, number] = [0, 0, -0.55];

/** A clickable salon object: generous invisible hit box plus a short wobble after a wrong tap. */
function Target({
  id,
  shake,
  onTap,
  children,
}: {
  id: BarberTarget;
  shake: number;
  onTap: (id: BarberTarget) => void;
  children?: ReactNode;
}) {
  const { at, hit } = BARBER_TARGETS[id];
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

export const InteriorBarber = memo(function InteriorBarber({
  visible,
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onExploreObject,
  onOpenWardrobe,
  onOpenDialogue,
  onTravelToMap,
}: InteriorBarberProps) {
  const textures = useMemo(() => getCafeTextures(), []);

  const [stage, setStage] = useState<BarberStage>(INITIAL);
  const [hint, setHint] = useState(false);
  const [wrong, setWrong] = useState<{ target: BarberTarget; seq: number } | null>(null);
  // Taps read the ref so two quick taps never act on the same stale state.
  const stageRef = useRef(stage);
  const waveRef = useRef(0);
  const welcomeRef = useRef(0);
  const lastTapRef = useRef<{ target: BarberTarget; at: number } | null>(null);
  const exploreRef = useRef(onExploreObject);
  exploreRef.current = onExploreObject;

  useEffect(() => {
    welcomeRef.current = window.setTimeout(() => {
      waveRef.current = 1.6;
      exploreRef.current?.('barber_welcome');
    }, WELCOME_MS);
    return () => window.clearTimeout(welcomeRef.current);
    // Once per visit; only touches refs.
  }, []);

  // The stage only changes on progress, so wrong taps do not restart the wait.
  useEffect(() => {
    setHint(false);
    const id = window.setTimeout(() => setHint(true), HINT_MS);
    return () => window.clearTimeout(id);
  }, [stage]);

  const handleTap = (target: BarberTarget, explore: WorldMapBaseRenderApi['onTriggerExplore']) => {
    if (target === 'mirror') {
      onOpenWardrobe?.();
      return;
    }
    window.clearTimeout(welcomeRef.current);
    const previous = stageRef.current;
    const now = performance.now();
    if (isRepeatTap(lastTapRef.current, target, previous, now)) return;
    lastTapRef.current = { target, at: now };
    const result = tap(previous, target);
    stageRef.current = result.state;
    setStage(result.state);
    // The travel dialogue takes over, so no scene line plays over its modal.
    if (result.travel) {
      onOpenDialogue?.();
      return;
    }
    if (result.wrong) {
      setWrong((w) => ({ target, seq: (w?.seq ?? 0) + 1 }));
      setHint(true);
    }
    const [x, y, z] = BARBER_TARGETS[target].at;
    waveRef.current = result.state === 'done' ? 2.8 : 1.6;
    explore(result.say, [x, y + 0.02, z]);
    if (result.state === 'done' && previous !== 'done') playRewardFanfare();
  };

  // Once done, the hint points at the barber, who offers the conversation.
  const marked = expectedTarget(stage) ?? 'barber';
  const config = WORLD_MAP_REGISTRY.interior_barber;
  const barberAt = BARBER_TARGETS.barber.at;

  return (
    <WorldMapBase
      config={config}
      obstacles={BARBER_OBSTACLES}
      visible={visible}
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      teleportRequest={teleportRequest}
      walkSpeed={2.8}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick, onTriggerExplore }) => {
        const target = (id: BarberTarget, children?: ReactNode) => (
          <Target
            id={id}
            shake={wrong?.target === id ? wrong.seq : 0}
            onTap={(t) => handleTap(t, onTriggerExplore)}
          >
            {children}
          </Target>
        );
        return (
          <group name="Interior_Barber">
            {/* Checkered tile floor */}
            <mesh
              position={[0, 0, 0.9]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={checkerMaterial(7, 7.4)}
              receiveShadow
              onClick={onGroundWalkClick}
            >
              <planeGeometry args={[7, 7.4]} />
            </mesh>

            {/* Striped back wall and low plaster side walls */}
            <mesh position={[0, 1.35, -2.76]} receiveShadow>
              <boxGeometry args={[7, 2.7, 0.18]} />
              <meshStandardMaterial color="#f4ead5" roughness={0.9} />
            </mesh>
            <WallStripes width={7} height={2.7} position={[0, 1.35, -2.66]} />
            {[-3.55, 3.55].map((x) => (
              <group key={x} position={[x, 0, 0.9]}>
                <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.2, 1.4, 7.4]} />
                  <meshStandardMaterial color="#e9dcc3" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.43, 0]}>
                  <boxGeometry args={[0.24, 0.07, 7.4]} />
                  <meshStandardMaterial color="#b91c1c" roughness={0.7} />
                </mesh>
              </group>
            ))}

            {/* Plain board so the hair styles read against the stripes */}
            <mesh position={[0, 1.52, -2.62]}>
              <boxGeometry args={[3.9, 0.98, 0.04]} />
              <meshStandardMaterial color="#4a2c1a" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.52, -2.59]} receiveShadow>
              <boxGeometry args={[3.76, 0.86, 0.03]} />
              <meshStandardMaterial color="#cfe0d8" roughness={0.9} />
            </mesh>

            {/* Dark wood cabinet carrying the mannequin heads */}
            <mesh position={[0, 0.495, -2.2]} castShadow receiveShadow>
              <boxGeometry args={[3.96, 0.99, 0.84]} />
              <meshStandardMaterial map={textures.darkWoodColor} bumpMap={textures.darkWoodBump} bumpScale={0.01} roughness={0.75} />
            </mesh>
            <mesh position={[0, 1.02, -2.2]} castShadow receiveShadow>
              <boxGeometry args={[4.08, 0.06, 0.94]} />
              <meshStandardMaterial color="#8a5a3b" map={textures.woodCounterColor} roughness={0.55} />
            </mesh>
            {MANNEQUINS.map((id) => (
              <group key={id}>{target(id, <BarberProp kind={id} scale={1.22} />)}</group>
            ))}

            {/* Client in the swivel chair; the beard is its own target and turns with them */}
            <Swivel spin={stage === 'done'} position={CHAIR_AT}>
              <BarberChair />
              <BarberProp kind="client" />
            </Swivel>
            {target(
              'beard',
              <Swivel
                spin={stage === 'done'}
                position={[0, -BARBER_TARGETS.beard.at[1], CHAIR_AT[2] - BARBER_TARGETS.beard.at[2]]}
              >
                <BarberProp kind={stage === 'done' ? 'trimmedBeard' : 'fullBeard'} />
              </Swivel>,
            )}

            {/* Barber on a small step */}
            <mesh position={[barberAt[0], barberAt[1] / 2, barberAt[2]]}>
              <boxGeometry args={[0.75, barberAt[1], 0.5]} />
              <meshStandardMaterial color="#3b2314" roughness={0.9} />
            </mesh>
            <StylizedHumanoid
              position={barberAt}
              scale={1.3}
              shirtColor="#f1f5f9"
              skinColor="#c98e68"
              hairColor="#1c1410"
              apronColor="#18181b"
              collarColor="#b91c1c"
              mustacheColor="#1c1410"
              waveTimerRef={waveRef}
              blinkOffset={0.7}
            />
            {target('barber')}

            {target('mirror', <BulbMirror />)}

            {/* Tool counter */}
            <mesh position={[0, 0.28, 0.45]} castShadow receiveShadow>
              <boxGeometry args={[3.7, 0.56, 0.56]} />
              <meshStandardMaterial map={textures.darkWoodColor} bumpMap={textures.darkWoodBump} bumpScale={0.01} roughness={0.75} />
            </mesh>
            <mesh position={[0, 0.59, 0.45]} castShadow receiveShadow>
              <boxGeometry args={[3.84, 0.06, 0.66]} />
              <meshStandardMaterial color="#8a5a3b" map={textures.woodCounterColor} roughness={0.5} />
            </mesh>
            {target('comb', <BarberProp kind="comb" />)}
            {target('scissors', <BarberProp kind="scissors" />)}

            {/* Decoration stays at the counter ends, away from every target */}
            <BarberProp kind="lotions" position={[-1.66, 0.62, 0.27]} />
            <BarberProp kind="towel" position={[-1.5, 0.62, 0.58]} scale={0.85} />
            <Steam position={[-1.5, 0.74, 0.58]} size={0.055} rise={0.32} />
            <BarberProp kind="dryer" position={[1.52, 0.62, 0.33]} />
            <BarberProp kind="tonic" position={[1.72, 0.62, 0.62]} />

            {hint && <HintMarker {...BARBER_TARGETS[marked]} />}

            {[-2.75, 2.75].map((x) => (
              <mesh key={x} position={[x, 0, 1.6]} geometry={pottedPlantGeometry()} material={toyMaterial()} scale={1.3} castShadow />
            ))}

            {/* Doormat and exit back to the street */}
            <mesh
              position={[BARBER_EXIT.position[0], 0.02, BARBER_EXIT.position[2] + 0.05]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[1.4, 0.76]} />
              <meshStandardMaterial color="#7f1d1d" roughness={1} />
            </mesh>
            <PortalTrigger
              {...BARBER_EXIT}
              color="#fbbf24"
              avatarPoseRef={avatarPoseRef}
              enableProximity
              onEnter={() => onTravelToMap('town', { ...BARBER_TOWN_RETURN })}
            />
          </group>
        );
      }}
    </WorldMapBase>
  );
});

export default InteriorBarber;
