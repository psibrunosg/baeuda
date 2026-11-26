import type { SchoolTarget } from '../domain/schoolLesson';
import { lotBox, type Aabb, type AvatarPose } from './worldNavigation';

/** Tap targets of the school interior: base point on the surface and size of the invisible hit box. */
export const SCHOOL_TARGETS: Record<
  SchoolTarget,
  { at: [number, number, number]; hit: [number, number, number] }
> = {
  teacher: { at: [-1.75, 0.02, -1.5], hit: [0.75, 1.25, 0.5] },
  board: { at: [0.15, 0.62, -2.1], hit: [2.6, 1.0, 0.16] },
  globe: { at: [-2.2, 0.6, -0.45], hit: [0.75, 0.75, 0.6] },
  science: { at: [2.15, 0.6, -0.6], hit: [0.85, 0.65, 0.6] },
  notebook: { at: [-0.8, 0.62, 0.35], hit: [0.74, 0.3, 0.6] },
  pencil: { at: [0, 0.62, 0.35], hit: [0.74, 0.3, 0.6] },
  homework: { at: [0.8, 0.62, 0.35], hit: [0.74, 0.3, 0.6] },
  art: { at: [-2.15, 0.02, 1.45], hit: [0.8, 1.2, 0.45] },
  backpack: { at: [2.05, 0.02, 1.5], hit: [0.8, 0.7, 0.6] },
};

/** Where the decorative desks stand (x, z). */
export const SCHOOL_SPARE_DESKS: ReadonlyArray<readonly [number, number]> = [
  [-2.75, 2.65],
  [-1.55, 2.65],
  [1.55, 2.65],
  [2.75, 2.65],
];

export const SCHOOL_OBSTACLES: readonly Aabb[] = [
  lotBox(0, -1.7, 3.4, 0.55), // blackboard wall and the teacher's side
  lotBox(0, 0.35, 1.3, 0.4), // student desk
  lotBox(-2.2, -0.45, 0.45, 0.4), // globe
  lotBox(2.15, -0.6, 0.55, 0.45), // science bench
  lotBox(-2.15, 1.45, 0.5, 0.4), // easel
  lotBox(2.05, 1.5, 0.45, 0.4), // backpack
  ...SCHOOL_SPARE_DESKS.map(([x, z]) => lotBox(x, z, 0.45, 0.55)),
];

/** Doormat inside the school. */
export const SCHOOL_EXIT = {
  position: [0, 0.04, 2.8] as [number, number, number],
  radius: 0.5,
  proximityRadius: 0.55,
};

/** Doorway on the south side of the school: clear of the avenue (z 7.7) and short of the sea. */
export const SCHOOL_TOWN_DOOR = {
  position: [-11.8, 0.04, 10.15] as [number, number, number],
  radius: 0.34,
  proximityRadius: 0.35,
};

/** Where leaving the school puts the avatar. */
export const SCHOOL_TOWN_RETURN: AvatarPose = { x: -11.8, y: 0.06, z: 11.0, yaw: 0 };
