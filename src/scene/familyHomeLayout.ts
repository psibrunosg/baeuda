import type { FamilyPerson, FamilyTarget } from '../domain/familyRoutine';
import { lotBox, type Aabb, type AvatarPose } from './worldNavigation';

/** Base point on the surface and size of the invisible hit box. */
export interface TapSpot {
  at: [number, number, number];
  hit: [number, number, number];
}

export const FAMILY_TARGETS: Record<FamilyTarget, TapSpot> = {
  bed: { at: [-3.8, 0.04, -2.51], hit: [1.98, 1.02, 1.74] },
  stove: { at: [2.0, 0.91, -2.85], hit: [1.1, 0.7, 0.55] },
  washer: { at: [3.0, 0.02, -0.3], hit: [1.05, 1.1, 0.8] },
  desk: { at: [-1.4, 0.02, -0.5], hit: [1.2, 0.95, 0.75] },
  clock: { at: [1.1, 1.4, -3.92], hit: [1.1, 1.1, 0.24] },
};

export const FAMILY_PEOPLE: Record<FamilyPerson, TapSpot> = {
  mother: { at: [0.8, 0.02, -1.3], hit: [1.1, 1.2, 0.6] },
  grandma: { at: [2.0, 0.02, 0.7], hit: [1.05, 1.2, 0.6] },
  brother: { at: [-0.4, 0.02, 0.3], hit: [1.1, 1.0, 0.6] },
};

/** Angled towards the sofa; far enough from the west wall to show on a portrait phone. */
export const TV_SPOT: TapSpot = { at: [-4.2, 0.02, -0.5], hit: [1.15, 1.2, 1.15] };

/** East wall: two low segments with the backyard doorway between them. */
export const EAST_WALL_X = 5.75;
export const EAST_DOOR = { minZ: -1.8, maxZ: 0.6 };

export const HOUSE_OBSTACLES: readonly Aabb[] = [
  lotBox(-3.8, -2.5, 1.15, 0.95), // Bed
  lotBox(-1.6, -2.9, 0.72, 0.55), // Wardrobe
  lotBox(2.4, -2.9, 1.35, 0.65), // Kitchen Counter & Stove
  lotBox(4.35, -2.7, 0.65, 0.65), // Fridge
  lotBox(-3.8, 1.2, 1.1, 0.65), // Sofa
  lotBox(-3.6, 2.35, 0.65, 0.42), // Coffee Table
  lotBox(4.4, 2.4, 0.55, 1.1), // Bookshelf, south of the backyard door
  lotBox(3.0, -0.3, 0.55, 0.45), // Washing machine
  lotBox(-1.4, -0.5, 0.7, 0.45), // Desk
  lotBox(TV_SPOT.at[0], TV_SPOT.at[2], 0.6, 0.6), // TV rack
  lotBox(0.8, -1.3, 0.4, 0.3), // Mother
  lotBox(2.0, 0.7, 0.4, 0.3), // Grandma
  lotBox(-0.4, 0.3, 0.4, 0.3), // Brother
  { minX: 5.45, maxX: 6.05, minZ: -4.3, maxZ: EAST_DOOR.minZ }, // East wall, north
  { minX: 5.45, maxX: 6.05, minZ: EAST_DOOR.maxZ, maxZ: 4.3 }, // East wall, south, and glass door
  lotBox(8.0, -2.4, 0.95, 0.55), // Swing
  lotBox(8.3, 2.0, 0.95, 0.55), // Table and grill
];

/** Leo's door on the street. */
export const HOUSE_TOWN_DOOR = {
  position: [-15.2, 0.04, -7.05] as [number, number, number],
  radius: 0.44,
  proximityRadius: 0.62,
};

/** Where leaving the house puts the avatar: out of reach of the door, or it would walk back in. */
export const HOUSE_TOWN_RETURN: AvatarPose = { x: -15.2, y: 0.06, z: -6.2, yaw: 0 };

/** Doormat inside the house, just behind the spawn so the HUD pill does not cover it. */
export const HOUSE_EXIT = {
  position: [0, 0.04, 3.1] as [number, number, number],
  radius: 0.4,
  proximityRadius: 0.4,
};
