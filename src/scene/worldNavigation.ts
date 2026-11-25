import type { WorldMapId } from '../domain/types';

export interface AvatarPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface Aabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ShadowFrustumSpec {
  left: number;
  right: number;
  top: number;
  bottom: number;
  far: number;
}

export interface WorldMapConfig {
  id: WorldMapId;
  icon: string;
  label: string;
  kind: 'exterior' | 'interior';
  defaultSpawn: AvatarPose;
  bounds: WorldBounds;
  cameraOffset: readonly [number, number, number];
  cameraTargetOffset: readonly [number, number, number];
  shadowFrustum: ShadowFrustumSpec;
  contactShadowScale: number;
  /** Extra camera distance on tall screens, so wide rooms keep their sides in frame. */
  portraitPullback?: number;
  bgColor?: string;
}

export function lotBox(cx: number, cz: number, halfW = 1.45, halfD = 1.15): Aabb {
  return { minX: cx - halfW, maxX: cx + halfW, minZ: cz - halfD, maxZ: cz + halfD };
}

export function resolveObstacleCollision(
  x: number,
  z: number,
  prevX: number,
  prevZ: number,
  obstacles: readonly Aabb[],
  customBlocker?: (cx: number, cz: number) => boolean,
): [number, number] {
  if (customBlocker?.(x, z)) {
    if (!customBlocker(prevX, z)) return [prevX, z];
    if (!customBlocker(x, prevZ)) return [x, prevZ];
    return [prevX, prevZ];
  }
  for (const box of obstacles) {
    if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
      if (prevX <= box.minX || prevX >= box.maxX) return [prevX, z];
      if (prevZ <= box.minZ || prevZ >= box.maxZ) return [x, prevZ];
      return [prevX, prevZ];
    }
  }
  return [x, z];
}

export const ACTIVE_WORLD_MAPS: readonly WorldMapId[] = [
  'town',
  'interior_house_leo',
  'farm',
];

export const WORLD_MAP_REGISTRY: Record<WorldMapId, WorldMapConfig> = {
  town: {
    id: 'town',
    icon: '🏙️',
    label: 'Baeuda Town',
    kind: 'exterior',
    defaultSpawn: { x: -0.35, y: 0.06, z: -0.5, yaw: Math.PI },
    bounds: { minX: -17.8, maxX: 17.8, minZ: -11.4, maxZ: 15.0 },
    cameraOffset: [0, 11.4, 9.4],
    cameraTargetOffset: [0, 0.35, -0.35],
    shadowFrustum: { left: -22, right: 22, top: 18, bottom: -18, far: 48 },
    contactShadowScale: 42,
  },
  interior_house_leo: {
    id: 'interior_house_leo',
    icon: '🏡',
    label: "Leo's House",
    kind: 'interior',
    defaultSpawn: { x: 0, y: 0.06, z: 3.1, yaw: Math.PI },
    bounds: { minX: -5.2, maxX: 5.2, minZ: -3.6, maxZ: 3.8 },
    cameraOffset: [0, 8.8, 7.2],
    cameraTargetOffset: [0, 0.35, -0.3],
    shadowFrustum: { left: -7.5, right: 7.5, top: 6.5, bottom: -6.5, far: 24 },
    contactShadowScale: 14,
    bgColor: '#261e1a',
  },
  interior_cafe: {
    id: 'interior_cafe',
    icon: '☕',
    label: 'Corner Café',
    kind: 'interior',
    defaultSpawn: { x: 0, y: 0.06, z: 3.2, yaw: Math.PI },
    bounds: { minX: -4.9, maxX: 4.9, minZ: -1.2, maxZ: 6.6 },
    cameraOffset: [0, 9.6, 6.6],
    cameraTargetOffset: [0, 0.6, -2.6],
    shadowFrustum: { left: -9, right: 9, top: 9, bottom: -9, far: 30 },
    contactShadowScale: 14,
    portraitPullback: 0.9,
    bgColor: '#f3e5cf',
  },
  farm: {
    id: 'farm',
    icon: '🌾',
    label: 'Sunny Farm',
    kind: 'exterior',
    defaultSpawn: { x: 9.8, y: 0.06, z: 0.2, yaw: -Math.PI / 2 },
    bounds: { minX: -11.5, maxX: 11.5, minZ: -8.5, maxZ: 8.5 },
    cameraOffset: [0, 11.4, 9.4],
    cameraTargetOffset: [0, 0.35, -0.35],
    shadowFrustum: { left: -16, right: 16, top: 14, bottom: -14, far: 40 },
    contactShadowScale: 28,
  },
  // Reserved biome configs for upcoming phases (same WorldMapBase architecture)
  mountain: {
    id: 'mountain',
    icon: '🏔️',
    label: 'Misty Peak',
    kind: 'exterior',
    defaultSpawn: { x: 0, y: 0.06, z: 7.5, yaw: Math.PI },
    bounds: { minX: -11, maxX: 11, minZ: -9, maxZ: 9 },
    cameraOffset: [0, 11.4, 9.4],
    cameraTargetOffset: [0, 0.35, -0.35],
    shadowFrustum: { left: -16, right: 16, top: 14, bottom: -14, far: 40 },
    contactShadowScale: 28,
  },
  cavern: {
    id: 'cavern',
    icon: '💎',
    label: 'Echo Cavern',
    kind: 'interior',
    defaultSpawn: { x: 0, y: 0.06, z: 5.5, yaw: Math.PI },
    bounds: { minX: -8, maxX: 8, minZ: -6, maxZ: 6 },
    cameraOffset: [0, 9.2, 7.6],
    cameraTargetOffset: [0, 0.35, -0.3],
    shadowFrustum: { left: -10, right: 10, top: 9, bottom: -9, far: 28 },
    contactShadowScale: 18,
    bgColor: '#13172b',
  },
  beach_island: {
    id: 'beach_island',
    icon: '🏖️',
    label: 'Lighthouse Island',
    kind: 'exterior',
    defaultSpawn: { x: 0, y: 0.06, z: 6.5, yaw: Math.PI },
    bounds: { minX: -10, maxX: 10, minZ: -8, maxZ: 8 },
    cameraOffset: [0, 11.4, 9.4],
    cameraTargetOffset: [0, 0.35, -0.35],
    shadowFrustum: { left: -15, right: 15, top: 13, bottom: -13, far: 38 },
    contactShadowScale: 26,
  },
  station: {
    id: 'station',
    icon: '🚉',
    label: 'Grand Station',
    kind: 'exterior',
    defaultSpawn: { x: -8, y: 0.06, z: 0, yaw: Math.PI / 2 },
    bounds: { minX: -10, maxX: 10, minZ: -7, maxZ: 7 },
    cameraOffset: [0, 11.0, 9.0],
    cameraTargetOffset: [0, 0.35, -0.35],
    shadowFrustum: { left: -15, right: 15, top: 13, bottom: -13, far: 38 },
    contactShadowScale: 26,
  },
  festival: {
    id: 'festival',
    icon: '🎪',
    label: 'Festival Grounds',
    kind: 'exterior',
    defaultSpawn: { x: 0, y: 0.06, z: 6.5, yaw: Math.PI },
    bounds: { minX: -10, maxX: 10, minZ: -8, maxZ: 8 },
    cameraOffset: [0, 11.4, 9.4],
    cameraTargetOffset: [0, 0.35, -0.35],
    shadowFrustum: { left: -15, right: 15, top: 13, bottom: -13, far: 38 },
    contactShadowScale: 26,
  },
};
