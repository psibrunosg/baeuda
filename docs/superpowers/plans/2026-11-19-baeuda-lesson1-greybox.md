# Baeuda Lesson 1 Greybox Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `baeuda` repository with a domain-driven TypeScript architecture and build the complete 7-screen Lesson 1 ("Café da Esquina") zero-translation 3D greybox prototype in React Three Fiber, ready to swap to Blender `.glb` assets and real `.mp3` files without rewriting game logic.

**Architecture:** Pure TypeScript domain layer (`src/domain`) owns the Constellation graph, learner relational memory, and deterministic 7-screen Lesson 1 state machine (including Recast, 5s hesitation hint, and `?` non-translation help). Declarative content (`src/content`) holds the Lesson 1 script and typed `.mp3` + viseme manifest. Isolated services (`src/services`) manage audio playback with a virtual clock fallback for missing `.mp3` files, gentle RMS voice capture, and versioned `localStorage` persistence. A single React Three Fiber `<Canvas>` (`src/scene`) renders the cozy low-poly greybox Neighborhood Map, Café Counter, articulated Leo rig, and 3D Constellation behind Blender-compatible contracts (`prop_*`, `cam_*`, NLA clips, `speechRef`), paired with a zero-Portuguese icon HUD and collapsible `DEV` fallback bar (`src/ui`).

**Tech Stack:** Vite 6, React 19, TypeScript 5, Three.js, `@react-three/fiber`, `@react-three/drei`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-baeuda-lesson1-greybox-design.md`

## Global Constraints

- **Zero Portuguese in learner UI:** No Portuguese labels, explanations, or buttons anywhere in learner-facing UI (`TopNav`, `LessonHud`, `SensoryCard`). Universal icons, gestures, visual contrasts, and native English audio only. English captions appear exclusively inside `DebugAudioBar` when an `.mp3` is missing or debug mode is toggled on.
- **Zero punishment / Recast only:** Never show red X icons, hearts/lives, error buzzers, countdown stress timers, or stage downgrades.
- **Monotonic Constellation stages:** `seed < root < voice`; concepts never downgrade on replay or error.
- **Strict dependency direction:** `src/domain` imports nothing from React, Three.js, or DOM/browser APIs. `src/content` imports only from `src/domain`.
- **Single R3F Canvas & safe shadow config:** Use `<Canvas shadows="percentage" dpr={[1, 1.5]}>` (never boolean `shadows`). Never call React `setState` inside `useFrame`. Never call `state.clock.getElapsedTime()` (use `state.clock.elapsedTime`).
- **Blender contract fidelity:** Interactive props use `prop_*` names resolved via `findPropName`; Leo accepts `{ animation, speechRef, position, assetMode }` with exact NLA clip names and the 5 visemes (`viseme_aa`, `viseme_ee`, `viseme_oo`, `viseme_fv`, `viseme_mbp`) + `blink`.
- **Audio fallback:** Missing `.mp3` files in `public/audio/lesson1/` must never throw uncaught errors or stall lesson progression; fallback runs a virtual clock driving `speechRef` visemes and fires `onEnded`.

---

## File Map

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.gitignore` | Project tooling, strict TS config, Vite + Vitest setup |
| `public/audio/lesson1/README.md`, `public/models/README.md` | Drop-in asset checklists for real `.mp3` files and Blender `.glb` exports |
| `src/domain/types.ts` | Core immutable domain types (`ConceptId`, `AcquisitionStage`, `LearnerProfile`, etc.) |
| `src/domain/constellation.ts` | Constellation edges, monotonic stage promotion, node upsert helpers |
| `src/domain/learnerMemory.ts` | Initial profile creation, Lesson 1 completion commit, single-concept voice promotion |
| `src/content/audioManifest.ts` | Typed `SpeechKey` manifest (`/audio/lesson1/*.mp3`, English debug phrase, fallback ms, viseme cues) |
| `src/content/lesson1Cafe.ts` | Declarative Lesson 1 screens, TPR rounds, contrast rounds, pour rounds, drink concepts, concept visuals |
| `src/domain/lessonEngine.ts` | Pure finite state machine for all 7 screens + Recast + 5s hesitation + `?` help |
| `src/services/learnerStorage.ts` | Versioned `localStorage` load/save/reset with corrupted-data recovery |
| `src/services/audioPlayer.ts` | Real `.mp3` playback + automatic virtual-clock fallback feeding mutable `speechRef` |
| `src/services/voiceCapture.ts` | Web Audio `getUserMedia` + `AnalyserNode` RMS speech detector with graceful fallback |
| `src/scene/contracts.ts` | Shared 3D contract types, `CAMERA_ANCHORS`, and `findPropName` |
| `src/scene/NeighborhoodMap.tsx` | Cozy greybox diorama neighborhood with fog, Café facade, pulsing doorway, chimney steam |
| `src/scene/CafeScene.tsx` | Greybox ↔ GLB adapter for counter, phase props, steam/ice/pour visuals, and `ErrorBoundary` |
| `src/scene/LeoBarista.tsx` | Greybox ↔ GLB adapter for Leo animations (`idle_breathe`, `ask_palm`, etc.) and `speechRef` lip-sync |
| `src/scene/Constellation3D.tsx` | 3D starfield for the 6 concepts, stage visuals, situational/contrast lines, flying completion orbs |
| `src/scene/ExperienceCanvas.tsx` | Single `<Canvas>`, damped `CameraRig`, bounded `OrbitControls`, cozy lighting |
| `src/ui/TopNav.tsx` | Icon-only Map ↔ Constellation toggle and immersion clock `MM:SS` |
| `src/ui/LessonHud.tsx` | `▶` start button, `?` help button, pour progress ring, Micro-Eco mic + silent wave |
| `src/ui/SensoryCard.tsx` | Zero-translation star detail sheet (visual icon, audio replay, contrast bridge, café shortcut, quick echo) |
| `src/ui/DebugAudioBar.tsx` | Collapsible `DEV` badge + missing-`.mp3` English fallback pill + screen jump / voice sim / reset |
| `src/App.tsx`, `src/main.tsx`, `src/index.css` | Composition root connecting state machine, timers, services, 3D scene, and HUD |

---

### Task 1: Project Scaffolding, Domain Types, Constellation Graph & Learner Memory

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `public/models/README.md`
- Create: `public/audio/lesson1/README.md`
- Create: `src/domain/types.ts`
- Create: `src/domain/constellation.ts`
- Create: `src/domain/learnerMemory.ts`
- Test: `src/domain/__tests__/constellation.test.ts`

**Interfaces:**
- Consumes: none (root module)
- Produces:
  - `src/domain/types.ts`: `ConceptId`, `AcquisitionStage`, `DrinkChoice`, `OralComfort`, `LocationId`, `LocationStatus`, `ConceptNode`, `ConstellationEdgeKind`, `ConstellationEdge`, `LearnerProfile`, `VisemeId`, `VisemeCue`
  - `src/domain/constellation.ts`: `LESSON1_CONCEPTS`, `LESSON1_EDGES`, `STAGE_RANK`, `promoteStage(current, next)`, `upsertConceptNode(constellation, conceptId, nextStage, neededHint, originLocation, nowIso)`, `getContrastPartner(conceptId)`
  - `src/domain/learnerMemory.ts`: `createInitialProfile()`, `applyLesson1Outcome(profile, outcome)`, `promoteConceptToVoice(profile, conceptId, nowIso)`

- [ ] **Step 1: Create project scaffolding files and install dependencies**

Create `.gitignore`:
```gitignore
node_modules/
dist/
.vite/
*.local
.DS_Store
```

Create `package.json`:
```json
{
  "name": "baeuda",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.0",
    "@react-three/fiber": "^9.1.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "three": "^0.176.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@types/three": "^0.176.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.8.0",
    "vite": "^6.3.0",
    "vitest": "^3.1.0"
  }
}
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

Create `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

Create `index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Baeuda</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `public/models/README.md`:
```markdown
# Blender 3D Models (Drop-In Directory)

Place optimized glTF Binary (`.glb`) exports here when ready to switch from `greybox` to `glb` mode:

- `cafe_esquina.glb`
  - Interactive prop node names: `prop_cafe_door`, `prop_cup_empty`, `prop_cup_hot`, `prop_jar_coffee`, `prop_water_cold`, `prop_iced_coffee`, `prop_box_mystery`
- `leo_barista.glb`
  - NLA clip names: `idle_breathe`, `wave_hi`, `present_left`, `present_right`, `ask_palm`, `blow_hot`, `shiver_cold`, `nod_thanks`, `surprised_happy`, `farewell_box`
  - Face Shape Keys: `viseme_aa`, `viseme_ee`, `viseme_oo`, `viseme_fv`, `viseme_mbp`, `blink`
```

Create `public/audio/lesson1/README.md`:
```markdown
# Lesson 1 Audio Files (`public/audio/lesson1/`)

Drop real English `.mp3` voice files here. While any file is missing, `AudioPlayer` automatically runs a timed virtual fallback so lip-sync and lesson progression keep working cleanly.

| Filename | Spoken English Line |
|---|---|
| `hi_leo.mp3` | Hi! Leo. |
| `demo_cup.mp3` | Cup. |
| `demo_coffee.mp3` | Coffee. |
| `demo_water.mp3` | Water. |
| `word_hot.mp3` | Hot. |
| `word_cold.mp3` | Cold. |
| `ask_cup.mp3` | Cup, please. |
| `ask_water.mp3` | Water, please. |
| `ask_coffee.mp3` | Coffee, please. |
| `thanks_cup.mp3` | Thanks! Cup. |
| `thanks_water.mp3` | Thanks! Water. |
| `thanks_coffee.mp3` | Thanks! Coffee. |
| `recast_cup.mp3` | Ah, cup! |
| `recast_coffee.mp3` | Ah, coffee! |
| `recast_water.mp3` | Ah, water! |
| `recast_hot_coffee.mp3` | Ah, hot coffee! |
| `recast_cold_water.mp3` | Ah, cold water! |
| `demo_hot_coffee.mp3` | Ooh... hot! Hot coffee. |
| `demo_cold_water.mp3` | Mmm... cold! Cold water. |
| `customer_hot_coffee.mp3` | Hot coffee, please. |
| `customer_cold_water.mp3` | Cold water, please. |
| `pour_coffee_prompt.mp3` | Pour. |
| `pour_coffee_done.mp3` | Pour... pour... good! Hot coffee! |
| `pour_water_prompt.mp3` | Now, pour cold water. |
| `pour_water_done.mp3` | Good! Cold water! |
| `choice_prompt.mp3` | Hot coffee? Or cold water? |
| `choice_confirm_hot_coffee.mp3` | Hot coffee! Nice! |
| `choice_confirm_cold_water.mp3` | Cold water! Nice! |
| `choice_cold_coffee_nice.mp3` | Ooh, cold coffee! Nice! |
| `echo_prompt_hot_coffee.mp3` | Hot coffee, please? |
| `echo_prompt_cold_water.mp3` | Cold water, please? |
| `echo_prompt_cold_coffee.mp3` | Cold coffee, please? |
| `echo_vocal_hot_coffee.mp3` | Hot coffee! Coming right up. |
| `echo_vocal_cold_water.mp3` | Cold water! Coming right up. |
| `echo_vocal_cold_coffee.mp3` | Cold coffee! Coming right up. |
| `echo_silent_hot_coffee.mp3` | One hot coffee. Enjoy! |
| `echo_silent_cold_water.mp3` | One cold water. Enjoy! |
| `echo_silent_cold_coffee.mp3` | One cold coffee. Enjoy! |
| `farewell_see_you.mp3` | See you! |
```

Run: `npm install`
Expected: installs dependencies cleanly with exit code 0.

- [ ] **Step 2: Write the failing unit tests for Constellation & LearnerMemory**

Create `src/domain/__tests__/constellation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  LESSON1_CONCEPTS,
  LESSON1_EDGES,
  getContrastPartner,
  promoteStage,
  upsertConceptNode,
} from '../constellation';
import {
  applyLesson1Outcome,
  createInitialProfile,
  promoteConceptToVoice,
} from '../learnerMemory';

describe('constellation', () => {
  it('promotes stages monotonically and never downgrades', () => {
    expect(promoteStage(undefined, 'seed')).toBe('seed');
    expect(promoteStage('seed', 'root')).toBe('root');
    expect(promoteStage('root', 'voice')).toBe('voice');
    expect(promoteStage('voice', 'seed')).toBe('voice');
    expect(promoteStage('voice', 'root')).toBe('voice');
    expect(promoteStage('root', 'seed')).toBe('root');
  });

  it('upserts concept nodes preserving higher stage and updating lastContactAt', () => {
    const first = upsertConceptNode({}, 'coffee', 'voice', false, 'cafe', '2026-11-19T10:00:00.000Z');
    const second = upsertConceptNode(first, 'coffee', 'seed', true, 'cafe', '2026-11-20T10:00:00.000Z');

    expect(second.coffee).toEqual({
      id: 'coffee',
      stage: 'voice',
      neededHint: true,
      originLocation: 'cafe',
      lastContactAt: '2026-11-20T10:00:00.000Z',
    });
  });

  it('defines all 6 Lesson 1 concepts and the hot <-> cold contrast edge', () => {
    expect(LESSON1_CONCEPTS).toEqual(['cup', 'coffee', 'water', 'hot', 'cold', 'pour']);
    expect(getContrastPartner('hot')).toBe('cold');
    expect(getContrastPartner('cold')).toBe('hot');
    expect(getContrastPartner('cup')).toBeNull();
    expect(LESSON1_EDGES.some((e) => e.kind === 'contrast' && e.from === 'hot' && e.to === 'cold')).toBe(true);
  });
});

describe('learnerMemory', () => {
  it('initializes a fresh profile with cafe discovered and empty constellation', () => {
    const profile = createInitialProfile();
    expect(profile.schemaVersion).toBe(1);
    expect(profile.preferredDrink).toBeNull();
    expect(profile.oralComfort).toBe('unknown');
    expect(profile.locations).toEqual({
      cafe: 'discovered',
      market: 'unexplored',
      plaza: 'unexplored',
    });
    expect(profile.constellation).toEqual({});
  });

  it('commits Lesson 1 outcome, marks cafe familiar, and sets concept stages correctly', () => {
    const initial = createInitialProfile();
    const updated = applyLesson1Outcome(initial, {
      preferredDrink: 'cold_coffee',
      oralComfort: 'vocal',
      hintedConcepts: ['water'],
      vocalConcepts: ['cup', 'coffee', 'cold'],
      nowIso: '2026-11-19T12:00:00.000Z',
    });

    expect(updated.preferredDrink).toBe('cold_coffee');
    expect(updated.oralComfort).toBe('vocal');
    expect(updated.locations.cafe).toBe('familiar');
    expect(updated.completedLessonIds).toContain('lesson1_cafe');
    expect(updated.constellation.cup?.stage).toBe('voice');
    expect(updated.constellation.coffee?.stage).toBe('voice');
    expect(updated.constellation.cold?.stage).toBe('voice');
    expect(updated.constellation.water?.stage).toBe('seed');
    expect(updated.constellation.hot?.stage).toBe('root');
    expect(updated.constellation.pour?.stage).toBe('root');
  });

  it('promotes a single concept to voice via Quick Echo in Sensory Card', () => {
    const profile = applyLesson1Outcome(createInitialProfile(), {
      preferredDrink: 'hot_coffee',
      oralComfort: 'silent',
      hintedConcepts: ['pour'],
      vocalConcepts: [],
      nowIso: '2026-11-19T12:00:00.000Z',
    });

    const promoted = promoteConceptToVoice(profile, 'pour', '2026-11-19T12:05:00.000Z');
    expect(promoted.constellation.pour?.stage).toBe('voice');
    expect(promoted.oralComfort).toBe('vocal');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `../constellation` and `../learnerMemory` do not exist yet.

- [ ] **Step 4: Implement `src/domain/types.ts`, `src/domain/constellation.ts`, and `src/domain/learnerMemory.ts`**

Create `src/domain/types.ts`:
```ts
export type ConceptId = 'cup' | 'coffee' | 'water' | 'hot' | 'cold' | 'pour';

export type AcquisitionStage = 'seed' | 'root' | 'voice';

export type DrinkChoice = 'hot_coffee' | 'cold_water' | 'cold_coffee';

export type OralComfort = 'unknown' | 'silent' | 'vocal';

export type LocationId = 'cafe' | 'market' | 'plaza';

export type LocationStatus = 'unexplored' | 'discovered' | 'familiar';

export interface ConceptNode {
  id: ConceptId;
  stage: AcquisitionStage;
  originLocation: LocationId;
  neededHint: boolean;
  lastContactAt: string;
}

export type ConstellationEdgeKind = 'situational' | 'contrast' | 'narrative';

export interface ConstellationEdge {
  from: ConceptId;
  to: ConceptId;
  kind: ConstellationEdgeKind;
}

export interface LearnerProfile {
  schemaVersion: 1;
  preferredDrink: DrinkChoice | null;
  oralComfort: OralComfort;
  immersionSeconds: number;
  completedLessonIds: string[];
  locations: Record<LocationId, LocationStatus>;
  constellation: Partial<Record<ConceptId, ConceptNode>>;
}

export type VisemeId = 'viseme_aa' | 'viseme_ee' | 'viseme_oo' | 'viseme_fv' | 'viseme_mbp';

export interface VisemeCue {
  at: number;
  viseme: VisemeId | null;
}

export type PropName =
  | 'prop_cafe_door'
  | 'prop_cup_empty'
  | 'prop_cup_hot'
  | 'prop_jar_coffee'
  | 'prop_water_cold'
  | 'prop_iced_coffee'
  | 'prop_box_mystery';

export type LeoAnimation =
  | 'idle_breathe'
  | 'wave_hi'
  | 'present_left'
  | 'present_right'
  | 'ask_palm'
  | 'blow_hot'
  | 'shiver_cold'
  | 'nod_thanks'
  | 'surprised_happy'
  | 'farewell_box';

export type CameraAnchorId =
  | 'cam_mapa'
  | 'cam_balcao'
  | 'cam_contraste'
  | 'cam_despejo'
  | 'cam_caixa'
  | 'cam_constelacao';
```

Create `src/domain/constellation.ts`:
```ts
import type {
  AcquisitionStage,
  ConceptId,
  ConceptNode,
  ConstellationEdge,
  LocationId,
} from './types';

export const LESSON1_CONCEPTS: readonly ConceptId[] = [
  'cup',
  'coffee',
  'water',
  'hot',
  'cold',
  'pour',
] as const;

export const LESSON1_EDGES: readonly ConstellationEdge[] = [
  { from: 'cup', to: 'coffee', kind: 'situational' },
  { from: 'cup', to: 'water', kind: 'situational' },
  { from: 'coffee', to: 'pour', kind: 'situational' },
  { from: 'water', to: 'pour', kind: 'situational' },
  { from: 'coffee', to: 'hot', kind: 'situational' },
  { from: 'water', to: 'cold', kind: 'situational' },
  { from: 'hot', to: 'cold', kind: 'contrast' },
] as const;

export const STAGE_RANK: Record<AcquisitionStage, number> = {
  seed: 1,
  root: 2,
  voice: 3,
};

export function promoteStage(
  current: AcquisitionStage | undefined,
  next: AcquisitionStage,
): AcquisitionStage {
  if (!current) return next;
  return STAGE_RANK[next] > STAGE_RANK[current] ? next : current;
}

export function upsertConceptNode(
  constellation: Partial<Record<ConceptId, ConceptNode>>,
  conceptId: ConceptId,
  nextStage: AcquisitionStage,
  neededHint: boolean,
  originLocation: LocationId,
  nowIso: string,
): Partial<Record<ConceptId, ConceptNode>> {
  const existing = constellation[conceptId];
  return {
    ...constellation,
    [conceptId]: {
      id: conceptId,
      stage: promoteStage(existing?.stage, nextStage),
      originLocation: existing?.originLocation ?? originLocation,
      neededHint,
      lastContactAt: nowIso,
    },
  };
}

export function getContrastPartner(conceptId: ConceptId): ConceptId | null {
  for (const edge of LESSON1_EDGES) {
    if (edge.kind !== 'contrast') continue;
    if (edge.from === conceptId) return edge.to;
    if (edge.to === conceptId) return edge.from;
  }
  return null;
}
```

Create `src/domain/learnerMemory.ts`:
```ts
import { LESSON1_CONCEPTS, upsertConceptNode } from './constellation';
import type { AcquisitionStage, ConceptId, DrinkChoice, LearnerProfile, OralComfort } from './types';

export interface Lesson1Outcome {
  preferredDrink: DrinkChoice;
  oralComfort: Exclude<OralComfort, 'unknown'>;
  hintedConcepts: readonly ConceptId[];
  vocalConcepts: readonly ConceptId[];
  nowIso: string;
}

export function createInitialProfile(): LearnerProfile {
  return {
    schemaVersion: 1,
    preferredDrink: null,
    oralComfort: 'unknown',
    immersionSeconds: 0,
    completedLessonIds: [],
    locations: {
      cafe: 'discovered',
      market: 'unexplored',
      plaza: 'unexplored',
    },
    constellation: {},
  };
}

export function applyLesson1Outcome(
  profile: LearnerProfile,
  outcome: Lesson1Outcome,
): LearnerProfile {
  const hinted = new Set(outcome.hintedConcepts);
  const vocal = new Set(outcome.vocalConcepts);

  let nextConstellation = { ...profile.constellation };

  for (const conceptId of LESSON1_CONCEPTS) {
    let stage: AcquisitionStage = 'root';
    if (vocal.has(conceptId)) {
      stage = 'voice';
    } else if (hinted.has(conceptId)) {
      stage = 'seed';
    }

    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      stage,
      hinted.has(conceptId),
      'cafe',
      outcome.nowIso,
    );
  }

  const completedLessonIds = profile.completedLessonIds.includes('lesson1_cafe')
    ? profile.completedLessonIds
    : [...profile.completedLessonIds, 'lesson1_cafe'];

  return {
    ...profile,
    preferredDrink: outcome.preferredDrink,
    oralComfort: outcome.oralComfort,
    completedLessonIds,
    locations: {
      ...profile.locations,
      cafe: 'familiar',
    },
    constellation: nextConstellation,
  };
}

export function promoteConceptToVoice(
  profile: LearnerProfile,
  conceptId: ConceptId,
  nowIso: string,
): LearnerProfile {
  const existing = profile.constellation[conceptId];
  return {
    ...profile,
    oralComfort: 'vocal',
    constellation: upsertConceptNode(
      profile.constellation,
      conceptId,
      'voice',
      existing?.neededHint ?? false,
      existing?.originLocation ?? 'cafe',
      nowIso,
    ),
  };
}
```

- [ ] **Step 5: Run tests and TypeScript check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (5 tests passing, 0 TS errors).

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts index.html public/ src/domain/
git commit -m "feat: scaffold project and add domain constellation and learner memory"
```

---

### Task 2: Declarative Content — Audio Manifest & Lesson 1 Script

**Files:**
- Create: `src/content/audioManifest.ts`
- Create: `src/content/lesson1Cafe.ts`
- Test: `src/content/__tests__/contentIntegrity.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts` (`ConceptId`, `DrinkChoice`, `LeoAnimation`, `PropName`, `VisemeCue`), `src/domain/constellation.ts` (`LESSON1_CONCEPTS`)
- Produces:
  - `src/content/audioManifest.ts`: `SpeechKey`, `SpeechLine`, `AUDIO_MANIFEST`, `CONCEPT_AUDIO_KEY`
  - `src/content/lesson1Cafe.ts`: `CounterDemoBeat`, `TprRound`, `ContrastDemoBeat`, `ContrastRound`, `PourRound`, `ConceptVisualMeta`, `COUNTER_DEMO_BEATS`, `TPR_ROUNDS`, `CONTRAST_DEMO_BEATS`, `CONTRAST_ROUNDS`, `POUR_ROUNDS`, `DRINK_TO_CONCEPTS`, `PROP_TO_DRINK`, `PROP_RECAST_AUDIO`, `CONCEPT_VISUALS`

- [ ] **Step 1: Write the failing content integrity test**

Create `src/content/__tests__/contentIntegrity.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { LESSON1_CONCEPTS } from '../../domain/constellation';
import { AUDIO_MANIFEST, CONCEPT_AUDIO_KEY, type SpeechKey } from '../audioManifest';
import {
  CONCEPT_VISUALS,
  CONTRAST_DEMO_BEATS,
  CONTRAST_ROUNDS,
  COUNTER_DEMO_BEATS,
  DRINK_TO_CONCEPTS,
  POUR_ROUNDS,
  PROP_RECAST_AUDIO,
  TPR_ROUNDS,
} from '../lesson1Cafe';

describe('content integrity', () => {
  it('ensures every audio manifest entry has a valid path, positive duration, and sorted viseme cues', () => {
    const entries = Object.entries(AUDIO_MANIFEST);
    expect(entries.length).toBeGreaterThanOrEqual(35);

    for (const [key, line] of entries) {
      expect(line.src).toBe(`/audio/lesson1/${key}.mp3`);
      expect(line.phrase.length).toBeGreaterThan(0);
      expect(line.fallbackDurationMs).toBeGreaterThan(300);
      for (let i = 1; i < line.cues.length; i++) {
        expect(line.cues[i].at).toBeGreaterThanOrEqual(line.cues[i - 1].at);
      }
      expect(line.cues[line.cues.length - 1]?.viseme).toBeNull();
    }
  });

  it('maps every Lesson 1 concept to an audio key and visual metadata', () => {
    for (const concept of LESSON1_CONCEPTS) {
      const audioKey = CONCEPT_AUDIO_KEY[concept];
      expect(AUDIO_MANIFEST[audioKey]).toBeDefined();
      expect(CONCEPT_VISUALS[concept]).toBeDefined();
      expect(CONCEPT_VISUALS[concept].color).toMatch(/^#/);
    }
  });

  it('validates all speech keys referenced by Lesson 1 script exist in AUDIO_MANIFEST', () => {
    const referenced: SpeechKey[] = [
      ...COUNTER_DEMO_BEATS.map((b) => b.audioKey),
      ...TPR_ROUNDS.flatMap((r) => [r.promptAudio, r.thanksAudio, r.helpAudio]),
      ...CONTRAST_DEMO_BEATS.map((b) => b.audioKey),
      ...CONTRAST_ROUNDS.flatMap((r) => [r.promptAudio, r.thanksAudio, r.helpAudio]),
      ...POUR_ROUNDS.flatMap((r) => [r.promptAudio, r.doneAudio, r.helpAudio]),
      ...Object.values(PROP_RECAST_AUDIO),
    ];

    for (const key of referenced) {
      expect(AUDIO_MANIFEST[key]).toBeDefined();
    }

    expect(DRINK_TO_CONCEPTS.hot_coffee).toEqual(['cup', 'coffee', 'hot']);
    expect(DRINK_TO_CONCEPTS.cold_water).toEqual(['cup', 'water', 'cold']);
    expect(DRINK_TO_CONCEPTS.cold_coffee).toEqual(['cup', 'coffee', 'cold']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `audioManifest.ts` and `lesson1Cafe.ts` do not exist yet.

- [ ] **Step 3: Implement `src/content/audioManifest.ts` and `src/content/lesson1Cafe.ts`**

Create `src/content/audioManifest.ts`:
```ts
import type { ConceptId, VisemeCue } from '../domain/types';

export interface SpeechLine {
  src: string;
  phrase: string;
  fallbackDurationMs: number;
  cues: readonly VisemeCue[];
}

export type SpeechKey =
  | 'hi_leo'
  | 'demo_cup'
  | 'demo_coffee'
  | 'demo_water'
  | 'word_hot'
  | 'word_cold'
  | 'ask_cup'
  | 'ask_water'
  | 'ask_coffee'
  | 'thanks_cup'
  | 'thanks_water'
  | 'thanks_coffee'
  | 'recast_cup'
  | 'recast_coffee'
  | 'recast_water'
  | 'recast_hot_coffee'
  | 'recast_cold_water'
  | 'demo_hot_coffee'
  | 'demo_cold_water'
  | 'customer_hot_coffee'
  | 'customer_cold_water'
  | 'pour_coffee_prompt'
  | 'pour_coffee_done'
  | 'pour_water_prompt'
  | 'pour_water_done'
  | 'choice_prompt'
  | 'choice_confirm_hot_coffee'
  | 'choice_confirm_cold_water'
  | 'choice_cold_coffee_nice'
  | 'echo_prompt_hot_coffee'
  | 'echo_prompt_cold_water'
  | 'echo_prompt_cold_coffee'
  | 'echo_vocal_hot_coffee'
  | 'echo_vocal_cold_water'
  | 'echo_vocal_cold_coffee'
  | 'echo_silent_hot_coffee'
  | 'echo_silent_cold_water'
  | 'echo_silent_cold_coffee'
  | 'farewell_see_you';

const line = (
  key: SpeechKey,
  phrase: string,
  fallbackDurationMs: number,
  cues: readonly VisemeCue[],
): SpeechLine => ({
  src: `/audio/lesson1/${key}.mp3`,
  phrase,
  fallbackDurationMs,
  cues,
});

export const AUDIO_MANIFEST: Record<SpeechKey, SpeechLine> = {
  hi_leo: line('hi_leo', 'Hi! Leo.', 1500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.28, viseme: 'viseme_ee' },
    { at: 0.65, viseme: 'viseme_ee' },
    { at: 0.95, viseme: 'viseme_oo' },
    { at: 1.35, viseme: null },
  ]),
  demo_cup: line('demo_cup', 'Cup.', 900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.35, viseme: 'viseme_mbp' },
    { at: 0.75, viseme: null },
  ]),
  demo_coffee: line('demo_coffee', 'Coffee.', 1050, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.32, viseme: 'viseme_fv' },
    { at: 0.58, viseme: 'viseme_ee' },
    { at: 0.9, viseme: null },
  ]),
  demo_water: line('demo_water', 'Water.', 1050, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.28, viseme: 'viseme_aa' },
    { at: 0.62, viseme: 'viseme_ee' },
    { at: 0.92, viseme: null },
  ]),
  word_hot: line('word_hot', 'Hot.', 900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.48, viseme: 'viseme_ee' },
    { at: 0.78, viseme: null },
  ]),
  word_cold: line('word_cold', 'Cold.', 950, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_ee' },
    { at: 0.82, viseme: null },
  ]),
  ask_cup: line('ask_cup', 'Cup, please.', 1200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.25, viseme: 'viseme_mbp' },
    { at: 0.52, viseme: 'viseme_ee' },
    { at: 1.05, viseme: null },
  ]),
  ask_water: line('ask_water', 'Water, please.', 1300, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.28, viseme: 'viseme_aa' },
    { at: 0.65, viseme: 'viseme_mbp' },
    { at: 0.82, viseme: 'viseme_ee' },
    { at: 1.18, viseme: null },
  ]),
  ask_coffee: line('ask_coffee', 'Coffee, please.', 1350, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.26, viseme: 'viseme_fv' },
    { at: 0.48, viseme: 'viseme_ee' },
    { at: 0.78, viseme: 'viseme_mbp' },
    { at: 0.94, viseme: 'viseme_ee' },
    { at: 1.24, viseme: null },
  ]),
  thanks_cup: line('thanks_cup', 'Thanks! Cup.', 1200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_aa' },
    { at: 0.78, viseme: 'viseme_mbp' },
    { at: 1.08, viseme: null },
  ]),
  thanks_water: line('thanks_water', 'Thanks! Water.', 1300, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_oo' },
    { at: 0.82, viseme: 'viseme_aa' },
    { at: 1.18, viseme: null },
  ]),
  thanks_coffee: line('thanks_coffee', 'Thanks! Coffee.', 1350, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_aa' },
    { at: 0.78, viseme: 'viseme_fv' },
    { at: 1.0, viseme: 'viseme_ee' },
    { at: 1.25, viseme: null },
  ]),
  recast_cup: line('recast_cup', 'Ah, cup!', 1000, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.42, viseme: 'viseme_aa' },
    { at: 0.68, viseme: 'viseme_mbp' },
    { at: 0.9, viseme: null },
  ]),
  recast_coffee: line('recast_coffee', 'Ah, coffee!', 1150, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.42, viseme: 'viseme_aa' },
    { at: 0.68, viseme: 'viseme_fv' },
    { at: 0.88, viseme: 'viseme_ee' },
    { at: 1.08, viseme: null },
  ]),
  recast_water: line('recast_water', 'Ah, water!', 1100, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.4, viseme: 'viseme_oo' },
    { at: 0.72, viseme: 'viseme_aa' },
    { at: 1.02, viseme: null },
  ]),
  recast_hot_coffee: line('recast_hot_coffee', 'Ah, hot coffee!', 1400, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_aa' },
    { at: 0.82, viseme: 'viseme_fv' },
    { at: 1.05, viseme: 'viseme_ee' },
    { at: 1.32, viseme: null },
  ]),
  recast_cold_water: line('recast_cold_water', 'Ah, cold water!', 1400, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.42, viseme: 'viseme_oo' },
    { at: 0.8, viseme: 'viseme_oo' },
    { at: 1.05, viseme: 'viseme_aa' },
    { at: 1.32, viseme: null },
  ]),
  demo_hot_coffee: line('demo_hot_coffee', 'Ooh... hot! Hot coffee.', 2100, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.55, viseme: 'viseme_aa' },
    { at: 1.05, viseme: 'viseme_aa' },
    { at: 1.48, viseme: 'viseme_fv' },
    { at: 1.72, viseme: 'viseme_ee' },
    { at: 2.0, viseme: null },
  ]),
  demo_cold_water: line('demo_cold_water', 'Mmm... cold! Cold water.', 2100, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.55, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.5, viseme: 'viseme_oo' },
    { at: 1.75, viseme: 'viseme_aa' },
    { at: 2.0, viseme: null },
  ]),
  customer_hot_coffee: line('customer_hot_coffee', 'Hot coffee, please.', 1550, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.42, viseme: 'viseme_fv' },
    { at: 0.68, viseme: 'viseme_ee' },
    { at: 1.02, viseme: 'viseme_mbp' },
    { at: 1.2, viseme: 'viseme_ee' },
    { at: 1.48, viseme: null },
  ]),
  customer_cold_water: line('customer_cold_water', 'Cold water, please.', 1550, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_oo' },
    { at: 0.72, viseme: 'viseme_aa' },
    { at: 1.05, viseme: 'viseme_mbp' },
    { at: 1.22, viseme: 'viseme_ee' },
    { at: 1.48, viseme: null },
  ]),
  pour_coffee_prompt: line('pour_coffee_prompt', 'Pour.', 950, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.22, viseme: 'viseme_oo' },
    { at: 0.82, viseme: null },
  ]),
  pour_coffee_done: line('pour_coffee_done', 'Pour... pour... good! Hot coffee!', 2100, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.18, viseme: 'viseme_oo' },
    { at: 0.65, viseme: 'viseme_oo' },
    { at: 1.15, viseme: 'viseme_aa' },
    { at: 1.58, viseme: 'viseme_fv' },
    { at: 1.82, viseme: 'viseme_ee' },
    { at: 2.02, viseme: null },
  ]),
  pour_water_prompt: line('pour_water_prompt', 'Now, pour cold water.', 1750, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_mbp' },
    { at: 0.65, viseme: 'viseme_oo' },
    { at: 1.05, viseme: 'viseme_oo' },
    { at: 1.38, viseme: 'viseme_aa' },
    { at: 1.66, viseme: null },
  ]),
  pour_water_done: line('pour_water_done', 'Good! Cold water!', 1450, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.48, viseme: 'viseme_oo' },
    { at: 0.88, viseme: 'viseme_oo' },
    { at: 1.12, viseme: 'viseme_aa' },
    { at: 1.38, viseme: null },
  ]),
  choice_prompt: line('choice_prompt', 'Hot coffee? Or cold water?', 2150, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.38, viseme: 'viseme_fv' },
    { at: 0.62, viseme: 'viseme_ee' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.48, viseme: 'viseme_oo' },
    { at: 1.78, viseme: 'viseme_aa' },
    { at: 2.05, viseme: null },
  ]),
  choice_confirm_hot_coffee: line('choice_confirm_hot_coffee', 'Hot coffee! Nice!', 1450, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.4, viseme: 'viseme_fv' },
    { at: 0.68, viseme: 'viseme_ee' },
    { at: 1.02, viseme: 'viseme_aa' },
    { at: 1.36, viseme: null },
  ]),
  choice_confirm_cold_water: line('choice_confirm_cold_water', 'Cold water! Nice!', 1450, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_oo' },
    { at: 0.72, viseme: 'viseme_aa' },
    { at: 1.05, viseme: 'viseme_aa' },
    { at: 1.36, viseme: null },
  ]),
  choice_cold_coffee_nice: line('choice_cold_coffee_nice', 'Ooh, cold coffee! Nice!', 1750, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_oo' },
    { at: 0.82, viseme: 'viseme_fv' },
    { at: 1.05, viseme: 'viseme_ee' },
    { at: 1.35, viseme: 'viseme_aa' },
    { at: 1.66, viseme: null },
  ]),
  echo_prompt_hot_coffee: line('echo_prompt_hot_coffee', 'Hot coffee, please?', 1600, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.42, viseme: 'viseme_fv' },
    { at: 0.7, viseme: 'viseme_ee' },
    { at: 1.06, viseme: 'viseme_mbp' },
    { at: 1.24, viseme: 'viseme_ee' },
    { at: 1.52, viseme: null },
  ]),
  echo_prompt_cold_water: line('echo_prompt_cold_water', 'Cold water, please?', 1600, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.46, viseme: 'viseme_oo' },
    { at: 0.74, viseme: 'viseme_aa' },
    { at: 1.08, viseme: 'viseme_mbp' },
    { at: 1.25, viseme: 'viseme_ee' },
    { at: 1.52, viseme: null },
  ]),
  echo_prompt_cold_coffee: line('echo_prompt_cold_coffee', 'Cold coffee, please?', 1650, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.42, viseme: 'viseme_aa' },
    { at: 0.72, viseme: 'viseme_fv' },
    { at: 0.95, viseme: 'viseme_ee' },
    { at: 1.2, viseme: 'viseme_mbp' },
    { at: 1.35, viseme: 'viseme_ee' },
    { at: 1.58, viseme: null },
  ]),
  echo_vocal_hot_coffee: line('echo_vocal_hot_coffee', 'Hot coffee! Coming right up.', 1900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.42, viseme: 'viseme_fv' },
    { at: 0.7, viseme: 'viseme_ee' },
    { at: 1.05, viseme: 'viseme_aa' },
    { at: 1.45, viseme: 'viseme_mbp' },
    { at: 1.8, viseme: null },
  ]),
  echo_vocal_cold_water: line('echo_vocal_cold_water', 'Cold water! Coming right up.', 1900, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_aa' },
    { at: 0.98, viseme: 'viseme_aa' },
    { at: 1.45, viseme: 'viseme_mbp' },
    { at: 1.8, viseme: null },
  ]),
  echo_vocal_cold_coffee: line('echo_vocal_cold_coffee', 'Cold coffee! Coming right up.', 1950, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_fv' },
    { at: 0.75, viseme: 'viseme_ee' },
    { at: 1.1, viseme: 'viseme_aa' },
    { at: 1.5, viseme: 'viseme_mbp' },
    { at: 1.85, viseme: null },
  ]),
  echo_silent_hot_coffee: line('echo_silent_hot_coffee', 'One hot coffee. Enjoy!', 1750, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.35, viseme: 'viseme_aa' },
    { at: 0.75, viseme: 'viseme_fv' },
    { at: 1.0, viseme: 'viseme_ee' },
    { at: 1.32, viseme: 'viseme_oo' },
    { at: 1.66, viseme: null },
  ]),
  echo_silent_cold_water: line('echo_silent_cold_water', 'One cold water. Enjoy!', 1750, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.38, viseme: 'viseme_oo' },
    { at: 0.78, viseme: 'viseme_aa' },
    { at: 1.25, viseme: 'viseme_oo' },
    { at: 1.66, viseme: null },
  ]),
  echo_silent_cold_coffee: line('echo_silent_cold_coffee', 'One cold coffee. Enjoy!', 1800, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.4, viseme: 'viseme_oo' },
    { at: 0.82, viseme: 'viseme_fv' },
    { at: 1.08, viseme: 'viseme_ee' },
    { at: 1.35, viseme: 'viseme_oo' },
    { at: 1.7, viseme: null },
  ]),
  farewell_see_you: line('farewell_see_you', 'See you!', 1150, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.48, viseme: 'viseme_oo' },
    { at: 1.05, viseme: null },
  ]),
};

export const CONCEPT_AUDIO_KEY: Record<ConceptId, SpeechKey> = {
  cup: 'demo_cup',
  coffee: 'demo_coffee',
  water: 'demo_water',
  hot: 'word_hot',
  cold: 'word_cold',
  pour: 'pour_coffee_prompt',
};
```

Create `src/content/lesson1Cafe.ts`:
```ts
import type { ConceptId, DrinkChoice, LeoAnimation, PropName } from '../domain/types';
import type { SpeechKey } from './audioManifest';

export interface CounterDemoBeat {
  prop: PropName;
  concept: ConceptId;
  audioKey: SpeechKey;
  leoAnim: LeoAnimation;
}

export interface TprRound {
  targetProp: PropName;
  concept: ConceptId;
  promptAudio: SpeechKey;
  thanksAudio: SpeechKey;
  helpAudio: SpeechKey;
}

export interface ContrastDemoBeat {
  prop: PropName;
  concept: ConceptId;
  audioKey: SpeechKey;
  leoAnim: LeoAnimation;
}

export interface ContrastRound {
  customerMood: 'cold' | 'warm';
  targetProp: PropName;
  concepts: readonly ConceptId[];
  promptAudio: SpeechKey;
  thanksAudio: SpeechKey;
  helpAudio: SpeechKey;
}

export interface PourRound {
  liquid: 'coffee' | 'water';
  vesselProp: PropName;
  promptAudio: SpeechKey;
  doneAudio: SpeechKey;
  helpAudio: SpeechKey;
}

export interface ConceptVisualMeta {
  id: ConceptId;
  color: string;
  position3D: readonly [number, number, number];
  iconSymbol: string;
}

export const COUNTER_DEMO_BEATS: readonly CounterDemoBeat[] = [
  { prop: 'prop_cup_empty', concept: 'cup', audioKey: 'demo_cup', leoAnim: 'present_left' },
  { prop: 'prop_jar_coffee', concept: 'coffee', audioKey: 'demo_coffee', leoAnim: 'present_right' },
  { prop: 'prop_water_cold', concept: 'water', audioKey: 'demo_water', leoAnim: 'present_right' },
];

export const TPR_ROUNDS: readonly TprRound[] = [
  {
    targetProp: 'prop_cup_empty',
    concept: 'cup',
    promptAudio: 'ask_cup',
    thanksAudio: 'thanks_cup',
    helpAudio: 'demo_cup',
  },
  {
    targetProp: 'prop_water_cold',
    concept: 'water',
    promptAudio: 'ask_water',
    thanksAudio: 'thanks_water',
    helpAudio: 'demo_water',
  },
  {
    targetProp: 'prop_jar_coffee',
    concept: 'coffee',
    promptAudio: 'ask_coffee',
    thanksAudio: 'thanks_coffee',
    helpAudio: 'demo_coffee',
  },
];

export const CONTRAST_DEMO_BEATS: readonly ContrastDemoBeat[] = [
  { prop: 'prop_cup_hot', concept: 'hot', audioKey: 'demo_hot_coffee', leoAnim: 'blow_hot' },
  { prop: 'prop_water_cold', concept: 'cold', audioKey: 'demo_cold_water', leoAnim: 'shiver_cold' },
];

export const CONTRAST_ROUNDS: readonly ContrastRound[] = [
  {
    customerMood: 'cold',
    targetProp: 'prop_cup_hot',
    concepts: ['hot', 'coffee'],
    promptAudio: 'customer_hot_coffee',
    thanksAudio: 'thanks_coffee',
    helpAudio: 'word_hot',
  },
  {
    customerMood: 'warm',
    targetProp: 'prop_water_cold',
    concepts: ['cold', 'water'],
    promptAudio: 'customer_cold_water',
    thanksAudio: 'thanks_water',
    helpAudio: 'word_cold',
  },
];

export const POUR_ROUNDS: readonly PourRound[] = [
  {
    liquid: 'coffee',
    vesselProp: 'prop_jar_coffee',
    promptAudio: 'pour_coffee_prompt',
    doneAudio: 'pour_coffee_done',
    helpAudio: 'pour_coffee_prompt',
  },
  {
    liquid: 'water',
    vesselProp: 'prop_water_cold',
    promptAudio: 'pour_water_prompt',
    doneAudio: 'pour_water_done',
    helpAudio: 'pour_coffee_prompt',
  },
];

export const DRINK_TO_CONCEPTS: Record<DrinkChoice, readonly ConceptId[]> = {
  hot_coffee: ['cup', 'coffee', 'hot'],
  cold_water: ['cup', 'water', 'cold'],
  cold_coffee: ['cup', 'coffee', 'cold'],
};

export const PROP_TO_DRINK: Partial<Record<PropName, DrinkChoice>> = {
  prop_cup_hot: 'hot_coffee',
  prop_water_cold: 'cold_water',
  prop_iced_coffee: 'cold_coffee',
};

export const PROP_RECAST_AUDIO: Partial<Record<PropName, SpeechKey>> = {
  prop_cup_empty: 'recast_cup',
  prop_jar_coffee: 'recast_coffee',
  prop_water_cold: 'recast_water',
  prop_cup_hot: 'recast_hot_coffee',
};

export const CONCEPT_VISUALS: Record<ConceptId, ConceptVisualMeta> = {
  cup: { id: 'cup', color: '#f4d9b0', position3D: [-1.1, 0.25, 0.2], iconSymbol: '☕' },
  coffee: { id: 'coffee', color: '#9c5a2d', position3D: [-0.25, 0.95, -0.35], iconSymbol: '🫘' },
  water: { id: 'water', color: '#6ec5e9', position3D: [0.95, 0.85, -0.2], iconSymbol: '💧' },
  hot: { id: 'hot', color: '#f97316', position3D: [-1.25, 1.35, -0.75], iconSymbol: '🔥' },
  cold: { id: 'cold', color: '#38bdf8', position3D: [1.35, 1.35, -0.75], iconSymbol: '❄️' },
  pour: { id: 'pour', color: '#eab308', position3D: [0.1, -0.35, 0.45], iconSymbol: '🫗' },
};
```

- [ ] **Step 4: Run tests and TypeScript check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (8 tests passing, 0 TS errors).

- [ ] **Step 5: Commit**

```bash
git add src/content/
git commit -m "feat: add declarative Lesson 1 script and typed audio/viseme manifest"
```

---

### Task 3: Lesson 1 Finite State Machine (`src/domain/lessonEngine.ts`)

**Files:**
- Create: `src/domain/lessonEngine.ts`
- Test: `src/domain/__tests__/lessonEngine.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`, `src/domain/learnerMemory.ts` (`applyLesson1Outcome`), `src/content/audioManifest.ts` (`SpeechKey`), `src/content/lesson1Cafe.ts`
- Produces:
  - `LessonPhase`: `'map_arrival' | 'counter_intro' | 'thermal_contrast' | 'action_pour' | 'personal_choice' | 'micro_echo' | 'farewell_constellation'`
  - `HintMode`: `'none' | 'glow' | 'contrast'`
  - `LessonEffect`: discriminated union (`play_audio` | `commit_profile`)
  - `LessonState`: full serializable state (phase, subStep, roundIndex, awaitingInput, leoAnim, cameraAnchor, highlightedProp, hintMode, customerMood, activePourLiquid, preferredDrink, oralComfort, hintedConcepts, vocalConcepts, mysteryBoxVisible, orbsLaunching, completed)
  - `LessonEvent`: discriminated union (`ENTER_CAFE` | `AUDIO_ENDED` | `PROP_TAPPED` | `POUR_COMPLETED` | `VOICE_DETECTED` | `SILENT_WAVE` | `HELP_REQUESTED` | `HESITATION_TIMEOUT` | `JUMP_TO_PHASE`)
  - `createLesson1State()`: returns initial `LessonState`
  - `lessonReducer(state, event, profile, nowIso)`: returns `{ state: LessonState; effects: LessonEffect[] }`

- [ ] **Step 1: Write the failing state-machine unit tests**

Create `src/domain/__tests__/lessonEngine.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createInitialProfile } from '../learnerMemory';
import {
  createLesson1State,
  lessonReducer,
  type LessonEffect,
  type LessonEvent,
  type LessonState,
} from '../lessonEngine';

const NOW = '2026-11-19T14:00:00.000Z';

function step(
  state: LessonState,
  event: LessonEvent,
  profile = createInitialProfile(),
): { state: LessonState; effects: LessonEffect[] } {
  return lessonReducer(state, event, profile, NOW);
}

describe('lessonEngine (7-screen Lesson 1)', () => {
  it('completes the full happy path from map_arrival to farewell_constellation with cold_coffee + vocal', () => {
    const profile = createInitialProfile();
    let s = createLesson1State();

    // Screen 1: map_arrival
    let res = step(s, { type: 'ENTER_CAFE' }, profile);
    s = res.state;
    expect(s.cameraAnchor).toBe('cam_balcao');
    expect(s.leoAnim).toBe('wave_hi');
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'hi_leo', playbackRate: 1 }]);

    // Greeting ends -> Screen 2 counter_intro demo beats (cup, coffee, water)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('counter_intro');
    expect(s.highlightedProp).toBe('prop_cup_empty');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.highlightedProp).toBe('prop_jar_coffee');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.highlightedProp).toBe('prop_water_cold');

    // TPR rounds: cup -> water -> coffee
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.awaitingInput).toBe(true);
    expect(s.leoAnim).toBe('ask_palm');

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_cup_empty' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'thanks_cup', playbackRate: 1 }]);

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_water_cold' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'thanks_water', playbackRate: 1 }]);

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_jar_coffee' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'thanks_coffee', playbackRate: 1 }]);

    // Screen 3: thermal_contrast (2 demos + 2 customer requests)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('thermal_contrast');
    expect(s.leoAnim).toBe('blow_hot');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.leoAnim).toBe('shiver_cold');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.customerMood).toBe('cold');
    expect(s.awaitingInput).toBe(true);

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_cup_hot' }, profile);
    s = res.state;
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.customerMood).toBe('warm');

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_water_cold' }, profile);
    s = res.state;

    // Screen 4: action_pour (coffee then water)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('action_pour');
    expect(s.activePourLiquid).toBe('coffee');
    expect(s.awaitingInput).toBe(true);

    res = step(s, { type: 'POUR_COMPLETED' }, profile);
    s = res.state;
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'pour_coffee_done', playbackRate: 1 }]);

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.activePourLiquid).toBe('water');

    res = step(s, { type: 'POUR_COMPLETED' }, profile);
    s = res.state;

    // Screen 5: personal_choice (creative cold_coffee!)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('personal_choice');
    expect(s.awaitingInput).toBe(true);

    res = step(s, { type: 'PROP_TAPPED', prop: 'prop_iced_coffee' }, profile);
    s = res.state;
    expect(s.preferredDrink).toBe('cold_coffee');
    expect(s.leoAnim).toBe('surprised_happy');
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'choice_cold_coffee_nice', playbackRate: 1 }]);

    // Screen 6: micro_echo (vocal path)
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('micro_echo');
    expect(s.awaitingInput).toBe(true);
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'echo_prompt_cold_coffee', playbackRate: 1 }]);

    res = step(s, { type: 'VOICE_DETECTED' }, profile);
    s = res.state;
    expect(s.oralComfort).toBe('vocal');
    expect(s.vocalConcepts).toEqual(['cup', 'coffee', 'cold']);
    expect(res.effects).toEqual([{ type: 'play_audio', key: 'echo_vocal_cold_coffee', playbackRate: 1 }]);

    // Screen 7: farewell_constellation
    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.phase).toBe('farewell_constellation');
    expect(s.mysteryBoxVisible).toBe(true);
    expect(s.cameraAnchor).toBe('cam_caixa');

    res = step(s, { type: 'AUDIO_ENDED' }, profile);
    s = res.state;
    expect(s.orbsLaunching).toBe(true);
    expect(s.completed).toBe(true);
    expect(s.cameraAnchor).toBe('cam_constelacao');

    const commit = res.effects.find((e) => e.type === 'commit_profile');
    expect(commit).toBeDefined();
    if (commit?.type === 'commit_profile') {
      expect(commit.profile.preferredDrink).toBe('cold_coffee');
      expect(commit.profile.oralComfort).toBe('vocal');
      expect(commit.profile.constellation.cold?.stage).toBe('voice');
      expect(commit.profile.constellation.hot?.stage).toBe('root');
    }
  });

  it('handles wrong tap with gentle Recast, records hinted concept, and later classifies it as seed', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'counter_intro' }).state;
    // Skip 3 demos to reach TPR round 0 (asking for cup)
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;

    // Tap water instead of cup
    const recastRes = step(s, { type: 'PROP_TAPPED', prop: 'prop_water_cold' });
    expect(recastRes.state.hintedConcepts).toContain('cup');
    expect(recastRes.state.hintMode).toBe('glow');
    expect(recastRes.state.highlightedProp).toBe('prop_cup_empty');
    expect(recastRes.effects).toEqual([
      { type: 'play_audio', key: 'recast_water', playbackRate: 1, followUpKey: 'ask_cup' },
    ]);
  });

  it('handles 5s hesitation timeout by glowing target and slowing playback to 0.8x', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'counter_intro' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;

    const hintRes = step(s, { type: 'HESITATION_TIMEOUT' });
    expect(hintRes.state.hintMode).toBe('glow');
    expect(hintRes.state.highlightedProp).toBe('prop_cup_empty');
    expect(hintRes.effects).toEqual([{ type: 'play_audio', key: 'ask_cup', playbackRate: 0.8 }]);
  });

  it('handles ? help button with contrast highlight and isolated word audio', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'thermal_contrast' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;
    s = step(s, { type: 'AUDIO_ENDED' }).state;

    const helpRes = step(s, { type: 'HELP_REQUESTED' });
    expect(helpRes.state.hintMode).toBe('contrast');
    expect(helpRes.state.hintedConcepts).toContain('hot');
    expect(helpRes.effects).toEqual([{ type: 'play_audio', key: 'word_hot', playbackRate: 0.85 }]);
  });

  it('welcomes silent wave on Screen 6 without punishment', () => {
    let s = createLesson1State();
    s = step(s, { type: 'JUMP_TO_PHASE', phase: 'micro_echo' }).state;

    const silentRes = step(s, { type: 'SILENT_WAVE' });
    expect(silentRes.state.oralComfort).toBe('silent');
    expect(silentRes.state.vocalConcepts).toEqual([]);
    expect(silentRes.state.leoAnim).toBe('nod_thanks');
    expect(silentRes.effects).toEqual([{ type: 'play_audio', key: 'echo_silent_hot_coffee', playbackRate: 1 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `src/domain/lessonEngine.ts` does not exist yet.

- [ ] **Step 3: Implement `src/domain/lessonEngine.ts`**

Create `src/domain/lessonEngine.ts`:
```ts
import type { SpeechKey } from '../content/audioManifest';
import {
  CONTRAST_DEMO_BEATS,
  CONTRAST_ROUNDS,
  COUNTER_DEMO_BEATS,
  DRINK_TO_CONCEPTS,
  POUR_ROUNDS,
  PROP_RECAST_AUDIO,
  PROP_TO_DRINK,
  TPR_ROUNDS,
} from '../content/lesson1Cafe';
import { applyLesson1Outcome } from './learnerMemory';
import type {
  CameraAnchorId,
  ConceptId,
  DrinkChoice,
  LearnerProfile,
  LeoAnimation,
  OralComfort,
  PropName,
} from './types';

export type LessonPhase =
  | 'map_arrival'
  | 'counter_intro'
  | 'thermal_contrast'
  | 'action_pour'
  | 'personal_choice'
  | 'micro_echo'
  | 'farewell_constellation';

export type LessonSubStep =
  | 'idle_map'
  | 'greeting'
  | 'demo'
  | 'interact'
  | 'feedback'
  | 'farewell_box'
  | 'constellation_ready';

export type HintMode = 'none' | 'glow' | 'contrast';

export type LessonEffect =
  | {
      type: 'play_audio';
      key: SpeechKey;
      playbackRate: number;
      followUpKey?: SpeechKey;
    }
  | {
      type: 'commit_profile';
      profile: LearnerProfile;
    };

export interface LessonState {
  phase: LessonPhase;
  subStep: LessonSubStep;
  roundIndex: number;
  awaitingInput: boolean;
  leoAnim: LeoAnimation;
  cameraAnchor: CameraAnchorId;
  highlightedProp: PropName | null;
  hintMode: HintMode;
  customerMood: 'cold' | 'warm' | null;
  activePourLiquid: 'coffee' | 'water' | null;
  preferredDrink: DrinkChoice;
  oralComfort: OralComfort;
  hintedConcepts: ConceptId[];
  vocalConcepts: ConceptId[];
  mysteryBoxVisible: boolean;
  orbsLaunching: boolean;
  completed: boolean;
}

export type LessonEvent =
  | { type: 'ENTER_CAFE' }
  | { type: 'AUDIO_ENDED' }
  | { type: 'PROP_TAPPED'; prop: PropName }
  | { type: 'POUR_COMPLETED' }
  | { type: 'VOICE_DETECTED' }
  | { type: 'SILENT_WAVE' }
  | { type: 'HELP_REQUESTED' }
  | { type: 'HESITATION_TIMEOUT' }
  | { type: 'JUMP_TO_PHASE'; phase: LessonPhase };

function addUnique(list: readonly ConceptId[], items: readonly ConceptId[]): ConceptId[] {
  const set = new Set(list);
  for (const item of items) set.add(item);
  return Array.from(set);
}

function echoPromptKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_water') return 'echo_prompt_cold_water';
  if (drink === 'cold_coffee') return 'echo_prompt_cold_coffee';
  return 'echo_prompt_hot_coffee';
}

function echoVocalKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_water') return 'echo_vocal_cold_water';
  if (drink === 'cold_coffee') return 'echo_vocal_cold_coffee';
  return 'echo_vocal_hot_coffee';
}

function echoSilentKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_water') return 'echo_silent_cold_water';
  if (drink === 'cold_coffee') return 'echo_silent_cold_coffee';
  return 'echo_silent_hot_coffee';
}

function choiceConfirmKey(drink: DrinkChoice): SpeechKey {
  if (drink === 'cold_coffee') return 'choice_cold_coffee_nice';
  if (drink === 'cold_water') return 'choice_confirm_cold_water';
  return 'choice_confirm_hot_coffee';
}

export function createLesson1State(): LessonState {
  return {
    phase: 'map_arrival',
    subStep: 'idle_map',
    roundIndex: 0,
    awaitingInput: false,
    leoAnim: 'wave_hi',
    cameraAnchor: 'cam_mapa',
    highlightedProp: 'prop_cafe_door',
    hintMode: 'none',
    customerMood: null,
    activePourLiquid: null,
    preferredDrink: 'hot_coffee',
    oralComfort: 'unknown',
    hintedConcepts: [],
    vocalConcepts: [],
    mysteryBoxVisible: false,
    orbsLaunching: false,
    completed: false,
  };
}

function enterPhase(base: LessonState, phase: LessonPhase): { state: LessonState; effects: LessonEffect[] } {
  const clean: LessonState = {
    ...base,
    phase,
    roundIndex: 0,
    hintMode: 'none',
    customerMood: null,
    activePourLiquid: null,
    highlightedProp: null,
    mysteryBoxVisible: false,
    orbsLaunching: false,
    completed: false,
  };

  switch (phase) {
    case 'map_arrival':
      return { state: createLesson1State(), effects: [] };
    case 'counter_intro': {
      const beat = COUNTER_DEMO_BEATS[0];
      return {
        state: {
          ...clean,
          subStep: 'demo',
          awaitingInput: false,
          cameraAnchor: 'cam_balcao',
          leoAnim: beat.leoAnim,
          highlightedProp: beat.prop,
        },
        effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
      };
    }
    case 'thermal_contrast': {
      const beat = CONTRAST_DEMO_BEATS[0];
      return {
        state: {
          ...clean,
          subStep: 'demo',
          awaitingInput: false,
          cameraAnchor: 'cam_contraste',
          leoAnim: beat.leoAnim,
          highlightedProp: beat.prop,
        },
        effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
      };
    }
    case 'action_pour': {
      const round = POUR_ROUNDS[0];
      return {
        state: {
          ...clean,
          subStep: 'interact',
          awaitingInput: true,
          cameraAnchor: 'cam_despejo',
          leoAnim: 'present_right',
          highlightedProp: round.vesselProp,
          activePourLiquid: round.liquid,
        },
        effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
      };
    }
    case 'personal_choice':
      return {
        state: {
          ...clean,
          subStep: 'interact',
          awaitingInput: true,
          cameraAnchor: 'cam_balcao',
          leoAnim: 'ask_palm',
          highlightedProp: null,
        },
        effects: [{ type: 'play_audio', key: 'choice_prompt', playbackRate: 1 }],
      };
    case 'micro_echo':
      return {
        state: {
          ...clean,
          subStep: 'interact',
          awaitingInput: true,
          cameraAnchor: 'cam_balcao',
          leoAnim: 'present_left',
          highlightedProp: null,
        },
        effects: [{ type: 'play_audio', key: echoPromptKey(clean.preferredDrink), playbackRate: 1 }],
      };
    case 'farewell_constellation':
      return {
        state: {
          ...clean,
          subStep: 'farewell_box',
          awaitingInput: false,
          cameraAnchor: 'cam_caixa',
          leoAnim: 'farewell_box',
          mysteryBoxVisible: true,
          highlightedProp: 'prop_box_mystery',
        },
        effects: [{ type: 'play_audio', key: 'farewell_see_you', playbackRate: 1 }],
      };
  }
}

export function lessonReducer(
  state: LessonState,
  event: LessonEvent,
  profile: LearnerProfile,
  nowIso: string,
): { state: LessonState; effects: LessonEffect[] } {
  if (event.type === 'JUMP_TO_PHASE') {
    return enterPhase(state, event.phase);
  }

  if (event.type === 'ENTER_CAFE') {
    if (state.phase !== 'map_arrival' || state.subStep !== 'idle_map') {
      return { state, effects: [] };
    }
    return {
      state: {
        ...state,
        subStep: 'greeting',
        cameraAnchor: 'cam_balcao',
        leoAnim: 'wave_hi',
        highlightedProp: null,
      },
      effects: [{ type: 'play_audio', key: 'hi_leo', playbackRate: 1 }],
    };
  }

  if (event.type === 'AUDIO_ENDED') {
    if (state.phase === 'map_arrival' && state.subStep === 'greeting') {
      return enterPhase(state, 'counter_intro');
    }

    if (state.phase === 'counter_intro') {
      if (state.subStep === 'demo') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < COUNTER_DEMO_BEATS.length) {
          const beat = COUNTER_DEMO_BEATS[nextIdx];
          return {
            state: {
              ...state,
              roundIndex: nextIdx,
              leoAnim: beat.leoAnim,
              highlightedProp: beat.prop,
            },
            effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
          };
        }
        const round = TPR_ROUNDS[0];
        return {
          state: {
            ...state,
            subStep: 'interact',
            roundIndex: 0,
            awaitingInput: true,
            leoAnim: 'ask_palm',
            highlightedProp: null,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
        };
      }

      if (state.subStep === 'feedback') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < TPR_ROUNDS.length) {
          const round = TPR_ROUNDS[nextIdx];
          return {
            state: {
              ...state,
              subStep: 'interact',
              roundIndex: nextIdx,
              awaitingInput: true,
              leoAnim: 'ask_palm',
              highlightedProp: null,
              hintMode: 'none',
            },
            effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
          };
        }
        return enterPhase(state, 'thermal_contrast');
      }
    }

    if (state.phase === 'thermal_contrast') {
      if (state.subStep === 'demo') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < CONTRAST_DEMO_BEATS.length) {
          const beat = CONTRAST_DEMO_BEATS[nextIdx];
          return {
            state: {
              ...state,
              roundIndex: nextIdx,
              leoAnim: beat.leoAnim,
              highlightedProp: beat.prop,
            },
            effects: [{ type: 'play_audio', key: beat.audioKey, playbackRate: 1 }],
          };
        }
        const round = CONTRAST_ROUNDS[0];
        return {
          state: {
            ...state,
            subStep: 'interact',
            roundIndex: 0,
            awaitingInput: true,
            leoAnim: 'ask_palm',
            customerMood: round.customerMood,
            highlightedProp: null,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
        };
      }

      if (state.subStep === 'feedback') {
        const nextIdx = state.roundIndex + 1;
        if (nextIdx < CONTRAST_ROUNDS.length) {
          const round = CONTRAST_ROUNDS[nextIdx];
          return {
            state: {
              ...state,
              subStep: 'interact',
              roundIndex: nextIdx,
              awaitingInput: true,
              leoAnim: 'ask_palm',
              customerMood: round.customerMood,
              highlightedProp: null,
              hintMode: 'none',
            },
            effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
          };
        }
        return enterPhase(state, 'action_pour');
      }
    }

    if (state.phase === 'action_pour' && state.subStep === 'feedback') {
      const nextIdx = state.roundIndex + 1;
      if (nextIdx < POUR_ROUNDS.length) {
        const round = POUR_ROUNDS[nextIdx];
        return {
          state: {
            ...state,
            subStep: 'interact',
            roundIndex: nextIdx,
            awaitingInput: true,
            activePourLiquid: round.liquid,
            highlightedProp: round.vesselProp,
            leoAnim: 'present_right',
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.promptAudio, playbackRate: 1 }],
        };
      }
      return enterPhase(state, 'personal_choice');
    }

    if (state.phase === 'personal_choice' && state.subStep === 'feedback') {
      return enterPhase(state, 'micro_echo');
    }

    if (state.phase === 'micro_echo' && state.subStep === 'feedback') {
      return enterPhase(state, 'farewell_constellation');
    }

    if (state.phase === 'farewell_constellation' && state.subStep === 'farewell_box') {
      const committedProfile = applyLesson1Outcome(profile, {
        preferredDrink: state.preferredDrink,
        oralComfort: state.oralComfort === 'vocal' ? 'vocal' : 'silent',
        hintedConcepts: state.hintedConcepts,
        vocalConcepts: state.vocalConcepts,
        nowIso,
      });

      return {
        state: {
          ...state,
          subStep: 'constellation_ready',
          cameraAnchor: 'cam_constelacao',
          orbsLaunching: true,
          completed: true,
          highlightedProp: null,
        },
        effects: [{ type: 'commit_profile', profile: committedProfile }],
      };
    }

    return { state, effects: [] };
  }

  if (event.type === 'PROP_TAPPED') {
    if (!state.awaitingInput) return { state, effects: [] };

    if (state.phase === 'counter_intro') {
      const round = TPR_ROUNDS[state.roundIndex];
      if (!round) return { state, effects: [] };
      if (event.prop === round.targetProp) {
        return {
          state: {
            ...state,
            subStep: 'feedback',
            awaitingInput: false,
            leoAnim: 'nod_thanks',
            highlightedProp: round.targetProp,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.thanksAudio, playbackRate: 1 }],
        };
      }
      const recastKey = PROP_RECAST_AUDIO[event.prop] ?? round.helpAudio;
      return {
        state: {
          ...state,
          leoAnim: 'ask_palm',
          hintMode: 'glow',
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, [round.concept]),
        },
        effects: [{ type: 'play_audio', key: recastKey, playbackRate: 1, followUpKey: round.promptAudio }],
      };
    }

    if (state.phase === 'thermal_contrast') {
      const round = CONTRAST_ROUNDS[state.roundIndex];
      if (!round) return { state, effects: [] };
      if (event.prop === round.targetProp) {
        return {
          state: {
            ...state,
            subStep: 'feedback',
            awaitingInput: false,
            leoAnim: 'nod_thanks',
            highlightedProp: round.targetProp,
            hintMode: 'none',
          },
          effects: [{ type: 'play_audio', key: round.thanksAudio, playbackRate: 1 }],
        };
      }
      const recastKey =
        event.prop === 'prop_water_cold' ? 'recast_cold_water' : 'recast_hot_coffee';
      return {
        state: {
          ...state,
          leoAnim: 'ask_palm',
          hintMode: 'glow',
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, round.concepts),
        },
        effects: [{ type: 'play_audio', key: recastKey, playbackRate: 1, followUpKey: round.promptAudio }],
      };
    }

    if (state.phase === 'personal_choice') {
      const drink = PROP_TO_DRINK[event.prop];
      if (!drink) return { state, effects: [] };
      return {
        state: {
          ...state,
          subStep: 'feedback',
          awaitingInput: false,
          preferredDrink: drink,
          leoAnim: drink === 'cold_coffee' ? 'surprised_happy' : 'nod_thanks',
          highlightedProp: event.prop,
          hintMode: 'none',
        },
        effects: [{ type: 'play_audio', key: choiceConfirmKey(drink), playbackRate: 1 }],
      };
    }

    return { state, effects: [] };
  }

  if (event.type === 'POUR_COMPLETED') {
    if (state.phase !== 'action_pour' || !state.awaitingInput) {
      return { state, effects: [] };
    }
    const round = POUR_ROUNDS[state.roundIndex];
    if (!round) return { state, effects: [] };

    return {
      state: {
        ...state,
        subStep: 'feedback',
        awaitingInput: false,
        leoAnim: 'nod_thanks',
        hintMode: 'none',
      },
      effects: [{ type: 'play_audio', key: round.doneAudio, playbackRate: 1 }],
    };
  }

  if (event.type === 'VOICE_DETECTED') {
    if (state.phase !== 'micro_echo' || !state.awaitingInput) {
      return { state, effects: [] };
    }
    const vocalConcepts = [...DRINK_TO_CONCEPTS[state.preferredDrink]];
    return {
      state: {
        ...state,
        subStep: 'feedback',
        awaitingInput: false,
        oralComfort: 'vocal',
        vocalConcepts,
        leoAnim: 'nod_thanks',
        hintMode: 'none',
      },
      effects: [{ type: 'play_audio', key: echoVocalKey(state.preferredDrink), playbackRate: 1 }],
    };
  }

  if (event.type === 'SILENT_WAVE') {
    if (state.phase !== 'micro_echo' || !state.awaitingInput) {
      return { state, effects: [] };
    }
    return {
      state: {
        ...state,
        subStep: 'feedback',
        awaitingInput: false,
        oralComfort: 'silent',
        vocalConcepts: [],
        leoAnim: 'nod_thanks',
        hintMode: 'none',
      },
      effects: [{ type: 'play_audio', key: echoSilentKey(state.preferredDrink), playbackRate: 1 }],
    };
  }

  if (event.type === 'HESITATION_TIMEOUT' || event.type === 'HELP_REQUESTED') {
    if (!state.awaitingInput) return { state, effects: [] };
    const isHelp = event.type === 'HELP_REQUESTED';
    const nextHintMode: HintMode = isHelp ? 'contrast' : 'glow';
    const rate = isHelp ? 0.85 : 0.8;

    if (state.phase === 'counter_intro') {
      const round = TPR_ROUNDS[state.roundIndex];
      if (!round) return { state, effects: [] };
      return {
        state: {
          ...state,
          hintMode: nextHintMode,
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, [round.concept]),
        },
        effects: [{ type: 'play_audio', key: isHelp ? round.helpAudio : round.promptAudio, playbackRate: rate }],
      };
    }

    if (state.phase === 'thermal_contrast') {
      const round = CONTRAST_ROUNDS[state.roundIndex];
      if (!round) return { state, effects: [] };
      return {
        state: {
          ...state,
          hintMode: nextHintMode,
          highlightedProp: round.targetProp,
          hintedConcepts: addUnique(state.hintedConcepts, round.concepts),
        },
        effects: [{ type: 'play_audio', key: isHelp ? round.helpAudio : round.promptAudio, playbackRate: rate }],
      };
    }

    if (state.phase === 'action_pour') {
      const round = POUR_ROUNDS[state.roundIndex];
      if (!round) return { state, effects: [] };
      return {
        state: {
          ...state,
          hintMode: nextHintMode,
          highlightedProp: round.vesselProp,
          hintedConcepts: addUnique(state.hintedConcepts, ['pour']),
        },
        effects: [{ type: 'play_audio', key: isHelp ? round.helpAudio : round.promptAudio, playbackRate: rate }],
      };
    }

    if (state.phase === 'personal_choice') {
      return {
        state: { ...state, hintMode: nextHintMode },
        effects: [{ type: 'play_audio', key: 'choice_prompt', playbackRate: rate }],
      };
    }

    if (state.phase === 'micro_echo') {
      return {
        state: { ...state, hintMode: nextHintMode },
        effects: [{ type: 'play_audio', key: echoPromptKey(state.preferredDrink), playbackRate: rate }],
      };
    }
  }

  return { state, effects: [] };
}
```

- [ ] **Step 4: Run tests and TypeScript check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (13 tests passing, 0 TS errors).

- [ ] **Step 5: Commit**

```bash
git add src/domain/lessonEngine.ts src/domain/__tests__/lessonEngine.test.ts
git commit -m "feat: implement 7-screen Lesson 1 state machine with Recast and safety net"
```

---

### Task 4: Services — `localStorage` Persistence, Audio Player (`.mp3` + Fallback) & Voice Capture

**Files:**
- Create: `src/services/learnerStorage.ts`
- Create: `src/services/audioPlayer.ts`
- Create: `src/services/voiceCapture.ts`
- Test: `src/services/__tests__/learnerStorage.test.ts`
- Test: `src/services/__tests__/audioPlayer.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`, `src/domain/learnerMemory.ts`, `src/content/audioManifest.ts`
- Produces:
  - `src/services/learnerStorage.ts`: `STORAGE_KEY`, `loadProfile(storage?)`, `saveProfile(profile, storage?)`, `resetProfile(storage?)`
  - `src/services/audioPlayer.ts`: `SpeechClockRef`, `AudioStatus`, `AudioPlayer`, `resolveActiveViseme(cues, timeSec)`, `createAudioPlayer(options)`
  - `src/services/voiceCapture.ts`: `VoiceCaptureHandle`, `startVoiceCapture(callbacks)`

- [ ] **Step 1: Write the failing unit tests for `learnerStorage` and `audioPlayer`**

Create `src/services/__tests__/learnerStorage.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { applyLesson1Outcome, createInitialProfile } from '../../domain/learnerMemory';
import { loadProfile, resetProfile, saveProfile, STORAGE_KEY } from '../learnerStorage';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

describe('learnerStorage', () => {
  it('saves and restores a valid LearnerProfile', () => {
    const storage = createMemoryStorage();
    const saved = applyLesson1Outcome(createInitialProfile(), {
      preferredDrink: 'hot_coffee',
      oralComfort: 'vocal',
      hintedConcepts: [],
      vocalConcepts: ['cup', 'coffee', 'hot'],
      nowIso: '2026-11-19T14:00:00.000Z',
    });

    saveProfile(saved, storage);
    const loaded = loadProfile(storage);
    expect(loaded).toEqual(saved);
  });

  it('recovers cleanly with an initial profile on corrupted JSON or mismatched schemaVersion', () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, '{not-valid-json');
    expect(loadProfile(storage)).toEqual(createInitialProfile());

    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }));
    expect(loadProfile(storage)).toEqual(createInitialProfile());
  });

  it('resets stored profile', () => {
    const storage = createMemoryStorage();
    saveProfile(createInitialProfile(), storage);
    resetProfile(storage);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
```

Create `src/services/__tests__/audioPlayer.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_MANIFEST } from '../../content/audioManifest';
import { createAudioPlayer, resolveActiveViseme, type AudioStatus } from '../audioPlayer';

describe('resolveActiveViseme', () => {
  it('returns the active viseme for a given playback timestamp', () => {
    const cues = AUDIO_MANIFEST.ask_cup.cues;
    expect(resolveActiveViseme(cues, 0.0)).toBe('viseme_aa');
    expect(resolveActiveViseme(cues, 0.3)).toBe('viseme_mbp');
    expect(resolveActiveViseme(cues, 0.7)).toBe('viseme_ee');
    expect(resolveActiveViseme(cues, 1.2)).toBeNull();
  });
});

describe('createAudioPlayer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('falls back to a timed virtual clock when Audio fails to load/play and fires onEnded', () => {
    vi.useFakeTimers();
    const statuses: AudioStatus[] = [];
    const onEnded = vi.fn();

    const player = createAudioPlayer({
      createAudioElement: () => null,
      onStatusChange: (status) => statuses.push(status),
    });

    player.play('demo_cup', { playbackRate: 1, onEnded });

    expect(player.speechRef.isPlaying()).toBe(true);
    expect(statuses[statuses.length - 1]).toMatchObject({
      mode: 'fallback',
      key: 'demo_cup',
      src: '/audio/lesson1/demo_cup.mp3',
      phrase: 'Cup.',
      isPlaying: true,
    });

    vi.advanceTimersByTime(AUDIO_MANIFEST.demo_cup.fallbackDurationMs + 50);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(player.speechRef.isPlaying()).toBe(false);
    player.dispose();
  });

  it('clears pending fallback timers on dispose without firing onEnded', () => {
    vi.useFakeTimers();
    const onEnded = vi.fn();
    const player = createAudioPlayer({
      createAudioElement: () => null,
    });

    player.play('demo_coffee', { playbackRate: 1, onEnded });
    player.dispose();
    vi.advanceTimersByTime(5000);

    expect(onEnded).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL because `learnerStorage.ts` and `audioPlayer.ts` do not exist yet.

- [ ] **Step 3: Implement `src/services/learnerStorage.ts`, `src/services/audioPlayer.ts`, and `src/services/voiceCapture.ts`**

Create `src/services/learnerStorage.ts`:
```ts
import { createInitialProfile } from '../domain/learnerMemory';
import type { LearnerProfile } from '../domain/types';

export const STORAGE_KEY = 'baeuda.learnerProfile.v1';

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function isValidProfile(value: unknown): value is LearnerProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LearnerProfile>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.immersionSeconds === 'number' &&
    Array.isArray(candidate.completedLessonIds) &&
    candidate.locations !== undefined &&
    typeof candidate.locations === 'object' &&
    candidate.constellation !== undefined &&
    typeof candidate.constellation === 'object'
  );
}

export function loadProfile(storage?: Storage): LearnerProfile {
  const store = resolveStorage(storage);
  if (!store) return createInitialProfile();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return createInitialProfile();
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProfile(parsed)) return createInitialProfile();
    return parsed;
  } catch {
    return createInitialProfile();
  }
}

export function saveProfile(profile: LearnerProfile, storage?: Storage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore quota/private-mode storage write failures gracefully.
  }
}

export function resetProfile(storage?: Storage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage removal errors.
  }
}
```

Create `src/services/audioPlayer.ts`:
```ts
import { AUDIO_MANIFEST, type SpeechKey } from '../content/audioManifest';
import type { VisemeCue, VisemeId } from '../domain/types';

export interface SpeechClockRef {
  getCurrentTime: () => number;
  isPlaying: () => boolean;
  cues: readonly VisemeCue[];
}

export interface AudioStatus {
  mode: 'idle' | 'audio' | 'fallback';
  key: SpeechKey | null;
  src: string | null;
  phrase: string | null;
  isPlaying: boolean;
}

export interface PlayOptions {
  playbackRate?: number;
  followUpKey?: SpeechKey;
  onEnded?: () => void;
}

export interface AudioPlayer {
  speechRef: SpeechClockRef;
  play: (key: SpeechKey, options?: PlayOptions) => void;
  stop: () => void;
  dispose: () => void;
}

interface CreateAudioPlayerOptions {
  createAudioElement?: (src: string) => HTMLAudioElement | null;
  onStatusChange?: (status: AudioStatus) => void;
}

export function resolveActiveViseme(
  cues: readonly VisemeCue[],
  timeSec: number,
): VisemeId | null {
  for (let i = cues.length - 1; i >= 0; i--) {
    if (timeSec >= cues[i].at) {
      return cues[i].viseme;
    }
  }
  return null;
}

export function createAudioPlayer(options: CreateAudioPlayerOptions = {}): AudioPlayer {
  const createEl =
    options.createAudioElement ??
    ((src: string) => (typeof Audio !== 'undefined' ? new Audio(src) : null));

  let activeAudio: HTMLAudioElement | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let fallbackStartMs = 0;
  let fallbackRate = 1;
  let fallbackActive = false;
  let playToken = 0;

  const speechRef: SpeechClockRef = {
    cues: [],
    isPlaying: () => {
      if (fallbackActive) return true;
      return Boolean(activeAudio && !activeAudio.paused && !activeAudio.ended);
    },
    getCurrentTime: () => {
      if (fallbackActive) {
        return ((Date.now() - fallbackStartMs) / 1000) * fallbackRate;
      }
      return activeAudio ? activeAudio.currentTime : 0;
    },
  };

  const emitStatus = (status: AudioStatus) => {
    options.onStatusChange?.(status);
  };

  const clearCurrent = () => {
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    fallbackActive = false;
    if (activeAudio) {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio = null;
    }
  };

  const startFallback = (
    token: number,
    key: SpeechKey,
    rate: number,
    finish: () => void,
  ) => {
    if (token !== playToken) return;
    const entry = AUDIO_MANIFEST[key];
    clearCurrent();
    speechRef.cues = entry.cues;
    fallbackStartMs = Date.now();
    fallbackRate = rate;
    fallbackActive = true;

    emitStatus({
      mode: 'fallback',
      key,
      src: entry.src,
      phrase: entry.phrase,
      isPlaying: true,
    });

    const durationMs = Math.max(350, Math.round(entry.fallbackDurationMs / rate));
    fallbackTimer = setTimeout(() => {
      if (token !== playToken) return;
      fallbackActive = false;
      fallbackTimer = null;
      emitStatus({
        mode: 'fallback',
        key,
        src: entry.src,
        phrase: entry.phrase,
        isPlaying: false,
      });
      finish();
    }, durationMs);
  };

  const playSingle = (
    token: number,
    key: SpeechKey,
    rate: number,
    finish: () => void,
  ) => {
    if (token !== playToken) return;
    const entry = AUDIO_MANIFEST[key];
    clearCurrent();
    speechRef.cues = entry.cues;

    const audio = createEl(entry.src);
    if (!audio) {
      startFallback(token, key, rate, finish);
      return;
    }

    activeAudio = audio;
    audio.playbackRate = rate;

    audio.onended = () => {
      if (token !== playToken) return;
      activeAudio = null;
      emitStatus({
        mode: 'audio',
        key,
        src: entry.src,
        phrase: entry.phrase,
        isPlaying: false,
      });
      finish();
    };

    audio.onerror = () => {
      startFallback(token, key, rate, finish);
    };

    emitStatus({
      mode: 'audio',
      key,
      src: entry.src,
      phrase: entry.phrase,
      isPlaying: true,
    });

    const playResult = audio.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        startFallback(token, key, rate, finish);
      });
    }
  };

  const play = (key: SpeechKey, playOptions: PlayOptions = {}) => {
    playToken += 1;
    const token = playToken;
    const rate = playOptions.playbackRate ?? 1;

    const finishPrimary = () => {
      if (token !== playToken) return;
      if (playOptions.followUpKey) {
        playSingle(token, playOptions.followUpKey, rate, () => {
          if (token !== playToken) return;
          playOptions.onEnded?.();
        });
      } else {
        playOptions.onEnded?.();
      }
    };

    playSingle(token, key, rate, finishPrimary);
  };

  const stop = () => {
    playToken += 1;
    clearCurrent();
    emitStatus({
      mode: 'idle',
      key: null,
      src: null,
      phrase: null,
      isPlaying: false,
    });
  };

  const dispose = () => {
    playToken += 1;
    clearCurrent();
  };

  return { speechRef, play, stop, dispose };
}
```

Create `src/services/voiceCapture.ts`:
```ts
export interface VoiceCaptureCallbacks {
  onLevel: (normalizedLevel: number) => void;
  onDetected: () => void;
  onUnavailable: () => void;
}

export interface VoiceCaptureHandle {
  stop: () => void;
}

const SPEECH_RMS_THRESHOLD = 0.035;
const REQUIRED_VOICED_MS = 240;
const MAX_LISTEN_MS = 6500;

export async function startVoiceCapture(
  callbacks: VoiceCaptureCallbacks,
): Promise<VoiceCaptureHandle> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    callbacks.onUnavailable();
    return { stop: () => {} };
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    callbacks.onUnavailable();
    return { stop: () => {} };
  }

  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    stream.getTracks().forEach((t) => t.stop());
    callbacks.onUnavailable();
    return { stop: () => {} };
  }

  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let rafId = 0;
  let stopped = false;
  let voicedMs = 0;
  let lastTick = performance.now();
  const startedAt = lastTick;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
    callbacks.onLevel(0);
  };

  const tick = (now: number) => {
    if (stopped) return;
    const dt = Math.min(now - lastTick, 100);
    lastTick = now;

    analyser.getFloatTimeDomainData(buffer);
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSq += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSq / buffer.length);
    const level = Math.min(1, rms / 0.14);
    callbacks.onLevel(level);

    if (rms >= SPEECH_RMS_THRESHOLD) {
      voicedMs += dt;
      if (voicedMs >= REQUIRED_VOICED_MS) {
        stop();
        callbacks.onDetected();
        return;
      }
    }

    if (now - startedAt >= MAX_LISTEN_MS) {
      stop();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return { stop };
}
```

- [ ] **Step 4: Run tests and TypeScript check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (19 tests passing, 0 TS errors).

- [ ] **Step 5: Commit**

```bash
git add src/services/
git commit -m "feat: add localStorage persistence, audio player fallback, and voice capture service"
```

---

### Task 5: 3D Scene Contracts, Neighborhood Map, Café Scene & Leo Barista (Greybox ↔ GLB)

**Files:**
- Create: `src/scene/contracts.ts`
- Create: `src/scene/ModelErrorBoundary.tsx`
- Create: `src/scene/NeighborhoodMap.tsx`
- Create: `src/scene/CafeScene.tsx`
- Create: `src/scene/LeoBarista.tsx`
- Test: `src/scene/__tests__/contracts.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`, `src/domain/lessonEngine.ts` (`LessonPhase`, `HintMode`), `src/services/audioPlayer.ts` (`SpeechClockRef`, `resolveActiveViseme`)
- Produces:
  - `src/scene/contracts.ts`: `AssetMode`, `CameraPose`, `CAMERA_ANCHORS`, `findPropName(object)`
  - `src/scene/NeighborhoodMap.tsx`: `NeighborhoodMap({ cafeStatus, visible, onEnterCafe })`
  - `src/scene/CafeScene.tsx`: `CafeScene({ assetMode, phase, highlightedProp, hintMode, customerMood, activePourLiquid, pourProgressRef, isPouringRef, mysteryBoxVisible, onPropTap, onPourStart, onPourEnd })`
  - `src/scene/LeoBarista.tsx`: `LeoBarista({ assetMode, animation, speechRef, position, visible })`

- [ ] **Step 1: Write the failing unit test for 3D contracts (`findPropName` & `CAMERA_ANCHORS`)**

Create `src/scene/__tests__/contracts.test.ts`:
```ts
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CAMERA_ANCHORS, findPropName } from '../contracts';

describe('scene contracts', () => {
  it('walks up the Object3D parent chain to find a prop_* name', () => {
    const root = new THREE.Group();
    root.name = 'ENV_Static';

    const cupGroup = new THREE.Group();
    cupGroup.name = 'prop_cup_hot';

    const rimMesh = new THREE.Mesh();
    rimMesh.name = 'CeramicRim_Material001';

    cupGroup.add(rimMesh);
    root.add(cupGroup);

    expect(findPropName(rimMesh)).toBe('prop_cup_hot');
    expect(findPropName(root)).toBeNull();
  });

  it('defines position and target tuples for every camera anchor', () => {
    const keys = [
      'cam_mapa',
      'cam_balcao',
      'cam_contraste',
      'cam_despejo',
      'cam_caixa',
      'cam_constelacao',
    ] as const;

    for (const key of keys) {
      expect(CAMERA_ANCHORS[key].position).toHaveLength(3);
      expect(CAMERA_ANCHORS[key].target).toHaveLength(3);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `src/scene/contracts.ts` does not exist yet.

- [ ] **Step 3: Implement `src/scene/contracts.ts` and `src/scene/ModelErrorBoundary.tsx`**

Create `src/scene/contracts.ts`:
```ts
import type * as THREE from 'three';
import type { CameraAnchorId, PropName } from '../domain/types';

export type AssetMode = 'greybox' | 'glb';

export interface CameraPose {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

export const CAMERA_ANCHORS: Record<CameraAnchorId, CameraPose> = {
  cam_mapa: { position: [5.4, 4.6, 6.2], target: [0, 0.7, 0] },
  cam_balcao: { position: [0, 1.55, 1.85], target: [0, 1.12, -0.45] },
  cam_contraste: { position: [0, 1.48, 1.55], target: [0, 1.05, -0.15] },
  cam_despejo: { position: [0.15, 1.58, 1.4], target: [0, 1.02, 0.05] },
  cam_caixa: { position: [0.45, 1.52, 1.55], target: [0.1, 1.06, 0.05] },
  cam_constelacao: { position: [0, 7.2, 4.2], target: [0, 6.4, 0] },
};

const VALID_PROPS = new Set<string>([
  'prop_cafe_door',
  'prop_cup_empty',
  'prop_cup_hot',
  'prop_jar_coffee',
  'prop_water_cold',
  'prop_iced_coffee',
  'prop_box_mystery',
]);

export function findPropName(object: THREE.Object3D | null): PropName | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name && current.name.startsWith('prop_') && VALID_PROPS.has(current.name)) {
      return current.name as PropName;
    }
    current = current.parent;
  }
  return null;
}
```

Create `src/scene/ModelErrorBoundary.tsx`:
```tsx
import { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Implement `src/scene/NeighborhoodMap.tsx`**

Create `src/scene/NeighborhoodMap.tsx`:
```tsx
import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type * as THREE from 'three';
import type { LocationStatus } from '../domain/types';

interface NeighborhoodMapProps {
  cafeStatus: LocationStatus;
  visible: boolean;
  onEnterCafe: () => void;
}

export function NeighborhoodMap({
  cafeStatus,
  visible,
  onEnterCafe,
}: NeighborhoodMapProps) {
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const puff1Ref = useRef<THREE.Mesh>(null);
  const puff2Ref = useRef<THREE.Mesh>(null);
  const miniLeoArmRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.elapsedTime;
    if (pulseRingRef.current) {
      const s = 1 + Math.sin(t * 3.2) * 0.14;
      pulseRingRef.current.scale.set(s, s, 1);
    }
    if (puff1Ref.current) {
      const cycle = (t * 0.45) % 1;
      puff1Ref.current.position.y = 2.65 + cycle * 0.9;
      puff1Ref.current.scale.setScalar(0.18 + cycle * 0.22);
    }
    if (puff2Ref.current) {
      const cycle = (t * 0.45 + 0.5) % 1;
      puff2Ref.current.position.y = 2.65 + cycle * 0.9;
      puff2Ref.current.scale.setScalar(0.18 + cycle * 0.22);
    }
    if (miniLeoArmRef.current) {
      miniLeoArmRef.current.rotation.z = -0.6 + Math.sin(t * 5.5) * 0.35;
    }
  });

  if (!visible) return null;

  const handleDoorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onEnterCafe();
  };

  return (
    <group name="Neighborhood_Diorama">
      {/* Ground island */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[6.4, 6.7, 0.3, 32]} />
        <meshStandardMaterial color="#d9cfb8" roughness={0.95} />
      </mesh>

      {/* Cobblestone street cross */}
      <mesh position={[0, 0.01, 1.4]} receiveShadow>
        <boxGeometry args={[10.5, 0.04, 1.4]} />
        <meshStandardMaterial color="#b4aa9c" roughness={0.92} />
      </mesh>

      {/* Café da Esquina — illuminated hero diorama */}
      <group position={[0, 0, -0.5]}>
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.1, 2.0]} />
          <meshStandardMaterial color="#e07a5f" roughness={0.78} />
        </mesh>

        {/* Roof & chimney */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[2.75, 0.24, 2.25]} />
          <meshStandardMaterial color="#5c4033" roughness={0.85} />
        </mesh>
        <mesh position={[0.8, 2.48, -0.45]} castShadow>
          <boxGeometry args={[0.32, 0.5, 0.32]} />
          <meshStandardMaterial color="#8d5b4c" roughness={0.85} />
        </mesh>

        {/* Chimney steam puffs */}
        <mesh ref={puff1Ref} position={[0.8, 2.75, -0.45]}>
          <sphereGeometry args={[0.35, 10, 10]} />
          <meshStandardMaterial color="#fff8ee" transparent opacity={0.55} roughness={1} />
        </mesh>
        <mesh ref={puff2Ref} position={[0.88, 3.1, -0.45]}>
          <sphereGeometry args={[0.35, 10, 10]} />
          <meshStandardMaterial color="#fff8ee" transparent opacity={0.4} roughness={1} />
        </mesh>

        {/* Striped awning */}
        <mesh position={[0, 1.62, 1.25]} rotation={[0.32, 0, 0]} castShadow>
          <boxGeometry args={[2.45, 0.12, 0.72]} />
          <meshStandardMaterial color="#f4e4c1" roughness={0.8} />
        </mesh>
        <mesh position={[-0.6, 1.65, 1.25]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.36, 0.13, 0.73]} />
          <meshStandardMaterial color="#2a6f68" roughness={0.8} />
        </mesh>
        <mesh position={[0.6, 1.65, 1.25]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.36, 0.13, 0.73]} />
          <meshStandardMaterial color="#2a6f68" roughness={0.8} />
        </mesh>

        {/* Warm glowing window */}
        <mesh position={[-0.65, 1.05, 1.01]}>
          <boxGeometry args={[0.82, 0.72, 0.05]} />
          <meshStandardMaterial
            color="#ffe599"
            emissive="#f59e0b"
            emissiveIntensity={cafeStatus === 'familiar' ? 0.85 : 0.55}
            roughness={0.3}
          />
        </mesh>

        {/* Clickable Café Door */}
        <group
          name="prop_cafe_door"
          position={[0.55, 0.65, 1.02]}
          onClick={handleDoorClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.72, 1.28, 0.08]} />
            <meshStandardMaterial color="#6b4423" roughness={0.7} />
          </mesh>
          <mesh position={[0.22, 0, 0.06]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Pulsing floor ring beneath the door */}
          <mesh ref={pulseRingRef} position={[0, -0.62, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.42, 0.56, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
          </mesh>
        </group>

        {/* Mini Leo waving in front of the door */}
        <group
          name="prop_cafe_door"
          position={[1.15, 0, 1.38]}
          onClick={handleDoorClick}
        >
          <mesh position={[0, 0.38, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.28, 6, 12]} />
            <meshStandardMaterial color="#3d6b59" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.74, 0]} castShadow>
            <sphereGeometry args={[0.15, 14, 14]} />
            <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
          </mesh>
          <mesh ref={miniLeoArmRef} position={[0.19, 0.52, 0]} castShadow>
            <capsuleGeometry args={[0.045, 0.2, 4, 8]} />
            <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
          </mesh>
        </group>
      </group>

      {/* Unexplored Neighborhood Blocks in Soft Translucent Fog (Market & Plaza silhouettes) */}
      <group position={[-3.3, 0, -0.4]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.9, 1.4, 1.5]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.45} roughness={0.95} />
        </mesh>
        {/* Translucent fog clouds */}
        <mesh position={[0, 1.65, 0.2]}>
          <sphereGeometry args={[0.95, 12, 12]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.68} roughness={1} />
        </mesh>
        <mesh position={[0.7, 1.45, -0.2]}>
          <sphereGeometry args={[0.72, 12, 12]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.62} roughness={1} />
        </mesh>
      </group>

      <group position={[3.3, 0, -0.8]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.22, 0.25, 0.7, 10]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.65, 12, 12]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.45} />
        </mesh>
        <mesh position={[-0.2, 1.35, 0.35]}>
          <sphereGeometry args={[0.92, 12, 12]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.65} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
```

- [ ] **Step 5: Implement `src/scene/CafeScene.tsx`**

Create `src/scene/CafeScene.tsx`:
```tsx
import { Suspense, useRef, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { HintMode, LessonPhase } from '../domain/lessonEngine';
import type { PropName } from '../domain/types';
import { findPropName, type AssetMode } from './contracts';
import { ModelErrorBoundary } from './ModelErrorBoundary';

export interface CafeSceneProps {
  assetMode: AssetMode;
  phase: LessonPhase;
  highlightedProp: PropName | null;
  hintMode: HintMode;
  customerMood: 'cold' | 'warm' | null;
  activePourLiquid: 'coffee' | 'water' | null;
  pourProgressRef: MutableRefObject<number>;
  isPouringRef: MutableRefObject<boolean>;
  mysteryBoxVisible: boolean;
  visible: boolean;
  onPropTap: (prop: PropName) => void;
  onPourStart: () => void;
  onPourEnd: () => void;
}

function SteamParticles({ position, intensity = 1 }: { position: [number, number, number]; intensity?: number }) {
  const s1 = useRef<THREE.Mesh>(null);
  const s2 = useRef<THREE.Mesh>(null);
  const s3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const refs = [s1, s2, s3];
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      const cycle = (t * 0.7 + i * 0.33) % 1;
      ref.current.position.y = cycle * 0.32 * intensity;
      ref.current.position.x = Math.sin(t * 2 + i * 2) * 0.03;
      ref.current.scale.setScalar((0.55 + cycle * 0.75) * intensity);
    });
  });

  return (
    <group name="fx_steam_cup" position={position}>
      {[s1, s2, s3].map((ref, idx) => (
        <mesh key={idx} ref={ref}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#fff7ed" transparent opacity={0.55} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function CafeGlb({ onPropTap }: { onPropTap: (prop: PropName) => void }) {
  const { scene } = useGLTF('/models/cafe_esquina.glb');
  return (
    <primitive
      object={scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const prop = findPropName(e.object);
        if (prop) onPropTap(prop);
      }}
    />
  );
}

function CafeGreybox({
  phase,
  highlightedProp,
  hintMode,
  customerMood,
  activePourLiquid,
  pourProgressRef,
  isPouringRef,
  mysteryBoxVisible,
  onPropTap,
  onPourStart,
  onPourEnd,
}: Omit<CafeSceneProps, 'assetMode' | 'visible'>) {
  const jarPourRef = useRef<THREE.Group>(null);
  const waterPourRef = useRef<THREE.Group>(null);
  const fillMeshRef = useRef<THREE.Mesh>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const boxRef = useRef<THREE.Group>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const pouring = isPouringRef.current && phase === 'action_pour';
    const progress = pourProgressRef.current;

    if (jarPourRef.current) {
      const active = pouring && activePourLiquid === 'coffee';
      jarPourRef.current.position.x = THREE.MathUtils.damp(
        jarPourRef.current.position.x,
        active ? 0.22 : 0.45,
        8,
        dt,
      );
      jarPourRef.current.position.y = THREE.MathUtils.damp(
        jarPourRef.current.position.y,
        active ? 1.24 : 0.96,
        8,
        dt,
      );
      jarPourRef.current.rotation.z = THREE.MathUtils.damp(
        jarPourRef.current.rotation.z,
        active ? 0.72 : 0,
        8,
        dt,
      );
    }

    if (waterPourRef.current) {
      const active = pouring && activePourLiquid === 'water';
      waterPourRef.current.position.x = THREE.MathUtils.damp(
        waterPourRef.current.position.x,
        active ? 0.22 : 0.45,
        8,
        dt,
      );
      waterPourRef.current.position.y = THREE.MathUtils.damp(
        waterPourRef.current.position.y,
        active ? 1.26 : 0.96,
        8,
        dt,
      );
      waterPourRef.current.rotation.z = THREE.MathUtils.damp(
        waterPourRef.current.rotation.z,
        active ? 0.75 : 0,
        8,
        dt,
      );
    }

    if (fillMeshRef.current) {
      const clamped = Math.max(0.01, Math.min(1, progress));
      fillMeshRef.current.scale.y = clamped;
      fillMeshRef.current.position.y = 0.02 + clamped * 0.065;
      fillMeshRef.current.visible = progress > 0.02;
    }

    if (streamRef.current) {
      streamRef.current.visible = pouring && progress < 1;
    }

    if (boxRef.current) {
      const targetY = mysteryBoxVisible ? 0.96 : 1.9;
      boxRef.current.position.y = THREE.MathUtils.damp(boxRef.current.position.y, targetY, 6, dt);
    }

    if (glowRingRef.current) {
      const pulse = 1 + Math.sin(t * 4.5) * 0.12;
      glowRingRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const handleGroupClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const prop = findPropName(e.object);
    if (prop) onPropTap(prop);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = findPropName(e.object) ? 'pointer' : 'auto';
  };

  const isHighlighted = (prop: PropName) => highlightedProp === prop;
  const contrastBoost = hintMode === 'contrast';

  const showIntroProps = phase === 'counter_intro' || phase === 'map_arrival';
  const showContrastProps = phase === 'thermal_contrast';
  const showPourProps = phase === 'action_pour';
  const showChoiceProps = phase === 'personal_choice' || phase === 'micro_echo' || phase === 'farewell_constellation';

  return (
    <group
      name="Cafe_Interior_Greybox"
      onClick={handleGroupClick}
      onPointerMove={handlePointerMove}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* ENV_Static: warm café walls, floor, wooden counter & espresso machine */}
      <group name="ENV_Static">
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color="#e8dcc8" roughness={0.92} />
        </mesh>
        {/* Back wall */}
        <mesh position={[0, 1.8, -1.65]} receiveShadow>
          <boxGeometry args={[6.4, 3.6, 0.18]} />
          <meshStandardMaterial color="#f5ebe0" roughness={0.88} />
        </mesh>
        {/* Warm wooden shelf */}
        <mesh position={[-1.1, 1.85, -1.42]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.08, 0.34]} />
          <meshStandardMaterial color="#8c5a3c" roughness={0.78} />
        </mesh>
        {/* Decorative espresso machine */}
        <group position={[1.25, 1.18, -0.35]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.44, 0.42]} />
            <meshStandardMaterial color="#c85a44" roughness={0.42} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[0.58, 0.05, 0.45]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
        {/* Main Wooden Counter (0.95m height per Blender guide) */}
        <mesh position={[0, 0.46, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.92, 0.92]} />
          <meshStandardMaterial color="#7a4e32" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.94, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[3.32, 0.06, 1.02]} />
          <meshStandardMaterial color="#b07d56" roughness={0.68} />
        </mesh>
      </group>

      {/* Subtle highlight halo rendered beneath whichever prop is currently highlighted */}
      {highlightedProp && (
        <mesh
          ref={glowRingRef}
          position={[
            highlightedProp === 'prop_cup_empty'
              ? showPourProps ? 0 : -0.52
              : highlightedProp === 'prop_cup_hot'
                ? -0.45
                : highlightedProp === 'prop_jar_coffee'
                  ? showPourProps ? 0.45 : 0
                  : highlightedProp === 'prop_water_cold'
                    ? showIntroProps ? 0.52 : showPourProps ? 0.45 : 0.45
                    : highlightedProp === 'prop_iced_coffee'
                      ? 0
                      : 0.42,
            0.975,
            0.12,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.16, 0.23, 28]} />
          <meshBasicMaterial color={contrastBoost ? '#f97316' : '#fbbf24'} transparent opacity={0.9} />
        </mesh>
      )}

      {/* SCREEN 2: Counter Intro Props (cup, coffee jar, water bottle) */}
      {showIntroProps && (
        <group name="PROPS_Intro">
          {/* Empty ceramic cup */}
          <group name="prop_cup_empty" position={[-0.52, 0.97, 0.12]}>
            <mesh position={[0, 0.085, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.078, 0.17, 18]} />
              <meshStandardMaterial
                color="#fff7ed"
                emissive={isHighlighted('prop_cup_empty') ? '#f59e0b' : '#000000'}
                emissiveIntensity={isHighlighted('prop_cup_empty') ? 0.35 : 0}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0.105, 0.085, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.048, 0.015, 8, 16]} />
              <meshStandardMaterial color="#fff7ed" roughness={0.25} />
            </mesh>
          </group>

          {/* Coffee carafe */}
          <group name="prop_jar_coffee" position={[0, 0.97, 0.12]}>
            <mesh position={[0, 0.13, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.12, 0.26, 18]} />
              <meshStandardMaterial
                color="#4b2e1e"
                emissive={isHighlighted('prop_jar_coffee') ? '#f59e0b' : '#000000'}
                emissiveIntensity={isHighlighted('prop_jar_coffee') ? 0.35 : 0}
                roughness={0.22}
              />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.03, 16]} />
              <meshStandardMaterial color="#1f2937" roughness={0.5} />
            </mesh>
            <SteamParticles position={[0, 0.3, 0]} intensity={0.75} />
          </group>

          {/* Cold water glass bottle */}
          <group name="prop_water_cold" position={[0.52, 0.97, 0.12]}>
            <mesh position={[0, 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.072, 0.082, 0.3, 18]} />
              <meshStandardMaterial
                color="#7dd3fc"
                transparent
                opacity={0.78}
                emissive={isHighlighted('prop_water_cold') ? '#38bdf8' : '#000000'}
                emissiveIntensity={isHighlighted('prop_water_cold') ? 0.4 : 0}
                roughness={0.12}
              />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.038, 0.042, 0.06, 12]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* SCREEN 3: Thermal Contrast Props (hot coffee vs iced cold water + customer visual silhouette) */}
      {showContrastProps && (
        <group name="PROPS_Contrast">
          {/* Steaming Hot Coffee */}
          <group name="prop_cup_hot" position={[-0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.09, 0]} castShadow>
              <cylinderGeometry args={[0.105, 0.085, 0.18, 18]} />
              <meshStandardMaterial
                color="#ea580c"
                emissive="#f97316"
                emissiveIntensity={contrastBoost || isHighlighted('prop_cup_hot') ? 0.5 : 0.18}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, 0.175, 0]}>
              <cylinderGeometry args={[0.092, 0.092, 0.015, 16]} />
              <meshStandardMaterial color="#3b1d0f" roughness={0.2} />
            </mesh>
            <SteamParticles position={[0, 0.22, 0]} intensity={contrastBoost ? 1.5 : 1.15} />
          </group>

          {/* Iced Cold Water */}
          <group name="prop_water_cold" position={[0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.082, 0.24, 18]} />
              <meshStandardMaterial
                color="#38bdf8"
                transparent
                opacity={0.72}
                emissive="#0ea5e9"
                emissiveIntensity={contrastBoost || isHighlighted('prop_water_cold') ? 0.5 : 0.18}
                roughness={0.1}
              />
            </mesh>
            {/* Ice cubes inside */}
            <mesh position={[-0.025, 0.17, 0.02]} rotation={[0.4, 0.5, 0.2]}>
              <boxGeometry args={[0.048, 0.048, 0.048]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.1} />
            </mesh>
            <mesh position={[0.03, 0.14, -0.015]} rotation={[0.2, 0.9, 0.5]}>
              <boxGeometry args={[0.045, 0.045, 0.045]} />
              <meshStandardMaterial color="#f0f9ff" roughness={0.1} />
            </mesh>
          </group>

          {/* Subtle customer visual cue on the left side of the counter */}
          {customerMood && (
            <group position={[-1.08, 1.18, -0.15]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.14, 0.3, 8, 12]} />
                <meshStandardMaterial
                  color={customerMood === 'cold' ? '#3b82f6' : '#f59e0b'}
                  roughness={0.7}
                />
              </mesh>
              <mesh position={[0, 0.36, 0]} castShadow>
                <sphereGeometry args={[0.14, 14, 14]} />
                <meshStandardMaterial color="#f5cba7" roughness={0.75} />
              </mesh>
              {/* Visual mood badge orb above customer (blue snowflake aura vs warm sun aura) */}
              <mesh position={[0, 0.64, 0]}>
                <octahedronGeometry args={[0.09, 0]} />
                <meshStandardMaterial
                  color={customerMood === 'cold' ? '#93c5fd' : '#fcd34d'}
                  emissive={customerMood === 'cold' ? '#38bdf8' : '#f97316'}
                  emissiveIntensity={0.8}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* SCREEN 4: Action Pour (empty cup center + hold-to-pour vessel) */}
      {showPourProps && (
        <group name="PROPS_Pour">
          <group name="prop_cup_empty" position={[0, 0.97, 0.12]}>
            <mesh position={[0, 0.09, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.09, 0.18, 18]} />
              <meshStandardMaterial color="#fff7ed" transparent opacity={0.85} roughness={0.2} />
            </mesh>
            {/* Dynamic liquid level rising inside cup */}
            <mesh ref={fillMeshRef} position={[0, 0.05, 0]} visible={false}>
              <cylinderGeometry args={[0.092, 0.078, 0.14, 16]} />
              <meshStandardMaterial
                color={activePourLiquid === 'water' ? '#38bdf8' : '#4a2511'}
                roughness={0.2}
              />
            </mesh>
          </group>

          {/* Pouring stream */}
          <mesh ref={streamRef} position={[0.03, 1.19, 0.12]} visible={false}>
            <cylinderGeometry args={[0.014, 0.018, 0.24, 10]} />
            <meshStandardMaterial
              color={activePourLiquid === 'water' ? '#7dd3fc' : '#5c2e14'}
              roughness={0.15}
            />
          </mesh>

          {activePourLiquid === 'coffee' && (
            <group
              ref={jarPourRef}
              name="prop_jar_coffee"
              position={[0.45, 0.97, 0.12]}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPourStart();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onPourEnd();
              }}
              onPointerOut={onPourEnd}
            >
              <mesh position={[0, 0.14, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.12, 0.28, 18]} />
                <meshStandardMaterial
                  color="#4b2e1e"
                  emissive="#f59e0b"
                  emissiveIntensity={0.25}
                  roughness={0.25}
                />
              </mesh>
            </group>
          )}

          {activePourLiquid === 'water' && (
            <group
              ref={waterPourRef}
              name="prop_water_cold"
              position={[0.45, 0.97, 0.12]}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPourStart();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onPourEnd();
              }}
              onPointerOut={onPourEnd}
            >
              <mesh position={[0, 0.15, 0]} castShadow>
                <cylinderGeometry args={[0.075, 0.085, 0.3, 18]} />
                <meshStandardMaterial
                  color="#7dd3fc"
                  transparent
                  opacity={0.82}
                  emissive="#38bdf8"
                  emissiveIntensity={0.28}
                  roughness={0.12}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* SCREENS 5, 6, 7: Personal Choice Drinks + Mystery Box Hook */}
      {showChoiceProps && (
        <group name="PROPS_Choice">
          <group name="prop_cup_hot" position={[-0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.085, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.08, 0.17, 18]} />
              <meshStandardMaterial
                color="#ea580c"
                emissive={isHighlighted('prop_cup_hot') ? '#f97316' : '#000000'}
                emissiveIntensity={0.4}
                roughness={0.25}
              />
            </mesh>
            <SteamParticles position={[0, 0.2, 0]} intensity={0.95} />
          </group>

          {/* Creative combo: Cold Coffee (tall glass with dark coffee + ice cubes) */}
          <group name="prop_iced_coffee" position={[0, 0.97, 0.12]}>
            <mesh position={[0, 0.13, 0]} castShadow>
              <cylinderGeometry args={[0.085, 0.072, 0.26, 18]} />
              <meshStandardMaterial
                color="#7c4727"
                transparent
                opacity={0.88}
                emissive={isHighlighted('prop_iced_coffee') ? '#38bdf8' : '#000000'}
                emissiveIntensity={0.4}
                roughness={0.18}
              />
            </mesh>
            <mesh position={[-0.02, 0.21, 0.015]} rotation={[0.4, 0.4, 0.2]}>
              <boxGeometry args={[0.044, 0.044, 0.044]} />
              <meshStandardMaterial color="#e0f2fe" roughness={0.1} />
            </mesh>
            <mesh position={[0.025, 0.19, -0.02]} rotation={[0.2, 0.8, 0.5]}>
              <boxGeometry args={[0.042, 0.042, 0.042]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.1} />
            </mesh>
          </group>

          <group name="prop_water_cold" position={[0.45, 0.97, 0.12]}>
            <mesh position={[0, 0.115, 0]} castShadow>
              <cylinderGeometry args={[0.088, 0.078, 0.23, 18]} />
              <meshStandardMaterial
                color="#38bdf8"
                transparent
                opacity={0.74}
                emissive={isHighlighted('prop_water_cold') ? '#38bdf8' : '#000000'}
                emissiveIntensity={0.4}
                roughness={0.12}
              />
            </mesh>
          </group>

          {/* Mystery box hook for Lesson 2 */}
          <group
            ref={boxRef}
            name="prop_box_mystery"
            position={[0.42, mysteryBoxVisible ? 0.97 : 1.9, 0.22]}
            visible={mysteryBoxVisible}
          >
            <mesh position={[0, 0.11, 0]} castShadow>
              <boxGeometry args={[0.3, 0.22, 0.24]} />
              <meshStandardMaterial color="#d4a373" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.11, 0]}>
              <boxGeometry args={[0.31, 0.04, 0.25]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.65} />
            </mesh>
            <SteamParticles position={[0, 0.25, 0]} intensity={0.8} />
          </group>
        </group>
      )}
    </group>
  );
}

export function CafeScene(props: CafeSceneProps) {
  const { assetMode, visible, ...greyboxProps } = props;
  if (!visible) return null;

  const greybox = <CafeGreybox {...greyboxProps} />;
  if (assetMode === 'glb') {
    return (
      <ModelErrorBoundary fallback={greybox}>
        <Suspense fallback={greybox}>
          <CafeGlb onPropTap={greyboxProps.onPropTap} />
        </Suspense>
      </ModelErrorBoundary>
    );
  }

  return greybox;
}
```

- [ ] **Step 6: Implement `src/scene/LeoBarista.tsx`**

Create `src/scene/LeoBarista.tsx`:
```tsx
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { LeoAnimation, VisemeId } from '../domain/types';
import { resolveActiveViseme, type SpeechClockRef } from '../services/audioPlayer';
import type { AssetMode } from './contracts';
import { ModelErrorBoundary } from './ModelErrorBoundary';

const VISEMES: readonly VisemeId[] = [
  'viseme_aa',
  'viseme_ee',
  'viseme_oo',
  'viseme_fv',
  'viseme_mbp',
];
const IDLE_CLIP: LeoAnimation = 'idle_breathe';

export interface LeoBaristaProps {
  assetMode: AssetMode;
  animation: LeoAnimation;
  speechRef: SpeechClockRef;
  position?: [number, number, number];
  visible?: boolean;
}

function LeoGlb({
  animation,
  speechRef,
  position = [0, 0, -0.72],
}: Omit<LeoBaristaProps, 'assetMode' | 'visible'>) {
  const groupRef = useRef<THREE.Group>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const { scene, animations } = useGLTF('/models/leo_barista.glb');
  const { actions, mixer } = useAnimations(animations, groupRef);

  const faceMesh = useMemo(() => {
    let found: THREE.Mesh | null = null;
    scene.traverse((obj) => {
      if (
        !found &&
        obj instanceof THREE.Mesh &&
        obj.morphTargetDictionary &&
        obj.morphTargetInfluences
      ) {
        found = obj;
      }
    });
    return found;
  }, [scene]);

  useEffect(() => {
    const next = actions[animation] || actions[IDLE_CLIP];
    if (!next || next === activeActionRef.current) return;

    const prev = activeActionRef.current;
    const isOneShot = animation !== IDLE_CLIP;

    next.reset();
    next.setLoop(isOneShot ? THREE.LoopOnce : THREE.LoopRepeat, isOneShot ? 1 : Infinity);
    next.clampWhenFinished = isOneShot;
    next.fadeIn(0.25).play();
    prev?.fadeOut(0.25);
    activeActionRef.current = next;

    if (!isOneShot) return;

    const onFinished = (e: { action: THREE.AnimationAction }) => {
      if (e.action !== next || !actions[IDLE_CLIP]) return;
      actions[IDLE_CLIP].reset().fadeIn(0.3).play();
      next.fadeOut(0.3);
      activeActionRef.current = actions[IDLE_CLIP];
    };

    mixer.addEventListener('finished', onFinished);
    return () => {
      mixer.removeEventListener('finished', onFinished);
    };
  }, [animation, actions, mixer]);

  useFrame((state, delta) => {
    if (!faceMesh || !faceMesh.morphTargetDictionary || !faceMesh.morphTargetInfluences) return;
    const dt = Math.min(delta, 0.05);
    const dict = faceMesh.morphTargetDictionary;
    const influences = faceMesh.morphTargetInfluences;

    const activeViseme = speechRef.isPlaying()
      ? resolveActiveViseme(speechRef.cues, speechRef.getCurrentTime())
      : null;

    for (const viseme of VISEMES) {
      const idx = dict[viseme];
      if (idx === undefined) continue;
      const target = viseme === activeViseme ? 0.85 : 0;
      influences[idx] = THREE.MathUtils.damp(influences[idx], target, 18, dt);
    }

    if ('blink' in dict) {
      const cycle = state.clock.elapsedTime % 3.5;
      const blinkTarget = cycle > 3.35 ? 1 : 0;
      influences[dict.blink] = THREE.MathUtils.damp(influences[dict.blink], blinkTarget, 24, dt);
    }
  });

  return <primitive ref={groupRef} object={scene} position={position} />;
}

function LeoGreybox({
  animation,
  speechRef,
  position = [0, 0, -0.72],
}: Omit<LeoBaristaProps, 'assetMode' | 'visible'>) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const browRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Gentle idle breathing
    if (rootRef.current) {
      const shiverX = animation === 'shiver_cold' ? Math.sin(t * 28) * 0.015 : 0;
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, position[0] + shiverX, 16, dt);
      rootRef.current.position.y = position[1] + Math.sin(t * 2.1) * 0.012;
    }

    // Head pose by animation
    if (headRef.current) {
      const nodX =
        animation === 'nod_thanks'
          ? Math.sin(t * 7) * 0.14
          : animation === 'blow_hot'
            ? 0.18
            : 0;
      const tiltZ =
        animation === 'surprised_happy'
          ? 0.12
          : animation === 'present_left'
            ? -0.08
            : animation === 'present_right'
              ? 0.08
              : 0;
      headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, nodX, 10, dt);
      headRef.current.rotation.z = THREE.MathUtils.damp(headRef.current.rotation.z, tiltZ, 8, dt);
    }

    // Arm poses matching Blender NLA tracks
    if (rightArmRef.current) {
      let targetRotX = 0.08;
      let targetRotZ = -0.18;
      if (animation === 'wave_hi' || animation === 'farewell_box') {
        targetRotX = -0.45;
        targetRotZ = -2.35 + Math.sin(t * 7.5) * 0.32;
      } else if (animation === 'ask_palm') {
        targetRotX = -0.85;
        targetRotZ = -0.25;
      } else if (animation === 'present_right') {
        targetRotX = -0.65;
        targetRotZ = -0.55;
      } else if (animation === 'surprised_happy') {
        targetRotX = -0.8;
        targetRotZ = -1.6;
      }
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(rightArmRef.current.rotation.x, targetRotX, 9, dt);
      rightArmRef.current.rotation.z = THREE.MathUtils.damp(rightArmRef.current.rotation.z, targetRotZ, 9, dt);
    }

    if (leftArmRef.current) {
      let targetRotX = 0.08;
      let targetRotZ = 0.18;
      if (animation === 'present_left') {
        targetRotX = -0.65;
        targetRotZ = 0.55;
      } else if (animation === 'surprised_happy') {
        targetRotX = -0.8;
        targetRotZ = 1.6;
      } else if (animation === 'blow_hot') {
        targetRotX = -0.72;
        targetRotZ = 0.35;
      }
      leftArmRef.current.rotation.x = THREE.MathUtils.damp(leftArmRef.current.rotation.x, targetRotX, 9, dt);
      leftArmRef.current.rotation.z = THREE.MathUtils.damp(leftArmRef.current.rotation.z, targetRotZ, 9, dt);
    }

    // Automatic blink every ~3.5s
    const cycle = t % 3.5;
    const eyeScaleY = cycle > 3.35 ? 0.12 : 1;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.damp(leftEyeRef.current.scale.y, eyeScaleY, 24, dt);
      rightEyeRef.current.scale.y = THREE.MathUtils.damp(rightEyeRef.current.scale.y, eyeScaleY, 24, dt);
    }

    // Eyebrows lift on surprise/curiosity
    if (browRef.current) {
      const targetY = animation === 'surprised_happy' || animation === 'ask_palm' ? 0.085 : 0.068;
      browRef.current.position.y = THREE.MathUtils.damp(browRef.current.position.y, targetY, 12, dt);
    }

    // Lip-sync driven by speechRef visemes (zero React re-renders)
    if (mouthRef.current) {
      const viseme = speechRef.isPlaying()
        ? resolveActiveViseme(speechRef.cues, speechRef.getCurrentTime())
        : null;

      let scaleX = 1.0;
      let scaleY = 0.25;
      if (viseme === 'viseme_aa') {
        scaleX = 1.1;
        scaleY = 1.25;
      } else if (viseme === 'viseme_ee') {
        scaleX = 1.45;
        scaleY = 0.55;
      } else if (viseme === 'viseme_oo') {
        scaleX = 0.65;
        scaleY = 1.15;
      } else if (viseme === 'viseme_fv') {
        scaleX = 1.15;
        scaleY = 0.42;
      } else if (viseme === 'viseme_mbp') {
        scaleX = 0.9;
        scaleY = 0.18;
      } else if (animation === 'nod_thanks' || animation === 'surprised_happy') {
        scaleX = 1.3;
        scaleY = 0.4;
      }

      mouthRef.current.scale.x = THREE.MathUtils.damp(mouthRef.current.scale.x, scaleX, 18, dt);
      mouthRef.current.scale.y = THREE.MathUtils.damp(mouthRef.current.scale.y, scaleY, 18, dt);
    }
  });

  return (
    <group ref={rootRef} name="Leo_Barista_Greybox" position={position}>
      {/* Torso + Olive Barista Apron */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.38, 8, 16]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.02, 0.16]} castShadow>
        <boxGeometry args={[0.34, 0.44, 0.14]} />
        <meshStandardMaterial color="#3d6b59" roughness={0.85} />
      </mesh>

      {/* Head + Face */}
      <group ref={headRef} position={[0, 1.52, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
        </mesh>
        {/* Cozy low-poly hair cap */}
        <mesh position={[0, 0.08, -0.02]} castShadow>
          <sphereGeometry args={[0.205, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#4a3122" roughness={0.88} />
        </mesh>
        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.068, 0.02, 0.18]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshStandardMaterial color="#1f2937" roughness={0.2} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.068, 0.02, 0.18]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshStandardMaterial color="#1f2937" roughness={0.2} />
        </mesh>
        {/* Eyebrows */}
        <group ref={browRef} position={[0, 0.068, 0.185]}>
          <mesh position={[-0.068, 0, 0]}>
            <boxGeometry args={[0.055, 0.014, 0.012]} />
            <meshStandardMaterial color="#4a3122" />
          </mesh>
          <mesh position={[0.068, 0, 0]}>
            <boxGeometry args={[0.055, 0.014, 0.012]} />
            <meshStandardMaterial color="#4a3122" />
          </mesh>
        </group>
        {/* Lip-sync mouth */}
        <mesh ref={mouthRef} position={[0, -0.075, 0.186]}>
          <boxGeometry args={[0.072, 0.05, 0.016]} />
          <meshStandardMaterial color="#7f2929" roughness={0.6} />
        </mesh>
      </group>

      {/* Left Arm (shoulder pivot) */}
      <group ref={leftArmRef} position={[-0.27, 1.24, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.28, 6, 12]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.062, 10, 10]} />
          <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
        </mesh>
      </group>

      {/* Right Arm (shoulder pivot) */}
      <group ref={rightArmRef} position={[0.27, 1.24, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.28, 6, 12]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.062, 10, 10]} />
          <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}

export function LeoBarista(props: LeoBaristaProps) {
  const { assetMode, visible = true, ...leoProps } = props;
  if (!visible) return null;

  const greybox = <LeoGreybox {...leoProps} />;
  if (assetMode === 'glb') {
    return (
      <ModelErrorBoundary fallback={greybox}>
        <Suspense fallback={greybox}>
          <LeoGlb {...leoProps} />
        </Suspense>
      </ModelErrorBoundary>
    );
  }

  return greybox;
}
```

- [ ] **Step 7: Run tests and TypeScript check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (21 tests passing, 0 TS errors).

- [ ] **Step 8: Commit**

```bash
git add src/scene/contracts.ts src/scene/ModelErrorBoundary.tsx src/scene/NeighborhoodMap.tsx src/scene/CafeScene.tsx src/scene/LeoBarista.tsx src/scene/__tests__/contracts.test.ts
git commit -m "feat: add 3D contracts, NeighborhoodMap, CafeScene, and LeoBarista greybox/GLB adapters"
```

---

### Task 6: 3D Constellation, Flying Star Orbs & Unified `ExperienceCanvas`

**Files:**
- Create: `src/scene/Constellation3D.tsx`
- Create: `src/scene/ExperienceCanvas.tsx`

**Interfaces:**
- Consumes: `src/domain/types.ts`, `src/domain/constellation.ts`, `src/content/lesson1Cafe.ts` (`CONCEPT_VISUALS`), `src/scene/contracts.ts`, `src/scene/NeighborhoodMap.tsx`, `src/scene/CafeScene.tsx`, `src/scene/LeoBarista.tsx`
- Produces:
  - `src/scene/Constellation3D.tsx`: `Constellation3D({ nodes, selectedConcept, launchingOrbs, visible, onSelectConcept })`
  - `src/scene/ExperienceCanvas.tsx`: `ExperienceCanvasProps`, `ExperienceCanvas`

- [ ] **Step 1: Implement `src/scene/Constellation3D.tsx`**

Create `src/scene/Constellation3D.tsx`:
```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { LESSON1_CONCEPTS, LESSON1_EDGES } from '../domain/constellation';
import type { AcquisitionStage, ConceptId, ConceptNode } from '../domain/types';
import { CONCEPT_VISUALS } from '../content/lesson1Cafe';

const CONSTELLATION_Y = 6.4;

interface Constellation3DProps {
  nodes: Partial<Record<ConceptId, ConceptNode>>;
  selectedConcept: ConceptId | null;
  launchingOrbs: boolean;
  visible: boolean;
  onSelectConcept: (id: ConceptId) => void;
}

function StarNode({
  conceptId,
  stage,
  selected,
  onSelect,
}: {
  conceptId: ConceptId;
  stage: AcquisitionStage;
  selected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const meta = CONCEPT_VISUALS[conceptId];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const offset = meta.position3D[0] * 1.7 + meta.position3D[1];
    if (groupRef.current) {
      groupRef.current.position.y = meta.position3D[1] + Math.sin(t * 1.5 + offset) * 0.06;
      groupRef.current.rotation.y = t * (stage === 'voice' ? 0.9 : 0.4);
    }
    if (auraRef.current && stage === 'voice') {
      const pulse = 1.15 + Math.sin(t * 3.4 + offset) * 0.16;
      auraRef.current.scale.setScalar(pulse);
    }
  });

  const radius = stage === 'seed' ? 0.14 : stage === 'root' ? 0.19 : 0.23;

  return (
    <group
      ref={groupRef}
      position={[meta.position3D[0], meta.position3D[1], meta.position3D[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {stage === 'voice' ? (
        <mesh>
          <octahedronGeometry args={[radius, 0]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.color}
            emissiveIntensity={selected ? 1.4 : 0.95}
            roughness={0.18}
          />
        </mesh>
      ) : (
        <mesh>
          <sphereGeometry args={[radius, 18, 18]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.color}
            emissiveIntensity={stage === 'root' ? 0.65 : 0.35}
            transparent={stage === 'seed'}
            opacity={stage === 'seed' ? 0.82 : 1}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* Stage halo */}
      <mesh ref={auraRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius + 0.05, radius + (stage === 'seed' ? 0.075 : 0.1), 28]} />
        <meshBasicMaterial
          color={selected ? '#fef08a' : meta.color}
          transparent
          opacity={stage === 'seed' ? 0.45 : 0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function FlyingOrbs({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);

  useFrame((_, delta) => {
    if (!active || !groupRef.current) {
      progressRef.current = 0;
      return;
    }
    const dt = Math.min(delta, 0.05);
    progressRef.current = Math.min(1, progressRef.current + dt * 0.65);
    const p = progressRef.current;
    const ease = 1 - Math.pow(1 - p, 3);

    groupRef.current.children.forEach((child, idx) => {
      const concept = LESSON1_CONCEPTS[idx];
      const target = CONCEPT_VISUALS[concept].position3D;
      const startX = (idx - 2.5) * 0.25;
      child.position.set(
        THREE.MathUtils.lerp(startX, target[0], ease),
        THREE.MathUtils.lerp(1.1, CONSTELLATION_Y + target[1], ease),
        THREE.MathUtils.lerp(0.1, target[2], ease),
      );
      child.visible = p < 0.98;
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {LESSON1_CONCEPTS.map((id) => (
        <mesh key={id}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial color={CONCEPT_VISUALS[id].color} />
        </mesh>
      ))}
    </group>
  );
}

export function Constellation3D({
  nodes,
  selectedConcept,
  launchingOrbs,
  visible,
  onSelectConcept,
}: Constellation3DProps) {
  return (
    <>
      <FlyingOrbs active={launchingOrbs} />
      {visible && (
        <group name="Constellation_3D" position={[0, CONSTELLATION_Y, 0]}>
          {/* Ambient starfield backdrop */}
          <mesh position={[0, 0.4, -2.8]}>
            <planeGeometry args={[14, 10]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.92} />
          </mesh>

          {/* Semantic & Contrast Edges */}
          {LESSON1_EDGES.map((edge) => {
            if (!nodes[edge.from] || !nodes[edge.to]) return null;
            const p1 = CONCEPT_VISUALS[edge.from].position3D;
            const p2 = CONCEPT_VISUALS[edge.to].position3D;
            const isContrast = edge.kind === 'contrast';

            return (
              <group key={`${edge.from}-${edge.to}`}>
                <Line
                  points={[
                    [p1[0], p1[1], p1[2]],
                    [p2[0], p2[1], p2[2]],
                  ]}
                  color={isContrast ? '#fbbf24' : '#94a3b8'}
                  lineWidth={isContrast ? 2.2 : 1.2}
                  dashed={isContrast}
                  dashSize={0.14}
                  gapSize={0.09}
                  transparent
                  opacity={isContrast ? 0.9 : 0.45}
                />
                {isContrast && (
                  <Line
                    points={[
                      [p1[0], p1[1] + 0.05, p1[2]],
                      [p2[0], p2[1] + 0.05, p2[2]],
                    ]}
                    color="#38bdf8"
                    lineWidth={1.6}
                    dashed
                    dashSize={0.14}
                    gapSize={0.09}
                    transparent
                    opacity={0.75}
                  />
                )}
              </group>
            );
          })}

          {/* Lit Concept Stars */}
          {LESSON1_CONCEPTS.map((id) => {
            const node = nodes[id];
            if (!node) return null;
            return (
              <StarNode
                key={id}
                conceptId={id}
                stage={node.stage}
                selected={selectedConcept === id}
                onSelect={() => onSelectConcept(id)}
              />
            );
          })}
        </group>
      )}
    </>
  );
}
```

- [ ] **Step 2: Implement `src/scene/ExperienceCanvas.tsx`**

Create `src/scene/ExperienceCanvas.tsx`:
```tsx
import { useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { HintMode, LessonPhase } from '../domain/lessonEngine';
import type {
  CameraAnchorId,
  ConceptId,
  ConceptNode,
  LeoAnimation,
  LocationStatus,
  PropName,
} from '../domain/types';
import type { SpeechClockRef } from '../services/audioPlayer';
import { CAMERA_ANCHORS, type AssetMode } from './contracts';
import { CafeScene } from './CafeScene';
import { Constellation3D } from './Constellation3D';
import { LeoBarista } from './LeoBarista';
import { NeighborhoodMap } from './NeighborhoodMap';

export type ActiveView = 'map' | 'lesson' | 'constellation';

export interface ExperienceCanvasProps {
  activeView: ActiveView;
  assetMode: AssetMode;
  cameraAnchor: CameraAnchorId;
  cafeStatus: LocationStatus;
  phase: LessonPhase;
  leoAnim: LeoAnimation;
  speechRef: SpeechClockRef;
  highlightedProp: PropName | null;
  hintMode: HintMode;
  customerMood: 'cold' | 'warm' | null;
  activePourLiquid: 'coffee' | 'water' | null;
  pourProgressRef: MutableRefObject<number>;
  isPouringRef: MutableRefObject<boolean>;
  mysteryBoxVisible: boolean;
  orbsLaunching: boolean;
  constellationNodes: Partial<Record<ConceptId, ConceptNode>>;
  selectedConcept: ConceptId | null;
  onEnterCafe: () => void;
  onPropTap: (prop: PropName) => void;
  onPourStart: () => void;
  onPourEnd: () => void;
  onSelectConcept: (id: ConceptId) => void;
}

function CameraRig({
  anchorId,
  orbitEnabled,
}: {
  anchorId: CameraAnchorId;
  orbitEnabled: boolean;
}) {
  const { camera } = useThree();
  const desiredPosRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].position));
  const targetRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].target));
  const lastAnchorRef = useRef<CameraAnchorId>(anchorId);
  const isTransitioningRef = useRef(true);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pose = CAMERA_ANCHORS[anchorId];
    desiredPosRef.current.set(pose.position[0], pose.position[1], pose.position[2]);

    if (lastAnchorRef.current !== anchorId) {
      lastAnchorRef.current = anchorId;
      isTransitioningRef.current = true;
    }

    if (!orbitEnabled || isTransitioningRef.current) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosRef.current.x, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosRef.current.y, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosRef.current.z, 5, dt);
      if (orbitEnabled && camera.position.distanceTo(desiredPosRef.current) < 0.08) {
        isTransitioningRef.current = false;
      }
    }

    targetRef.current.x = THREE.MathUtils.damp(targetRef.current.x, pose.target[0], 6, dt);
    targetRef.current.y = THREE.MathUtils.damp(targetRef.current.y, pose.target[1], 6, dt);
    targetRef.current.z = THREE.MathUtils.damp(targetRef.current.z, pose.target[2], 6, dt);

    if (!orbitEnabled) {
      camera.lookAt(targetRef.current);
    }
  });

  if (!orbitEnabled) return null;

  const pose = CAMERA_ANCHORS[anchorId];
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      target={[pose.target[0], pose.target[1], pose.target[2]]}
      minDistance={2.8}
      maxDistance={9.5}
      maxPolarAngle={Math.PI * 0.48}
    />
  );
}

export function ExperienceCanvas(props: ExperienceCanvasProps) {
  const isConstellation = props.activeView === 'constellation';
  const isMap = props.activeView === 'map';
  const isLesson = props.activeView === 'lesson';

  const effectiveAnchor: CameraAnchorId = isConstellation
    ? 'cam_constelacao'
    : isMap
      ? 'cam_mapa'
      : props.cameraAnchor;

  const bgColor = isConstellation ? '#0b1120' : '#f4e7d3';

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{ position: [5.4, 4.6, 6.2], fov: 42 }}
    >
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 8.5, 22]} />

      <ambientLight intensity={isConstellation ? 0.65 : 0.9} color="#fff7ed" />
      <directionalLight
        position={[3.5, 5.5, 4]}
        intensity={isConstellation ? 0.9 : 1.35}
        color="#ffe8c2"
        castShadow
      />
      <pointLight position={[0, 2.3, 0.2]} intensity={0.8} color="#ffd180" />

      <CameraRig anchorId={effectiveAnchor} orbitEnabled={isMap || isConstellation} />

      <NeighborhoodMap
        cafeStatus={props.cafeStatus}
        visible={isMap}
        onEnterCafe={props.onEnterCafe}
      />

      <CafeScene
        assetMode={props.assetMode}
        phase={props.phase}
        highlightedProp={props.highlightedProp}
        hintMode={props.hintMode}
        customerMood={props.customerMood}
        activePourLiquid={props.activePourLiquid}
        pourProgressRef={props.pourProgressRef}
        isPouringRef={props.isPouringRef}
        mysteryBoxVisible={props.mysteryBoxVisible}
        visible={isLesson}
        onPropTap={props.onPropTap}
        onPourStart={props.onPourStart}
        onPourEnd={props.onPourEnd}
      />

      <LeoBarista
        assetMode={props.assetMode}
        animation={props.leoAnim}
        speechRef={props.speechRef}
        visible={isLesson}
      />

      <Constellation3D
        nodes={props.constellationNodes}
        selectedConcept={props.selectedConcept}
        launchingOrbs={props.orbsLaunching}
        visible={isConstellation}
        onSelectConcept={props.onSelectConcept}
      />
    </Canvas>
  );
}
```

- [ ] **Step 3: Run TypeScript check and tests**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (21 tests passing, 0 TS errors).

- [ ] **Step 4: Commit**

```bash
git add src/scene/Constellation3D.tsx src/scene/ExperienceCanvas.tsx
git commit -m "feat: add 3D Constellation starfield and unified ExperienceCanvas"
```

---

### Task 7: Zero-Portuguese HUD, Sensory Card, Debug Bar, `App.tsx` Wiring & Full Verification

**Files:**
- Create: `src/index.css`
- Create: `src/ui/TopNav.tsx`
- Create: `src/ui/LessonHud.tsx`
- Create: `src/ui/SensoryCard.tsx`
- Create: `src/ui/DebugAudioBar.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

**Interfaces:**
- Consumes: `src/domain/*`, `src/content/*`, `src/services/*`, `src/scene/ExperienceCanvas.tsx`
- Produces: complete runnable React app in `src/App.tsx` + `src/main.tsx`

- [ ] **Step 1: Create `src/index.css`**

Create `src/index.css`:
```css
:root {
  --bg-warm: #f4e7d3;
  --surface-glass: rgba(255, 250, 242, 0.84);
  --surface-dark: rgba(15, 23, 42, 0.86);
  --accent-amber: #ea580c;
  --accent-gold: #f59e0b;
  --accent-mint: #10b981;
  --ink-dark: #1f2937;
  --ink-light: #f8fafc;
}

* {
  box-sizing: border-box;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-warm);
}

.app-shell {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  border-radius: 999px;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
}

.icon-btn:active {
  transform: scale(0.94);
}

.top-nav {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 20;
}

.pill-toggle {
  display: flex;
  padding: 4px;
  gap: 4px;
  border-radius: 999px;
  background: var(--surface-glass);
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.14);
}

.pill-toggle button {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  position: relative;
}

.pill-toggle button.active {
  background: var(--accent-amber);
  color: #fff;
}

.star-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #fbbf24;
  color: #1f2937;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.clock-pill {
  height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--surface-glass);
  backdrop-filter: blur(10px);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink-dark);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
}

.hud-bottom-center {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 18px;
  z-index: 20;
}

.play-btn {
  width: 72px;
  height: 72px;
  background: var(--accent-amber);
  color: #fff;
  font-size: 28px;
}

.help-btn {
  position: absolute;
  right: 20px;
  bottom: 28px;
  width: 54px;
  height: 54px;
  background: var(--surface-glass);
  color: var(--ink-dark);
  font-size: 24px;
  font-weight: 700;
  backdrop-filter: blur(8px);
  z-index: 20;
}

.mic-btn {
  width: 74px;
  height: 74px;
  background: var(--accent-mint);
  color: #fff;
  font-size: 30px;
}

.wave-btn {
  width: 58px;
  height: 58px;
  background: var(--surface-glass);
  color: var(--ink-dark);
  font-size: 26px;
}

.pour-ring {
  width: 76px;
  height: 76px;
  border-radius: 999px;
  background: var(--surface-glass);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
}

.sensory-card {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  width: min(360px, calc(100vw - 32px));
  padding: 18px 20px;
  border-radius: 24px;
  background: var(--surface-dark);
  color: var(--ink-light);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  z-index: 25;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sensory-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stage-dots {
  display: flex;
  gap: 6px;
}

.stage-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.stage-dot.lit {
  background: #fbbf24;
  box-shadow: 0 0 8px #fbbf24;
}

.dev-container {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: min(340px, calc(100vw - 170px));
}

.dev-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dev-badge {
  border: none;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: rgba(15, 23, 42, 0.78);
  color: #e2e8f0;
  cursor: pointer;
}

.dev-caption-pill {
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.85);
  color: #fef3c7;
  font-size: 13px;
  line-height: 1.35;
  backdrop-filter: blur(8px);
}

.dev-caption-meta {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.dev-drawer {
  padding: 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.dev-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dev-actions button {
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-radius: 8px;
  padding: 5px 8px;
  font-size: 11px;
  cursor: pointer;
}
```

- [ ] **Step 2: Create `src/ui/TopNav.tsx`, `src/ui/LessonHud.tsx`, `src/ui/SensoryCard.tsx`, and `src/ui/DebugAudioBar.tsx`**

Create `src/ui/TopNav.tsx`:
```tsx
import type { ActiveView } from '../scene/ExperienceCanvas';

interface TopNavProps {
  activeView: ActiveView;
  starCount: number;
  immersionSeconds: number;
  onSelectView: (view: 'map' | 'constellation') => void;
}

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TopNav({
  activeView,
  starCount,
  immersionSeconds,
  onSelectView,
}: TopNavProps) {
  return (
    <nav className="top-nav" aria-label="Navigation">
      <div className="clock-pill" aria-label="Immersion time">
        <span aria-hidden="true">⏱</span>
        <span>{formatClock(immersionSeconds)}</span>
      </div>

      <div className="pill-toggle">
        <button
          type="button"
          className={activeView !== 'constellation' ? 'active' : ''}
          aria-label="Map"
          onClick={() => onSelectView('map')}
        >
          🗺
        </button>
        <button
          type="button"
          className={activeView === 'constellation' ? 'active' : ''}
          aria-label="Constellation"
          onClick={() => onSelectView('constellation')}
        >
          ✨
          {starCount > 0 && <span className="star-badge">{starCount}</span>}
        </button>
      </div>
    </nav>
  );
}
```

Create `src/ui/LessonHud.tsx`:
```tsx
import type { LessonPhase } from '../domain/lessonEngine';
import type { ActiveView } from '../scene/ExperienceCanvas';

interface LessonHudProps {
  activeView: ActiveView;
  phase: LessonPhase;
  awaitingInput: boolean;
  pourProgress: number;
  isListening: boolean;
  voiceLevel: number;
  onStartCafe: () => void;
  onRequestHelp: () => void;
  onStartMic: () => void;
  onSilentWave: () => void;
  onHoldPourStart: () => void;
  onHoldPourEnd: () => void;
}

export function LessonHud({
  activeView,
  phase,
  awaitingInput,
  pourProgress,
  isListening,
  voiceLevel,
  onStartCafe,
  onRequestHelp,
  onStartMic,
  onSilentWave,
  onHoldPourStart,
  onHoldPourEnd,
}: LessonHudProps) {
  if (activeView === 'map') {
    return (
      <div className="hud-bottom-center">
        <button
          type="button"
          className="icon-btn play-btn"
          aria-label="Enter"
          onClick={onStartCafe}
        >
          ▶
        </button>
      </div>
    );
  }

  if (activeView !== 'lesson') return null;

  const ringDegrees = Math.round(pourProgress * 360);

  return (
    <>
      {phase === 'action_pour' && awaitingInput && (
        <div className="hud-bottom-center">
          <button
            type="button"
            className="icon-btn pour-ring"
            aria-label="Pour"
            style={{
              background: `conic-gradient(#ea580c ${ringDegrees}deg, rgba(255,250,242,0.88) ${ringDegrees}deg)`,
            }}
            onPointerDown={onHoldPourStart}
            onPointerUp={onHoldPourEnd}
            onPointerLeave={onHoldPourEnd}
          >
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: '999px',
                background: 'rgba(255,250,242,0.94)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🫗
            </span>
          </button>
        </div>
      )}

      {phase === 'micro_echo' && awaitingInput && (
        <div className="hud-bottom-center">
          <button
            type="button"
            className="icon-btn mic-btn"
            aria-label="Speak"
            onClick={onStartMic}
            style={{
              transform: isListening ? `scale(${1 + voiceLevel * 0.25})` : undefined,
              boxShadow: isListening
                ? `0 0 ${14 + voiceLevel * 28}px rgba(16, 185, 129, 0.9)`
                : undefined,
            }}
          >
            🎙
          </button>
          <button
            type="button"
            className="icon-btn wave-btn"
            aria-label="Continue"
            onClick={onSilentWave}
          >
            👋
          </button>
        </div>
      )}

      {awaitingInput && (
        <button
          type="button"
          className="icon-btn help-btn"
          aria-label="Help"
          onClick={onRequestHelp}
        >
          ?
        </button>
      )}
    </>
  );
}
```

Create `src/ui/SensoryCard.tsx`:
```tsx
import { CONCEPT_VISUALS } from '../content/lesson1Cafe';
import { getContrastPartner, STAGE_RANK } from '../domain/constellation';
import type { ConceptId, ConceptNode } from '../domain/types';

interface SensoryCardProps {
  node: ConceptNode | null;
  isListening: boolean;
  onReplayAudio: (id: ConceptId) => void;
  onSelectConcept: (id: ConceptId) => void;
  onGoToCafe: () => void;
  onQuickEcho: (id: ConceptId) => void;
  onClose: () => void;
}

export function SensoryCard({
  node,
  isListening,
  onReplayAudio,
  onSelectConcept,
  onGoToCafe,
  onQuickEcho,
  onClose,
}: SensoryCardProps) {
  if (!node) return null;

  const visual = CONCEPT_VISUALS[node.id];
  const contrastId = getContrastPartner(node.id);
  const contrastVisual = contrastId ? CONCEPT_VISUALS[contrastId] : null;
  const rank = STAGE_RANK[node.stage];

  return (
    <div className="sensory-card" role="dialog" aria-label={node.id}>
      <div className="sensory-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: '999px',
              background: visual.color,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            {visual.iconSymbol}
          </span>
          <div className="stage-dots" aria-label={node.stage}>
            {[1, 2, 3].map((level) => (
              <span key={level} className={`stage-dot ${rank >= level ? 'lit' : ''}`} />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Close"
          onClick={onClose}
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.14)', color: '#fff' }}
        >
          ✕
        </button>
      </div>

      <div className="sensory-row">
        <button
          type="button"
          className="icon-btn"
          aria-label="Listen"
          onClick={() => onReplayAudio(node.id)}
          style={{ width: 52, height: 52, background: '#f59e0b', color: '#111827', fontSize: 22 }}
        >
          🔊
        </button>

        {contrastVisual && contrastId && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Contrast"
            onClick={() => {
              onSelectConcept(contrastId);
              onReplayAudio(contrastId);
            }}
            style={{
              height: 48,
              padding: '0 14px',
              gap: 8,
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: 20,
            }}
          >
            <span>{visual.iconSymbol}</span>
            <span>↔</span>
            <span>{contrastVisual.iconSymbol}</span>
          </button>
        )}

        <button
          type="button"
          className="icon-btn"
          aria-label="Echo"
          onClick={() => onQuickEcho(node.id)}
          style={{
            width: 52,
            height: 52,
            background: isListening ? '#10b981' : 'rgba(16,185,129,0.28)',
            color: '#fff',
            fontSize: 22,
          }}
        >
          🎙
        </button>

        <button
          type="button"
          className="icon-btn"
          aria-label="Cafe"
          onClick={onGoToCafe}
          style={{
            width: 48,
            height: 48,
            background: 'rgba(255,255,255,0.14)',
            color: '#fff',
            fontSize: 20,
          }}
        >
          🏠
        </button>
      </div>
    </div>
  );
}
```

Create `src/ui/DebugAudioBar.tsx`:
```tsx
import { useState } from 'react';
import type { LessonPhase } from '../domain/lessonEngine';
import type { AudioStatus } from '../services/audioPlayer';
import type { AssetMode } from '../scene/contracts';

interface DebugAudioBarProps {
  audioStatus: AudioStatus;
  phase: LessonPhase;
  assetMode: AssetMode;
  onToggleAssetMode: () => void;
  onJumpPhase: (phase: LessonPhase) => void;
  onSimulateVoice: () => void;
  onResetProfile: () => void;
}

const PHASES: readonly LessonPhase[] = [
  'map_arrival',
  'counter_intro',
  'thermal_contrast',
  'action_pour',
  'personal_choice',
  'micro_echo',
  'farewell_constellation',
];

export function DebugAudioBar({
  audioStatus,
  phase,
  assetMode,
  onToggleAssetMode,
  onJumpPhase,
  onSimulateVoice,
  onResetProfile,
}: DebugAudioBarProps) {
  const [open, setOpen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const showFallbackPill =
    showCaptions && audioStatus.mode === 'fallback' && audioStatus.phrase !== null;

  return (
    <aside className="dev-container">
      <div className="dev-row">
        <button
          type="button"
          className="dev-badge"
          onClick={() => setOpen((v) => !v)}
        >
          DEV · {phase}
        </button>
      </div>

      {showFallbackPill && (
        <div className="dev-caption-pill">
          <div>
            {audioStatus.isPlaying ? '🔊 ' : '✓ '}
            “{audioStatus.phrase}”
          </div>
          <div className="dev-caption-meta">fallback (missing {audioStatus.src})</div>
        </div>
      )}

      {open && (
        <div className="dev-drawer">
          <div className="dev-actions">
            <button type="button" onClick={() => setShowCaptions((v) => !v)}>
              Captions: {showCaptions ? 'ON' : 'OFF'}
            </button>
            <button type="button" onClick={onToggleAssetMode}>
              3D: {assetMode.toUpperCase()}
            </button>
            <button type="button" onClick={onSimulateVoice}>
              Simulate Voice
            </button>
            <button type="button" onClick={onResetProfile}>
              Reset Storage
            </button>
          </div>
          <div className="dev-actions">
            {PHASES.map((p, idx) => (
              <button key={p} type="button" onClick={() => onJumpPhase(p)}>
                {idx + 1}. {p.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 3: Create `src/App.tsx` and `src/main.tsx`**

Create `src/App.tsx`:
```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONCEPT_AUDIO_KEY } from './content/audioManifest';
import {
  createLesson1State,
  lessonReducer,
  type LessonEffect,
  type LessonEvent,
  type LessonPhase,
} from './domain/lessonEngine';
import { createInitialProfile, promoteConceptToVoice } from './domain/learnerMemory';
import type { ConceptId, LearnerProfile, PropName } from './domain/types';
import { createAudioPlayer, type AudioStatus } from './services/audioPlayer';
import { loadProfile, resetProfile, saveProfile } from './services/learnerStorage';
import { startVoiceCapture, type VoiceCaptureHandle } from './services/voiceCapture';
import type { AssetMode } from './scene/contracts';
import { ExperienceCanvas, type ActiveView } from './scene/ExperienceCanvas';
import { DebugAudioBar } from './ui/DebugAudioBar';
import { LessonHud } from './ui/LessonHud';
import { SensoryCard } from './ui/SensoryCard';
import { TopNav } from './ui/TopNav';

const POUR_DURATION_SEC = 1.4;
const HESITATION_MS = 5000;

export default function App() {
  const [profile, setProfile] = useState<LearnerProfile>(() => loadProfile());
  const [lesson, setLesson] = useState(() => createLesson1State());
  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [assetMode, setAssetMode] = useState<AssetMode>('greybox');
  const [selectedConcept, setSelectedConcept] = useState<ConceptId | null>(null);
  const [pourProgressUi, setPourProgressUi] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>({
    mode: 'idle',
    key: null,
    src: null,
    phrase: null,
    isPlaying: false,
  });

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const lessonRef = useRef(lesson);
  lessonRef.current = lesson;

  const pourProgressRef = useRef(0);
  const isPouringRef = useRef(false);
  const voiceHandleRef = useRef<VoiceCaptureHandle | null>(null);
  const hesitationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioPlayer = useMemo(
    () =>
      createAudioPlayer({
        onStatusChange: setAudioStatus,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      audioPlayer.dispose();
      voiceHandleRef.current?.stop();
      if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
    };
  }, [audioPlayer]);

  const dispatchRef = useRef<(event: LessonEvent) => void>(() => {});

  const runEffects = useCallback(
    (effects: LessonEffect[]) => {
      for (const effect of effects) {
        if (effect.type === 'play_audio') {
          audioPlayer.play(effect.key, {
            playbackRate: effect.playbackRate,
            followUpKey: effect.followUpKey,
            onEnded: () => dispatchRef.current({ type: 'AUDIO_ENDED' }),
          });
        } else if (effect.type === 'commit_profile') {
          setProfile(effect.profile);
          saveProfile(effect.profile);
          setActiveView('constellation');
        }
      }
    },
    [audioPlayer],
  );

  const dispatch = useCallback(
    (event: LessonEvent) => {
      const { state: nextState, effects } = lessonReducer(
        lessonRef.current,
        event,
        profileRef.current,
        new Date().toISOString(),
      );
      lessonRef.current = nextState;
      setLesson(nextState);
      if (event.type === 'POUR_COMPLETED' || event.type === 'JUMP_TO_PHASE') {
        pourProgressRef.current = 0;
        isPouringRef.current = false;
        setPourProgressUi(0);
      }
      runEffects(effects);
    },
    [runEffects],
  );

  dispatchRef.current = dispatch;

  // Immersion seconds counter while active in lesson or constellation
  useEffect(() => {
    if (activeView === 'map') return;
    const id = setInterval(() => {
      setProfile((prev) => {
        const next = { ...prev, immersionSeconds: prev.immersionSeconds + 1 };
        saveProfile(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [activeView]);

  // 5s Hesitation safety net whenever awaiting learner input (except silent-period Micro-Eco)
  useEffect(() => {
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
    if (
      activeView !== 'lesson' ||
      !lesson.awaitingInput ||
      lesson.phase === 'micro_echo' ||
      audioStatus.isPlaying
    ) {
      return;
    }
    hesitationTimerRef.current = setTimeout(() => {
      dispatch({ type: 'HESITATION_TIMEOUT' });
    }, HESITATION_MS);
    return () => {
      if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
    };
  }, [activeView, lesson.awaitingInput, lesson.phase, lesson.roundIndex, audioStatus.isPlaying, dispatch]);

  // Continuous hold-to-pour loop for Screen 4
  useEffect(() => {
    if (lesson.phase !== 'action_pour' || !lesson.awaitingInput) return;
    let rafId = 0;
    let last = performance.now();

    const stopPour = () => {
      isPouringRef.current = false;
    };
    window.addEventListener('pointerup', stopPour);
    window.addEventListener('pointercancel', stopPour);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (isPouringRef.current) {
        const next = Math.min(1, pourProgressRef.current + dt / POUR_DURATION_SEC);
        pourProgressRef.current = next;
        setPourProgressUi(next);
        if (next >= 1) {
          isPouringRef.current = false;
          dispatch({ type: 'POUR_COMPLETED' });
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointerup', stopPour);
      window.removeEventListener('pointercancel', stopPour);
    };
  }, [lesson.phase, lesson.awaitingInput, lesson.roundIndex, dispatch]);

  const handleEnterCafe = useCallback(() => {
    setSelectedConcept(null);
    setActiveView('lesson');
    if (lessonRef.current.completed || lessonRef.current.phase !== 'map_arrival') {
      const fresh = createLesson1State();
      lessonRef.current = fresh;
      setLesson(fresh);
    }
    dispatch({ type: 'ENTER_CAFE' });
  }, [dispatch]);

  const handlePropTap = useCallback(
    (prop: PropName) => {
      if (prop === 'prop_cafe_door') {
        handleEnterCafe();
        return;
      }
      dispatch({ type: 'PROP_TAPPED', prop });
    },
    [dispatch, handleEnterCafe],
  );

  const handleStartMic = useCallback(async () => {
    voiceHandleRef.current?.stop();
    setIsListening(true);
    const handle = await startVoiceCapture({
      onLevel: setVoiceLevel,
      onDetected: () => {
        setIsListening(false);
        setVoiceLevel(0);
        dispatch({ type: 'VOICE_DETECTED' });
      },
      onUnavailable: () => {
        setIsListening(false);
        setVoiceLevel(0);
      },
    });
    voiceHandleRef.current = handle;
  }, [dispatch]);

  const handleQuickEcho = useCallback(async (conceptId: ConceptId) => {
    voiceHandleRef.current?.stop();
    setIsListening(true);
    const handle = await startVoiceCapture({
      onLevel: setVoiceLevel,
      onDetected: () => {
        setIsListening(false);
        setVoiceLevel(0);
        setProfile((prev) => {
          const next = promoteConceptToVoice(prev, conceptId, new Date().toISOString());
          saveProfile(next);
          return next;
        });
        audioPlayer.play(CONCEPT_AUDIO_KEY[conceptId]);
      },
      onUnavailable: () => {
        setIsListening(false);
        setVoiceLevel(0);
      },
    });
    voiceHandleRef.current = handle;
  }, [audioPlayer]);

  const handleSelectConcept = useCallback(
    (id: ConceptId) => {
      setSelectedConcept(id);
      audioPlayer.play(CONCEPT_AUDIO_KEY[id]);
    },
    [audioPlayer],
  );

  const handleJumpPhase = useCallback(
    (phase: LessonPhase) => {
      setSelectedConcept(null);
      if (phase === 'map_arrival') {
        setActiveView('map');
      } else {
        setActiveView('lesson');
      }
      dispatch({ type: 'JUMP_TO_PHASE', phase });
    },
    [dispatch],
  );

  const handleReset = useCallback(() => {
    audioPlayer.stop();
    voiceHandleRef.current?.stop();
    resetProfile();
    const freshProfile = createInitialProfile();
    const freshLesson = createLesson1State();
    setProfile(freshProfile);
    setLesson(freshLesson);
    setSelectedConcept(null);
    setActiveView('map');
  }, [audioPlayer]);

  const starCount = Object.keys(profile.constellation).length;
  const selectedNode = selectedConcept ? (profile.constellation[selectedConcept] ?? null) : null;

  return (
    <main className="app-shell">
      <ExperienceCanvas
        activeView={activeView}
        assetMode={assetMode}
        cameraAnchor={lesson.cameraAnchor}
        cafeStatus={profile.locations.cafe}
        phase={lesson.phase}
        leoAnim={lesson.leoAnim}
        speechRef={audioPlayer.speechRef}
        highlightedProp={lesson.highlightedProp}
        hintMode={lesson.hintMode}
        customerMood={lesson.customerMood}
        activePourLiquid={lesson.activePourLiquid}
        pourProgressRef={pourProgressRef}
        isPouringRef={isPouringRef}
        mysteryBoxVisible={lesson.mysteryBoxVisible}
        orbsLaunching={lesson.orbsLaunching}
        constellationNodes={profile.constellation}
        selectedConcept={selectedConcept}
        onEnterCafe={handleEnterCafe}
        onPropTap={handlePropTap}
        onPourStart={() => {
          isPouringRef.current = true;
        }}
        onPourEnd={() => {
          isPouringRef.current = false;
        }}
        onSelectConcept={handleSelectConcept}
      />

      <TopNav
        activeView={activeView}
        starCount={starCount}
        immersionSeconds={profile.immersionSeconds}
        onSelectView={(view) => {
          setSelectedConcept(null);
          setActiveView(view);
        }}
      />

      <LessonHud
        activeView={activeView}
        phase={lesson.phase}
        awaitingInput={lesson.awaitingInput}
        pourProgress={pourProgressUi}
        isListening={isListening}
        voiceLevel={voiceLevel}
        onStartCafe={handleEnterCafe}
        onRequestHelp={() => dispatch({ type: 'HELP_REQUESTED' })}
        onStartMic={handleStartMic}
        onSilentWave={() => dispatch({ type: 'SILENT_WAVE' })}
        onHoldPourStart={() => {
          isPouringRef.current = true;
        }}
        onHoldPourEnd={() => {
          isPouringRef.current = false;
        }}
      />

      {activeView === 'constellation' && (
        <SensoryCard
          node={selectedNode}
          isListening={isListening}
          onReplayAudio={(id) => audioPlayer.play(CONCEPT_AUDIO_KEY[id])}
          onSelectConcept={setSelectedConcept}
          onGoToCafe={handleEnterCafe}
          onQuickEcho={handleQuickEcho}
          onClose={() => setSelectedConcept(null)}
        />
      )}

      <DebugAudioBar
        audioStatus={audioStatus}
        phase={lesson.phase}
        assetMode={assetMode}
        onToggleAssetMode={() => setAssetMode((m) => (m === 'greybox' ? 'glb' : 'greybox'))}
        onJumpPhase={handleJumpPhase}
        onSimulateVoice={() => {
          if (activeView === 'lesson' && lesson.phase === 'micro_echo') {
            dispatch({ type: 'VOICE_DETECTED' });
          } else if (activeView === 'constellation' && selectedConcept) {
            setProfile((prev) => {
              const next = promoteConceptToVoice(prev, selectedConcept, new Date().toISOString());
              saveProfile(next);
              return next;
            });
          }
        }}
        onResetProfile={handleReset}
      />
    </main>
  );
}
```

Create `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Run full automated checks (Vitest + TypeScript + Vite production build)**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: All Vitest tests PASS, 0 TypeScript errors, clean Vite production build in `dist/`.

- [ ] **Step 5: Verify live in browser across all 7 screens**

Start dev server (`npm run dev`), open the app in the browser, and verify:
1. Neighborhood Map renders with fog, glowing Café da Esquina, pulsing doorway ring, zero Portuguese text, and zero console errors/shadow warnings.
2. Entering Café plays fallback English caption in `DEV` bar while animating Leo's greybox mouth & wave.
3. Counter Intro demos + TPR + wrong-tap Recast + `?` help button work cleanly.
4. Thermal Contrast demos (`hot coffee` steam vs `cold water` ice) + 2 customer requests work.
5. Action Pour hold-to-pour fills the cup continuously for coffee and water.
6. Personal Choice (`cold coffee`) triggers `surprised_happy`.
7. Micro-Eco vocal/silent path completes into Mystery Box + Flying Orbs → 3D Constellation with 6 stars, `hot ↔ cold` double dashed contrast line, Sensory Card, and persisted `localStorage` on reload.

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/ui/ src/App.tsx src/main.tsx
git commit -m "feat: wire zero-Portuguese HUD, SensoryCard, DebugAudioBar, and full Lesson 1 flow"
```
