import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { BookshopTarget } from '../../domain/bookshopVisit';
import { CITY_QUESTS } from '../../domain/inventoryAndQuests';
import { BAKERY_TOWN_DOOR } from '../bakeryLayout';
import { BARBER_TOWN_DOOR } from '../barberLayout';
import {
  BOOKSHOP_EXIT,
  BOOKSHOP_LADDER,
  BOOKSHOP_OBSTACLES,
  BOOKSHOP_TARGETS,
  BOOKSHOP_TOWN_DOOR,
  BOOKSHOP_TOWN_RETURN,
  fillerBooks,
} from '../bookshopLayout';
import { HOUSE_TOWN_DOOR } from '../familyHomeLayout';
import { SCHOOL_TOWN_DOOR } from '../schoolLayout';
import { ACTIVE_WORLD_MAPS, WORLD_MAP_REGISTRY } from '../worldNavigation';

const config = WORLD_MAP_REGISTRY.interior_bookshop;
const distance = (p: { x: number; z: number }, portal: { position: [number, number, number] }) =>
  Math.hypot(p.x - portal.position[0], p.z - portal.position[2]);

const targets = Object.keys(BOOKSHOP_TARGETS) as BookshopTarget[];
const hitBox = (id: BookshopTarget) => {
  const { at, hit } = BOOKSHOP_TARGETS[id];
  return new THREE.Box3(
    new THREE.Vector3(at[0] - hit[0] / 2, at[1], at[2] - hit[2] / 2),
    new THREE.Vector3(at[0] + hit[0] / 2, at[1] + hit[1], at[2] + hit[2] / 2),
  );
};

/** Everything the rolling ladder ever occupies. */
const ladderSweep = (() => {
  const { x, travel, halfWidth, height, footZ, topZ } = BOOKSHOP_LADDER;
  return new THREE.Box3(
    new THREE.Vector3(x - travel - halfWidth, 0, topZ - 0.05),
    new THREE.Vector3(x + travel + halfWidth, height + 0.05, footZ + 0.05),
  );
})();

/**
 * Mirrors CameraRig (ExperienceCanvas) with the avatar at the spawn, including the view offset
 * that frames interiors inside the HUD (INTERIOR_ZOOM_OUT 1.2, INTERIOR_VIEW_TOP -0.02).
 */
function spawnCamera(width: number, height: number) {
  const aspect = width / height;
  const fov = aspect < 1 ? Math.min(42, Math.round(27 / Math.pow(aspect, 0.45))) : 27;
  const k = aspect < 1 ? 1 + (1 - aspect) * (config.portraitPullback ?? 0) : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  camera.setViewOffset(width, height, (width - width * 1.2) / 2, height * -0.02, width * 1.2, height * 1.2);
  const { defaultSpawn: p, cameraOffset: o, cameraTargetOffset: t } = config;
  camera.position.set(p.x + o[0] * k, o[1] * k, p.z + o[2] * k);
  camera.lookAt(p.x + t[0], t[1], p.z + t[2]);
  camera.updateMatrixWorld();
  return camera;
}

describe('bookshop interior layout', () => {
  it('is an active map whose spawn and street return do not bounce through a portal', () => {
    expect(ACTIVE_WORLD_MAPS).toContain('interior_bookshop');
    expect(distance(config.defaultSpawn, BOOKSHOP_EXIT)).toBeGreaterThan(BOOKSHOP_EXIT.proximityRadius);
    const farmGate = { position: [-17.2, 0.04, -0.5] as [number, number, number], proximityRadius: 0.78 };
    for (const door of [BOOKSHOP_TOWN_DOOR, BAKERY_TOWN_DOOR, BARBER_TOWN_DOOR, SCHOOL_TOWN_DOOR, HOUSE_TOWN_DOOR, farmGate]) {
      expect(distance(BOOKSHOP_TOWN_RETURN, door)).toBeGreaterThan(door.proximityRadius);
    }
    const npc = CITY_QUESTS.find((q) => q.id === 'quest_librarian_book')!.npcPosition!;
    expect(Math.hypot(BOOKSHOP_TOWN_RETURN.x - npc.x, BOOKSHOP_TOWN_RETURN.z - npc.z)).toBeGreaterThan(1);
  });

  it('puts the town door in the gap beside the bookshop, clear of the avenue', () => {
    const [x, , z] = BOOKSHOP_TOWN_DOOR.position;
    const r = BOOKSHOP_TOWN_DOOR.radius;
    expect(z + r).toBeLessThan(-1.5); // main avenue edge
    expect(x - r).toBeGreaterThan(-12.4); // bookshop lot, with its outdoor librarian
    expect(x + r).toBeLessThan(-11.34); // clothing store's sneaker stand
  });

  it('spawns outside the furniture and keeps every target off the way to the exit', () => {
    const { x, z } = config.defaultSpawn;
    for (const o of BOOKSHOP_OBSTACLES) {
      expect(x > o.minX && x < o.maxX && z > o.minZ && z < o.maxZ).toBe(false);
    }
    // a corridor as wide as the doormat ring, from just behind the spawn to the exit
    const way = new THREE.Box3(
      new THREE.Vector3(-BOOKSHOP_EXIT.radius, 0, z - 0.4),
      new THREE.Vector3(BOOKSHOP_EXIT.radius, 2, BOOKSHOP_EXIT.position[2] + BOOKSHOP_EXIT.radius),
    );
    for (const id of targets) expect(hitBox(id).intersectsBox(way), id).toBe(false);
    for (const o of BOOKSHOP_OBSTACLES) {
      expect(o.minX < way.max.x && o.maxX > way.min.x && o.minZ < way.max.z && o.maxZ > way.min.z).toBe(false);
    }
  });

  it('gives each target its own space and keeps shelf books out of the featured one', () => {
    for (const [i, a] of targets.entries()) {
      for (const b of targets.slice(i + 1)) expect(hitBox(a).intersectsBox(hitBox(b)), `${a}/${b}`).toBe(false);
    }
    const featured = hitBox('book');
    for (const b of fillerBooks()) {
      const overlaps =
        b.x + b.width / 2 > featured.min.x &&
        b.x - b.width / 2 < featured.max.x &&
        b.y + b.height > featured.min.y &&
        b.y < featured.max.y;
      expect(overlaps).toBe(false);
    }
    expect(fillerBooks().length).toBeGreaterThan(60);
  });

  it.each([
    // width, height, top bars, bottom guidance pill and buttons
    [375, 812, 150, 190],
    [1366, 768, 100, 130],
  ])('keeps every tap target big, on screen and unobstructed at %ix%i', (width, height, top, bottom) => {
    const camera = spawnCamera(width, height);
    const toScreen = (v: THREE.Vector3) => {
      const n = v.clone().project(camera);
      return { x: ((n.x + 1) / 2) * width, y: ((1 - n.y) / 2) * height };
    };

    for (const id of targets) {
      const box = hitBox(id);
      const corners = [box.min.x, box.max.x].flatMap((x) =>
        [box.min.y, box.max.y].flatMap((y) =>
          [box.min.z, box.max.z].map((z) => toScreen(new THREE.Vector3(x, y, z))),
        ),
      );
      const xs = corners.map((c) => c.x);
      const ys = corners.map((c) => c.y);
      expect(Math.abs(BOOKSHOP_TARGETS[id].at[0]), id).toBeLessThanOrEqual(2.4);
      expect(Math.min(...xs), id).toBeGreaterThan(0);
      expect(Math.max(...xs), id).toBeLessThan(width);
      expect(Math.min(...ys), id).toBeGreaterThan(top);
      expect(Math.max(...ys), id).toBeLessThan(height - bottom);
      expect(Math.max(...xs) - Math.min(...xs), id).toBeGreaterThanOrEqual(44);
      expect(Math.max(...ys) - Math.min(...ys), id).toBeGreaterThanOrEqual(30);

      // A tap on the middle of the target reaches it before any other hit box.
      const centre = box.getCenter(new THREE.Vector3());
      const ray = new THREE.Ray(camera.position, centre.clone().sub(camera.position).normalize());
      const first = targets
        .map((other) => ({ other, point: ray.intersectBox(hitBox(other), new THREE.Vector3()) }))
        .filter((hit) => hit.point)
        .sort((a, b) => camera.position.distanceTo(a.point!) - camera.position.distanceTo(b.point!))[0];
      expect(first.other).toBe(id);

      // The ladder never rolls between the camera and the inner part of a target.
      for (const dx of [-0.35, 0, 0.35]) {
        for (const dy of [-0.35, 0, 0.35]) {
          const size = box.getSize(new THREE.Vector3());
          const point = centre.clone().add(new THREE.Vector3(dx * size.x, dy * size.y, 0));
          const probe = new THREE.Ray(camera.position, point.clone().sub(camera.position).normalize());
          const blocked = probe.intersectBox(ladderSweep, new THREE.Vector3());
          if (blocked) {
            expect(camera.position.distanceTo(blocked), id).toBeGreaterThan(camera.position.distanceTo(point));
          }
        }
      }

      // The hint arrow stays below the top bars (HintMarker: base at hit + 0.22, bob 0.06, half height 0.12).
      const { at, hit } = BOOKSHOP_TARGETS[id];
      expect(toScreen(new THREE.Vector3(at[0], at[1] + hit[1] + 0.4, at[2])).y, id).toBeGreaterThan(top);
    }

    const [x, y, z] = BOOKSHOP_EXIT.position;
    const r = BOOKSHOP_EXIT.radius;
    for (const [dx, dz] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
      const p = toScreen(new THREE.Vector3(x + dx, y, z + dz));
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(width);
      expect(p.y).toBeGreaterThan(top);
      expect(p.y).toBeLessThan(height - bottom);
    }
  });
});
