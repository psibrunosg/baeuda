import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { BarberTarget } from '../../domain/barberSalon';
import { BARBER_EXIT, BARBER_TARGETS, BARBER_TOWN_DOOR, BARBER_TOWN_RETURN } from '../barberLayout';
import { ACTIVE_WORLD_MAPS, lotBox, WORLD_MAP_REGISTRY } from '../worldNavigation';

const distance = (p: { x: number; z: number }, portal: { position: [number, number, number] }) =>
  Math.hypot(p.x - portal.position[0], p.z - portal.position[2]);

const targets = Object.keys(BARBER_TARGETS) as BarberTarget[];
const hitBox = (id: BarberTarget) => {
  const { at, hit } = BARBER_TARGETS[id];
  return new THREE.Box3(
    new THREE.Vector3(at[0] - hit[0] / 2, at[1], at[2] - hit[2] / 2),
    new THREE.Vector3(at[0] + hit[0] / 2, at[1] + hit[1], at[2] + hit[2] / 2),
  );
};

/** Mirrors the fixed 2.5D camera of CameraRig (ExperienceCanvas) with the avatar at the spawn. */
function spawnCamera(width: number, height: number) {
  const config = WORLD_MAP_REGISTRY.interior_barber;
  const aspect = width / height;
  const fov = aspect < 1 ? Math.min(42, Math.round(27 / Math.pow(aspect, 0.45))) : 27;
  const k = aspect < 1 ? 1 + (1 - aspect) * (config.portraitPullback ?? 0) : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  const { defaultSpawn: p, cameraOffset: o, cameraTargetOffset: t } = config;
  // Interiors are framed inside the HUD: INTERIOR_ZOOM_OUT and INTERIOR_VIEW_TOP of ExperienceCanvas.
  camera.setViewOffset(width, height, (width - width * 1.2) / 2, height * -0.02, width * 1.2, height * 1.2);
  camera.position.set(p.x + o[0] * k, o[1] * k, p.z + o[2] * k);
  camera.lookAt(p.x + t[0], t[1], p.z + t[2]);
  camera.updateMatrixWorld();
  return camera;
}

describe('barber interior layout', () => {
  it('is an active map whose spawn and street return do not bounce through a portal', () => {
    expect(ACTIVE_WORLD_MAPS).toContain('interior_barber');
    const { defaultSpawn } = WORLD_MAP_REGISTRY.interior_barber;
    expect(distance(defaultSpawn, BARBER_EXIT)).toBeGreaterThan(BARBER_EXIT.proximityRadius);
    expect(distance(BARBER_TOWN_RETURN, BARBER_TOWN_DOOR)).toBeGreaterThan(BARBER_TOWN_DOOR.proximityRadius);
  });

  it('keeps the town door off the road, the buildings and the things already tappable there', () => {
    const [x, , z] = BARBER_TOWN_DOOR.position;
    const reach = Math.max(BARBER_TOWN_DOOR.radius, BARBER_TOWN_DOOR.proximityRadius);
    expect(z + reach).toBeLessThan(-1.7);
    // Behind this line the tech shop's headphones stand takes the taps meant for the ring.
    expect(z - BARBER_TOWN_DOOR.radius).toBeGreaterThan(-2.41);
    // Barber and tech shop obstacles, copied from NeighborhoodMap.
    for (const box of [lotBox(13.5, -3.5, 1.4, 1.05), lotBox(16.6, -3.5, 1.4, 1.05)]) {
      for (const p of [{ x, z }, BARBER_TOWN_RETURN]) {
        expect(p.x > box.minX && p.x < box.maxX && p.z > box.minZ && p.z < box.maxZ).toBe(false);
      }
    }
    // Pole, chair, tool table, barber, and the street point of the quest NPC.
    for (const [px, pz] of [[12.42, -2.42], [13.22, -2.22], [13.92, -2.26], [14.46, -2.3], [13.5, -1.4]]) {
      expect(distance({ x: px, z: pz }, BARBER_TOWN_DOOR)).toBeGreaterThan(reach + 0.15);
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

    // The exit ring is clear of the centred play button (72px) and, on portrait, above the wide pill.
    const [ex, ey, ez] = BARBER_EXIT.position;
    const r = BARBER_EXIT.radius;
    const centre = toScreen(new THREE.Vector3(ex, ey, ez));
    expect(centre.x).toBeGreaterThan(0);
    expect(centre.y).toBeLessThan(height);
    expect(toScreen(new THREE.Vector3(ex + r, ey, ez)).x).toBeLessThan(width / 2 - 36);
    if (height > width) {
      expect(toScreen(new THREE.Vector3(ex, ey, ez + r)).y).toBeLessThan(height - bottom);
    }

    for (const id of targets) {
      const box = hitBox(id);
      const corners = [box.min.x, box.max.x].flatMap((x) =>
        [box.min.y, box.max.y].flatMap((y) =>
          [box.min.z, box.max.z].map((z) => toScreen(new THREE.Vector3(x, y, z))),
        ),
      );
      const xs = corners.map((c) => c.x);
      const ys = corners.map((c) => c.y);
      expect(Math.abs(BARBER_TARGETS[id].at[0])).toBeLessThanOrEqual(2.4);
      expect(Math.min(...xs), id).toBeGreaterThan(0);
      expect(Math.max(...xs), id).toBeLessThan(width);
      expect(Math.min(...ys), id).toBeGreaterThan(top);
      expect(Math.max(...ys), id).toBeLessThan(height - bottom);
      expect(Math.max(...xs) - Math.min(...xs), id).toBeGreaterThanOrEqual(44);
      expect(Math.max(...ys) - Math.min(...ys), id).toBeGreaterThanOrEqual(30);

      // Hit boxes never share space.
      for (const other of targets.filter((o) => o !== id)) {
        expect(box.intersectsBox(hitBox(other)), `${id}/${other}`).toBe(false);
      }

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
