import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarStyle, LocationId, LocationStatus, SpeechKey, WorldMapId } from '../domain/types';
import { getCafeGeometries } from './cafeGeometries';
import { getCafeTextures } from './cafeTextures';
import { MapVisibleRefContext, useMapVisibleRef } from './mapVisibility';
import { PortalTrigger } from './PortalTrigger';
import { BAKERY_TOWN_DOOR } from './bakeryLayout';
import { BARBER_TOWN_DOOR } from './barberLayout';
import { BOOKSHOP_TOWN_DOOR } from './bookshopLayout';
import { PET_SHOP_TOWN_DOOR } from './petShopLayout';
import { SchoolFacade } from './SchoolFacade';
import { SCHOOL_TOWN_DOOR } from './schoolLayout';
import { HOUSE_TOWN_DOOR } from './familyHomeLayout';
import { lotBox, resolveObstacleCollision as resolveCollision, type Aabb, type AvatarPose } from './worldNavigation';
import {
  CafeCatNpc,
  LearnerAvatar,
  MarketVendorNpc,
  MiniLeoGreeter,
  PlazaMusicianNpc,
} from './StylizedCharacters';
import { CityLife } from './CityLife';
import { ToyAwning, ToyRoof, ToyWindowTrim } from './toyBuildings';
import { once, toyMaterial } from './toyKit';
import {
  bicycleGeometry,
  bushGeometry,
  cloudGeometry,
  fruitCrateGeometry,
  streetlampGeometry,
  treeCanopyGeometry,
  treeTrunkGeometry,
} from './toyProps';
import { StreetMicroEvents } from './StreetMicroEvents';
import {
  InteractiveBakery,
  InteractiveClothingStore,
  InteractiveConstructionSite,
  InteractiveTechShop,
  InteractiveTireShop,
} from './CityShops';
import {
  InteractiveBarberShop,
  InteractiveBookshop,
  InteractivePetShop,
  InteractivePharmacy,
  InteractivePizzeria,
  InteractivePostBank,
} from './CityShopsPhase2';
import {
  BackgroundClocktower,
  CityRainParticles,
  EastRiverAndBridges,
  ParkLake,
  PatioStringLights,
  ResidentialHouse,
  SouthBeachAndPier,
} from './TownBuildings';

export type { AvatarPose } from './worldNavigation';

interface NeighborhoodMapProps {
  cafeStatus: LocationStatus;
  locations?: Record<LocationId, LocationStatus>;
  streetDiscoveries?: readonly string[];
  activeQuestPosition?: { x: number; z: number; yaw: number } | null;
  timeOfDay?: 'day' | 'night';
  weather?: 'sunny' | 'rainy';
  visible: boolean;
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onEnterCafe: () => void;
  onEnterMarket?: () => void;
  onEnterPlaza?: () => void;
  onEnterPizzeria?: () => void;
  onEnterPharmacy?: () => void;
  onTravelToMap?: (target: WorldMapId, spawn?: AvatarPose) => void;
  onExploreObject?: (key: SpeechKey) => void;
  onInspectCuriosity?: (curiosityId: string) => void;
  onMapBlockedBump?: () => void;
}

const WALK_SPEED = 3.2;
const WORLD_X_MIN = -17.8;
const WORLD_X_MAX = 17.8;
const WORLD_Z_MIN = -11.4;
const WORLD_Z_MAX = 15.0;

// Static 2D AABB obstacles for all 2.5D buildings, houses, lake, and street furniture
const OBSTACLE_AABBS: readonly Aabb[] = [
  // Z1: Centro & Gastronomia / Saúde
  lotBox(-3.6, -3.5, 1.3, 1.0),   // Fruit Market
  lotBox(0.0, -3.6, 1.5, 1.2),    // Corner Café
  lotBox(3.8, -3.5, 1.4, 1.05),   // Artisan Bakery
  lotBox(-3.6, 3.4, 1.4, 1.05),   // Pizzeria
  lotBox(0.0, 3.4, 1.4, 1.05),    // Pharmacy
  lotBox(3.8, 3.4, 1.4, 1.05),    // Pet Shop
  lotBox(0.0, 8.8, 1.45, 1.0),    // Post & Bank
  lotBox(-11.8, 8.8, 1.5, 1.0),   // Baeuda Academy (school)
  // Z2: Bairro Residencial & Cultura (West)
  lotBox(-15.2, -8.2, 1.25, 1.0), // Casa do Leo
  lotBox(-12.2, -8.2, 1.25, 1.0), // Casa da Ana
  lotBox(-9.2, -8.2, 1.25, 1.0),  // Casa do Padeiro
  lotBox(-13.8, -3.5, 1.4, 1.05), // Bookshop
  lotBox(-9.8, -3.5, 1.4, 1.05),  // Clothing Store
  lotBox(-13.8, 3.4, 1.25, 1.0),  // Casa do Músico
  lotBox(-9.8, 3.4, 1.25, 1.0),   // Casa da Família
  // Z3: Parque & Lago + Torre do Relógio
  lotBox(0.0, -12.2, 1.45, 1.1),  // Clocktower
  lotBox(4.2, -8.2, 2.9, 1.9),    // Park Lake
  // Z4: Serviços (East of River)
  lotBox(13.5, -3.5, 1.4, 1.05),  // Barber Shop
  lotBox(16.6, -3.5, 1.4, 1.05),  // Tech & Phone
  lotBox(13.5, 3.4, 1.4, 1.05),   // Tire Shop
  lotBox(16.6, 3.4, 1.4, 1.05),   // Construction Site
  // Z5: Street Furniture along South Promenade
  lotBox(-4.0, 9.2, 0.95, 0.55),  // Bus Stop Shelter
  lotBox(4.2, 9.3, 0.7, 0.4),     // Seaside Bench
  lotBox(4.2, 8.15, 0.85, 0.52),  // Retro Parked Car
];

const CAFE_AWNING = ['#f6e7cc', '#2a6f62', '#f6e7cc', '#2a6f62', '#f6e7cc', '#2a6f62', '#f6e7cc'] as const;
const MARKET_AWNING = ['#d96b47', '#fdf6ea', '#d96b47', '#fdf6ea', '#d96b47'] as const;

/** The bush geometry is white-based; instanced bushes tint per instance, these two share one green. */
const cafeBushMaterial = () =>
  once('material:cafeBush', () => new THREE.MeshStandardMaterial({ vertexColors: true, color: '#5f8d5b', roughness: 0.88 }));

function isWaterBlocked(x: number, z: number): boolean {
  // East River channel (X: 9.45..11.75) open only on Bridge 1 (Z: -1.4..0.4) and Bridge 2 (Z: 5.6..7.4)
  if (x > 9.45 && x < 11.75 && z > -8.5) {
    const onBridge1 = z >= -1.4 && z <= 0.4;
    const onBridge2 = z >= 5.6 && z <= 7.4;
    if (!onBridge1 && !onBridge2) return true;
  }
  // South Sea (Z > 12.2) open only on the Wooden Pier (X: -1.15..1.15, Z <= 15.0)
  if (z > 12.2) {
    const onPier = x >= -1.15 && x <= 1.15 && z <= 15.0;
    if (!onPier) return true;
  }
  return false;
}

function resolveObstacleCollision(x: number, z: number, prevX: number, prevZ: number): [number, number] {
  return resolveCollision(x, z, prevX, prevZ, OBSTACLE_AABBS, isWaterBlocked);
}

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
  const cloudRef = useRef<THREE.Mesh>(null);
  const mapVisibleRef = useMapVisibleRef();
  useFrame((state) => {
    if (!mapVisibleRef.current || !cloudRef.current) return;
    const t = state.clock.elapsedTime;
    cloudRef.current.position.x = Math.sin(t * speed + phase) * 0.28;
    cloudRef.current.position.y = Math.cos(t * speed * 1.4 + phase) * 0.06;
  });

  return (
    <group position={position} scale={scale}>
      <mesh ref={cloudRef} geometry={cloudGeometry()} material={toyMaterial()} />
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
  const material = toyMaterial(fogged ? 'fog' : 'matte');
  return (
    <group position={position} scale={scale}>
      <mesh geometry={treeTrunkGeometry()} material={material} castShadow={!fogged} />
      <mesh geometry={treeCanopyGeometry()} material={material} castShadow={!fogged} />
    </group>
  );
}

const FOREST_TREES: readonly (readonly [number, number, number])[] = [
  [-17.2, -12.6, 1.15], [-14.2, -13.1, 1.05], [-10.8, -12.4, 1.2], [-7.4, -13.0, 1.1],
  [-3.8, -12.4, 1.15], [3.6, -12.5, 1.1], [7.2, -12.8, 1.2], [11.8, -12.2, 1.05],
  [15.4, -12.6, 1.15], [18.2, -11.2, 1.0],
  // Residential & Park accents
  [-17.5, -5.6, 0.95], [-17.5, 1.8, 1.0], [-17.2, 8.8, 1.05],
  [-4.2, -6.2, 0.92], [7.8, -7.2, 0.98], [18.2, 1.5, 1.05], [18.0, 8.8, 0.95],
];

/**
 * All neighborhood trees in 2 draw calls: static instanced trunks and canopies,
 * each tree turned and tinted a little differently.
 */
function InstancedForest() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const count = FOREST_TREES.length;

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    FOREST_TREES.forEach(([tx, tz, sc], i) => {
      dummy.position.set(tx, 0, tz);
      dummy.rotation.y = i * 2.4;
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(i, dummy.matrix);
      canopyRef.current?.setMatrixAt(i, dummy.matrix);
      canopyRef.current?.setColorAt(i, tint.setRGB(i % 3 === 1 ? 1.18 : 1, i % 4 === 2 ? 0.9 : 1, i % 5 === 3 ? 0.8 : 1));
    });
    for (const mesh of [trunkRef.current, canopyRef.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, []);

  return (
    <group name="Instanced_Forest">
      <instancedMesh ref={trunkRef} args={[treeTrunkGeometry(), toyMaterial(), count]} castShadow />
      <instancedMesh ref={canopyRef} args={[treeCanopyGeometry(), toyMaterial(), count]} castShadow />
    </group>
  );
}

function QuestBeacon({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Group>(null);
  const mapVisibleRef = useMapVisibleRef();
  useFrame((state) => {
    if (!mapVisibleRef.current || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 1.95 + Math.sin(t * 3.4) * 0.14;
    ref.current.rotation.y = t * 1.8;
  });
  return (
    <group ref={ref} position={[x, 1.95, z]}>
      <mesh>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#f59e0b"
          emissiveIntensity={0.9}
          roughness={0.25}
          metalness={0.35}
        />
      </mesh>
    </group>
  );
}

export const NeighborhoodMap = memo(function NeighborhoodMap({
  cafeStatus,
  locations,
  streetDiscoveries,
  activeQuestPosition,
  timeOfDay = 'day',
  weather = 'sunny',
  visible,
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onEnterCafe,
  onEnterMarket,
  onEnterPlaza,
  onEnterPizzeria,
  onEnterPharmacy,
  onTravelToMap,
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
  const mapVisibleRef = useRef(visible);
  mapVisibleRef.current = visible;

  // Parallel Talk interactive world states hydrated from profile.streetDiscoveries
  const [streetlampOn, setStreetlampOn] = useState(
    () => !(streetDiscoveries?.includes('world_light_off') ?? false),
  );
  const [flowersBloomed, setFlowersBloomed] = useState(
    () => streetDiscoveries?.includes('world_water_flowers') ?? false,
  );
  const [catBowlFilled, setCatBowlFilled] = useState(
    () => streetDiscoveries?.includes('world_cat_water') ?? false,
  );

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

  // Restore avatar pose when returning from an interior scene
  useLayoutEffect(() => {
    if (!avatarPoseRef || !avatarGroupRef.current) return;
    avatarGroupRef.current.position.set(
      avatarPoseRef.current.x,
      avatarPoseRef.current.y,
      avatarPoseRef.current.z,
    );
    avatarGroupRef.current.rotation.y = avatarPoseRef.current.yaw;
  }, [avatarPoseRef]);

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

    // Update walkable learner avatar in free 2.5D X/Z world coordinates
    const avatar = avatarGroupRef.current;
    if (!avatar) return;

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
      const nextX = avatar.position.x + dx * WALK_SPEED * dt;
      const nextZ = avatar.position.z + dz * WALK_SPEED * dt;

      const clampedX = THREE.MathUtils.clamp(nextX, WORLD_X_MIN, WORLD_X_MAX);
      const clampedZ = THREE.MathUtils.clamp(nextZ, WORLD_Z_MIN, WORLD_Z_MAX);
      const [safeX, safeZ] = resolveObstacleCollision(
        clampedX,
        clampedZ,
        avatar.position.x,
        avatar.position.z,
      );
      avatar.position.x = safeX;
      avatar.position.z = safeZ;
      avatar.rotation.y = Math.atan2(dx, dz);
      isWalkingRef.current = true;
    } else if (walkTargetRef.current) {
      const tx = THREE.MathUtils.clamp(walkTargetRef.current.x, WORLD_X_MIN, WORLD_X_MAX);
      const tz = THREE.MathUtils.clamp(walkTargetRef.current.y, WORLD_Z_MIN, WORLD_Z_MAX);

      const toX = tx - avatar.position.x;
      const toZ = tz - avatar.position.z;
      const dist = Math.hypot(toX, toZ);
      if (dist < 0.08) {
        walkTargetRef.current = null;
        isWalkingRef.current = false;
      } else {
        const step = Math.min(dist, WALK_SPEED * dt);
        const candX = avatar.position.x + (toX / dist) * step;
        const candZ = avatar.position.z + (toZ / dist) * step;
        const [safeX, safeZ] = resolveObstacleCollision(
          candX,
          candZ,
          avatar.position.x,
          avatar.position.z,
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
          THREE.MathUtils.clamp(walkTargetRef.current.x, WORLD_X_MIN, WORLD_X_MAX),
          0.055,
          THREE.MathUtils.clamp(walkTargetRef.current.y, WORLD_Z_MIN, WORLD_Z_MAX),
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

  const handleShopAudio = useCallback(
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

  // Mirror ringPos across shop center for shops rotated Math.PI so all facades face South (+Z)
  const makeFlippedShopAudio = useCallback(
    (shopPos: readonly [number, number, number]) =>
      (key: SpeechKey, ringPos: [number, number, number]) => {
        const flippedX = 2 * shopPos[0] - ringPos[0];
        const flippedZ = 2 * shopPos[2] - ringPos[2];
        handleShopAudio(key, [flippedX, ringPos[1], flippedZ]);
      },
    [handleShopAudio],
  );

  const handleWalkPoint = useCallback((x: number, z: number) => {
    walkTargetRef.current = new THREE.Vector2(x, z);
  }, []);

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
    <MapVisibleRefContext.Provider value={mapVisibleRef}>
      <group name="Neighborhood_Diorama" visible={visible}>
      {/* Grounded studio AO across the 2.5D city plateau */}
      <ContactShadows
        frames={1}
        position={[0, 0.012, 0]}
        opacity={0.28}
        scale={42}
        blur={2.4}
        far={5}
        color="#4a3728"
      />

      {/* Full 2.5D City Plateau: warm terracotta earth base + lush sage lawn */}
      {/* Plain boxes: drei RoundedBox inflates when height < 2*radius and buried every street under the lawn */}
      <mesh position={[0, -0.34, 0]} receiveShadow>
        <boxGeometry args={[42.4, 0.48, 32.4]} />
        <meshStandardMaterial
          color="#a67c52"
          bumpMap={textures.clayBump}
          bumpScale={0.015}
          roughness={0.95}
        />
      </mesh>
      <mesh position={[0, -0.05, 0]} receiveShadow onClick={handleGroundWalkClick}>
        <boxGeometry args={[42.0, 0.12, 32.0]} />
        <meshStandardMaterial
          color="#b2c48e"
          bumpMap={textures.clayBump}
          bumpScale={0.012}
          roughness={0.94}
        />
      </mesh>

      {/* ===== MULTI-BLOCK STREET NETWORK (2 E-W Avenues + 2 N-S Streets + Residential Lane) ===== */}
      {/* Main Avenue E-W (Z = -0.5) */}
      <mesh position={[0, 0.018, -0.5]} receiveShadow onClick={handleGroundWalkClick}>
        <boxGeometry args={[36.4, 0.04, 2.0]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.018}
          roughness={weather === 'rainy' ? 0.35 : 0.9}
          metalness={weather === 'rainy' ? 0.12 : 0}
        />
      </mesh>
      {/* South Avenue E-W (Z = +6.5) */}
      <mesh position={[0, 0.018, 6.5]} receiveShadow onClick={handleGroundWalkClick}>
        <boxGeometry args={[36.4, 0.04, 2.0]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.018}
          roughness={weather === 'rainy' ? 0.35 : 0.9}
          metalness={weather === 'rainy' ? 0.12 : 0}
        />
      </mesh>
      {/* West Street N-S (X = -6.6) separating Residential West from Downtown */}
      <mesh position={[-6.6, 0.019, -0.5]} receiveShadow onClick={handleGroundWalkClick}>
        <boxGeometry args={[1.8, 0.04, 20.4]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.016}
          roughness={weather === 'rainy' ? 0.35 : 0.9}
        />
      </mesh>
      {/* East-Center Street N-S (X = +7.4) along the riverbank */}
      <mesh position={[7.4, 0.019, 2.2]} receiveShadow onClick={handleGroundWalkClick}>
        <boxGeometry args={[1.8, 0.04, 15.0]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.016}
          roughness={weather === 'rainy' ? 0.35 : 0.9}
        />
      </mesh>
      {/* Cozy Residential Lane connecting the 3 North Houses to West Street (Z = -5.8) */}
      <mesh position={[-12.2, 0.017, -5.8]} receiveShadow onClick={handleGroundWalkClick}>
        <boxGeometry args={[10.4, 0.04, 1.4]} />
        <meshStandardMaterial color="#d6cab6" roughness={0.9} />
      </mesh>

      {/* Raised Sidewalk Plazas under Commercial Blocks */}
      <RoundedBox args={[11.6, 0.06, 3.2]} radius={0.04} smoothness={2} position={[0, 0.02, -3.2]} receiveShadow onClick={handleGroundWalkClick}>
        <meshStandardMaterial color="#dfd3be" bumpMap={textures.plasterBump} bumpScale={0.008} roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[11.6, 0.06, 3.4]} radius={0.04} smoothness={2} position={[0, 0.02, 3.5]} receiveShadow onClick={handleGroundWalkClick}>
        <meshStandardMaterial color="#dfd3be" bumpMap={textures.plasterBump} bumpScale={0.008} roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[7.4, 0.06, 3.2]} radius={0.04} smoothness={2} position={[-11.8, 0.02, -3.2]} receiveShadow onClick={handleGroundWalkClick}>
        <meshStandardMaterial color="#dfd3be" roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[6.2, 0.06, 3.2]} radius={0.04} smoothness={2} position={[15.0, 0.02, -3.2]} receiveShadow onClick={handleGroundWalkClick}>
        <meshStandardMaterial color="#dfd3be" roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[6.2, 0.06, 3.4]} radius={0.04} smoothness={2} position={[15.0, 0.02, 3.5]} receiveShadow onClick={handleGroundWalkClick}>
        <meshStandardMaterial color="#dfd3be" roughness={0.88} />
      </RoundedBox>

      {/* Zebra crosswalk stripes leading to the Café */}
      {[-0.45, -0.15, 0.15, 0.45].map((cx, idx) => (
        <mesh key={idx} position={[cx, 0.042, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 1.35]} />
          <meshStandardMaterial color="#f5ebd8" roughness={0.85} />
        </mesh>
      ))}

      {/* Reflective rain puddles on the main avenue during rain */}
      {weather === 'rainy' && (
        <>
          <mesh position={[-1.4, 0.044, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.42, 20]} />
            <meshPhysicalMaterial color="#64748b" transparent opacity={0.55} roughness={0.04} clearcoat={1} />
          </mesh>
          <mesh position={[1.8, 0.044, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.52, 22]} />
            <meshPhysicalMaterial color="#64748b" transparent opacity={0.55} roughness={0.04} clearcoat={1} />
          </mesh>
        </>
      )}

      {/* City-wide real rainfall particles */}
      <CityRainParticles active={weather === 'rainy'} />
      {/* Warm festoon string lights draped from café awning to north streetlamp */}
      <PatioStringLights
        start={[-1.22, 1.82, -2.4]}
        end={[-2.28, 2.0, -2.12]}
        isNight={timeOfDay === 'night' || weather === 'rainy'}
      />

      {/* ===== NATURE ZONES: PARK LAKE (Z3), EAST RIVER & BRIDGES (Z4), SOUTH BEACH & PIER (Z5) ===== */}
      <ParkLake position={[4.2, 0.02, -8.2]} />
      <EastRiverAndBridges onWalkClick={handleWalkPoint} />
      <SouthBeachAndPier
        isNight={timeOfDay === 'night'}
        onExploreStreet={(key) => onExploreObject?.(key)}
        onWalkClick={handleWalkPoint}
      />

      {/* Northern Landmark Clocktower overlooking Park & Downtown */}
      <BackgroundClocktower position={[0, 0.04, -12.2]} isNight={timeOfDay === 'night'} />

      {/* ===== Z2: BAIRRO RESIDENCIAL (5 Cozy Houses Facing South +Z) ===== */}
      <ResidentialHouse
        position={[-15.2, 0.04, -8.2]}
        wallColor="#e9d5ff"
        roofColor="#7e22ce"
        doorColor="#5a3827"
        isNight={timeOfDay === 'night'}
        onExplore={() => onTravelToMap?.('interior_house_leo')}
      />
      {/* Door portal into Leo's House 2.5D Interior */}
      {onTravelToMap && (
        <PortalTrigger
          {...HOUSE_TOWN_DOOR}
          color="#a855f7"
          avatarPoseRef={avatarPoseRef}
          enableProximity
          onEnter={() => onTravelToMap('interior_house_leo')}
        />
      )}
      {/* West Avenue Farm Gate Portal -> Sunny Farm Biome */}
      {onTravelToMap && (
        <group>
          <group position={[-17.4, 0.06, -0.5]}>
            {[-1.15, 1.15].map((pz, i) => (
              <mesh key={i} position={[0, 0.52, pz]} castShadow>
                <boxGeometry args={[0.16, 1.04, 0.16]} />
                <meshStandardMaterial color="#7a4e32" roughness={0.88} />
              </mesh>
            ))}
          </group>
          <PortalTrigger
            position={[-17.2, 0.04, -0.5]}
            color="#84cc16"
            radius={0.56}
            avatarPoseRef={avatarPoseRef}
            enableProximity
            proximityRadius={0.78}
            onEnter={() => onTravelToMap('farm')}
          />
        </group>
      )}
      <ResidentialHouse
        position={[-12.2, 0.04, -8.2]}
        wallColor="#f6d8ae"
        roofColor="#b45309"
        doorColor="#2a6f62"
        isNight={timeOfDay === 'night'}
        onExplore={() => handleShopAudio('world_water_flowers', [-12.2, 0.08, -6.9])}
      />
      <ResidentialHouse
        position={[-9.2, 0.04, -8.2]}
        wallColor="#c9dbc3"
        roofColor="#5c4033"
        doorColor="#9a3412"
        isNight={timeOfDay === 'night'}
        onExplore={() => handleShopAudio('world_bakery_bread', [-9.2, 0.08, -6.9])}
      />
      <ResidentialHouse
        position={[-13.8, 0.04, 3.4]}
        wallColor="#fde68a"
        roofColor="#9a3412"
        doorColor="#1d4ed8"
        isNight={timeOfDay === 'night'}
        onExplore={() => handleShopAudio('world_table', [-13.8, 0.08, 4.7])}
      />
      <ResidentialHouse
        position={[-9.8, 0.04, 3.4]}
        wallColor="#e9b8b0"
        roofColor="#7c4732"
        doorColor="#2a6f62"
        isNight={timeOfDay === 'night'}
        onExplore={() => handleShopAudio('world_water_flowers', [-9.8, 0.08, 4.7])}
      />

      {/* ===== ALL 11 INTERACTIVE CITY SHOPS (EVERY FACADE ORIENTED SOUTH +Z!) ===== */}
      {/* Z1 Centro: Bakery (N), Pizzeria (S), Pharmacy (S), PetShop (S), PostBank (South Promenade) */}
      <InteractiveBakery
        position={[3.8, 0.06, -3.5]}
        rotationY={Math.PI}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={makeFlippedShopAudio([3.8, 0.06, -3.5])}
      />
      {/* Door portal into the Artisan Bakery 2.5D Interior */}
      {onTravelToMap && (
        <PortalTrigger
          {...BAKERY_TOWN_DOOR}
          color="#f59e0b"
          avatarPoseRef={avatarPoseRef}
          enableProximity
          onEnter={() => onTravelToMap('interior_bakery')}
        />
      )}
      <InteractivePizzeria
        position={[-3.6, 0.06, 3.4]}
        rotationY={Math.PI}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={makeFlippedShopAudio([-3.6, 0.06, 3.4])}
        onEnterInterior={onEnterPizzeria}
      />
      <InteractivePharmacy
        position={[0.0, 0.06, 3.4]}
        rotationY={0}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={handleShopAudio}
        onEnterInterior={onEnterPharmacy}
      />
      <InteractivePetShop
        position={[3.8, 0.06, 3.4]}
        rotationY={0}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={handleShopAudio}
      />
      {/* Door portal into the Pet Shop & Vet 2.5D Interior */}
      {onTravelToMap && (
        <PortalTrigger
          {...PET_SHOP_TOWN_DOOR}
          color="#38bdf8"
          avatarPoseRef={avatarPoseRef}
          enableProximity
          onEnter={() => onTravelToMap('interior_pet_shop')}
        />
      )}
      <InteractivePostBank
        position={[0.0, 0.06, 8.8]}
        rotationY={Math.PI}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={makeFlippedShopAudio([0.0, 0.06, 8.8])}
      />
      <SchoolFacade position={[-11.8, 0.04, 8.8]} isNight={timeOfDay === 'night'} />
      {/* Door portal into the Baeuda Academy 2.5D Interior */}
      {onTravelToMap && (
        <PortalTrigger
          {...SCHOOL_TOWN_DOOR}
          color="#3b82f6"
          avatarPoseRef={avatarPoseRef}
          enableProximity
          onEnter={() => onTravelToMap('school')}
        />
      )}

      {/* Z2 Cultura & Estilo (West of West Street) */}
      <InteractiveBookshop
        position={[-13.8, 0.06, -3.5]}
        rotationY={Math.PI}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={makeFlippedShopAudio([-13.8, 0.06, -3.5])}
      />
      {/* Door portal into the Bookshop & Stationery 2.5D Interior */}
      {onTravelToMap && (
        <PortalTrigger
          {...BOOKSHOP_TOWN_DOOR}
          color="#22c55e"
          avatarPoseRef={avatarPoseRef}
          enableProximity
          onEnter={() => onTravelToMap('interior_bookshop')}
        />
      )}
      <InteractiveClothingStore
        position={[-9.8, 0.06, -3.5]}
        rotationY={Math.PI}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={makeFlippedShopAudio([-9.8, 0.06, -3.5])}
      />

      {/* Z4 Serviços (East of River, across Bridge 1 & Bridge 2) */}
      <InteractiveBarberShop
        position={[13.5, 0.06, -3.5]}
        rotationY={0}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={handleShopAudio}
      />
      {/* Door portal into the Barber Shop 2.5D Interior */}
      {onTravelToMap && (
        <PortalTrigger
          {...BARBER_TOWN_DOOR}
          color="#ef4444"
          avatarPoseRef={avatarPoseRef}
          enableProximity
          onEnter={() => onTravelToMap('interior_barber')}
        />
      )}
      <InteractiveTechShop
        position={[16.6, 0.06, -3.5]}
        rotationY={0}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={handleShopAudio}
      />
      <InteractiveTireShop
        position={[13.5, 0.06, 3.4]}
        rotationY={Math.PI}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={makeFlippedShopAudio([13.5, 0.06, 3.4])}
      />
      <InteractiveConstructionSite
        position={[16.6, 0.06, 3.4]}
        rotationY={Math.PI}
        isNight={timeOfDay === 'night'}
        onInspectCuriosity={onInspectCuriosity}
        onTriggerAudio={makeFlippedShopAudio([16.6, 0.06, 3.4])}
      />

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

      {/* Walkable Learner Avatar (starts outside Café on the Main Avenue crosswalk) */}
      <group
        ref={avatarGroupRef}
        position={[-0.35, 0.06, -0.5]}
        rotation={[0, Math.PI, 0]}
      >
        <LearnerAvatar
          isWalkingRef={isWalkingRef}
          blockedBumpRef={blockedBumpRef}
          avatarStyle={avatarStyle}
        />
      </group>

      {/* Emergent zero-dialogue street micro-events (Mailbox, Rolled Apple, Patio Parasol) */}
      <StreetMicroEvents
        weather={weather}
        onTriggerAudio={handleShopAudio}
      />

      <CityLife obstacles={OBSTACLE_AABBS} avatarPoseRef={avatarPoseRef} />

      {/* Café da Esquina — tactile artisan diorama hero */}
      <group position={[0, 0.06, -3.6]}>
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

        {/* Tiled hip roof */}
        <ToyRoof position={[0, 2.24, 0]} width={2.8} depth={2.28} color="#8a4a34" />

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
          <ToyAwning colors={CAFE_AWNING} stripe={0.35} depth={0.76} front={1} />
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
          <ToyWindowTrim position={[0, 0, 0.052]} width={0.78} height={0.68} facing={1} />
          {/* Flower box */}
          <RoundedBox args={[0.92, 0.18, 0.22]} radius={0.02} smoothness={2} position={[0, -0.5, 0.09]} castShadow>
            <meshStandardMaterial color="#7a4e32" roughness={0.85} />
          </RoundedBox>
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
          onClick={handleExploreTap('world_table', [-1.62, 0.07, -2.68])}
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
              exploreRingRef.current.position.set(-2.28, 0.07, -2.12);
              exploreRingRef.current.visible = true;
              exploreTimerRef.current = 0.9;
            }
          }}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <mesh geometry={streetlampGeometry()} material={toyMaterial()} castShadow />
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
        </group>

        {/* Emergent Micro-Event: Café Cat + Interactive Water Bowl (zero dialogue!) */}
        <group
          position={[-0.78, 0.02, 1.48]}
          onClick={(e) => {
            e.stopPropagation();
            setCatBowlFilled(true);
            onExploreObject?.('world_cat_water');
            if (exploreRingRef.current) {
              exploreRingRef.current.position.set(-0.78, 0.07, -2.12);
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
                exploreRingRef.current.position.set(bx, 0.07, bz - 3.6);
                exploreRingRef.current.visible = true;
                exploreTimerRef.current = 0.9;
              }
            }}
            onPointerOver={handleDoorPointerOver}
            onPointerOut={handleDoorPointerOut}
          >
            <mesh geometry={bushGeometry()} material={cafeBushMaterial()} castShadow />
          </group>
        ))}

        {/* Cute Mint-Green Vintage Bicycle parked along the right patio wall (interactive: "Bicycle.") */}
        <group
          position={[1.64, 0.06, 0.05]}
          rotation={[0, -0.3, 0]}
          onClick={handleExploreTap('world_bicycle', [1.64, 0.07, -3.55])}
          onPointerOver={handleDoorPointerOver}
          onPointerOut={handleDoorPointerOut}
        >
          <mesh geometry={bicycleGeometry('#6ee7b7')} material={toyMaterial('gloss')} castShadow />
        </group>
      </group>

      {/* North Forest Belt + Park + Residential Trees (4 instanced draw calls, interactive: "Tree.") */}
      <group
        onClick={handleExploreTap('world_tree', [-3.4, 0.07, -11.6])}
        onPointerOver={handleDoorPointerOver}
        onPointerOut={handleDoorPointerOut}
      >
        <InstancedForest />
      </group>

      {/* DISTRICT 2: Open-Air Timber-Framed Local Market Pavilion (Lesson 2) */}
      <group
        position={[-3.6, 0.06, -3.5]}
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
          <ToyAwning colors={MARKET_AWNING} stripe={0.48} depth={1.62} front={1} fogged={marketLocked} />
        </group>
        {/* 6 Rich Clickable 3D Fruit Crates (Apple, Banana, Orange, Strawberry, Grapes, Watermelon) */}
        {[
          { id: 'fruit_apple', pos: [-0.82, 0.78, 0.16] as [number, number, number], color: '#ef4444', kind: 'apple' as const },
          { id: 'fruit_banana', pos: [-0.28, 0.78, 0.16] as [number, number, number], color: '#facc15', kind: 'banana' as const },
          { id: 'fruit_orange', pos: [0.26, 0.78, 0.16] as [number, number, number], color: '#f97316', kind: 'orange' as const },
          { id: 'fruit_strawberry', pos: [0.8, 0.78, 0.16] as [number, number, number], color: '#e11d48', kind: 'strawberry' as const },
          { id: 'fruit_grapes', pos: [-0.68, 0.2, 0.85] as [number, number, number], color: '#7e22ce', kind: 'grapes' as const },
          { id: 'fruit_watermelon', pos: [-0.05, 0.2, 0.85] as [number, number, number], color: '#15803d', kind: 'watermelon' as const },
        ].map((crate) => (
          <group
            key={crate.id}
            position={crate.pos}
            onClick={(e) => {
              e.stopPropagation();
              if (marketLocked) {
                onMapBlockedBump?.();
                return;
              }
              onInspectCuriosity?.(crate.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (marketLocked) return;
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={handleDoorPointerOut}
          >
            <mesh
              geometry={fruitCrateGeometry(crate.kind, crate.color)}
              material={toyMaterial(marketLocked ? 'fog' : 'matte')}
              castShadow={!marketLocked}
            />
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

        {/* Map Lock Fog */}
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
          </>
        )}
      </group>

      {/* DISTRICT 3: Central Plaza in the North Park next to the Lake (Lesson 3) */}
      <group
        position={[-1.6, 0.06, -7.8]}
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

        {/* Map Lock Fog */}
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
          </>
        )}
      </group>

      {/* Floating 3D golden beacon guiding the learner to the active quest NPC */}
      {activeQuestPosition && (
        <QuestBeacon x={activeQuestPosition.x} z={activeQuestPosition.z} />
      )}

      {/* Soft Claybound-style drifting clouds above the city */}
      <StylizedCloud position={[-8.5, 4.6, -11.5]} scale={1.15} speed={0.22} phase={0.4} />
      <StylizedCloud position={[8.2, 4.8, -10.8]} scale={1.05} speed={0.18} phase={2.1} />
      <StylizedCloud position={[0.2, 5.1, -13.2]} scale={1.2} speed={0.15} phase={4.2} />
      </group>
    </MapVisibleRefContext.Provider>
  );
});
