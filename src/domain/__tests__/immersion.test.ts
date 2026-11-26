import { describe, expect, it } from 'vitest';
import { getContrastPartner } from '../constellation';
import {
  getGuidanceCopy,
  resolveImmersionTier,
  resolveWorldAtmosphere,
  type GuidanceContext,
} from '../immersion';
import {
  applyLesson1Outcome,
  applyLesson2Outcome,
  applyLesson3Outcome,
  createInitialProfile,
} from '../learnerMemory';

const ALL_CONTEXTS: readonly GuidanceContext[] = [
  'map_explore',
  'map_locked_border',
  'cafe_listen',
  'cafe_tap_prop',
  'cafe_pour',
  'cafe_choice',
  'cafe_echo',
  'bakery_task',
  'school_task',
  'constellation',
];

const PORTUGUESE_SCAFFOLD_WORDS =
  /\b(clique|toque|segure|ouça|escolha|tente|ande|área|névoa|conclua|fale)\b/i;

describe('progressive immersion engine', () => {
  it('maps star counts monotonically across onboarding -> blended -> immersive tiers', () => {
    expect(resolveImmersionTier(0)).toBe('onboarding');
    expect(resolveImmersionTier(5)).toBe('onboarding');
    expect(resolveImmersionTier(6)).toBe('blended');
    expect(resolveImmersionTier(14)).toBe('blended');
    expect(resolveImmersionTier(15)).toBe('immersive');
    expect(resolveImmersionTier(20)).toBe('immersive');
  });

  it('starts in Portuguese scaffolding, blends English keywords mid-way, and removes Portuguese at immersive tier', () => {
    for (const ctx of ALL_CONTEXTS) {
      const onboarding = getGuidanceCopy(ctx, 0);
      const blended = getGuidanceCopy(ctx, 6);
      const immersive = getGuidanceCopy(ctx, 15);

      expect(onboarding.tier).toBe('onboarding');
      expect(onboarding.tierIndex).toBe(1);
      expect(onboarding.plainText.length).toBeGreaterThan(8);

      expect(blended.tier).toBe('blended');
      expect(blended.tierIndex).toBe(2);
      expect(blended.segments.some((s) => s.highlight)).toBe(true);

      expect(immersive.tier).toBe('immersive');
      expect(immersive.tierIndex).toBe(3);
      expect(immersive.plainText).not.toMatch(PORTUGUESE_SCAFFOLD_WORDS);
    }
  });
});

describe('multi-lesson district progression (Cafe -> Market -> Plaza)', () => {
  it('unlocks Market after Lesson 1, Plaza after Lesson 2, and lights all 14 concepts after Lesson 3', () => {
    const now = '2026-11-23T12:00:00.000Z';
    const p0 = createInitialProfile();
    expect(p0.locations).toEqual({ cafe: 'discovered', market: 'unexplored', plaza: 'unexplored' });

    const p1 = applyLesson1Outcome(p0, {
      preferredDrink: 'hot_coffee',
      oralComfort: 'vocal',
      hintedConcepts: [],
      vocalConcepts: ['coffee'],
      nowIso: now,
    });
    expect(p1.locations).toEqual({ cafe: 'familiar', market: 'unexplored', plaza: 'unexplored' });
    expect(Object.keys(p1.constellation)).toHaveLength(6);

    const p2 = applyLesson2Outcome(p1, now);
    expect(p2.locations).toEqual({ cafe: 'familiar', market: 'familiar', plaza: 'discovered' });
    expect(Object.keys(p2.constellation)).toHaveLength(10);

    const p3 = applyLesson3Outcome(p2, now);
    expect(p3.locations).toEqual({ cafe: 'familiar', market: 'familiar', plaza: 'familiar' });
    expect(Object.keys(p3.constellation)).toHaveLength(14);
    expect(getContrastPartner('big')).toBe('small');
    expect(getContrastPartner('fast')).toBe('slow');

    // Automatic atmosphere progression driven by completed lessons (no manual weather button)
    expect(resolveWorldAtmosphere(p0.completedLessonIds)).toEqual({ timeOfDay: 'day', weather: 'sunny' });
    expect(resolveWorldAtmosphere(p1.completedLessonIds)).toEqual({ timeOfDay: 'day', weather: 'rainy' });
    expect(resolveWorldAtmosphere(p2.completedLessonIds)).toEqual({ timeOfDay: 'night', weather: 'sunny' });
    expect(resolveWorldAtmosphere(p3.completedLessonIds)).toEqual({ timeOfDay: 'day', weather: 'sunny' });
  });
});
