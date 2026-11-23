import { describe, expect, it } from 'vitest';
import { buildSrsReviewPairs, computeReviewUrgency } from '../srsEngine';
import { createInitialProfile } from '../learnerMemory';
import type { ConceptNode } from '../types';

describe('srsEngine', () => {
  it('prioritizes concepts that needed hints and have older lastContactAt', () => {
    const now = Date.parse('2026-11-23T12:00:00.000Z');
    const freshVoice: ConceptNode = {
      id: 'coffee',
      stage: 'voice',
      originLocation: 'cafe',
      neededHint: false,
      lastContactAt: '2026-11-23T11:30:00.000Z',
    };
    const oldSeedHint: ConceptNode = {
      id: 'water',
      stage: 'seed',
      originLocation: 'cafe',
      neededHint: true,
      lastContactAt: '2026-11-21T12:00:00.000Z',
    };

    expect(computeReviewUrgency(oldSeedHint, now)).toBeGreaterThan(
      computeReviewUrgency(freshVoice, now),
    );

    const profile = {
      ...createInitialProfile(),
      constellation: { coffee: freshVoice, water: oldSeedHint },
    };
    const pairs = buildSrsReviewPairs(profile, 6, now);
    expect(pairs).toHaveLength(6);
    expect(pairs[0].id).toBe('srs_water');
  });
});
