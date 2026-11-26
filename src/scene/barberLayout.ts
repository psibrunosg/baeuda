import type { BarberTarget } from '../domain/barberSalon';
import type { AvatarPose } from './worldNavigation';

/** Tap targets of the barber interior: base point on the surface and size of the invisible hit box. */
export const BARBER_TARGETS: Record<
  BarberTarget,
  { at: [number, number, number]; hit: [number, number, number] }
> = {
  // Mannequin heads on the wall shelf
  curly: { at: [-1.35, 1.05, -1.9], hit: [0.78, 0.75, 0.4] },
  straight: { at: [-0.45, 1.05, -1.9], hit: [0.78, 0.75, 0.4] },
  long: { at: [0.45, 1.05, -1.9], hit: [0.78, 0.75, 0.4] },
  short: { at: [1.35, 1.05, -1.9], hit: [0.78, 0.75, 0.4] },
  barber: { at: [-1.35, 0.2, -0.65], hit: [0.75, 1.1, 0.5] },
  // Chin of the client seated in the chair
  beard: { at: [0, 0.85, -0.45], hit: [0.75, 0.45, 0.4] },
  mirror: { at: [1.4, 0.3, -0.65], hit: [0.75, 1.1, 0.3] },
  // Tool counter in front
  comb: { at: [-0.65, 0.62, 0.45], hit: [0.9, 0.36, 0.55] },
  scissors: { at: [0.65, 0.62, 0.45], hit: [0.9, 0.36, 0.55] },
};

/** Doormat inside the barber shop, left of centre so the HUD does not cover it. */
export const BARBER_EXIT = {
  position: [-1.4, 0.04, 3.2] as [number, number, number],
  radius: 0.5,
  proximityRadius: 0.55,
};

/** Gap between the barber and tech shops, in front of the headphones stand (front face at z -2.41). */
export const BARBER_TOWN_DOOR = {
  position: [14.97, 0.04, -2.1] as [number, number, number],
  radius: 0.3,
  proximityRadius: 0.3,
};

/** Road in front of the door; (13.5, -1.4) belongs to the quest NPC. */
export const BARBER_TOWN_RETURN: AvatarPose = { x: 14.97, y: 0.06, z: -1.4, yaw: 0 };
