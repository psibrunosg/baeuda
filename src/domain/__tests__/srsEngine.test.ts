import { describe, expect, it } from 'vitest';
import {
  URGENT_REVIEW_THRESHOLD,
  buildSrsReviewPairs,
  computeReviewUrgency,
  getRetentionStatus,
} from '../srsEngine';
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

  it('gives fluent concepts the lowest base urgency while still resurfacing them after a long interval', () => {
    const now = Date.parse('2026-11-24T12:00:00.000Z');
    const recentFluent: ConceptNode = {
      id: 'coffee',
      stage: 'fluent',
      originLocation: 'cafe',
      neededHint: false,
      lastContactAt: '2026-11-24T10:00:00.000Z',
    };
    const recentVoice: ConceptNode = {
      id: 'water',
      stage: 'voice',
      originLocation: 'cafe',
      neededHint: false,
      lastContactAt: '2026-11-24T10:00:00.000Z',
    };
    const staleFluent: ConceptNode = {
      id: 'hot',
      stage: 'fluent',
      originLocation: 'cafe',
      neededHint: false,
      lastContactAt: '2026-10-20T12:00:00.000Z',
    };

    expect(computeReviewUrgency(recentFluent, now)).toBeLessThan(
      computeReviewUrgency(recentVoice, now),
    );
    expect(computeReviewUrgency(staleFluent, now)).toBeGreaterThanOrEqual(
      URGENT_REVIEW_THRESHOLD,
    );
  });

  it('reports urgent SRS concepts and Mistakes Lab items via getRetentionStatus', () => {
    const now = Date.parse('2026-11-24T12:00:00.000Z');
    const clean = getRetentionStatus(createInitialProfile(), now);
    expect(clean.needsRetention).toBe(false);
    expect(clean.hasUrgentSrs).toBe(false);
    expect(clean.hasMistakes).toBe(false);

    const withUrgentAndMistakes = getRetentionStatus(
      {
        ...createInitialProfile(),
        mistakeExerciseIds: ['ex_1', 'ex_2'],
        constellation: {
          coffee: {
            id: 'coffee',
            stage: 'seed',
            originLocation: 'cafe',
            neededHint: true,
            lastContactAt: '2026-11-20T12:00:00.000Z',
          },
          water: {
            id: 'water',
            stage: 'fluent',
            originLocation: 'cafe',
            neededHint: false,
            lastContactAt: '2026-11-24T11:50:00.000Z',
          },
        },
      },
      now,
    );

    expect(withUrgentAndMistakes.hasMistakes).toBe(true);
    expect(withUrgentAndMistakes.mistakeCount).toBe(2);
    expect(withUrgentAndMistakes.hasUrgentSrs).toBe(true);
    expect(withUrgentAndMistakes.urgentConceptIds).toEqual(['coffee']);
    expect(withUrgentAndMistakes.needsRetention).toBe(true);
  });
});
