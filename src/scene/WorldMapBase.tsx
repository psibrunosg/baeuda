import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarStyle, SpeechKey } from '../domain/types';
import { MapVisibleRefContext } from './mapVisibility';
import { LearnerAvatar } from './StylizedCharacters';
import { CityRainParticles } from './TownBuildings';
import {
  resolveObstacleCollision,
  type Aabb,
  type AvatarPose,
  type WorldMapConfig,
} from './worldNavigation';

export interface WorldMapBaseRenderApi {
  onGroundWalkClick: (e: ThreeEvent<MouseEvent>) => void;
  onWalkPoint: (x: number, z: number) => void;
  onTriggerExplore: (key: SpeechKey, ringPos: [number, number, number]) => void;
}

interface WorldMapBaseProps {
  config: WorldMapConfig;
  obstacles: readonly Aabb[];
  customBlocker?: (x: number, z: number) => boolean;
  visible: boolean;
  weather?: 'sunny' | 'rainy';
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  walkSpeed?: number;
  onExploreObject?: (key: SpeechKey) => void;
  children: (api: WorldMapBaseRenderApi) => ReactNode;
}

/**
 * Shared 2.5D map runtime shell used by all lazy-loaded biomes and detailed 2.5D interiors.
 * Encapsulates WASD/Arrow + Click-to-Walk movement, AABB collisions, ContactShadows,
 * exploration highlight pulse, and exterior weather particles.
 */
export function WorldMapBase({
  config,
  obstacles,
  customBlocker,
  visible,
  weather = 'sunny',
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  walkSpeed = 3.2,
  onExploreObject,
  children,
}: WorldMapBaseProps) {
  const mapVisibleRef = useRef(visible);
  mapVisibleRef.current = visible;

  const avatarGroupRef = useRef<THREE.Group>(null);
  const walkRingRef = useRef<THREE.Mesh>(null);
  const exploreRingRef = useRef<THREE.Mesh>(null);
  const exploreTimerRef = useRef(0);
  const walkTargetRef = useRef<THREE.Vector2 | null>(null);
  const isWalkingRef = useRef(false);
  const blockedBumpRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});

  useLayoutEffect(() => {
    if (!avatarGroupRef.current) return;
    const pose = avatarPoseRef?.current ?? config.defaultSpawn;
    avatarGroupRef.current.position.set(pose.x, pose.y, pose.z);
    avatarGroupRef.current.rotation.y = pose.yaw;
  }, [avatarPoseRef, config.defaultSpawn]);

  useEffect(() => {
    if (!teleportRequest || !avatarGroupRef.current) return;
    avatarGroupRef.current.position.x = teleportRequest.x;
    avatarGroupRef.current.position.z = teleportRequest.z;
    avatarGroupRef.current.rotation.y = teleportRequest.yaw;
    walkTargetRef.current = null;
    isWalkingRef.current = false;
    if (avatarPoseRef) {
      avatarPoseRef.current.x = teleportRequest.x;
      avatarPoseRef.current.z = teleportRequest.z;
      avatarPoseRef.current.yaw = teleportRequest.yaw;
    }
  }, [teleportRequest, avatarPoseRef]);

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
      keysRef.current = {};
      walkTargetRef.current = null;
      isWalkingRef.current = false;
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) {
        return;
      }
      const code = e.code;
      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        keysRef.current[code] = true;
        walkTargetRef.current = null;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [visible]);

  useFrame((state, delta) => {
    if (!visible) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (exploreRingRef.current) {
      if (exploreTimerRef.current > 0) {
        exploreTimerRef.current = Math.max(0, exploreTimerRef.current - dt);
        exploreRingRef.current.visible = true;
        const p = 1 + (1 - exploreTimerRef.current) * 0.45;
        exploreRingRef.current.scale.set(p, p, 1);
      } else {
        exploreRingRef.current.visible = false;
      }
    }

    const avatar = avatarGroupRef.current;
    if (!avatar) return;

    const { minX, maxX, minZ, maxZ } = config.bounds;
    const keys = keysRef.current;
    let dx = 0;
    let dz = 0;
    if (keys.KeyA || keys.ArrowLeft) dx -= 1;
    if (keys.KeyD || keys.ArrowRight) dx += 1;
    if (keys.KeyW || keys.ArrowUp) dz -= 1;
    if (keys.KeyS || keys.ArrowDown) dz += 1;

    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      dx /= len;
      dz /= len;
      const clampedX = THREE.MathUtils.clamp(avatar.position.x + dx * walkSpeed * dt, minX, maxX);
      const clampedZ = THREE.MathUtils.clamp(avatar.position.z + dz * walkSpeed * dt, minZ, maxZ);
      const [safeX, safeZ] = resolveObstacleCollision(
        clampedX,
        clampedZ,
        avatar.position.x,
        avatar.position.z,
        obstacles,
        customBlocker,
      );
      avatar.position.x = safeX;
      avatar.position.z = safeZ;
      avatar.rotation.y = Math.atan2(dx, dz);
      isWalkingRef.current = true;
    } else if (walkTargetRef.current) {
      const tx = THREE.MathUtils.clamp(walkTargetRef.current.x, minX, maxX);
      const tz = THREE.MathUtils.clamp(walkTargetRef.current.y, minZ, maxZ);
      const toX = tx - avatar.position.x;
      const toZ = tz - avatar.position.z;
      const dist = Math.hypot(toX, toZ);
      if (dist < 0.08) {
        walkTargetRef.current = null;
        isWalkingRef.current = false;
      } else {
        const step = Math.min(dist, walkSpeed * dt);
        const candX = avatar.position.x + (toX / dist) * step;
        const candZ = avatar.position.z + (toZ / dist) * step;
        const [safeX, safeZ] = resolveObstacleCollision(
          candX,
          candZ,
          avatar.position.x,
          avatar.position.z,
          obstacles,
          customBlocker,
        );
        const moved = Math.hypot(safeX - avatar.position.x, safeZ - avatar.position.z);
        if (moved < step * 0.15) {
          walkTargetRef.current = null;
          isWalkingRef.current = false;
        } else {
          avatar.position.x = safeX;
          avatar.position.z = safeZ;
          avatar.rotation.y = Math.atan2(toX, toZ);
          isWalkingRef.current = true;
        }
      }
    } else {
      isWalkingRef.current = false;
    }

    if (walkRingRef.current) {
      if (walkTargetRef.current) {
        walkRingRef.current.visible = true;
        walkRingRef.current.position.set(
          THREE.MathUtils.clamp(walkTargetRef.current.x, minX, maxX),
          0.055,
          THREE.MathUtils.clamp(walkTargetRef.current.y, minZ, maxZ),
        );
        const pulse = 1 + Math.sin(t * 6) * 0.12;
        walkRingRef.current.scale.set(pulse, pulse, 1);
      } else {
        walkRingRef.current.visible = false;
      }
    }

    if (avatarPoseRef) {
      avatarPoseRef.current.x = avatar.position.x;
      avatarPoseRef.current.y = avatar.position.y;
      avatarPoseRef.current.z = avatar.position.z;
      avatarPoseRef.current.yaw = avatar.rotation.y;
    }
  });

  const onGroundWalkClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    walkTargetRef.current = new THREE.Vector2(e.point.x, e.point.z);
  }, []);

  const onWalkPoint = useCallback((x: number, z: number) => {
    walkTargetRef.current = new THREE.Vector2(x, z);
  }, []);

  const onTriggerExplore = useCallback(
    (key: SpeechKey, ringPos: [number, number, number]) => {
      onExploreObject?.(key);
      if (exploreRingRef.current) {
        exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
        exploreRingRef.current.visible = true;
        exploreTimerRef.current = 0.9;
      }
    },
    [onExploreObject],
  );

  return (
    <MapVisibleRefContext.Provider value={mapVisibleRef}>
      <group name={`WorldMap_${config.id}`} visible={visible}>
        <ContactShadows
          frames={1}
          position={[0, 0.012, 0]}
          opacity={config.kind === 'interior' ? 0.34 : 0.28}
          scale={config.contactShadowScale}
          blur={2.4}
          far={5}
          color="#4a3728"
        />

        {config.kind === 'exterior' && <CityRainParticles active={weather === 'rainy'} />}

        {/* Walk target destination ring */}
        <mesh ref={walkRingRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
        </mesh>

        {/* Discovery highlight ring */}
        <mesh ref={exploreRingRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.34, 28]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
        </mesh>

        {/* Walkable Learner Avatar */}
        <group
          ref={avatarGroupRef}
          position={[config.defaultSpawn.x, config.defaultSpawn.y, config.defaultSpawn.z]}
          rotation={[0, config.defaultSpawn.yaw, 0]}
        >
          <LearnerAvatar
            isWalkingRef={isWalkingRef}
            blockedBumpRef={blockedBumpRef}
            avatarStyle={avatarStyle}
          />
        </group>

        {children({ onGroundWalkClick, onWalkPoint, onTriggerExplore })}
      </group>
    </MapVisibleRefContext.Provider>
  );
}
