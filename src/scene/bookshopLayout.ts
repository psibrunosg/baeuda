import type { BookshopTarget } from '../domain/bookshopVisit';
import { lotBox, type Aabb, type AvatarPose } from './worldNavigation';

/** Tap targets of the bookshop interior: base point on the surface and size of the invisible hit box. */
export const BOOKSHOP_TARGETS: Record<
  BookshopTarget,
  { at: [number, number, number]; hit: [number, number, number] }
> = {
  librarian: { at: [-1.75, 0.02, -1.5], hit: [0.75, 1.25, 0.5] },
  book: { at: [0.1, 0.8, -1.95], hit: [0.74, 0.66, 0.3] },
  globe: { at: [-2.2, 0.6, -0.45], hit: [0.75, 0.75, 0.6] },
  storybook: { at: [2.05, 0.6, -0.45], hit: [0.85, 0.4, 0.65] },
  notebook: { at: [-0.8, 0.62, 0.35], hit: [0.74, 0.3, 0.6] },
  pen: { at: [0, 0.62, 0.35], hit: [0.74, 0.3, 0.6] },
  pencil: { at: [0.8, 0.62, 0.35], hit: [0.74, 0.3, 0.6] },
};

/** Walnut bookcases along the back wall: bay centres (x) and the top of each shelf board (y). */
export const BOOKSHOP_BAYS = [-2.3, 0, 2.3] as const;
export const BOOKSHOP_SHELF_LEVELS = [0.2, 0.8, 1.56] as const;

export interface SpineBook {
  /** centre */
  x: number;
  /** base, on the shelf */
  y: number;
  width: number;
  height: number;
  color: string;
}

const SPINE_COLORS = ['#1d4ed8', '#d97706', '#15803d', '#7c3aed', '#0f766e', '#eab308', '#be5a7c', '#e7dac5'];

/** Decorative books filling the shelves, leaving room around the featured one. */
export function fillerBooks(): SpineBook[] {
  const { at, hit } = BOOKSHOP_TARGETS.book;
  const out: SpineBook[] = [];
  BOOKSHOP_BAYS.forEach((bay, b) =>
    BOOKSHOP_SHELF_LEVELS.forEach((y, level) => {
      let left = bay - 1.02;
      for (let i = b * 5 + level * 3; ; i++) {
        const width = 0.09 + (i % 3) * 0.025;
        if (left + width > bay + 1.02) return;
        const x = left + width / 2;
        left += width + 0.012;
        if (y === at[1] && Math.abs(x - at[0]) < (hit[0] + width) / 2) continue;
        out.push({ x, y, width, height: 0.34 + ((i * 7) % 5) * 0.035, color: SPINE_COLORS[(i * 3) % SPINE_COLORS.length] });
      }
    }),
  );
  return out;
}

/** Sliding library ladder: rest position, how far it rolls to each side and the room it takes. */
export const BOOKSHOP_LADDER = {
  x: 1.3,
  travel: 0.3,
  halfWidth: 0.2,
  height: 1.95,
  footZ: -1.5,
  topZ: -1.84,
};

export const BOOKSHOP_OBSTACLES: readonly Aabb[] = [
  lotBox(0, -1.7, 3.4, 0.55), // bookcases, ladder and the librarian's side
  lotBox(0, 0.35, 1.3, 0.4), // stationery table
  lotBox(-2.2, -0.45, 0.45, 0.4), // globe
  lotBox(2.35, -0.7, 0.75, 0.7), // reading corner
  lotBox(-2.1, 1.45, 0.45, 0.4), // backpack
  lotBox(2.15, 1.5, 0.45, 0.4), // display crate
];

/** Doormat inside the bookshop. */
export const BOOKSHOP_EXIT = {
  position: [0, 0.04, 2.8] as [number, number, number],
  radius: 0.5,
  proximityRadius: 0.55,
};

/** Gap between the bookshop and the clothing store: clear of the librarian outside and short of the road (z -1.5). */
export const BOOKSHOP_TOWN_DOOR = {
  position: [-11.9, 0.04, -2.15] as [number, number, number],
  radius: 0.34,
  proximityRadius: 0.35,
};

/** Road in front of the door; (-13.8, -1.4) belongs to the quest NPC. */
export const BOOKSHOP_TOWN_RETURN: AvatarPose = { x: -11.9, y: 0.06, z: -1.4, yaw: 0 };
