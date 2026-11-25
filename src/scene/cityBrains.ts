import { evolve, forward, type Net } from './brain';
import { mulberry32, type Car } from './cityLifeLogic';
import trainedJson from './trainedBrains.json';

const trained = trainedJson as Partial<Record<string, { sizes: number[]; w: number[]; score: number }>>;

const CRUISE = 2.2; // keep in sync with cityLifeLogic
const DT = 0.1;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- driver

/** Net input: distance to the nearest stop point ahead (0..3), own speed. Output: share of cruise speed. */
const driverFitness = (net: Net): number => {
  let total = 0;
  for (let ep = 0; ep < 6; ep++) {
    const r = mulberry32(900 + ep);
    let x = 0;
    let v = CRUISE * r();
    let line = 1.5 + r() * 7; // blocker position
    let lv = r() < 0.5 ? 0 : CRUISE * 0.8 * r();
    for (let s = 0; s < 200; s++) {
      if (r() < 0.02) lv = r() < 0.4 ? 0 : r() * CRUISE;
      line += lv * DT;
      const gap = line - x;
      const f = (forward(net, [Math.min(gap, 3) / 3, v / CRUISE])[0] + 1) / 2;
      const target = CRUISE * f;
      v += (target - v) * Math.min(1, DT * (target < v ? 7 : 3));
      x += v * DT;
      if (line - x < 0.15) {
        total -= 25; // overran the stop point
        line = x + 3 + r() * 3;
      }
      total += v * DT;
    }
  }
  return total;
};

/** Driver output as a speed share (0..1). */
export function driveShare(net: Net, gap: number, speed: number): number {
  return (forward(net, [Math.min(gap, 3) / 3, speed / CRUISE])[0] + 1) / 2;
}

// ---------------------------------------------------------------- critter (dog, cat, bird)

export interface CritterState {
  x: number;
  z: number;
  /** Heading angle: forward = (cos, sin) in (x, z). Three yaw = -th. */
  th: number;
}

const rel = (s: CritterState, tx: number, tz: number, range: number): [number, number] => {
  const dx = tx - s.x;
  const dz = tz - s.z;
  const fwd = dx * Math.cos(s.th) + dz * Math.sin(s.th);
  const side = -dx * Math.sin(s.th) + dz * Math.cos(s.th);
  const l = Math.hypot(fwd, side);
  const k = l > range ? range / l : 1;
  return [(fwd * k) / range, (side * k) / range];
};

export const CRITTER_TURN = 4; // rad/s at full output

/** Inputs: goal (fwd, side), hazard (fwd, side). Outputs: turn, speed share. Returns the speed used. */
export function critterStep(
  net: Net,
  s: CritterState,
  goal: { x: number; z: number },
  hazard: { x: number; z: number } | null,
  vmax: number,
  dt: number,
): number {
  const g = rel(s, goal.x, goal.z, 4);
  const h = hazard && Math.hypot(hazard.x - s.x, hazard.z - s.z) < 3 ? rel(s, hazard.x, hazard.z, 3) : [0, 0];
  const o = forward(net, [g[0], g[1], h[0], h[1]]);
  s.th += o[0] * CRITTER_TURN * dt;
  const sp = ((o[1] + 1) / 2) * vmax;
  s.x += Math.cos(s.th) * sp * dt;
  s.z += Math.sin(s.th) * sp * dt;
  return sp;
}

/** Mean distance to a wandering goal (lower is better) with a penalty for letting a hazard touch it. */
export function critterEpisode(net: Net, ep: number): { dist: number; hits: number } {
  const r = mulberry32(300 + ep);
  const s: CritterState = { x: 0, z: 0, th: r() * TAU };
  const goal = { x: r() * 4 - 2, z: r() * 4 - 2 };
  let gt = r() * TAU;
  const gv = ep % 2 ? 0.9 : 0.2;
  let hz = { x: 5, z: 0, vx: -2.2, vz: 0 };
  let dist = 0;
  let hits = 0;
  for (let i = 0; i < 150; i++) {
    if (r() < 0.03) gt = r() * TAU;
    goal.x += Math.cos(gt) * gv * DT;
    goal.z += Math.sin(gt) * gv * DT;
    hz.x += hz.vx * DT;
    hz.z += hz.vz * DT;
    if (Math.hypot(hz.x - s.x, hz.z - s.z) > 9) {
      const a = r() * TAU;
      const tx = s.x + (r() - 0.5) * 2;
      const tz = s.z + (r() - 0.5) * 2;
      hz = { x: tx + Math.cos(a) * 6, z: tz + Math.sin(a) * 6, vx: -Math.cos(a) * 2.2, vz: -Math.sin(a) * 2.2 };
    }
    critterStep(net, s, goal, hz, 1.6, DT);
    dist += Math.min(Math.hypot(goal.x - s.x, goal.z - s.z), 5);
    if (Math.hypot(hz.x - s.x, hz.z - s.z) < 0.9) hits++;
  }
  return { dist: dist / 150, hits };
}

const critterFitness = (net: Net): number => {
  let total = 0;
  for (let ep = 0; ep < 4; ep++) {
    const { dist, hits } = critterEpisode(net, ep);
    total -= dist * 15 + hits * 0.4;
  }
  return total;
};

// ---------------------------------------------------------------- pedestrian gap judgement

export const CROSS_TIME = 3.7; // seconds a walker needs on the road, plus a safety margin

/** Nearest car about to reach the zebra at cx, as [distance/6, speed/cruise]. */
export function approachFeatures(cars: readonly Car[], cx: number): [number, number] {
  let d = 6;
  let v = 0;
  for (const c of cars) {
    if (!c.active || c.hx === 0 || c.z < -1.6 || c.z > 0.6) continue;
    const a = (cx - c.x) * c.hx;
    if (a > -0.9 && a < d) {
      d = Math.max(a, 0);
      v = c.speed;
    }
  }
  return [d / 6, v / CRUISE];
}

const crossFitness = (net: Net): number => {
  const r = mulberry32(55);
  let total = 0;
  for (let i = 0; i < 300; i++) {
    const d = r() < 0.2 ? 6 : r() * 6;
    const v = r() < 0.2 ? 0 : r() * CRUISE;
    const go = forward(net, [d / 6, v / CRUISE])[0] > 0;
    const unsafe = v > 0.05 && d / v < CROSS_TIME;
    total += go ? (unsafe ? -10 : 1) : unsafe ? 0.2 : -0.5;
  }
  return total;
};

/** Should a walker step onto an unsignalled zebra given the nearest approaching car? */
export function mayCross(net: Net, cars: readonly Car[], cx: number): boolean {
  const [d, v] = approachFeatures(cars, cx);
  return forward(net, [d, v])[0] > 0;
}

// ---------------------------------------------------------------- the city's trained brains

export interface CityBrains {
  driver: Net;
  critter: Net;
  crosser: Net;
}

/** What to train: topology, fitness and seed per brain. `npm run train:brains` uses the same list. */
export const BRAIN_SPECS: Record<keyof CityBrains, { sizes: readonly number[]; fitness: (n: Net) => number; seed: number }> = {
  driver: { sizes: [2, 6, 1], fitness: driverFitness, seed: 1 },
  critter: { sizes: [4, 8, 2], fitness: critterFitness, seed: 2 },
  crosser: { sizes: [2, 4, 1], fitness: crossFitness, seed: 3 },
};

let cache: CityBrains | null = null;

/** Loads the shipped weights (trainedBrains.json); trains on the spot only for a brain whose shape changed. */
export function cityBrains(): CityBrains {
  if (cache) return cache;
  const out = {} as CityBrains;
  for (const k of Object.keys(BRAIN_SPECS) as Array<keyof CityBrains>) {
    const spec = BRAIN_SPECS[k];
    const saved = trained[k];
    out[k] =
      saved && saved.sizes.join() === spec.sizes.join()
        ? { sizes: spec.sizes, w: Float32Array.from(saved.w) }
        : evolve(spec.sizes, spec.fitness, spec.seed, { pop: 40, gens: 30 }).net;
  }
  return (cache = out);
}
