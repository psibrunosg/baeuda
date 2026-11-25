import { describe, expect, it } from 'vitest';
import trained from '../trainedBrains.json';
import { BRAIN_SPECS, cityBrains, critterEpisode, driveShare, approachFeatures } from '../cityBrains';
import { forward, randomNet } from '../brain';
import { carsHaveGreen, makeCars, mulberry32, stepCars } from '../cityLifeLogic';

describe('city brains', () => {
  const b = cityBrains();

  it('driver cruises on an open road and brakes at the stop point', () => {
    expect(driveShare(b.driver, 3, 2.2)).toBeGreaterThan(0.8);
    expect(driveShare(b.driver, 0, 1.5)).toBeLessThan(0.15);
    expect(driveShare(b.driver, 0.5, 2.2)).toBeLessThan(driveShare(b.driver, 2.5, 2.2));
  });

  it('critter beats an untrained net at staying near its goal', () => {
    const untrained = randomNet(b.critter.sizes, mulberry32(9));
    const score = (n: typeof untrained) => [0, 1, 2, 3].reduce((s, e) => s + critterEpisode(n, e).dist, 0);
    expect(score(b.critter)).toBeLessThan(score(untrained) * 0.7);
  });

  it('crosser waits for a close fast car and goes on an empty road', () => {
    expect(forward(b.crosser, [1, 0])[0]).toBeGreaterThan(0);
    expect(forward(b.crosser, [0.1, 1])[0]).toBeLessThan(0);
  });

  it('ships trained weights for every brain, so nothing trains at load', () => {
    for (const [k, spec] of Object.entries(BRAIN_SPECS)) {
      const t = (trained as Record<string, { sizes: number[]; w: number[] }>)[k];
      expect(t?.sizes.join()).toBe(spec.sizes.join());
      expect(Array.from(b[k as keyof typeof b].w)).toEqual(t.w.map((x) => Math.fround(x)));
    }
  });

  it('forward is bounded and deterministic', () => {
    const o = forward(b.driver, [0.3, 0.5]);
    expect(o[0]).toBeGreaterThan(-1);
    expect(o[0]).toBeLessThan(1);
    expect(forward(b.driver, [0.3, 0.5])).toEqual(o);
  });

  it('approachFeatures reports an empty road as far and still', () => {
    expect(approachFeatures([], 0)).toEqual([1, 0]);
  });

  it('neural drivers keep flowing without crashing for two minutes', () => {
    const cars = makeCars(14);
    const rand = mulberry32(77);
    let closest = Infinity;
    let moved = 0;
    for (let t = 0; t < 120; t += 0.05) {
      stepCars(cars, 0.05, { green: carsHaveGreen(t), people: [], rand, driver: (g, v) => driveShare(b.driver, g, v) });
      const live = cars.filter((c) => c.active);
      moved += live.filter((c) => c.speed > 0.5).length;
      for (let i = 0; i < live.length; i++)
        for (let j = i + 1; j < live.length; j++) closest = Math.min(closest, Math.hypot(live[i].x - live[j].x, live[i].z - live[j].z));
    }
    expect(closest).toBeGreaterThan(0.45);
    expect(moved).toBeGreaterThan(2000);
  });
});
