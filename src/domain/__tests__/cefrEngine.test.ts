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
  recordPedagogicalEvidence,
  recordStreetDiscovery,
} from '../learnerMemory';
import { ALL_CONCEPTS } from '../constellation';
import type { ConceptId, ConceptNode } from '../types';

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

  it('tracks Pizzeria & Pharmacy interiors and advances A2 -> B1 only with full hybrid readiness + A2 milestone', () => {
    let profile = createInitialProfile();
    profile = applyLesson1Outcome(profile, {
      preferredDrink: 'hot_coffee',
      oralComfort: 'vocal',
      hintedConcepts: [],
      vocalConcepts: ['coffee', 'cup', 'water', 'hot', 'cold', 'pour'],
      nowIso: NOW,
    });
    profile = applyCafeCycleOutcome(profile, 'cafe_c2_food', CAFE_C2_CONCEPTS, NOW);
    profile = applyCafeCycleOutcome(profile, 'cafe_c3_quantity', CAFE_C3_CONCEPTS, NOW);
    profile = recordStreetDiscovery(profile, 'world_cat_water');
    profile = recordStreetDiscovery(profile, 'world_mailbox_open');
    profile = recordStreetDiscovery(profile, 'world_light_on');
    profile = applyCafeCycleOutcome(profile, 'cafe_pre_a1_shift', [], NOW);
    profile = applyCafeCycleOutcome(profile, 'cafe_a1_spiral', CAFE_A1_SPIRAL_CONCEPTS, NOW);
    profile = applyLesson2Outcome(profile, NOW);
    profile = applyLesson3Outcome(profile, NOW);

    const a2Before = evaluateCefrProgress(profile);
    expect(a2Before.level).toBe('a2');
    expect(a2Before.levelLabel).toBe('A2');
    expect(a2Before.nextLevel).toBe('b1');
    expect(a2Before.pizzeriaCompleted).toBe(false);
    expect(a2Before.pharmacyCompleted).toBe(false);
    expect(a2Before.milestoneReady).toBe(false);

    // Complete Pizzeria & Pharmacy via unified recordPedagogicalEvidence
    profile = recordPedagogicalEvidence(profile, {
      mode: 'interior_3d',
      contextId: 'pizzeria_kitchen',
      interiorId: 'pizzeria',
      concepts: ['hot', 'plate', 'more', 'like'],
      nowIso: NOW,
    });
    profile = recordPedagogicalEvidence(profile, {
      mode: 'interior_3d',
      contextId: 'pharmacy_counter',
      interiorId: 'pharmacy',
      concepts: ['water', 'cold', 'one', 'two'],
      nowIso: NOW,
    });

    const withAllInteriors = evaluateCefrProgress(profile);
    expect(withAllInteriors.pizzeriaCompleted).toBe(true);
    expect(withAllInteriors.pharmacyCompleted).toBe(true);
    expect(withAllInteriors.completedInteriors).toEqual(
      expect.arrayContaining(['cafe', 'market', 'plaza', 'pizzeria', 'pharmacy']),
    );

    // Populate constellation to meet A2 Festival Night readiness (20 root, 8 voice, 3 fluent)
    const matureConstellation: Partial<Record<ConceptId, ConceptNode>> = {};
    ALL_CONCEPTS.slice(0, 22).forEach((conceptId, idx) => {
      const stage = idx < 4 ? 'fluent' : idx < 10 ? 'voice' : 'root';
      matureConstellation[conceptId] = {
        id: conceptId,
        stage,
        originLocation: 'cafe',
        neededHint: false,
        lastContactAt: NOW,
      };
    });
    profile = {
      ...profile,
      constellation: matureConstellation,
    };

    const readyForA2Milestone = evaluateCefrProgress(profile);
    expect(readyForA2Milestone.level).toBe('a2');
    expect(readyForA2Milestone.conceptsAtLeastRoot).toBeGreaterThanOrEqual(20);
    expect(readyForA2Milestone.conceptsAtLeastVoice).toBeGreaterThanOrEqual(8);
    expect(readyForA2Milestone.conceptsFluent).toBeGreaterThanOrEqual(3);
    expect(readyForA2Milestone.nextMilestone.id).toBe('a2_festival_night');
    expect(readyForA2Milestone.milestoneReady).toBe(true);

    // Completing the A2 Neighborhood Milestone graduates learner to B1!
    profile = recordPedagogicalEvidence(profile, {
      mode: 'story',
      contextId: 'a2_festival_night',
      concepts: ['music', 'like'],
      completedMilestoneId: 'a2_festival_night',
      nowIso: NOW,
    });
    const b1 = evaluateCefrProgress(profile);
    expect(b1.level).toBe('b1');
    expect(b1.levelLabel).toBe('B1');
    expect(b1.nextLevel).toBeNull();
    expect(b1.nextMilestone.id).toBe('b1_neighborhood_assembly');
  });
});
