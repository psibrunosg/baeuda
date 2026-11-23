import { describe, expect, it } from 'vitest';
import {
  CAFE_A1_SPIRAL_CONCEPTS,
  CAFE_C2_CONCEPTS,
  CAFE_C3_CONCEPTS,
  evaluateCefrProgress,
} from '../cefrEngine';
import {
  applyCafeCycleOutcome,
  applyLesson1Outcome,
  applyLesson2Outcome,
  applyLesson3Outcome,
  createInitialProfile,
  recordStreetDiscovery,
} from '../learnerMemory';

const NOW = '2026-11-23T14:00:00.000Z';

describe('CEFR Fluency Engine & Spiral Curriculum', () => {
  it('keeps the city locked after Lesson 1 alone and unlocks Market only when full Pre-A1 readiness is reached', () => {
    let profile = createInitialProfile();
    expect(evaluateCefrProgress(profile).level).toBe('pre_a1');
    expect(evaluateCefrProgress(profile).nextCafeCycle).toBe('cafe_c1_drinks');

    // Cycle 1 alone does NOT unlock Market prematurely
    profile = applyLesson1Outcome(profile, {
      preferredDrink: 'hot_coffee',
      oralComfort: 'vocal',
      hintedConcepts: [],
      vocalConcepts: ['coffee'],
      nowIso: NOW,
    });
    expect(profile.locations.market).toBe('unexplored');
    expect(evaluateCefrProgress(profile).level).toBe('pre_a1');
    expect(evaluateCefrProgress(profile).nextCafeCycle).toBe('cafe_c2_food');

    // Cycle 2 (food & mixing)
    profile = applyCafeCycleOutcome(profile, 'cafe_c2_food', CAFE_C2_CONCEPTS, NOW);
    expect(profile.locations.market).toBe('unexplored');
    expect(evaluateCefrProgress(profile).nextCafeCycle).toBe('cafe_c3_quantity');

    // Cycle 3 (sizes, numbers, full/empty)
    profile = applyCafeCycleOutcome(profile, 'cafe_c3_quantity', CAFE_C3_CONCEPTS, NOW);
    expect(profile.locations.market).toBe('unexplored');
    expect(evaluateCefrProgress(profile).nextCafeCycle).toBe('cafe_pre_a1_shift');

    // Street physical discoveries (3 required)
    profile = recordStreetDiscovery(profile, 'world_cat_water');
    profile = recordStreetDiscovery(profile, 'world_mailbox_open');
    profile = recordStreetDiscovery(profile, 'world_light_on');
    expect(evaluateCefrProgress(profile).streetDiscoveryCount).toBe(3);

    // Pre-A1 Graduation Shift -> graduates to A1 and unlocks Local Market!
    profile = applyCafeCycleOutcome(profile, 'cafe_pre_a1_shift', [], NOW);
    const a1 = evaluateCefrProgress(profile);
    expect(a1.level).toBe('a1');
    expect(a1.preA1Ready).toBe(true);
    expect(a1.marketUnlocked).toBe(true);
    expect(profile.locations.market).toBe('discovered');

    // Returning to the Café at A1 activates the Spiral Curriculum A1 layer!
    expect(a1.nextCafeCycle).toBe('cafe_a1_spiral');

    // Completing Market, Plaza, and the A1 Café Return advances to A2
    profile = applyCafeCycleOutcome(profile, 'cafe_a1_spiral', CAFE_A1_SPIRAL_CONCEPTS, NOW);
    profile = applyLesson2Outcome(profile, NOW);
    expect(profile.locations.plaza).toBe('discovered');
    profile = applyLesson3Outcome(profile, NOW);
    expect(evaluateCefrProgress(profile).level).toBe('a2');
  });
});
