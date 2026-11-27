import type { PetShopTarget } from '../domain/petShopVisit';
import { lotBox, type Aabb, type AvatarPose } from './worldNavigation';

/** Tap targets of the pet shop interior: base point on the surface and size of the invisible hit box. */
export const PET_SHOP_TARGETS: Record<
  PetShopTarget,
  { at: [number, number, number]; hit: [number, number, number] }
> = {
  vet: { at: [-1.75, 0.02, -1.5], hit: [0.75, 1.25, 0.5] },
  tub: { at: [0.05, 0.62, -1.7], hit: [1.1, 0.55, 0.6] },
  cat: { at: [1.75, 0.62, -1.6], hit: [0.75, 0.88, 0.55] },
  collar: { at: [-2.2, 0.36, -0.35], hit: [0.75, 0.36, 0.6] },
  dog: { at: [0, 0.02, -0.65], hit: [1.04, 0.76, 0.66] },
  stethoscope: { at: [2.2, 0.55, -0.45], hit: [0.75, 0.35, 0.6] },
  bowl: { at: [-0.9, 0.02, 0.35], hit: [0.74, 0.32, 0.6] },
  // low stool: any taller and it would cover the puppy behind it
  brush: { at: [0, 0.2, 0.35], hit: [0.72, 0.3, 0.6] },
  ball: { at: [0.9, 0.02, 0.35], hit: [0.74, 0.62, 0.6] },
};

/** Water bowl beside the food: decoration only. */
export const PET_SHOP_WATER_BOWL: [number, number, number] = [-1.6, 0.02, 0.35];

export const PET_SHOP_OBSTACLES: readonly Aabb[] = [
  lotBox(0, -1.7, 2.4, 0.5), // vet, grooming bench and cat stool
  lotBox(0, -0.65, 0.55, 0.35), // puppy
  lotBox(-0.2, 0.35, 1.7, 0.4), // bowls, brush stool and ball
  lotBox(-2.2, -0.35, 0.45, 0.4), // collar table
  lotBox(2.2, -0.45, 0.45, 0.4), // stethoscope table
  lotBox(-2.15, 1.5, 0.5, 0.4), // food sacks
  lotBox(2.15, 1.5, 0.45, 0.4), // toy basket
];

/** Doormat inside the pet shop. */
export const PET_SHOP_EXIT = {
  position: [0, 0.04, 2.8] as [number, number, number],
  radius: 0.5,
  proximityRadius: 0.55,
};

/** East side of the pet shop: clear of the facade's clickables and short of the street (x 6.4). */
export const PET_SHOP_TOWN_DOOR = {
  position: [5.6, 0.04, 3.4] as [number, number, number],
  radius: 0.34,
  proximityRadius: 0.35,
};

/** Sidewalk between the door and the main avenue. */
export const PET_SHOP_TOWN_RETURN: AvatarPose = { x: 5.8, y: 0.06, z: 2.0, yaw: 0 };
