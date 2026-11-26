import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { BakeryTarget } from '../../domain/bakeryBasket';
import { BAKERY_EXIT, BAKERY_TARGETS, BAKERY_TOWN_DOOR, BAKERY_TOWN_RETURN } from '../bakeryLayout';
import { ACTIVE_WORLD_MAPS, WORLD_MAP_REGISTRY } from '../worldNavigation';

const config = WORLD_MAP_REGISTRY.interior_bakery;
const distance = (p: { x: number; z: number }, portal: { position: [number, number, number] }) =>
  Math.hypot(p.x - portal.position[0], p.z - portal.position[2]);

const targets = Object.keys(BAKERY_TARGETS) as BakeryTarget[];
const hitBox = (id: BakeryTarget) => {
  const { at, hit } = BAKERY_TARGETS[id];
  return new THREE.Box3(
    new THREE.Vector3(at[0] - hit[0] / 2, at[1], at[2] - hit[2] / 2),
    new THREE.Vector3(at[0] + hit[0] / 2, at[1] + hit[1], at[2] + hit[2] / 2),
  );
};

/** Mirrors the fixed 2.5D camera of CameraRig (ExperienceCanvas) with the avatar at the spawn. */
function spawnCamera(width: number, height: number) {
  const aspect = width / height;
  const fov = aspect < 1 ? Math.min(42, Math.round(27 / Math.pow(aspect, 0.45))) : 27;
  const k = aspect < 1 ? 1 + (1 - aspect) * (config.portraitPullback ?? 0) : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  const { defaultSpawn: p, cameraOffset: o, cameraTargetOffset: t } = config;
  camera.position.set(p.x + o[0] * k, o[1] * k, p.z + o[2] * k);
  camera.lookAt(p.x + t[0], t[1], p.z + t[2]);
  camera.updateMatrixWorld();
  return camera;
}

describe('bakery interior layout', () => {
  it('is an active map whose spawn and street return do not bounce through a portal', () => {
    expect(ACTIVE_WORLD_MAPS).toContain('interior_bakery');
    expect(distance(config.defaultSpawn, BAKERY_EXIT)).toBeGreaterThan(BAKERY_EXIT.proximityRadius);
    expect(distance(BAKERY_TOWN_RETURN, BAKERY_TOWN_DOOR)).toBeGreaterThan(BAKERY_TOWN_DOOR.proximityRadius);
  });

  it('does not pull in a player walking along the road', () => {
    expect(BAKERY_TOWN_DOOR.position[2] + BAKERY_TOWN_DOOR.proximityRadius).toBeLessThan(-1.7);
  });

  it.each([
    [375, 812],
    [1280, 720],
    [1366, 768],
  ])('shows the whole doormat ring beside the play button at %ix%i', (width, height) => {
    const camera = spawnCamera(width, height);
    // the interior view offset of ExperienceCanvas (INTERIOR_ZOOM_OUT, INTERIOR_VIEW_TOP)
    camera.setViewOffset(width, height, -width * 0.1, height * -0.02, width * 1.2, height * 1.2);
    const [x, y, z] = BAKERY_EXIT.position;
    const r = BAKERY_EXIT.radius;
    for (const [dx, dz] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
      const n = new THREE.Vector3(x + dx, y, z + dz).project(camera);
      expect(((n.x + 1) / 2) * width).toBeGreaterThan(0);
      expect(((n.x + 1) / 2) * width).toBeLessThan(width / 2 - 32);
      expect(((1 - n.y) / 2) * height).toBeLessThan(height);
    }
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
      expect(Math.abs(BAKERY_TARGETS[id].at[0])).toBeLessThanOrEqual(2.4);
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
  });
});
