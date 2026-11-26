import type { BakeryTarget } from '../domain/bakeryBasket';
import type { AvatarPose } from './worldNavigation';

/** Tap targets of the bakery interior: base point on the surface and size of the invisible hit box. */
export const BAKERY_TARGETS: Record<
  BakeryTarget,
  { at: [number, number, number]; hit: [number, number, number] }
> = {
  oven: { at: [-1.35, 0.45, -1.7], hit: [1.35, 1.15, 0.3] },
  baker: { at: [0, 0.62, -0.95], hit: [0.75, 0.9, 0.5] },
  dough: { at: [1.45, 0.62, -1.5], hit: [0.95, 0.45, 0.8] },
  bread: { at: [-1.35, 0.62, -0.2], hit: [0.8, 0.36, 0.52] },
  butter: { at: [-0.45, 0.62, -0.2], hit: [0.8, 0.36, 0.52] },
  croissant: { at: [0.45, 0.62, -0.2], hit: [0.8, 0.36, 0.52] },
  slice: { at: [1.35, 0.62, -0.2], hit: [0.8, 0.36, 0.52] },
  bell: { at: [1.4, 0.62, 0.48], hit: [0.68, 0.38, 0.46] },
};

export const BAKERY_BASKET_AT: [number, number, number] = [0, 0.62, 0.46];

/** Doormat inside the bakery, left of centre so the HUD does not cover it. */
export const BAKERY_EXIT = {
  position: [-1.4, 0.04, 2.9] as [number, number, number],
  radius: 0.5,
  proximityRadius: 0.55,
};

/** Doorway by the east corner of the shop: clear of its obstacle and short of the road (z -1.7). */
export const BAKERY_TOWN_DOOR = {
  position: [5.25, 0.04, -2.2] as [number, number, number],
  radius: 0.34,
  proximityRadius: 0.35,
};

/** Where leaving the bakery puts the avatar (same point the minimap uses). */
export const BAKERY_TOWN_RETURN: AvatarPose = { x: 3.8, y: 0.06, z: -1.4, yaw: 0 };
