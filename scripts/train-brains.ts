/**
 * Long offline training for the city's brains.
 *   npm run train:brains -- [gens=150] [pop=80] [runs=1]
 * Every run continues from the best net saved in training/brains.db, logs each generation there,
 * and the overall champion per brain is exported to src/scene/trainedBrains.json (shipped with the game).
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { evolve } from '../src/scene/brain';
import { BRAIN_SPECS, type CityBrains } from '../src/scene/cityBrains';

const [gens = 150, pop = 80, runs = 1] = process.argv.slice(2).map(Number);

mkdirSync('training', { recursive: true });
const db = new DatabaseSync('training/brains.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, brain TEXT NOT NULL, sizes TEXT NOT NULL, seed INTEGER,
    pop INTEGER, gens INTEGER, resumed INTEGER, score REAL, weights TEXT, at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS generations (
    run_id INTEGER NOT NULL REFERENCES runs(id), gen INTEGER NOT NULL, best REAL, mean REAL, PRIMARY KEY (run_id, gen)
  );
`);

const champion = db.prepare('SELECT id, score, weights FROM runs WHERE brain = ? AND sizes = ? AND weights IS NOT NULL ORDER BY score DESC LIMIT 1');
const insertRun = db.prepare('INSERT INTO runs (brain, sizes, seed, pop, gens, resumed) VALUES (?, ?, ?, ?, ?, ?)');
const insertGen = db.prepare('INSERT INTO generations (run_id, gen, best, mean) VALUES (?, ?, ?, ?)');
const finishRun = db.prepare('UPDATE runs SET score = ?, weights = ? WHERE id = ?');
const lastRunId = db.prepare('SELECT COALESCE(MAX(id), 0) AS n FROM runs');

const brains = Object.keys(BRAIN_SPECS) as Array<keyof CityBrains>;

for (let r = 0; r < runs; r++) {
  for (const name of brains) {
    const spec = BRAIN_SPECS[name];
    const sizes = spec.sizes.join(',');
    const prev = champion.get(name, sizes) as { id: number; score: number; weights: string } | undefined;
    // a fresh seed each run so successive runs explore, while the champion is always kept as a starting point
    const seed = spec.seed + 1000 * ((lastRunId.get() as { n: number }).n + 1);
    const { lastInsertRowid } = insertRun.run(name, sizes, seed, pop, gens, prev?.id ?? null);
    const runId = Number(lastInsertRowid);
    const start = prev ? { sizes: spec.sizes, w: Float32Array.from(JSON.parse(prev.weights) as number[]) } : undefined;
    const { net, score } = evolve(spec.sizes, spec.fitness, seed, {
      pop,
      gens,
      start,
      onGen: (g, best, mean) => insertGen.run(runId, g, best, mean),
    });
    finishRun.run(score, JSON.stringify(Array.from(net.w)), runId);
    console.log(`${name}: run ${runId} score ${score.toFixed(2)}${prev ? ` (previous champion ${prev.score.toFixed(2)})` : ''}`);
  }
}

const out: Record<string, { sizes: readonly number[]; w: number[]; score: number }> = {};
for (const name of brains) {
  const row = champion.get(name, BRAIN_SPECS[name].sizes.join(',')) as { score: number; weights: string };
  out[name] = {
    sizes: BRAIN_SPECS[name].sizes,
    w: (JSON.parse(row.weights) as number[]).map((x) => Math.round(x * 1e5) / 1e5),
    score: Math.round(row.score * 100) / 100,
  };
}
writeFileSync('src/scene/trainedBrains.json', JSON.stringify(out, null, 1) + '\n');
console.log('exported champions to src/scene/trainedBrains.json');
