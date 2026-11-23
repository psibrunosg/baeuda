import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { LocationId, LocationStatus, SpeechKey } from '../domain/types';
import { getCafeGeometries } from './cafeGeometries';
import { getCafeTextures } from './cafeTextures';
import {
  CafeCatNpc,
  LearnerAvatar,
  MarketVendorNpc,
  MiniLeoGreeter,
  PlazaMusicianNpc,
} from './StylizedCharacters';
import { StreetMicroEvents } from './StreetMicroEvents';
import {
  InteractiveBakery,
  InteractiveClothingStore,
  InteractiveConstructionSite,
  InteractiveTechShop,
  InteractiveTireShop,
} from './CityShops';
import { InteractivePharmacy } from './CityShopsPhase2';
import {
  AcrossStreetPromenade,
  BackgroundBakery,
  BackgroundClocktower,
  BackgroundTownhouse,
  CityRainParticles,
  PatioStringLights,
} from './TownBuildings';

export interface AvatarPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

interface NeighborhoodMapProps {
  cafeStatus: LocationStatus;
  locations?: Record<LocationId, LocationStatus>;
  timeOfDay?: 'day' | 'night';
  weather?: 'sunny' | 'rainy';
  visible: boolean;
  hideAvatar?: boolean;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  onEnterCafe: () => void;
  onEnterMarket?: () => void;
  onEnterPlaza?: () => void;
  onExploreObject?: (key: SpeechKey) => void;
  onInspectCuriosity?: (curiosityId: string) => void;
  onMapBlockedBump?: () => void;
}

const WALK_SPEED = 2.4;
const WALK_Z_MIN = -0.85;
const WALK_Z_MAX = 3.35;
const MARKET_BORDER_X = -2.05;
const PLAZA_BORDER_X = 2.05;

function StylizedCloud({
  position,
  scale = 1,
  speed = 0.25,
  phase = 0,
}: {
  position: [number, number, number];
  scale?: number;
  speed?: number;
  phase?: number;
}) {
  const cloudRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!cloudRef.current) return;
    const t = state.clock.elapsedTime;
    cloudRef.current.position.x = Math.sin(t * speed + phase) * 0.28;
    cloudRef.current.position.y = Math.cos(t * speed * 1.4 + phase) * 0.06;
  });

  return (
    <group position={position} scale={scale}>
      <group ref={cloudRef}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.42, 14, 14]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.96} />
        </mesh>
        <mesh position={[-0.36, -0.06, 0.04]}>
          <sphereGeometry args={[0.31, 12, 12]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.96} />
        </mesh>
        <mesh position={[0.36, -0.05, -0.04]}>
          <sphereGeometry args={[0.33, 12, 12]} />
          <meshStandardMaterial color="#fffaf2" roughness={0.96} />
        </mesh>
      </group>
    </group>
  );
}

function StylizedTree({
  position,
  scale = 1,
  fogged = false,
}: {
  position: [number, number, number];
  scale?: number;
  fogged?: boolean;
}) {
  const textures = useMemo(() => getCafeTextures(), []);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.34, 0]} castShadow={!fogged}>
        <cylinderGeometry args={[0.09, 0.13, 0.68, 10]} />
        <meshStandardMaterial
          color={fogged ? '#94a3b8' : '#7c5234'}
          transparent={fogged}
          opacity={fogged ? 0.45 : 1}
          roughness={0.92}
        />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow={!fogged}>
        <sphereGeometry args={[0.42, 14, 14]} />
        <meshStandardMaterial
          color={fogged ? '#cbd5e1' : '#5f8d5b'}
          bumpMap={fogged ? null : textures.clayBump}
          bumpScale={0.01}
          transparent={fogged}
          opacity={fogged ? 0.48 : 1}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[-0.22, 0.76, 0.15]} castShadow={!fogged}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial
          color={fogged ? '#cbd5e1' : '#4d7c4a'}
          transparent={fogged}
          opacity={fogged ? 0.45 : 1}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0.24, 0.82, -0.1]} castShadow={!fogged}>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial
          color={fogged ? '#cbd5e1' : '#73a36d'}
          transparent={fogged}
          opacity={fogged ? 0.45 : 1}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

/**
 * Charming wooden sawhorse barrier at locked district borders (zero text).
 */
function DistrictBarrier({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.08, 0.34, 0.85]} radius={0.015} smoothness={2} position={[0, 0.24, 0]} castShadow>
        <meshStandardMaterial color="#f59e0b" roughness={0.75} />
      </RoundedBox>
      <mesh position={[0, 0.24, -0.22]}>
        <boxGeometry args={[0.085, 0.34, 0.14]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.24, 0.22]}>
        <boxGeometry args={[0.085, 0.34, 0.14]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.12, -0.34]} castShadow>
        <boxGeometry args={[0.06, 0.24, 0.06]} />
        <meshStandardMaterial color="#7a4e32" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.12, 0.34]} castShadow>
        <boxGeometry args={[0.06, 0.24, 0.06]} />
        <meshStandardMaterial color="#7a4e32" roughness={0.88} />
      </mesh>
    </group>
  );
}

export function NeighborhoodMap({
  cafeStatus,
  locations,
  timeOfDay = 'day',
  weather = 'sunny',
  visible,
  hideAvatar = false,
  avatarPoseRef,
  onEnterCafe,
  onEnterMarket,
  onEnterPlaza,
  onExploreObject,
  onInspectCuriosity,
  onMapBlockedBump,
}: NeighborhoodMapProps) {
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const puff1Ref = useRef<THREE.Mesh>(null);
  const puff2Ref = useRef<THREE.Mesh>(null);
  const fountainRingRef = useRef<THREE.Mesh>(null);
  const exploreRingRef = useRef<THREE.Mesh>(null);
  const exploreTimerRef = useRef(0);
  const catDropRef = useRef<THREE.Mesh>(null);

  // Parallel Talk interactive world states (cause -> effect + spoken English)
  const [streetlampOn, setStreetlampOn] = useState(true);
  const [flowersBloomed, setFlowersBloomed] = useState(false);
  const [catBowlFilled, setCatBowlFilled] = useState(false);

  // Walkable learner avatar state (all refs, zero per-frame React re-renders)
  const avatarGroupRef = useRef<THREE.Group>(null);
  const walkRingRef = useRef<THREE.Mesh>(null);
  const walkTargetRef = useRef<THREE.Vector2 | null>(null);
  const isWalkingRef = useRef(false);
  const blockedBumpRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});

  const geos = useMemo(() => getCafeGeometries(), []);
  const textures = useMemo(() => getCafeTextures(), []);

  const effectiveCafeStatus = locations?.cafe ?? cafeStatus;
  const marketLocked = (locations?.market ?? 'unexplored') === 'unexplored';
  const plazaLocked = (locations?.plaza ?? 'unexplored') === 'unexplored';

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
      keysRef.current = {};
      walkTargetRef.current = null;
      isWalkingRef.current = false;
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
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

  useLayoutEffect(() => {
    if (puff1Ref.current) puff1Ref.current.position.y = 0.1;
    if (puff2Ref.current) puff2Ref.current.position.y = 0.45;
  }, [visible]);

  useFrame((state, delta) => {
    if (!visible) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (pulseRingRef.current) {
      const s = 1 + Math.sin(t * 3.2) * 0.14;
      pulseRingRef.current.scale.set(s, s, 1);
    }
    if (puff1Ref.current) {
      const cycle = (t * 0.45) % 1;
      puff1Ref.current.position.y = cycle * 0.92;
      puff1Ref.current.scale.setScalar(0.18 + cycle * 0.24);
    }
    if (puff2Ref.current) {
      const cycle = (t * 0.45 + 0.5) % 1;
      puff2Ref.current.position.y = cycle * 0.92;
      puff2Ref.current.scale.setScalar(0.18 + cycle * 0.24);
    }
    if (fountainRingRef.current && !plazaLocked) {
      const ripple = 1 + Math.sin(t * 4) * 0.12;
      fountainRingRef.current.scale.set(ripple, ripple, 1);
    }

    if (catDropRef.current && !catBowlFilled) {
      catDropRef.current.position.y = 0.34 + Math.sin(t * 3.6) * 0.04;
      catDropRef.current.rotation.y = t * 1.4;
    }

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

    // Update walkable learner avatar
    const avatar = avatarGroupRef.current;
    if (!avatar) return;

    const minX = marketLocked ? MARKET_BORDER_X : -7.9;
    const maxX = plazaLocked ? PLAZA_BORDER_X : 7.9;

    const keys = keysRef.current;
    let dx = 0;
    let dz = 0;
    if (keys.KeyA || keys.ArrowLeft) dx -= 1;
    if (keys.KeyD || keys.ArrowRight) dx += 1;
    if (keys.KeyW || keys.ArrowUp) dz -= 1;
    if (keys.KeyS || keys.ArrowDown) dz += 1;

    if (hideAvatar) {
      // First-person intuitive steering: A/D turn view, W/S walk forward/back along yaw
      const turnSpeed = 2.1;
      if (keys.KeyA || keys.ArrowLeft) avatar.rotation.y += turnSpeed * dt;
      if (keys.KeyD || keys.ArrowRight) avatar.rotation.y -= turnSpeed * dt;
      let fwd = 0;
      if (keys.KeyW || keys.ArrowUp) fwd += 1;
      if (keys.KeyS || keys.ArrowDown) fwd -= 1;
      if (fwd !== 0) {
        dx = Math.sin(avatar.rotation.y) * fwd;
        dz = Math.cos(avatar.rotation.y) * fwd;
      } else {
        dx = 0;
        dz = 0;
      }
    }

    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      dx /= len;
      dz /= len;
      const nextX = avatar.position.x + dx * WALK_SPEED * dt;
      const nextZ = avatar.position.z + dz * WALK_SPEED * dt;

      if ((marketLocked && nextX < minX) || (plazaLocked && nextX > maxX)) {
        if (blockedBumpRef.current <= 0.05) {
          blockedBumpRef.current = 1;
          onMapBlockedBump?.();
        }
      }

      avatar.position.x = THREE.MathUtils.clamp(nextX, minX, maxX);
      avatar.position.z = THREE.MathUtils.clamp(nextZ, WALK_Z_MIN, WALK_Z_MAX);
      if (!hideAvatar) {
        avatar.rotation.y = Math.atan2(dx, dz);
      }
      isWalkingRef.current = true;
    } else if (walkTargetRef.current) {
      const tx = THREE.MathUtils.clamp(walkTargetRef.current.x, minX, maxX);
      const tz = THREE.MathUtils.clamp(walkTargetRef.current.y, WALK_Z_MIN, WALK_Z_MAX);

      if (
        (marketLocked && walkTargetRef.current.x < minX) ||
        (plazaLocked && walkTargetRef.current.x > maxX)
      ) {
        if (
          Math.abs(avatar.position.x - tx) < 0.15 &&
          blockedBumpRef.current <= 0.05
        ) {
          blockedBumpRef.current = 1;
          onMapBlockedBump?.();
        }
      }

      const toX = tx - avatar.position.x;
      const toZ = tz - avatar.position.z;
      const dist = Math.hypot(toX, toZ);
      if (dist < 0.08) {
        walkTargetRef.current = null;
        isWalkingRef.current = false;
      } else {
        const step = Math.min(dist, WALK_SPEED * dt);
        avatar.position.x += (toX / dist) * step;
        avatar.position.z += (toZ / dist) * step;
        avatar.rotation.y = Math.atan2(toX, toZ);
        isWalkingRef.current = true;
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
          THREE.MathUtils.clamp(walkTargetRef.current.y, WALK_Z_MIN, WALK_Z_MAX),
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

  if (!visible) return null;

  const handleDoorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onEnterCafe();
  };

  const handleDoorPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handleDoorPointerOut = () => {
    document.body.style.cursor = 'auto';
  };

  const handleGroundWalkClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    walkTargetRef.current = new THREE.Vector2(e.point.x, e.point.z);
  };

  const handleExploreTap = (key: SpeechKey, ringPos: [number, number, number]) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onExploreObject?.(key);
    if (exploreRingRef.current) {
      exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
      exploreRingRef.current.visible = true;
      exploreTimerRef.current = 0.9;
    }
  };

  return (
    <group name="Neighborhood_Diorama">
      {/* Grounded studio AO across the full miniature city plateau */}
      <ContactShadows
        frames={1}
        position={[0, 0.012, 0.6]}
        opacity={0.3}
        scale={24}
        blur={2.4}
        far={4}
        color="#4a3728"
      />

      {/* Full Miniature City Island: warm terracotta soil rim + lush sage turf */}
      <mesh position={[0, -0.32, 0.5]} receiveShadow>
        <cylinderGeometry args={[13.2, 12.6, 0.44, 56]} />
        <meshStandardMaterial
          color="#a67c52"
          bumpMap={textures.clayBump}
          bumpScale={0.015}
          roughness={0.95}
        />
      </mesh>
      <mesh position={[0, -0.05, 0.5]} receiveShadow>
        <cylinderGeometry args={[13.15, 13.22, 0.12, 56]} />
        <meshStandardMaterial
          color="#b9c698"
          bumpMap={textures.clayBump}
          bumpScale={0.012}
          roughness={0.94}
        />
      </mesh>

      {/* Main Walkable Cobblestone Boulevard + Stone Curbs + Crosswalk + Raised Sidewalk */}
      <mesh
        position={[0, 0.015, 1.72]}
        receiveShadow
        onClick={handleGroundWalkClick}
      >
        <boxGeometry args={[15.8, 0.04, 1.85]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.018}
          roughness={weather === 'rainy' ? 0.35 : 0.9}
          metalness={weather === 'rainy' ? 0.12 : 0}
        />
      </mesh>
      {/* Beveled stone street curbs framing both sides of the cobblestone boulevard */}
      <RoundedBox args={[15.8, 0.075, 0.14]} radius={0.02} smoothness={2} position={[0, 0.042, 0.82]} receiveShadow>
        <meshStandardMaterial color="#cfc3ae" roughness={0.86} />
      </RoundedBox>
      <RoundedBox args={[15.8, 0.075, 0.14]} radius={0.02} smoothness={2} position={[0, 0.042, 2.66]} receiveShadow>
        <meshStandardMaterial color="#cfc3ae" roughness={0.86} />
      </RoundedBox>
      {/* Reflective rain puddles on the street during real city rain */}
      {weather === 'rainy' && (
        <>
          <mesh position={[-1.15, 0.04, 1.55]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.42, 20]} />
            <meshPhysicalMaterial color="#64748b" transparent opacity={0.55} roughness={0.04} clearcoat={1} />
          </mesh>
          <mesh position={[1.45, 0.04, 1.95]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.52, 22]} />
            <meshPhysicalMaterial color="#64748b" transparent opacity={0.55} roughness={0.04} clearcoat={1} />
          </mesh>
        </>
      )}
      {/* Low stone garden border wall along the back horizon */}
      <RoundedBox args={[14.4, 0.34, 0.22]} radius={0.04} smoothness={2} position={[0, 0.18, -3.1]} receiveShadow>
        <meshStandardMaterial color="#d6cab6" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.9} />
      </RoundedBox>
      {/* City-wide real rainfall particles */}
      <CityRainParticles active={weather === 'rainy'} />
      {/* Warm festoon string lights draped from café awning to north streetlamp + across the street */}
      <PatioStringLights
        start={[-1.22, 1.82, 0.65]}
        end={[-2.28, 2.0, 0.93]}
        isNight={timeOfDay === 'night' || weather === 'rainy'}
      />
      <PatioStringLights
        start={[-2.28, 2.0, 0.93]}
        end={[-2.65, 1.98, 3.05]}
        isNight={timeOfDay === 'night' || weather === 'rainy'}
      />

      {/* Full Across-the-Street South Promenade (Pocket Park, Bus Stop, Parked Car) */}
      <group onClick={handleGroundWalkClick}>
        <AcrossStreetPromenade
          isNight={timeOfDay === 'night'}
          onExploreStreet={(key) => onExploreObject?.(key)}
        />
      </group>

      {/* Everyday Interactive City Shops (built & verified one by one) */}
      <InteractiveBakery
        position={[-4.55, 0.06, 4.45]}
        rotationY={0.16}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={(key, ringPos) => {
          onExploreObject?.(key);
          if (exploreRingRef.current) {
            exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
            exploreRingRef.current.visible = true;
            exploreTimerRef.current = 0.9;
          }
        }}
      />
      <InteractiveTireShop
        position={[4.65, 0.06, 4.42]}
        rotationY={-0.16}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={(key, ringPos) => {
          onExploreObject?.(key);
          if (exploreRingRef.current) {
            exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
            exploreRingRef.current.visible = true;
            exploreTimerRef.current = 0.9;
          }
        }}
      />
      <InteractiveClothingStore
        position={[-7.35, 0.06, 4.35]}
        rotationY={0.22}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={(key, ringPos) => {
          onExploreObject?.(key);
          if (exploreRingRef.current) {
            exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
            exploreRingRef.current.visible = true;
            exploreTimerRef.current = 0.9;
          }
        }}
      />
      <InteractiveTechShop
        position={[7.25, 0.06, -0.55]}
        rotationY={-0.18}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={(key, ringPos) => {
          onExploreObject?.(key);
          if (exploreRingRef.current) {
            exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
            exploreRingRef.current.visible = true;
            exploreTimerRef.current = 0.9;
          }
        }}
      />
      <InteractiveConstructionSite
        position={[7.45, 0.06, 4.35]}
        rotationY={-0.22}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={(key, ringPos) => {
          onExploreObject?.(key);
          if (exploreRingRef.current) {
            exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
            exploreRingRef.current.visible = true;
            exploreTimerRef.current = 0.9;
          }
        }}
      />
      <InteractivePharmacy
        position={[-7.25, 0.06, -0.55]}
        rotationY={0.18}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={(key, ringPos) => {
          onExploreObject?.(key);
          if (exploreRingRef.current) {
            exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
            exploreRingRef.current.visible = true;
            exploreTimerRef.current = 0.9;
          }
        }}
      />
      {/* Zebra crosswalk stripes leading to the café */}
      {[-0.45, -0.15, 0.15, 0.45].map((cx, idx) => (
        <mesh key={idx} position={[cx, 0.038, 1.72]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 1.25]} />
          <meshStandardMaterial color="#f5ebd8" roughness={0.85} />
        </mesh>
      ))}
      <RoundedBox
        args={[17.6, 0.075, 2.85]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.025, -0.45]}
        receiveShadow
        onClick={handleGroundWalkClick}
      >
        <meshStandardMaterial
          color="#dfd3be"
          bumpMap={textures.plasterBump}
          bumpScale={0.008}
          roughness={0.88}
        />
      </RoundedBox>

      {/* Walk target destination ring */}
      <mesh ref={walkRingRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.24, 24]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
      </mesh>

      {/* Sensory discovery highlight ring when tapping outdoor objects */}
      <mesh ref={exploreRingRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.34, 28]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
      </mesh>

      {/* Walkable Learner Avatar (starts outside Café on the sidewalk facing the café) */}
      <group
        ref={avatarGroupRef}
        position={[-0.35, 0.06, 1.98]}
        rotation={[0, Math.PI, 0]}
        visible={!hideAvatar}
      >
        <LearnerAvatar isWalkingRef={isWalkingRef} blockedBumpRef={blockedBumpRef} />
      </group>

      {/* Emergent zero-dialogue street micro-events (Mailbox, Rolled Apple, Patio Parasol) */}
      <StreetMicroEvents
        weather={weather}
        onTriggerAudio={(key, ringPos) => {
          onExploreObject?.(key);
          if (exploreRingRef.current) {
            exploreRingRef.current.position.set(ringPos[0], ringPos[1], ringPos[2]);
            exploreRingRef.current.visible = true;
            exploreTimerRef.current = 0.9;
          }
        }}
      />

      {/* Full Northern Skyline Architecture (Townhouses + Artisan Bakery + Bookshop Clocktower) */}
      <BackgroundTownhouse
        position={[-6.0, 0.04, -4.35]}
        wallColor="#e9b8b0"
        roofColor="#7c4732"
        height={2.5}
        isNight={timeOfDay === 'night'}
      />
      <BackgroundBakery position={[-2.85, 0.04, -4.35]} isNight={timeOfDay === 'night'} />
      <BackgroundClocktower position={[2.85, 0.04, -4.4]} isNight={timeOfDay === 'night'} />
      <BackgroundTownhouse
        position={[5.95, 0.04, -4.35]}
        wallColor="#c9dbc3"
        roofColor="#5c4033"
        height={2.65}
        isNight={timeOfDay === 'night'}
      />

      {/* Café da Esquina — tactile artisan diorama hero */}
      <group position={[0, 0.06, -0.55]}>
        {/* Main textured terracotta stucco building */}
        <RoundedBox args={[2.56, 2.12, 2.04]} radius={0.05} smoothness={3} position={[0, 1.06, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#ffffff"
            map={textures.terracottaColor}
            bumpMap={textures.terracottaBump}
            bumpScale={0.016}
            roughness={0.84}
          />
        </RoundedBox>

        {/* Cream stone base plinth & cornice molding */}
        <RoundedBox args={[2.64, 0.22, 2.12]} radius={0.03} smoothness={2} position={[0, 0.11, 0]} receiveShadow>
          <meshStandardMaterial color="#e7dac5" roughness={0.88} />
        </RoundedBox>
        <RoundedBox args={[2.7, 0.1, 2.18]} radius={0.025} smoothness={2} position={[0, 2.08, 0]} castShadow>
          <meshStandardMaterial color="#f2e4ce" roughness={0.85} />
        </RoundedBox>

        {/* Pitched roof cap with warm clay overhang */}
        <RoundedBox args={[2.86, 0.24, 2.34]} radius={0.05} smoothness={3} position={[0, 2.24, 0]} castShadow>
          <meshStandardMaterial
            color="#5a3827"
            bumpMap={textures.clayBump}
            bumpScale={0.012}
            roughness={0.86}
          />
        </RoundedBox>
        {/* Terracotta rooftop trim */}
        <RoundedBox args={[2.5, 0.18, 1.98]} radius={0.04} smoothness={3} position={[0, 2.42, 0]} castShadow>
          <meshStandardMaterial color="#7c4732" roughness={0.85} />
        </RoundedBox>

        {/* Brick chimney with collar + rising steam puffs */}
        <group position={[0.82, 2.52, -0.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.5, 0.34]} />
            <meshStandardMaterial color="#8f4f3c" bumpMap={textures.terracottaBump} bumpScale={0.012} roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <boxGeometry args={[0.42, 0.08, 0.42]} />
            <meshStandardMaterial color="#5c3527" roughness={0.88} />
          </mesh>
        </group>
        <group position={[0.82, 2.84, -0.45]}>
          <mesh ref={puff1Ref}>
            <sphereGeometry args={[0.34, 12, 12]} />
            <meshStandardMaterial color="#fff8ee" transparent opacity={0.55} roughness={1} depthWrite={false} />
          </mesh>
        </group>
        <group position={[0.9, 2.84, -0.45]}>
          <mesh ref={puff2Ref}>
            <sphereGeometry args={[0.34, 12, 12]} />
            <meshStandardMaterial color="#fff8ee" transparent opacity={0.42} roughness={1} depthWrite={false} />
          </mesh>
        </group>

        {/* Scalloped 7-stripe awning */}
        <group position={[0, 1.65, 1.26]} rotation={[0.32, 0, 0]}>
          {Array.from({ length: 7 }, (_, i) => (
            <RoundedBox
              key={i}
              args={[0.35, 0.12, 0.76]}
              radius={0.03}
              smoothness={3}
              position={[-1.05 + i * 0.35, 0, 0]}
              castShadow
            >
              <meshStandardMaterial
                color={i % 2 === 0 ? '#f6e7cc' : '#2a6f62'}
                bumpMap={textures.clayBump}
                bumpScale={0.006}
                roughness={0.84}
              />
            </RoundedBox>
          ))}
        </group>

        {/* Framed warm glowing café window + wooden flower box with colorful blooms */}
        <group position={[-0.64, 1.06, 1.03]}>
          <RoundedBox args={[0.92, 0.82, 0.08]} radius={0.02} smoothness={2}>
            <meshStandardMaterial color="#f5ebd8" roughness={0.82} />
          </RoundedBox>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.78, 0.68]} />
            <meshStandardMaterial
              color="#ffe9a6"
              emissive="#f59e0b"
              emissiveIntensity={effectiveCafeStatus === 'familiar' ? 0.95 : 0.62}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[0.04, 0.7, 0.03]} />
            <meshStandardMaterial color="#f5ebd8" />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[0.8, 0.04, 0.03]} />
            <meshStandardMaterial color="#f5ebd8" />
          </mesh>
          {/* Flower box */}
          <RoundedBox args={[0.92, 0.18, 0.22]} radius={0.02} smoothness={2} position={[0, -0.44, 0.09]} castShadow>
            <meshStandardMaterial color="#7a4e32" roughness={0.85} />
          </RoundedBox>
          {[-0.28, -0.08, 0.12, 0.28].map((fx, idx) => (
            <group key={idx} position={[fx, -0.32, 0.11]}>
              <mesh>
                <sphereGeometry args={[0.075, 10, 10]} />
                <meshStandardMaterial color="#4d7c54" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.055, 0.02]}>
                <sphereGeometry args={[0.036, 8, 8]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? '#f472b6' : '#facc15'}
                  roughness={0.7}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Hanging wrought-iron café sign with miniature 3D ceramic mug (0 text!) */}
        <group position={[1.3, 1.66, 0.84]}>
          <mesh position={[0.14, 0.14, 0]}>
            <boxGeometry args={[0.38, 0.035, 0.035]} />
            <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.4} />
          </mesh>
          <RoundedBox args={[0.34, 0.3, 0.045]} radius={0.03} smoothness={3} position={[0.2, -0.04, 0]} castShadow>
            <meshStandardMaterial color="#fef3c7" roughness={0.75} />
          </RoundedBox>
          <mesh
            geometry={geos.mug}
            position={[0.2, -0.1, 0.03]}
            scale={0.72}
            rotation={[0, 0.3, 0]}
          >
            <meshStandardMaterial color="#c9563c" roughness={0.35} />
          </mesh>
        </group>

        {/* Clickable Paneled Wooden Café Door + Raised Golden Pulsing Ring */}
        <group
          name="prop_cafe_door"
          position={[0.56, 0.65, 1.03]}
          onClick={handleDoorClick}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <RoundedBox args={[0.84, 1.38, 0.09]} radius={0.02} smoothness={2} position={[0, 0.02, -0.01]}>
            <meshStandardMaterial color="#f5ebd8" roughness={0.82} />
          </RoundedBox>
          <RoundedBox args={[0.72, 1.28, 0.08]} radius={0.02} smoothness={2} castShadow>
            <meshStandardMaterial
              color="#693e22"
              bumpMap={textures.woodCounterBump}
              bumpScale={0.008}
              roughness={0.72}
            />
          </RoundedBox>
          <mesh position={[0, 0.28, 0.045]}>
            <planeGeometry args={[0.42, 0.36]} />
            <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.65} />
          </mesh>
          <mesh position={[0.24, -0.04, 0.062]}>
            <sphereGeometry args={[0.044, 12, 12]} />
            <meshStandardMaterial color="#facc15" metalness={0.78} roughness={0.22} />
          </mesh>
          <mesh ref={pulseRingRef} position={[0, -0.59, 0.38]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.54, 36]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
          </mesh>
        </group>

        {/* Unique Detailed Mini Leo Greeter outside the café door (click to learn Barista profession!) */}
        <group
          name="npc_barista_leo"
          position={[1.18, 0.01, 1.38]}
          onClick={(e) => {
            e.stopPropagation();
            onInspectCuriosity?.('job_barista');
          }}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <MiniLeoGreeter />
        </group>

        {/* Outdoor Sidewalk Bistro Table & Chairs (interactive: "Table.") */}
        <group
          position={[-1.62, 0.02, 0.92]}
          onClick={handleExploreTap('world_table', [-1.62, 0.07, 0.37])}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.56, 10]} />
            <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.32, 0.3, 0.045, 20]} />
            <meshStandardMaterial color="#f7ead6" roughness={0.6} />
          </mesh>
          <mesh geometry={geos.mug} position={[0.05, 0.58, 0.04]} scale={0.65} castShadow>
            <meshStandardMaterial color="#dc5a2c" roughness={0.3} />
          </mesh>
          {[-0.44, 0.44].map((cx, idx) => (
            <group key={idx} position={[cx, 0, 0]} rotation={[0, idx === 0 ? 0.25 : -0.25, 0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.14, 0.035, 14]} />
                <meshStandardMaterial color="#2a6f62" roughness={0.78} />
              </mesh>
              <mesh position={[0, 0.15, 0]} castShadow>
                <cylinderGeometry args={[0.022, 0.03, 0.3, 8]} />
                <meshStandardMaterial color="#27272a" metalness={0.5} roughness={0.5} />
              </mesh>
              <mesh position={[idx === 0 ? -0.13 : 0.13, 0.48, 0]} castShadow>
                <boxGeometry args={[0.03, 0.34, 0.24]} />
                <meshStandardMaterial color="#2a6f62" roughness={0.78} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Cozy Vintage Streetlamp (Parallel Talk toggle: "Light on!" / "Light off!") */}
        <group
          position={[-2.28, 0.02, 1.48]}
          onClick={(e) => {
            e.stopPropagation();
            const next = !streetlampOn;
            setStreetlampOn(next);
            onExploreObject?.(next ? 'world_light_on' : 'world_light_off');
            if (exploreRingRef.current) {
              exploreRingRef.current.position.set(-2.28, 0.07, 0.93);
              exploreRingRef.current.visible = true;
              exploreTimerRef.current = 0.9;
            }
          }}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.06, 1.9, 10]} />
            <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.38} />
          </mesh>
          <mesh position={[0, 1.98, 0]}>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial
              color={streetlampOn ? '#fef9c3' : '#94a3b8'}
              emissive="#fbbf24"
              emissiveIntensity={streetlampOn ? (timeOfDay === 'night' ? 2.2 : 1.35) : 0}
              roughness={0.2}
            />
          </mesh>
          {streetlampOn && (
            <mesh position={[0, 1.98, 0]}>
              <sphereGeometry args={[0.26, 12, 12]} />
              <meshBasicMaterial
                color="#fde68a"
                transparent
                opacity={timeOfDay === 'night' ? 0.34 : 0.18}
                depthWrite={false}
              />
            </mesh>
          )}
          <pointLight
            position={[0, 1.88, 0]}
            intensity={streetlampOn ? (timeOfDay === 'night' ? 4.5 : 0.8) : 0}
            distance={6}
            decay={2}
            color="#ffd27d"
          />
          <mesh position={[0, 2.13, 0]} castShadow>
            <coneGeometry args={[0.18, 0.12, 12]} />
            <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.4} />
          </mesh>
        </group>

        {/* Emergent Micro-Event: Café Cat + Interactive Water Bowl (zero dialogue!) */}
        <group
          position={[-0.78, 0.02, 1.48]}
          onClick={(e) => {
            e.stopPropagation();
            setCatBowlFilled(true);
            onExploreObject?.('world_cat_water');
            if (exploreRingRef.current) {
              exploreRingRef.current.position.set(-0.78, 0.07, 0.93);
              exploreRingRef.current.visible = true;
              exploreTimerRef.current = 0.9;
            }
          }}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <group position={[-0.14, 0, -0.02]} rotation={[0, 0.55, 0]}>
            <CafeCatNpc happy={catBowlFilled} />
          </group>
          {/* Ceramic water bowl */}
          <mesh position={[0.14, 0.04, 0.04]} castShadow>
            <cylinderGeometry args={[0.095, 0.11, 0.07, 16]} />
            <meshStandardMaterial color="#e07a5f" roughness={0.4} />
          </mesh>
          {/* Shimmering blue water inside bowl once filled */}
          <mesh position={[0.14, catBowlFilled ? 0.072 : 0.045, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.078, 16]} />
            <meshStandardMaterial
              color={catBowlFilled ? '#22b8f0' : '#4a3728'}
              emissive={catBowlFilled ? '#0ea5e9' : '#000000'}
              emissiveIntensity={catBowlFilled ? 0.35 : 0}
              roughness={0.12}
            />
          </mesh>
          {/* Floating visual droplet cue above empty bowl (zero text!) */}
          {!catBowlFilled && (
            <mesh ref={catDropRef} geometry={geos.droplet} position={[0.14, 0.34, 0.04]} scale={0.62}>
              <meshPhysicalMaterial
                color="#38bdf8"
                emissive="#0ea5e9"
                emissiveIntensity={0.65}
                roughness={0.08}
                clearcoat={1}
              />
            </mesh>
          )}
        </group>

        {/* Sidewalk Wooden A-Frame Easel (icon-only, zero text) */}
        <group position={[-0.98, 0.06, 1.24]} rotation={[0, 0.35, 0]}>
          <mesh position={[0, 0.22, 0.06]} rotation={[-0.18, 0, 0]} castShadow>
            <boxGeometry args={[0.28, 0.42, 0.025]} />
            <meshStandardMaterial color="#7a4e32" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.22, -0.06]} rotation={[0.18, 0, 0]} castShadow>
            <boxGeometry args={[0.28, 0.42, 0.025]} />
            <meshStandardMaterial color="#7a4e32" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.24, 0.075]} rotation={[-0.18, 0, 0]}>
            <planeGeometry args={[0.22, 0.3]} />
            <meshStandardMaterial color="#27312f" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.24, 0.088]} rotation={[-0.18, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.03, 0.07, 12]} />
            <meshBasicMaterial color="#fef3c7" />
          </mesh>
        </group>

        {/* Lush Flowering Bushes flanking café corners (Parallel Talk: "Water... flowers!") */}
        {[
          [-1.52, 0.14, 0.58],
          [1.5, 0.14, 0.46],
        ].map(([bx, by, bz], idx) => (
          <group
            key={idx}
            position={[bx, by, bz]}
            scale={flowersBloomed ? 1.18 : 1}
            onClick={(e) => {
              e.stopPropagation();
              setFlowersBloomed((prev) => !prev);
              onExploreObject?.('world_water_flowers');
              if (exploreRingRef.current) {
                exploreRingRef.current.position.set(bx, 0.07, bz - 0.55);
                exploreRingRef.current.visible = true;
                exploreTimerRef.current = 0.9;
              }
            }}
            onPointerOver={handleDoorPointerOver}
            onPointerOut={handleDoorPointerOut}
          >
            <mesh castShadow>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshStandardMaterial color="#4d7c54" bumpMap={textures.clayBump} bumpScale={0.008} roughness={0.9} />
            </mesh>
            <mesh position={[0.14, -0.04, 0.08]} castShadow>
              <sphereGeometry args={[0.15, 10, 10]} />
              <meshStandardMaterial color="#5f8d5b" roughness={0.9} />
            </mesh>
            <mesh position={[-0.08, 0.12, 0.12]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#f472b6" roughness={0.7} />
            </mesh>
            <mesh position={[0.09, 0.08, 0.14]}>
              <sphereGeometry args={[0.036, 8, 8]} />
              <meshStandardMaterial color="#facc15" roughness={0.7} />
            </mesh>
          </group>
        ))}

        {/* Cute Mint-Green Vintage Bicycle parked along the right patio wall (interactive: "Bicycle.") */}
        <group
          position={[1.64, 0.06, 0.05]}
          rotation={[0, -0.3, 0]}
          onClick={handleExploreTap('world_bicycle', [1.64, 0.07, -0.5])}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          {[-0.24, 0.24].map((wz, idx) => (
            <mesh key={idx} position={[0, 0.16, wz]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[0.15, 0.022, 8, 18]} />
              <meshStandardMaterial color="#292524" roughness={0.75} />
            </mesh>
          ))}
          <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.016, 0.016, 0.48, 8]} />
            <meshStandardMaterial color="#6ee7b7" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.34, 0.18]} rotation={[0.25, 0, 0]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.22, 8]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.25} />
          </mesh>
          <RoundedBox args={[0.14, 0.1, 0.11]} radius={0.015} smoothness={2} position={[0, 0.36, 0.26]} castShadow>
            <meshStandardMaterial color="#c49563" roughness={0.88} />
          </RoundedBox>
        </group>
      </group>

      {/* Cozy green neighborhood trees framing the café (interactive: "Tree.") */}
      <group
        onClick={handleExploreTap('world_tree', [2.45, 0.07, -2.1])}
        onPointerOver={handleDoorPointerOver}
        onPointerOut={handleDoorPointerOut}
      >
        <StylizedTree position={[-2.15, 0, -2.3]} scale={0.95} />
        <StylizedTree position={[2.45, 0, -2.1]} scale={1.08} />
      </group>

      {/* DISTRICT 2: Open-Air Timber-Framed Local Market Pavilion (Lesson 2) */}
      <group
        position={[-4.5, 0.06, -0.45]}
        onClick={(e) => {
          if (marketLocked) return;
          e.stopPropagation();
          onEnterMarket?.();
        }}
        onPointerOver={(e) => {
          if (marketLocked) return;
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={handleDoorPointerOut}
      >
        {/* 4 Timber corner posts */}
        {[
          [-1.08, 0.82, -0.62],
          [1.08, 0.82, -0.62],
          [-1.08, 0.82, 0.62],
          [1.08, 0.82, 0.62],
        ].map(([px, py, pz], idx) => (
          <mesh key={idx} position={[px, py, pz]} castShadow={!marketLocked}>
            <boxGeometry args={[0.1, 1.64, 0.1]} />
            <meshStandardMaterial
              color={marketLocked ? '#94a3b8' : '#7a4e32'}
              transparent={marketLocked}
              opacity={marketLocked ? 0.45 : 1}
              roughness={0.88}
            />
          </mesh>
        ))}
        {/* Wooden market counter base */}
        <RoundedBox args={[2.16, 0.72, 0.92]} radius={0.04} smoothness={2} position={[0, 0.36, 0]} castShadow={!marketLocked}>
          <meshStandardMaterial
            color={marketLocked ? '#cbd5e1' : '#ffffff'}
            map={marketLocked ? null : textures.woodCrateColor}
            bumpMap={marketLocked ? null : textures.woodCrateBump}
            bumpScale={0.01}
            transparent={marketLocked}
            opacity={marketLocked ? 0.45 : 1}
            roughness={0.86}
          />
        </RoundedBox>
        {/* 5-Stripe Scalloped Market Canopy */}
        <group position={[0, 1.68, 0.06]} rotation={[0.18, 0, 0]}>
          {Array.from({ length: 5 }, (_, i) => (
            <RoundedBox
              key={i}
              args={[0.48, 0.1, 1.62]}
              radius={0.03}
              smoothness={2}
              position={[-0.96 + i * 0.48, 0, 0]}
              castShadow={!marketLocked}
            >
              <meshStandardMaterial
                color={marketLocked ? '#e2e8f0' : i % 2 === 0 ? '#d96b47' : '#fdf6ea'}
                transparent={marketLocked}
                opacity={marketLocked ? 0.5 : 1}
                roughness={0.86}
              />
            </RoundedBox>
          ))}
        </group>
        {/* 6 Rich Clickable 3D Fruit Crates (Apple, Banana, Orange, Strawberry, Grapes, Watermelon) */}
        {[
          { id: 'fruit_apple', pos: [-0.82, 0.78, 0.16] as [number, number, number], color: '#ef4444', kind: 'apple' },
          { id: 'fruit_banana', pos: [-0.28, 0.78, 0.16] as [number, number, number], color: '#facc15', kind: 'banana' },
          { id: 'fruit_orange', pos: [0.26, 0.78, 0.16] as [number, number, number], color: '#f97316', kind: 'orange' },
          { id: 'fruit_strawberry', pos: [0.8, 0.78, 0.16] as [number, number, number], color: '#e11d48', kind: 'strawberry' },
          { id: 'fruit_grapes', pos: [-0.68, 0.2, 0.85] as [number, number, number], color: '#7e22ce', kind: 'grapes' },
          { id: 'fruit_watermelon', pos: [-0.05, 0.2, 0.85] as [number, number, number], color: '#15803d', kind: 'watermelon' },
        ].map((crate) => (
          <group
            key={crate.id}
            position={crate.pos}
            onClick={(e) => {
              e.stopPropagation();
              onInspectCuriosity?.(crate.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={handleDoorPointerOut}
          >
            <RoundedBox args={[0.46, 0.2, 0.36]} radius={0.02} smoothness={2} castShadow={!marketLocked}>
              <meshStandardMaterial
                color={marketLocked ? '#cbd5e1' : '#b47b4e'}
                transparent={marketLocked}
                opacity={marketLocked ? 0.55 : 1}
                roughness={0.86}
              />
            </RoundedBox>
            {crate.kind === 'watermelon' ? (
              <mesh position={[0, 0.15, 0]} scale={[1.3, 0.85, 0.9]} castShadow={!marketLocked}>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color="#15803d" roughness={0.55} />
              </mesh>
            ) : crate.kind === 'banana' ? (
              <>
                {[-0.08, 0.08].map((bx, i) => (
                  <mesh key={i} position={[bx, 0.14, 0]} rotation={[0.4, 0.2, Math.PI * 0.18]} castShadow={!marketLocked}>
                    <torusGeometry args={[0.075, 0.028, 8, 12, Math.PI]} />
                    <meshStandardMaterial color="#facc15" roughness={0.5} />
                  </mesh>
                ))}
              </>
            ) : (
              <>
                {[
                  [-0.1, 0.13, -0.05],
                  [0.02, 0.14, 0.04],
                  [0.12, 0.13, -0.03],
                  [-0.04, 0.15, 0.06],
                ].map(([fx, fy, fz], i) => (
                  <mesh key={i} position={[fx, fy, fz]} castShadow={!marketLocked}>
                    <sphereGeometry args={[crate.kind === 'grapes' ? 0.048 : 0.068, 10, 10]} />
                    <meshStandardMaterial color={crate.color} roughness={0.48} />
                  </mesh>
                ))}
              </>
            )}
          </group>
        ))}
        {!marketLocked && (
          <>
            {/* Hanging warm market lantern */}
            <mesh position={[0, 1.42, 0.65]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive="#fbbf24"
                emissiveIntensity={timeOfDay === 'night' ? 2.0 : 0.7}
              />
            </mesh>
          </>
        )}
        {/* Unique Market Vendor NPC */}
        <group position={[0.55, 0.02, 0.96]}>
          <MarketVendorNpc fogged={marketLocked} />
        </group>

        {/* Golden entry ring when unlocked */}
        {!marketLocked && (
          <mesh position={[0, 0.06, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.38, 0.5, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
          </mesh>
        )}

        {/* Map Lock Fog + Sawhorse Barrier */}
        {marketLocked && (
          <>
            <mesh position={[0.15, 1.75, 0.2]}>
              <sphereGeometry args={[1.25, 14, 14]} />
              <meshStandardMaterial color="#f8fafc" transparent opacity={0.64} roughness={1} depthWrite={false} />
            </mesh>
            <mesh position={[-0.75, 1.5, -0.15]}>
              <sphereGeometry args={[0.88, 12, 12]} />
              <meshStandardMaterial color="#f8fafc" transparent opacity={0.58} roughness={1} depthWrite={false} />
            </mesh>
            <DistrictBarrier position={[2.0, 0, 1.85]} />
          </>
        )}
      </group>

      {/* DISTRICT 3: Central Plaza (Lesson 3 — clickable once unlocked after Market Lesson 2) */}
      <group
        position={[4.45, 0.06, -0.55]}
        onClick={(e) => {
          if (plazaLocked) return;
          e.stopPropagation();
          onEnterPlaza?.();
        }}
        onPointerOver={(e) => {
          if (plazaLocked) return;
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={handleDoorPointerOut}
      >
        <StylizedTree position={[0.45, 0, -0.45]} scale={0.95} fogged={plazaLocked} />
        {/* Tiered Water Fountain */}
        <mesh position={[-0.35, 0.22, 0.35]}>
          <cylinderGeometry args={[0.62, 0.68, 0.32, 18]} />
          <meshStandardMaterial
            color={plazaLocked ? '#cbd5e1' : '#e7dac5'}
            transparent={plazaLocked}
            opacity={plazaLocked ? 0.45 : 1}
          />
        </mesh>
        <mesh position={[-0.35, 0.56, 0.35]}>
          <cylinderGeometry args={[0.2, 0.28, 0.42, 14]} />
          <meshStandardMaterial
            color={plazaLocked ? '#cbd5e1' : '#d6cbb8'}
            transparent={plazaLocked}
            opacity={plazaLocked ? 0.45 : 1}
          />
        </mesh>
        {!plazaLocked && (
          <mesh ref={fountainRingRef} position={[-0.35, 0.4, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.25, 0.52, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} />
          </mesh>
        )}
        {/* Park Bench + Unique Plaza Musician NPC */}
        <RoundedBox args={[0.85, 0.12, 0.35]} radius={0.02} smoothness={2} position={[0.72, 0.22, 0.62]}>
          <meshStandardMaterial
            color={plazaLocked ? '#cbd5e1' : '#8b5a3c'}
            transparent={plazaLocked}
            opacity={plazaLocked ? 0.45 : 1}
          />
        </RoundedBox>
        <group position={[0.72, 0.1, 0.65]}>
          <PlazaMusicianNpc fogged={plazaLocked} />
        </group>

        {/* Golden entry ring when unlocked */}
        {!plazaLocked && (
          <mesh position={[0, 0.06, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.38, 0.5, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
          </mesh>
        )}

        {/* Map Lock Fog + Sawhorse Barrier */}
        {plazaLocked && (
          <>
            <mesh position={[-0.1, 1.45, 0.25]}>
              <sphereGeometry args={[1.22, 14, 14]} />
              <meshStandardMaterial color="#f8fafc" transparent opacity={0.62} roughness={1} depthWrite={false} />
            </mesh>
            <mesh position={[0.75, 1.25, -0.25]}>
              <sphereGeometry args={[0.88, 12, 12]} />
              <meshStandardMaterial color="#f8fafc" transparent opacity={0.56} roughness={1} depthWrite={false} />
            </mesh>
            <DistrictBarrier position={[-2.1, 0, 1.95]} />
          </>
        )}
      </group>

      {/* Soft Claybound-style drifting clouds above the city */}
      <StylizedCloud position={[-3.2, 3.25, -3.1]} scale={0.95} speed={0.22} phase={0.4} />
      <StylizedCloud position={[3.1, 3.4, -2.9]} scale={0.85} speed={0.18} phase={2.1} />
      <StylizedCloud position={[0.1, 3.55, -3.9]} scale={1.0} speed={0.15} phase={4.2} />
    </group>
  );
}
