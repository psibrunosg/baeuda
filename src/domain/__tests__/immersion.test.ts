import { describe, expect, it } from 'vitest';
import { getContrastPartner } from '../constellation';
import {
  getGuidanceCopy,
  resolveImmersionTier,
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
  'constellation',
];

const PORTUGUESE_SCAFFOLD_WORDS =
  /\b(clique|toque|segure|ouça|escolha|tente|ande|área|névoa|conclua|fale)\b/i;

describe('progressive immersion engine', () => {
  it('maps star counts monotonically across onboarding -> blended -> immersive tiers', () => {
    expect(resolveImmersionTier(0)).toBe('onboarding');
    expect(resolveImmersionTier(2)).toBe('onboarding');
    expect(resolveImmersionTier(3)).toBe('blended');
    expect(resolveImmersionTier(5)).toBe('blended');
    expect(resolveImmersionTier(6)).toBe('immersive');
    expect(resolveImmersionTier(12)).toBe('immersive');
  });

  it('starts in Portuguese scaffolding, blends English keywords mid-way, and removes Portuguese at immersive tier', () => {
    for (const ctx of ALL_CONTEXTS) {
      const onboarding = getGuidanceCopy(ctx, 0);
      const blended = getGuidanceCopy(ctx, 4);
      const immersive = getGuidanceCopy(ctx, 6);

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
    expect(p1.locations).toEqual({ cafe: 'familiar', market: 'discovered', plaza: 'unexplored' });
    expect(Object.keys(p1.constellation)).toHaveLength(6);

    const p2 = applyLesson2Outcome(p1, now);
    expect(p2.locations).toEqual({ cafe: 'familiar', market: 'familiar', plaza: 'discovered' });
    expect(Object.keys(p2.constellation)).toHaveLength(10);

    const p3 = applyLesson3Outcome(p2, now);
    expect(p3.locations).toEqual({ cafe: 'familiar', market: 'familiar', plaza: 'familiar' });
    expect(Object.keys(p3.constellation)).toHaveLength(14);
    expect(getContrastPartner('big')).toBe('small');
    expect(getContrastPartner('fast')).toBe('slow');
  });
});
