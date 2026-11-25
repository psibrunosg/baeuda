import { mulberry32 } from './cityLifeLogic';

/** Tiny fully-connected tanh network. Weights per neuron: [bias, w0..wn-1], layer after layer. */
export interface Net {
  sizes: readonly number[];
  w: Float32Array;
}

const weightCount = (s: readonly number[]) => s.slice(1).reduce((n, out, i) => n + (s[i] + 1) * out, 0);

function gauss(rand: () => number): number {
  return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
}

export function randomNet(sizes: readonly number[], rand: () => number): Net {
  const w = new Float32Array(weightCount(sizes));
  for (let i = 0; i < w.length; i++) w[i] = gauss(rand) * 0.8;
  return { sizes, w };
}

/** Returns one value in (-1, 1) per output neuron. */
export function forward(net: Net, input: ArrayLike<number>): number[] {
  let x: ArrayLike<number> = input;
  let k = 0;
  for (let l = 1; l < net.sizes.length; l++) {
    const out = new Array<number>(net.sizes[l]);
    for (let o = 0; o < out.length; o++) {
      let s = net.w[k++];
      for (let i = 0; i < net.sizes[l - 1]; i++) s += net.w[k++] * x[i];
      out[o] = Math.tanh(s);
    }
    x = out;
  }
  return x as number[];
}

export interface EvolveOpts {
  pop?: number;
  gens?: number;
  sigma?: number;
  /** A previously trained net to continue from (joins the starting population). */
  start?: Net;
  /** Called after every generation with the best and mean score. */
  onGen?: (gen: number, best: number, mean: number) => void;
}

/** Neuroevolution: keep the best quarter, breed the rest by uniform crossover + gaussian mutation. */
export function evolve(
  sizes: readonly number[],
  fitness: (n: Net) => number,
  seed: number,
  { pop = 40, gens = 30, sigma = 0.35, start, onGen }: EvolveOpts = {},
): { net: Net; score: number } {
  const rand = mulberry32(seed);
  let nets = Array.from({ length: pop }, () => randomNet(sizes, rand));
  if (start) nets[0] = start;
  let ranked = nets.map((n) => ({ n, f: fitness(n) })).sort((a, b) => b.f - a.f);
  const elite = Math.max(2, pop >> 2);
  for (let g = 0; g < gens; g++) {
    const parents = ranked.slice(0, elite).map((r) => r.n);
    nets = parents.slice();
    while (nets.length < pop) {
      const a = parents[Math.floor(rand() * elite)];
      const b = parents[Math.floor(rand() * elite)];
      const w = new Float32Array(a.w.length);
      for (let i = 0; i < w.length; i++) w[i] = (rand() < 0.5 ? a.w[i] : b.w[i]) + (rand() < 0.2 ? gauss(rand) * sigma : 0);
      nets.push({ sizes, w });
    }
    // fitness episodes are seeded, so re-scoring the elites keeps the ranking fair
    ranked = nets.map((n) => ({ n, f: fitness(n) })).sort((a, b) => b.f - a.f);
    onGen?.(g + 1, ranked[0].f, ranked.reduce((t, r) => t + r.f, 0) / pop);
  }
  return { net: ranked[0].n, score: ranked[0].f };
}
