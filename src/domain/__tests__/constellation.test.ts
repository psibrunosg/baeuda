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
