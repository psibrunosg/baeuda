import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  FAMILY_PEOPLE,
  FAMILY_TARGETS,
  HOUSE_EXIT,
  HOUSE_OBSTACLES,
  HOUSE_TOWN_DOOR,
  HOUSE_TOWN_RETURN,
  TV_SPOT,
  type TapSpot,
} from '../familyHomeLayout';
import { resolveObstacleCollision, WORLD_MAP_REGISTRY } from '../worldNavigation';

const config = WORLD_MAP_REGISTRY.interior_house_leo;
const spawn = config.defaultSpawn;

const spots: Record<string, TapSpot> = { ...FAMILY_TARGETS, ...FAMILY_PEOPLE, tv: TV_SPOT };
const hitBox = ({ at, hit }: TapSpot) =>
  new THREE.Box3(
    new THREE.Vector3(at[0] - hit[0] / 2, at[1], at[2] - hit[2] / 2),
    new THREE.Vector3(at[0] + hit[0] / 2, at[1] + hit[1], at[2] + hit[2] / 2),
  );
const insideObstacle = (x: number, z: number) =>
  HOUSE_OBSTACLES.some((b) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);

/** Mirrors the click-to-walk loop of WorldMapBase at 60 fps; returns where the avatar stops. */
function walk(from: { x: number; z: number }, to: { x: number; z: number }) {
  const step = 2.8 / 60;
  let { x, z } = from;
  for (let frame = 0; frame < 1000; frame++) {
    const dist = Math.hypot(to.x - x, to.z - z);
    if (dist < 0.08) break;
    const s = Math.min(dist, step);
    const [nx, nz] = resolveObstacleCollision(
      x + ((to.x - x) / dist) * s,
      z + ((to.z - z) / dist) * s,
      x,
      z,
      HOUSE_OBSTACLES,
    );
    if (Math.hypot(nx - x, nz - z) < s * 0.15) break;
    [x, z] = [nx, nz];
  }
  return { x, z };
}

/** Mirrors CameraRig (ExperienceCanvas): fixed 2.5D camera, interior view offset, avatar at the spawn. */
function spawnCamera(width: number, height: number) {
  const aspect = width / height;
  const fov = aspect < 1 ? Math.min(42, Math.round(27 / Math.pow(aspect, 0.45))) : 27;
  const k = aspect < 1 ? 1 + (1 - aspect) * (config.portraitPullback ?? 0) : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  const w = width * 1.2;
  const h = height * 1.2;
  camera.setViewOffset(width, height, (width - w) / 2, height * -0.02, w, h);
  const { cameraOffset: o, cameraTargetOffset: t } = config;
  camera.position.set(spawn.x + o[0] * k, o[1] * k, spawn.z + o[2] * k);
  camera.lookAt(spawn.x + t[0], t[1], spawn.z + t[2]);
  camera.updateMatrixWorld();
  return camera;
}

describe('family home layout', () => {
  it('spawns on free floor, out of reach of the exit portal', () => {
    expect(insideObstacle(spawn.x, spawn.z)).toBe(false);
    const toExit = Math.hypot(spawn.x - HOUSE_EXIT.position[0], spawn.z - HOUSE_EXIT.position[2]);
    expect(toExit).toBeGreaterThan(HOUSE_EXIT.proximityRadius);
    // The framing below holds wherever the avatar walks in depth.
    expect(config.cameraFixedZ).toBe(spawn.z);
  });

  it('leaves the learner on the street, out of reach of the house door', () => {
    const [x, , z] = HOUSE_TOWN_DOOR.position;
    expect(Math.hypot(HOUSE_TOWN_RETURN.x - x, HOUSE_TOWN_RETURN.z - z)).toBeGreaterThan(
      HOUSE_TOWN_DOOR.proximityRadius,
    );
  });

  it('lets the learner through the backyard door and not through the wall', () => {
    const through = walk({ x: 5.0, z: -0.6 }, { x: 6.8, z: -0.6 });
    expect(through.x).toBeGreaterThan(6.7);
    const blocked = walk({ x: 5.0, z: 2.5 }, { x: 6.8, z: 2.5 });
    expect(blocked.x).toBeLessThan(5.75);
  });

  it('walks from the doormat to the backyard with a single tap', () => {
    const target = { x: 6.8, z: -0.8 };
    const end = walk(spawn, target);
    expect(Math.hypot(end.x - target.x, end.z - target.z)).toBeLessThan(0.1);
    expect(target.x).toBeLessThanOrEqual(config.bounds.maxX);
  });

  it('walks back from the backyard to the spawn with a single tap', () => {
    const end = walk({ x: 6.8, z: -0.2 }, spawn);
    expect(Math.hypot(end.x - spawn.x, end.z - spawn.z)).toBeLessThan(0.1);
  });

  it.each([
    // width, height, top bars and spoken-line caption, bottom guidance pill and buttons
    [375, 812, 218, 190],
    [1366, 768, 100, 130],
  ])('keeps every tap target big, on screen and unobstructed at %ix%i', (width, height, top, bottom) => {
    const camera = spawnCamera(width, height);
    const toScreen = (v: THREE.Vector3) => {
      const n = v.clone().project(camera);
      return { x: ((n.x + 1) / 2) * width, y: ((1 - n.y) / 2) * height };
    };

    for (const [id, spot] of Object.entries(spots)) {
      const box = hitBox(spot);
      const corners = [box.min.x, box.max.x].flatMap((x) =>
        [box.min.y, box.max.y].flatMap((y) =>
          [box.min.z, box.max.z].map((z) => toScreen(new THREE.Vector3(x, y, z))),
        ),
      );
      const xs = corners.map((c) => c.x);
      const ys = corners.map((c) => c.y);
      expect(Math.min(...xs), id).toBeGreaterThan(0);
      expect(Math.max(...xs), id).toBeLessThan(width);
      expect(Math.min(...ys), id).toBeGreaterThan(top);
      expect(Math.max(...ys), id).toBeLessThan(height - bottom);
      expect(Math.max(...xs) - Math.min(...xs), id).toBeGreaterThanOrEqual(44);
      expect(Math.max(...ys) - Math.min(...ys), id).toBeGreaterThanOrEqual(30);

      // A tap on the middle of the target reaches it before any other hit box.
      const centre = box.getCenter(new THREE.Vector3());
      const ray = new THREE.Ray(camera.position, centre.clone().sub(camera.position).normalize());
      const first = Object.entries(spots)
        .map(([other, s]) => ({ other, point: ray.intersectBox(hitBox(s), new THREE.Vector3()) }))
        .filter((hit) => hit.point)
        .sort((a, b) => camera.position.distanceTo(a.point!) - camera.position.distanceTo(b.point!))[0];
      expect(first.other).toBe(id);
    }

    const wardrobe = new THREE.Vector3(-1.6, 0.92, -2.9);
    const [ex, ey, ez] = HOUSE_EXIT.position;
    const exitFront = new THREE.Vector3(ex, ey, ez + HOUSE_EXIT.radius);
    for (const point of [new THREE.Vector3(ex, ey, ez), exitFront, wardrobe]) {
      const { x, y } = toScreen(point);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(width);
      expect(y).toBeGreaterThan(top);
      expect(y).toBeLessThan(height - bottom);
    }
  });
});
