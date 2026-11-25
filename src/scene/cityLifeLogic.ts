import type { Aabb } from './worldNavigation';

/** Deterministic PRNG (same as cafeTextures) so the city looks identical every load. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- flora

/** Paved, wet or built-over rectangles of the Baeuda Town map (x0,x1,z0,z1). */
const NO_PLANT_RECTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-18.5, 18.5, -1.7, 0.7], // main avenue
  [-18.5, 18.5, 5.3, 7.7], // south avenue
  [-7.6, -5.6, -10.8, 9.8], // west street
  [6.4, 8.4, -5.4, 9.8], // east-centre street
  [-18, -7, -6.6, -5.0], // residential lane
  [9.2, 12.0, -9, 14], // river
  [-5.9, 5.9, -4.9, -1.5], // downtown sidewalks
  [-5.9, 5.9, 1.7, 5.3],
  [-15.6, -8.0, -4.9, -1.5],
  [11.8, 18.2, -4.9, -1.5],
  [11.8, 18.2, 1.7, 5.3],
  [0.8, 7.6, -11.2, -5.0], // park lake + sand
];

export function isPlantable(x: number, z: number, obstacles: readonly Aabb[]): boolean {
  if (x < -17.4 || x > 17.4 || z < -11.2 || z > 11.4) return false;
  for (const [x0, x1, z0, z1] of NO_PLANT_RECTS) if (x > x0 && x < x1 && z > z0 && z < z1) return false;
  for (const b of obstacles) {
    if (x > b.minX - 0.5 && x < b.maxX + 0.5 && z > b.minZ - 0.5 && z < b.maxZ + 0.5) return false;
  }
  return true;
}

export interface Plant {
  x: number;
  z: number;
  scale: number;
  color: string;
}

const FLOWER_COLORS = ['#f472b6', '#fbbf24', '#f87171', '#c084fc', '#fb923c', '#fef3c7', '#60a5fa'];
const BUSH_COLORS = ['#4d7c4a', '#5f8d5b', '#6b9a5e'];

/** Rejection-sampled, clustered scatter. Flowers come in small patches, bushes alone. */
export function scatterPlants(
  kind: 'flower' | 'bush',
  count: number,
  seed: number,
  obstacles: readonly Aabb[],
): Plant[] {
  const rand = mulberry32(seed);
  const palette = kind === 'flower' ? FLOWER_COLORS : BUSH_COLORS;
  const out: Plant[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 80) {
    const cx = -17 + rand() * 34;
    const cz = -11 + rand() * 22;
    const patch = kind === 'flower' ? palette[Math.floor(rand() * palette.length)] : null;
    const n = kind === 'flower' ? 3 + Math.floor(rand() * 3) : 1;
    for (let i = 0; i < n && out.length < count; i++) {
      const x = cx + (rand() - 0.5) * (kind === 'flower' ? 0.7 : 0);
      const z = cz + (rand() - 0.5) * (kind === 'flower' ? 0.7 : 0);
      if (!isPlantable(x, z, obstacles)) continue;
      out.push({
        x,
        z,
        scale: kind === 'flower' ? 0.8 + rand() * 0.5 : 0.7 + rand() * 0.6,
        color: patch ?? palette[Math.floor(rand() * palette.length)],
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------- traffic

export const LIGHT_CYCLE = 16;
export const LIGHT_GREEN = 9; // cars go for 9 s, then 7 s red (pedestrians cross)

export function carsHaveGreen(t: number): boolean {
  return t % LIGHT_CYCLE < LIGHT_GREEN;
}

/** Seconds since the cars' light turned red (0 while green). */
export function redElapsed(t: number): number {
  return Math.max(0, (t % LIGHT_CYCLE) - LIGHT_GREEN);
}

export interface Vec {
  x: number;
  z: number;
}

export type Plan = 'S' | 'L' | 'R';

interface Turn {
  p0: Vec;
  p1: Vec;
  p2: Vec;
  u: number;
  len: number;
  nhx: number;
  nhz: number;
}

export interface Car {
  active: boolean;
  /** Seconds until an inactive car tries to enter the map again. */
  wait: number;
  x: number;
  z: number;
  /** Unit heading on the grid (E=1,0  W=-1,0  S=0,1  N=0,-1). */
  hx: number;
  hz: number;
  yaw: number;
  speed: number;
  turn: Turn | null;
  plan: Plan | null;
  /** Index of the intersection this car holds (-1 none). */
  holds: number;
}

export const CAR_GAP = 1.5;
const LANE = 0.35; // lane centre offset from the road centreline (right-hand traffic)
const CRUISE = 2.2;
const TURN_SPEED = 1.3;
const BOX = 0.95; // distance from an intersection centre to where the turn starts

/** Intersections of the two avenues (z=-0.5, 6.5) with the two streets (x=-6.6, 7.4). */
export const INTERSECTIONS: readonly Vec[] = [
  { x: -6.6, z: -0.5 },
  { x: 7.4, z: -0.5 },
  { x: -6.6, z: 6.5 },
  { x: 7.4, z: 6.5 },
];

/** Zebra crossings on the main avenue. The one at x=0 also has the traffic light. */
export const CROSSWALK_XS: readonly number[] = [-4, 0, 4];
export const LIGHT_X = 0;
const STOP_LINE = 1.35;

const laneZ = (hx: number, cz: number) => cz + (hx > 0 ? LANE : -LANE);
const laneX = (hz: number, cx: number) => cx + (hz > 0 ? -LANE : LANE);

interface Source {
  x: number;
  z: number;
  hx: number;
  hz: number;
}

const SOURCES: readonly Source[] = [
  { x: -18, z: laneZ(1, -0.5), hx: 1, hz: 0 },
  { x: 18, z: laneZ(-1, -0.5), hx: -1, hz: 0 },
  { x: -18, z: laneZ(1, 6.5), hx: 1, hz: 0 },
  { x: 18, z: laneZ(-1, 6.5), hx: -1, hz: 0 },
  { x: laneX(1, -6.6), z: -10.8, hx: 0, hz: 1 },
  { x: laneX(-1, -6.6), z: 9.8, hx: 0, hz: -1 },
  { x: laneX(1, 7.4), z: -5.3, hx: 0, hz: 1 },
  { x: laneX(-1, 7.4), z: 9.8, hx: 0, hz: -1 },
];

export function makeCars(n: number): Car[] {
  return Array.from({ length: n }, (_, i) => ({
    active: false,
    wait: i * 1.4,
    x: 0,
    z: 0,
    hx: 1,
    hz: 0,
    yaw: 0,
    speed: 0,
    turn: null,
    plan: null,
    holds: -1,
  }));
}

function offMap(c: Car): boolean {
  if (c.hx !== 0) return c.x < -18.4 || c.x > 18.4;
  return c.x < 0 ? c.z < -11 || c.z > 10 : c.z < -5.5 || c.z > 10;
}

function spawn(c: Car, cars: Car[], rand: () => number): boolean {
  const start = Math.floor(rand() * SOURCES.length);
  for (let k = 0; k < SOURCES.length; k++) {
    const s = SOURCES[(start + k) % SOURCES.length];
    if (cars.some((o) => o.active && Math.abs(o.x - s.x) < 2.6 && Math.abs(o.z - s.z) < 2.6)) continue;
    c.active = true;
    c.x = s.x;
    c.z = s.z;
    c.hx = s.hx;
    c.hz = s.hz;
    c.yaw = Math.atan2(-s.hz, s.hx);
    c.speed = CRUISE;
    c.turn = null;
    c.plan = null;
    c.holds = -1;
    return true;
  }
  return false;
}

const turnHeading = (c: Car, plan: Plan): [number, number] =>
  plan === 'R' ? [-c.hz, c.hx] : plan === 'L' ? [c.hz, -c.hx] : [c.hx, c.hz];

/** Pick the exit with the least traffic ("smart routing"), with a small taste for going straight. */
function planFor(c: Car, ix: Vec, cars: Car[], rand: () => number): Plan {
  let best: Plan = 'S';
  let bestScore = -Infinity;
  for (const plan of ['S', 'L', 'R'] as const) {
    const [nhx, nhz] = turnHeading(c, plan);
    const ex = ix.x + nhx * 3;
    const ez = ix.z + nhz * 3;
    let crowd = 0;
    for (const o of cars) if (o !== c && o.active && Math.hypot(o.x - ex, o.z - ez) < 3.2) crowd++;
    const score = rand() * 0.8 + (plan === 'S' ? 0.5 : 0) - crowd * 0.9;
    if (score > bestScore) {
      bestScore = score;
      best = plan;
    }
  }
  return best;
}

function startTurn(c: Car, ix: Vec, plan: Plan): void {
  const [nhx, nhz] = turnHeading(c, plan);
  // exit point on the new lane, and the corner where the two lane lines cross
  const p2: Vec = nhx !== 0 ? { x: ix.x + nhx * BOX, z: laneZ(nhx, ix.z) } : { x: laneX(nhz, ix.x), z: ix.z + nhz * BOX };
  const p1: Vec = c.hx !== 0 ? { x: laneX(nhz, ix.x), z: c.z } : { x: c.x, z: laneZ(nhx, ix.z) };
  const p0 = { x: c.x, z: c.z };
  c.turn = {
    p0,
    p1,
    p2,
    u: 0,
    len: Math.hypot(p1.x - p0.x, p1.z - p0.z) + Math.hypot(p2.x - p1.x, p2.z - p1.z),
    nhx,
    nhz,
  };
}

export interface TrafficCtx {
  green: boolean;
  people: readonly Vec[];
  rand: () => number;
  /** Learned speed share (0..1) from distance to the nearest stop point ahead and own speed. */
  driver?: (gap: number, speed: number) => number;
}

const inCrosswalk = (p: Vec, cx: number) => Math.abs(p.x - cx) < 0.75 && p.z > -1.6 && p.z < 0.6;

/** True when a person stands on the zebra at cx. */
export function crosswalkBusy(people: readonly Vec[], cx: number): boolean {
  return people.some((p) => inCrosswalk(p, cx));
}

/** Gap acceptance for unsignalled zebras: no moving car about to reach the crossing. */
export function zebraClear(cars: readonly Car[], cx: number): boolean {
  return !cars.some(
    (c) =>
      c.active &&
      c.hx !== 0 &&
      c.z > -1.6 &&
      c.z < 0.6 &&
      Math.abs(c.x - cx) < 3.4 &&
      (cx - c.x) * c.hx > -0.9 &&
      c.speed > 0.25,
  );
}

export function stepCars(cars: Car[], dt: number, ctx: TrafficCtx): void {
  for (const c of cars) {
    if (!c.active) {
      c.wait -= dt;
      if (c.wait <= 0 && !spawn(c, cars, ctx.rand)) c.wait = 0.6;
      continue;
    }
    let target = c.turn ? TURN_SPEED : CRUISE;
    let gap = Infinity; // distance to the nearest rule trigger ahead; the net learns to ease off before it

    // car ahead in the same corridor
    for (const o of cars) {
      if (o === c || !o.active) continue;
      const dx = o.x - c.x;
      const dz = o.z - c.z;
      const a = dx * c.hx + dz * c.hz;
      const l = Math.abs(dx * c.hz - dz * c.hx);
      if (a > 0 && l < 0.4) {
        gap = Math.min(gap, a - CAR_GAP);
        if (a < CAR_GAP) target = 0;
      }
    }

    // people straight ahead (covers the player walking anywhere on the road)
    for (const p of ctx.people) {
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const a = dx * c.hx + dz * c.hz;
      const l = Math.abs(dx * c.hz - dz * c.hx);
      if (a > 0.2 && l < 0.5) {
        gap = Math.min(gap, a - 1.4);
        if (a < 1.4) target = 0;
      }
    }

    if (c.hx !== 0 && c.z > -1.5 && c.z < 0.5 && !c.turn) {
      for (const cx of CROSSWALK_XS) {
        const ahead = (cx - c.x) * c.hx;
        // give way to anyone on the zebra while the car is still before it
        if (ahead > 0.95 && crosswalkBusy(ctx.people, cx)) {
          gap = Math.min(gap, ahead - 2.6);
          if (ahead < 2.6) target = 0;
        }
        // red light for cars (pedestrian phase)
        if (cx === LIGHT_X && !ctx.green) {
          const toLine = (-STOP_LINE * c.hx - c.x) * c.hx;
          if (toLine > -0.05) {
            gap = Math.min(gap, toLine - 0.9);
            if (toLine < 0.9) target = 0;
          }
        }
      }
    }

    // intersections: one car in the box at a time
    if (!c.turn) {
      for (let i = 0; i < INTERSECTIONS.length; i++) {
        const ix = INTERSECTIONS[i];
        const d = (ix.x - c.x) * c.hx + (ix.z - c.z) * c.hz;
        const side = Math.abs((ix.x - c.x) * c.hz - (ix.z - c.z) * c.hx);
        if (side > 0.7 || d <= 0 || d > 2.4) continue;
        const heldByOther = cars.some((o) => o !== c && o.active && o.holds === i);
        if (c.holds !== i) {
          if (heldByOther) {
            gap = Math.min(gap, d - 1.5);
            if (d < 1.5) target = 0;
          } else {
            c.holds = i;
            c.plan = planFor(c, ix, cars, ctx.rand);
          }
        }
        if (c.holds === i && d <= BOX && c.plan && c.plan !== 'S') startTurn(c, ix, c.plan);
      }
    }

    if (ctx.driver && target > 0 && gap < 3) target *= ctx.driver(Math.max(gap, 0), c.speed);

    c.speed += (target - c.speed) * Math.min(1, dt * (target < c.speed ? 7 : 3));

    if (c.turn) {
      const t = c.turn;
      t.u = Math.min(1, t.u + (c.speed * dt) / t.len);
      const u = t.u;
      const k = 1 - u;
      c.x = k * k * t.p0.x + 2 * k * u * t.p1.x + u * u * t.p2.x;
      c.z = k * k * t.p0.z + 2 * k * u * t.p1.z + u * u * t.p2.z;
      const tx = 2 * k * (t.p1.x - t.p0.x) + 2 * u * (t.p2.x - t.p1.x);
      const tz = 2 * k * (t.p1.z - t.p0.z) + 2 * u * (t.p2.z - t.p1.z);
      c.yaw = Math.atan2(-tz, tx);
      if (u >= 1) {
        c.hx = t.nhx;
        c.hz = t.nhz;
        c.yaw = Math.atan2(-c.hz, c.hx);
        c.turn = null;
      }
    } else {
      c.x += c.hx * c.speed * dt;
      c.z += c.hz * c.speed * dt;
    }

    // release the intersection once clear of the box and moving away
    if (c.holds >= 0 && !c.turn) {
      const ix = INTERSECTIONS[c.holds];
      const away = (c.x - ix.x) * c.hx + (c.z - ix.z) * c.hz;
      if (away > 1.4) {
        c.holds = -1;
        c.plan = null;
      }
    }

    if (offMap(c)) {
      c.active = false;
      c.holds = -1;
      c.wait = 1 + ctx.rand() * 3;
    }
  }
}

// ---------------------------------------------------------------- walkers

/** Sidewalk graph: nodes 0-4 north of the avenue, 5-9 south; 2<->7 is the zebra crossing. */
export const NODE_X = [-8, -4, 0, 4, 8, -8, -4, 0, 4, 8] as const;
export const NODE_Z = [-2.0, -2.0, -2.0, -2.0, -2.0, 1.6, 1.6, 1.6, 1.6, 1.6] as const;
/** Zebra pairs (north node, south node). Pair 1 (nodes 2<->7) is the signalled one. */
export const CROSSINGS: ReadonlyArray<readonly [number, number]> = [
  [1, 6],
  [2, 7],
  [3, 8],
];
export const SIGNALLED_CROSSING = 1;

export function neighbors(n: number): number[] {
  const row = n < 5 ? 0 : 5;
  const i = n - row;
  const out: number[] = [];
  if (i > 0) out.push(n - 1);
  if (i < 4) out.push(n + 1);
  for (const [a, b] of CROSSINGS) {
    if (n === a) out.push(b);
    if (n === b) out.push(a);
  }
  return out;
}

/** Index into CROSSINGS if a->b is a street crossing, else -1. */
export function crossingIndex(a: number, b: number): number {
  return CROSSINGS.findIndex(([p, q]) => (a === p && b === q) || (a === q && b === p));
}

/** A pedestrian may start crossing only while cars are held at red with enough time left. */
export function canStartCrossing(t: number): boolean {
  const e = redElapsed(t);
  return e > 1.5 && e < LIGHT_CYCLE - LIGHT_GREEN - 3.4;
}

export interface Walker {
  node: number;
  /** Learned value of heading to each node (grows toward what the walker enjoys). */
  q: number[];
  visits: number[];
  /** What this walker likes (bakery lover, park lover…); never changes. */
  taste: number[];
  steps: number;
  waited: number;
}

export function makeWalker(start: number, taste: number[]): Walker {
  return {
    node: start,
    q: new Array(NODE_X.length).fill(0),
    visits: new Array(NODE_X.length).fill(0),
    taste,
    steps: 0,
    waited: 0,
  };
}

/** Exploration shrinks as the walker gains experience: curious first, creature of habit later. */
export function epsilon(steps: number): number {
  return Math.max(0.05, 0.7 * Math.pow(0.93, steps));
}

export function chooseNext(w: Walker, rand: () => number): number {
  const opts = neighbors(w.node);
  if (rand() < epsilon(w.steps)) {
    // explore, preferring places seen least
    let best = opts[0];
    let bestScore = Infinity;
    for (const o of opts) {
      const s = w.visits[o] + rand();
      if (s < bestScore) {
        bestScore = s;
        best = o;
      }
    }
    return best;
  }
  let best = opts[0];
  for (const o of opts) if (w.q[o] > w.q[best]) best = o;
  return best;
}

/** Q-update after arriving at `node`: reward = how much the walker liked it (+ noise). */
export function learn(w: Walker, node: number, rand: () => number): void {
  const reward = w.taste[node] + (rand() - 0.5) * 0.2;
  w.q[node] += 0.3 * (reward - w.q[node]);
  w.visits[node] += 1;
  w.steps += 1;
  w.node = node;
  w.waited = 0;
}

/** Standing at a red light is unpleasant: the walker slowly learns to avoid the crossing. */
export function punishWaiting(w: Walker, target: number, dt: number): void {
  w.waited += dt;
  w.q[target] -= 0.02 * dt;
}
