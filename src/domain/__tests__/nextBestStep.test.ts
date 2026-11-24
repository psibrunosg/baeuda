import { describe, expect, it } from 'vitest';
import {
  CAFE_A1_SPIRAL_CONCEPTS,
  CAFE_C2_CONCEPTS,
  CAFE_C3_CONCEPTS,
} from '../cefrEngine';
import {
  applyCafeCycleOutcome,
  applyLesson1Outcome,
  applyLesson2Outcome,
  applyLesson3Outcome,
  createInitialProfile,
  recordPedagogicalEvidence,
  recordStreetDiscovery,
} from '../learnerMemory';
import {
  computeNextBestStep,
  computeSessionBucketRatios,
} from '../nextBestStep';
import type { LearnerProfile } from '../types';

const NOW_ISO = '2026-11-24T12:00:00.000Z';
const NOW_MS = Date.parse(NOW_ISO);

function buildPreA1GraduatedProfile(): LearnerProfile {
  let profile = createInitialProfile();
  profile = applyLesson1Outcome(profile, {
    preferredDrink: 'hot_coffee',
    oralComfort: 'vocal',
    hintedConcepts: [],
    vocalConcepts: ['coffee', 'cup', 'hot'],
    nowIso: NOW_ISO,
  });
  profile = applyCafeCycleOutcome(profile, 'cafe_c2_food', CAFE_C2_CONCEPTS, NOW_ISO);
  profile = applyCafeCycleOutcome(profile, 'cafe_c3_quantity', CAFE_C3_CONCEPTS, NOW_ISO);
  profile = recordStreetDiscovery(profile, 'world_cat_water');
  profile = recordStreetDiscovery(profile, 'world_mailbox_open');
  profile = recordStreetDiscovery(profile, 'world_light_on');
  profile = applyCafeCycleOutcome(profile, 'cafe_pre_a1_shift', [], NOW_ISO);
  return profile;
}

describe('nextBestStep', () => {
  it('always starts a brand-new learner on Corner Café Cycle 1 even if mistakes exist', () => {
    const fresh: LearnerProfile = {
      ...createInitialProfile(),
      mistakeExerciseIds: ['ex_1', 'ex_2', 'ex_3'],
    };

    const step = computeNextBestStep(fresh, NOW_MS);
    expect(step.id).toBe('spiral_cafe_c1');
    expect(step.bucket).toBe('spiral');
    expect(step.cefrLevel).toBe('pre_a1');
    expect(step.target).toEqual({
      kind: 'enter_interior',
      interiorId: 'cafe',
      cafeCycleId: 'cafe_c1_drinks',
    });
  });

  it('guides spiral advancement cleanly through Café cycles, street discoveries, Market, Plaza, Pizzeria, Pharmacy, and Practice', () => {
    let profile = applyLesson1Outcome(createInitialProfile(), {
      preferredDrink: 'hot_coffee',
      oralComfort: 'vocal',
      hintedConcepts: [],
      vocalConcepts: ['coffee'],
      nowIso: NOW_ISO,
    });
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'cafe',
      cafeCycleId: 'cafe_c2_food',
    });

    profile = applyCafeCycleOutcome(profile, 'cafe_c2_food', CAFE_C2_CONCEPTS, NOW_ISO);
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'cafe',
      cafeCycleId: 'cafe_c3_quantity',
    });

    profile = applyCafeCycleOutcome(profile, 'cafe_c3_quantity', CAFE_C3_CONCEPTS, NOW_ISO);
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'explore_street',
      minDiscoveries: 3,
    });

    profile = recordStreetDiscovery(profile, 'world_cat_water');
    profile = recordStreetDiscovery(profile, 'world_mailbox_open');
    profile = recordStreetDiscovery(profile, 'world_light_on');
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'cafe',
      cafeCycleId: 'cafe_pre_a1_shift',
    });

    profile = applyCafeCycleOutcome(profile, 'cafe_pre_a1_shift', [], NOW_ISO);
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'cafe',
      cafeCycleId: 'cafe_a1_spiral',
    });

    profile = applyCafeCycleOutcome(profile, 'cafe_a1_spiral', CAFE_A1_SPIRAL_CONCEPTS, NOW_ISO);
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'market',
    });

    profile = applyLesson2Outcome(profile, NOW_ISO);
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'plaza',
    });

    profile = applyLesson3Outcome(profile, NOW_ISO);
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'pizzeria',
    });

    profile = recordPedagogicalEvidence(profile, {
      mode: 'interior_3d',
      contextId: 'pizzeria_kitchen',
      interiorId: 'pizzeria',
      concepts: ['hot', 'plate'],
      nowIso: NOW_ISO,
    });
    // Reset recentSessionBuckets so we inspect pure spiral order
    profile = { ...profile, recentSessionBuckets: [] };
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'enter_interior',
      interiorId: 'pharmacy',
    });

    profile = recordPedagogicalEvidence(profile, {
      mode: 'interior_3d',
      contextId: 'pharmacy_counter',
      interiorId: 'pharmacy',
      concepts: ['water', 'cold'],
      nowIso: NOW_ISO,
    });
    profile = { ...profile, recentSessionBuckets: [] };
    expect(computeNextBestStep(profile, NOW_MS).target).toEqual({
      kind: 'open_practice',
      unitId: 'unit_1_cafe',
    });
  });

  it('triggers high-urgency retention override for Mistakes Lab or severely overdue SRS, without repeating retention back-to-back', () => {
    const base = buildPreA1GraduatedProfile();

    const withManyMistakes: LearnerProfile = {
      ...base,
      mistakeExerciseIds: ['m1', 'm2', 'm3'],
      recentSessionBuckets: ['spiral'],
    };
    const mistakeStep = computeNextBestStep(withManyMistakes, NOW_MS);
    expect(mistakeStep.bucket).toBe('retention');
    expect(mistakeStep.target).toEqual({ kind: 'open_practice', mistakesOnly: true });

    // Back-to-back retention turn is avoided when lastBucket is already 'retention'
    const afterRetention: LearnerProfile = {
      ...withManyMistakes,
      recentSessionBuckets: ['spiral', 'retention'],
    };
    expect(computeNextBestStep(afterRetention, NOW_MS).bucket).not.toBe('retention');

    // Severely overdue SRS triggers Smart Review
    const withOverdueSrs: LearnerProfile = {
      ...base,
      constellation: {
        ...base.constellation,
        water: {
          id: 'water',
          stage: 'seed',
          originLocation: 'cafe',
          neededHint: true,
          lastContactAt: '2026-11-10T12:00:00.000Z',
        },
      },
      recentSessionBuckets: ['spiral'],
    };
    const srsStep = computeNextBestStep(withOverdueSrs, NOW_MS);
    expect(srsStep.bucket).toBe('retention');
    expect(srsStep.target).toEqual({ kind: 'open_srs' });
  });

  it('balances the 60/25/15 session rhythm by recommending application (Stories/Talk) after spiral-heavy turns', () => {
    const base = buildPreA1GraduatedProfile();
    const spiralHeavy: LearnerProfile = {
      ...base,
      recentSessionBuckets: ['spiral', 'spiral', 'spiral', 'spiral'],
    };

    const step = computeNextBestStep(spiralHeavy, NOW_MS);
    expect(step.bucket).toBe('application');
    expect(step.target).toEqual({ kind: 'open_story', storyId: 'story_missing_cake' });

    // Once the story is completed, application pivots to Talk
    const afterStory: LearnerProfile = {
      ...spiralHeavy,
      completedStoryIds: ['story_missing_cake', 'story_runaway_puppy'],
    };
    const talkStep = computeNextBestStep(afterStory, NOW_MS);
    expect(talkStep.bucket).toBe('application');
    expect(talkStep.target.kind).toBe('open_talk');
  });

  it('computes session bucket ratios accurately and returns deterministic recommendations', () => {
    expect(computeSessionBucketRatios([])).toEqual({
      spiral: 0,
      retention: 0,
      application: 0,
    });
    expect(
      computeSessionBucketRatios([
        'spiral',
        'spiral',
        'spiral',
        'retention',
        'application',
      ]),
    ).toEqual({
      spiral: 0.6,
      retention: 0.2,
      application: 0.2,
    });

    const profile = buildPreA1GraduatedProfile();
    expect(computeNextBestStep(profile, NOW_MS)).toEqual(computeNextBestStep(profile, NOW_MS));
  });
});
