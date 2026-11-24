import { describe, expect, it } from 'vitest';
import {
  CROSSINGS,
  INTERSECTIONS,
  canStartCrossing,
  carsHaveGreen,
  chooseNext,
  crossingIndex,
  epsilon,
  isPlantable,
  learn,
  makeCars,
  makeWalker,
  mulberry32,
  neighbors,
  scatterPlants,
  stepCars,
  zebraClear,
  type Car,
  type Vec,
} from '../cityLifeLogic';
import { lotBox } from '../worldNavigation';

const OBS = [lotBox(0, -3.6, 1.5, 1.2), lotBox(-3.6, 3.4, 1.4, 1.05)];

function carAt(x: number, z: number, hx: number, hz: number): Car {
  const [c] = makeCars(1);
  return { ...c, active: true, x, z, hx, hz, speed: 2.2, yaw: 0 };
}

function run(cars: Car[], seconds: number, people: Vec[], green = true, seed = 5, onStep?: () => void) {
  const rand = mulberry32(seed);
  for (let i = 0; i < seconds * 30; i++) {
    stepCars(cars, 1 / 30, { green, people, rand });
    onStep?.();
  }
}

describe('flora', () => {
  it('never plants on streets, water or buildings, and is deterministic', () => {
    for (const kind of ['flower', 'bush'] as const) {
      const plants = scatterPlants(kind, 60, 7, OBS);
      expect(plants.length).toBeGreaterThan(20);
      for (const p of plants) expect(isPlantable(p.x, p.z, OBS)).toBe(true);
    }
    expect(scatterPlants('flower', 20, 3, OBS)).toEqual(scatterPlants('flower', 20, 3, OBS));
  });
});

describe('traffic', () => {
  it('stops for a person on the zebra and goes once they leave', () => {
    const car = carAt(-6.2, -0.15, 1, 0);
    const person: Vec = { x: -4, z: -0.3 };
    run([car], 4, [person]);
    expect(car.x).toBeLessThan(-4.75); // held before the zebra edge
    expect(car.speed).toBeLessThan(0.1);
    run([car], 3, []);
    expect(car.x).toBeGreaterThan(-3);
  });

  it('stops for the player standing in the road ahead', () => {
    const car = carAt(10, 6.85, 1, 0);
    run([car], 3, [{ x: 12, z: 6.85 }]);
    expect(car.x).toBeLessThan(11.2);
  });

  it('holds at the red light and releases on green', () => {
    const car = carAt(-5, -0.15, 1, 0);
    run([car], 4, [], false);
    expect(car.x).toBeLessThan(-1.2);
    run([car], 3, [], true);
    expect(car.x).toBeGreaterThan(0);
  });

  it('shares intersections without collisions and cars actually turn', () => {
    const cars = makeCars(14);
    const headings = new Set<string>();
    let minDist = Infinity;
    let bothInBox = false;
    run(cars, 240, [], true, 11, () => {
      for (const c of cars) if (c.active) headings.add(`${c.hx},${c.hz}`);
      for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
          if (!cars[i].active || !cars[j].active) continue;
          minDist = Math.min(minDist, Math.hypot(cars[i].x - cars[j].x, cars[i].z - cars[j].z));
        }
      }
      for (const ix of INTERSECTIONS) {
        const inside = cars.filter((c) => c.active && Math.hypot(c.x - ix.x, c.z - ix.z) < 0.8);
        if (inside.length > 1) bothInBox = true;
      }
    });
    expect(headings.size).toBe(4); // east, west, north and south all seen => turning works
    expect(minDist).toBeGreaterThan(0.45);
    expect(bothInBox).toBe(false);
  });

  it('pedestrian gap acceptance: zebra is clear only without an approaching car', () => {
    expect(zebraClear([carAt(-6, -0.15, 1, 0)], -4)).toBe(false);
    expect(zebraClear([carAt(-12, -0.15, 1, 0)], -4)).toBe(true);
    const stopped = carAt(-6, -0.15, 1, 0);
    stopped.speed = 0;
    expect(zebraClear([stopped], -4)).toBe(true);
  });

  it('only allows the signalled crossing in the middle of the red phase', () => {
    expect(carsHaveGreen(1)).toBe(true);
    expect(canStartCrossing(1)).toBe(false);
    expect(canStartCrossing(9.2)).toBe(false);
    expect(canStartCrossing(11)).toBe(true);
    expect(canStartCrossing(15.5)).toBe(false);
  });
});

describe('walkers', () => {
  it('learns what it likes, explores less with experience, and uses all three zebras', () => {
    const taste = new Array(10).fill(0);
    taste[3] = 1;
    const w = makeWalker(2, taste);
    const rand = mulberry32(1);
    for (let i = 0; i < 400; i++) {
      const next = chooseNext(w, rand);
      expect(neighbors(w.node)).toContain(next);
      learn(w, next, rand);
    }
    expect(w.visits[3]).toBeGreaterThan(w.visits[0] * 3);
    expect(epsilon(400)).toBeLessThan(epsilon(0));
    expect(CROSSINGS.every(([a, b]) => crossingIndex(a, b) >= 0 && neighbors(a).includes(b))).toBe(true);
  });
});
