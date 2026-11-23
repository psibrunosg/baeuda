import { describe, expect, it } from 'vitest';
import {
  getGuidanceCopy,
  resolveImmersionTier,
  type GuidanceContext,
} from '../immersion';

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
