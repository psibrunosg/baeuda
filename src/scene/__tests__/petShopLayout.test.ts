import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { PetShopTarget } from '../../domain/petShopVisit';
import { CITY_QUESTS } from '../../domain/inventoryAndQuests';
import { BAKERY_TOWN_DOOR } from '../bakeryLayout';
import { BARBER_TOWN_DOOR } from '../barberLayout';
import { BOOKSHOP_TOWN_DOOR } from '../bookshopLayout';
import { HOUSE_TOWN_DOOR } from '../familyHomeLayout';
import { BALL_BOUNCE, BRUSH, PET_SHOP_GEOMETRY, PUPPY } from '../maps/petShopProps';
import {
  PET_SHOP_EXIT,
  PET_SHOP_OBSTACLES,
  PET_SHOP_TARGETS,
  PET_SHOP_TOWN_DOOR,
  PET_SHOP_TOWN_RETURN,
} from '../petShopLayout';
import { SCHOOL_TOWN_DOOR } from '../schoolLayout';
import { merge } from '../toyKit';
import { PET_TAIL_PIVOT, petGeometry } from '../toyProps';
import { ACTIVE_WORLD_MAPS, WORLD_MAP_REGISTRY } from '../worldNavigation';

const config = WORLD_MAP_REGISTRY.interior_pet_shop;
const distance = (p: { x: number; z: number }, portal: { position: [number, number, number] }) =>
  Math.hypot(p.x - portal.position[0], p.z - portal.position[2]);

const targets = Object.keys(PET_SHOP_TARGETS) as PetShopTarget[];
const hitBox = (id: PetShopTarget) => {
  const { at, hit } = PET_SHOP_TARGETS[id];
  return new THREE.Box3(
    new THREE.Vector3(at[0] - hit[0] / 2, at[1], at[2] - hit[2] / 2),
    new THREE.Vector3(at[0] + hit[0] / 2, at[1] + hit[1], at[2] + hit[2] / 2),
  );
};

/** Bounds of a prop in target coordinates. */
const bounds = (kind: keyof typeof PET_SHOP_GEOMETRY) => {
  const geometry = merge(PET_SHOP_GEOMETRY[kind]());
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
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

describe('pet shop interior layout', () => {
  it('is an active map whose spawn and street return do not bounce through a portal', () => {
    expect(ACTIVE_WORLD_MAPS).toContain('interior_pet_shop');
    expect(distance(config.defaultSpawn, PET_SHOP_EXIT)).toBeGreaterThan(PET_SHOP_EXIT.proximityRadius);
    for (const door of [PET_SHOP_TOWN_DOOR, BAKERY_TOWN_DOOR, BARBER_TOWN_DOOR, BOOKSHOP_TOWN_DOOR, SCHOOL_TOWN_DOOR, HOUSE_TOWN_DOOR]) {
      expect(distance(PET_SHOP_TOWN_RETURN, door)).toBeGreaterThan(door.proximityRadius);
    }
    const npc = CITY_QUESTS.find((q) => q.id === 'quest_vet_petfood')!.npcPosition!;
    expect(distance(npc, PET_SHOP_TOWN_DOOR)).toBeGreaterThan(1);
  });

  it('puts the town door east of the pet shop, short of the street', () => {
    const [x, , z] = PET_SHOP_TOWN_DOOR.position;
    const r = PET_SHOP_TOWN_DOOR.radius;
    expect(x - r).toBeGreaterThan(5.2); // pet shop lot (NeighborhoodMap obstacle)
    expect(x + r).toBeLessThan(6.4); // east-centre street
    expect(z).toBeGreaterThan(2.35);
    expect(z).toBeLessThan(4.45);
    expect(PET_SHOP_TOWN_RETURN.x).toBeLessThan(6.4);
    expect(PET_SHOP_TOWN_RETURN.z).toBeGreaterThan(0.7); // main avenue
  });

  it('spawns outside the furniture and keeps every target off the way to the exit', () => {
    const { x, z } = config.defaultSpawn;
    for (const o of PET_SHOP_OBSTACLES) {
      expect(x > o.minX && x < o.maxX && z > o.minZ && z < o.maxZ).toBe(false);
    }
    // a corridor as wide as the doormat ring, from just behind the spawn to the exit
    const way = new THREE.Box3(
      new THREE.Vector3(-PET_SHOP_EXIT.radius, 0, z - 0.4),
      new THREE.Vector3(PET_SHOP_EXIT.radius, 2, PET_SHOP_EXIT.position[2] + PET_SHOP_EXIT.radius),
    );
    for (const id of targets) expect(hitBox(id).intersectsBox(way), id).toBe(false);
    for (const o of PET_SHOP_OBSTACLES) {
      expect(o.minX < way.max.x && o.maxX > way.min.x && o.minZ < way.max.z && o.maxZ > way.min.z).toBe(false);
    }
  });

  it('keeps moving things inside their own hit box', () => {
    const inside = (id: PetShopTarget, local: THREE.Box3) => {
      const world = local.clone().translate(new THREE.Vector3(...PET_SHOP_TARGETS[id].at));
      expect(hitBox(id).containsBox(world), id).toBe(true);
    };
    for (const id of ['tub', 'collar', 'stethoscope'] as const) inside(id, bounds(id));
    inside('bowl', bounds('kibble'));

    const ball = bounds('ball');
    ball.max.y += BALL_BOUNCE;
    inside('ball', ball);

    // both ends of the scrubbing motion
    for (const wave of [-1, 1]) {
      const pose = new THREE.Matrix4()
        .makeTranslation(wave * BRUSH.swing, BRUSH.lift, 0)
        .multiply(new THREE.Matrix4().makeRotationZ(wave * BRUSH.tilt));
      inside('brush', bounds('brush').applyMatrix4(new THREE.Matrix4().makeRotationY(BRUSH.yaw)).applyMatrix4(pose));
    }

    const pet = petGeometry('dog');
    const puppy = new THREE.Group();
    puppy.position.x = PUPPY.x;
    puppy.rotation.y = PUPPY.yaw;
    puppy.scale.setScalar(PUPPY.scale);
    const tail = new THREE.Mesh(pet.tail);
    tail.position.set(...PET_TAIL_PIVOT);
    puppy.add(new THREE.Mesh(pet.body), tail);
    const dog = new THREE.Box3().setFromObject(puppy, true);
    dog.max.y += PUPPY.hop;
    // the paws rest on the floor, a hair under the target's base
    dog.min.y = Math.max(dog.min.y, 0);
    inside('dog', dog);
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
      expect(Math.abs(PET_SHOP_TARGETS[id].at[0]), id).toBeLessThanOrEqual(2.4);
      expect(Math.min(...xs), id).toBeGreaterThan(0);
      expect(Math.max(...xs), id).toBeLessThan(width);
      expect(Math.min(...ys), id).toBeGreaterThan(top);
      expect(Math.max(...ys), id).toBeLessThan(height - bottom);
      expect(Math.max(...xs) - Math.min(...xs), id).toBeGreaterThanOrEqual(44);
      expect(Math.max(...ys) - Math.min(...ys), id).toBeGreaterThanOrEqual(30);

      // No other hit box covers the inner part of this one, seen from the camera.
      const centre = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      for (const dx of [-0.45, 0, 0.45]) {
        for (const dy of [-0.45, 0, 0.45]) {
          const point = centre.clone().add(new THREE.Vector3(dx * size.x, dy * size.y, size.z / 2));
          const ray = new THREE.Ray(camera.position, point.clone().sub(camera.position).normalize());
          const first = targets
            .map((other) => ({ other, point: ray.intersectBox(hitBox(other), new THREE.Vector3()) }))
            .filter((hit) => hit.point)
            .sort((a, b) => camera.position.distanceTo(a.point!) - camera.position.distanceTo(b.point!))[0];
          expect(first.other, `${id} at ${dx},${dy}`).toBe(id);
        }
      }

      // The hint arrow stays below the top bars (HintMarker: base at hit + 0.22, bob 0.06, half height 0.12).
      const { at, hit } = PET_SHOP_TARGETS[id];
      expect(toScreen(new THREE.Vector3(at[0], at[1] + hit[1] + 0.4, at[2])).y, id).toBeGreaterThan(top);
    }

    for (const [i, a] of targets.entries()) {
      for (const b of targets.slice(i + 1)) expect(hitBox(a).intersectsBox(hitBox(b)), `${a}/${b}`).toBe(false);
    }

    const [x, y, z] = PET_SHOP_EXIT.position;
    const r = PET_SHOP_EXIT.radius;
    for (const [dx, dz] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
      const p = toScreen(new THREE.Vector3(x + dx, y, z + dz));
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(width);
      expect(p.y).toBeGreaterThan(top);
      expect(p.y).toBeLessThan(height - bottom);
    }
  });
});
