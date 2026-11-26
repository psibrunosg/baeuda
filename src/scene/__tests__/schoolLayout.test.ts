import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SchoolTarget } from '../../domain/schoolLesson';
import {
  SCHOOL_EXIT,
  SCHOOL_OBSTACLES,
  SCHOOL_TARGETS,
  SCHOOL_TOWN_DOOR,
  SCHOOL_TOWN_RETURN,
} from '../schoolLayout';
import { ACTIVE_WORLD_MAPS, WORLD_MAP_REGISTRY } from '../worldNavigation';

const config = WORLD_MAP_REGISTRY.school;
const distance = (p: { x: number; z: number }, portal: { position: [number, number, number] }) =>
  Math.hypot(p.x - portal.position[0], p.z - portal.position[2]);

const targets = Object.keys(SCHOOL_TARGETS) as SchoolTarget[];
const hitBox = (id: SchoolTarget) => {
  const { at, hit } = SCHOOL_TARGETS[id];
  return new THREE.Box3(
    new THREE.Vector3(at[0] - hit[0] / 2, at[1], at[2] - hit[2] / 2),
    new THREE.Vector3(at[0] + hit[0] / 2, at[1] + hit[1], at[2] + hit[2] / 2),
  );
};

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

describe('school interior layout', () => {
  it('is an active map whose spawn and street return do not bounce through a portal', () => {
    expect(ACTIVE_WORLD_MAPS).toContain('school');
    expect(distance(config.defaultSpawn, SCHOOL_EXIT)).toBeGreaterThan(SCHOOL_EXIT.proximityRadius);
    expect(distance(SCHOOL_TOWN_RETURN, SCHOOL_TOWN_DOOR)).toBeGreaterThan(SCHOOL_TOWN_DOOR.proximityRadius);
  });

  it('spawns outside the furniture and keeps every target off the way to the exit', () => {
    const { x, z } = config.defaultSpawn;
    for (const o of SCHOOL_OBSTACLES) {
      expect(x > o.minX && x < o.maxX && z > o.minZ && z < o.maxZ).toBe(false);
    }
    // a corridor as wide as the doormat ring, from just behind the spawn to the exit
    const way = new THREE.Box3(
      new THREE.Vector3(-SCHOOL_EXIT.radius, 0, z - 0.4),
      new THREE.Vector3(SCHOOL_EXIT.radius, 2, SCHOOL_EXIT.position[2] + SCHOOL_EXIT.radius),
    );
    for (const id of targets) expect(hitBox(id).intersectsBox(way), id).toBe(false);
    for (const o of SCHOOL_OBSTACLES) {
      expect(o.minX < way.max.x && o.maxX > way.min.x && o.minZ < way.max.z && o.maxZ > way.min.z).toBe(false);
    }
  });

  it('puts the town door between the building and the sea, clear of the south avenue', () => {
    const [x, , z] = SCHOOL_TOWN_DOOR.position;
    const r = SCHOOL_TOWN_DOOR.proximityRadius;
    expect(z - r).toBeGreaterThan(7.5);
    expect(z - r).toBeGreaterThanOrEqual(9.8); // the building box is z 7.8..9.8
    expect(Math.abs(x - -11.8)).toBeLessThan(1.5);
    expect(z).toBeLessThan(12.2);
    expect(SCHOOL_TOWN_RETURN.z).toBeLessThan(12.2);
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
      expect(Math.abs(SCHOOL_TARGETS[id].at[0]), id).toBeLessThanOrEqual(2.4);
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
    }

    const [x, y, z] = SCHOOL_EXIT.position;
    const r = SCHOOL_EXIT.radius;
    for (const [dx, dz] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
      const p = toScreen(new THREE.Vector3(x + dx, y, z + dz));
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(width);
      expect(p.y).toBeGreaterThan(top);
      expect(p.y).toBeLessThan(height - bottom);
    }
  });
});
