import { STAGE_RANK } from './constellation';
import {
  CURRICULUM_MILESTONES,
  getCefrLabel,
  getCurriculumLevel,
  getMilestoneForLevel,
  getNextCefrLevel,
} from './curriculumMap';
import type {
  CafeCycleId,
  CefrLabel,
  CefrLevel,
  ConceptId,
  ConceptNode,
  CurriculumLevelSpec,
  CurriculumMilestone,
  InteriorId,
  LearnerProfile,
} from './types';

export const PRE_A1_REQUIRED_STREET_DISCOVERIES = 3;

export const CAFE_C2_CONCEPTS: readonly ConceptId[] = [
  'milk',
  'sugar',
  'bread',
  'cake',
  'sweet',
  'more',
] as const;

export const CAFE_C3_CONCEPTS: readonly ConceptId[] = [
  'big',
  'small',
  'one',
  'two',
  'full',
  'empty',
] as const;

export const CAFE_A1_SPIRAL_CONCEPTS: readonly ConceptId[] = [
  'plate',
  'next_to',
  'coin',
  'like',
] as const;

export interface CefrProgress {
  level: CefrLevel;
  levelLabel: CefrLabel;
  completedCafeCycles: readonly CafeCycleId[];
  streetDiscoveryCount: number;
  preA1StepsDone: number;
  preA1StepsTotal: number;
  preA1Ready: boolean;
  marketUnlocked: boolean;
  plazaUnlocked: boolean;
  nextCafeCycle: CafeCycleId;
  pizzeriaCompleted: boolean;
  pharmacyCompleted: boolean;
  completedInteriors: readonly InteriorId[];
  conceptsAtLeastRoot: number;
  conceptsAtLeastVoice: number;
  conceptsFluent: number;
  currentLevelSpec: CurriculumLevelSpec;
  nextLevel: CefrLevel | null;
  nextMilestone: CurriculumMilestone;
  milestoneReady: boolean;
}

function meetsMilestoneReadiness(
  milestone: CurriculumMilestone,
  stats: {
    conceptsAtLeastRoot: number;
    conceptsAtLeastVoice: number;
    conceptsFluent: number;
    completedInteriors: Set<InteriorId>;
    completedCafeCycles: Set<CafeCycleId>;
    streetDiscoveryCount: number;
  },
): boolean {
  const c = milestone.readinessCriteria;
  if (stats.conceptsAtLeastRoot < c.minConceptsAtLeastRoot) return false;
  if (c.minConceptsAtLeastVoice !== undefined && stats.conceptsAtLeastVoice < c.minConceptsAtLeastVoice) {
    return false;
  }
  if (c.minConceptsFluent !== undefined && stats.conceptsFluent < c.minConceptsFluent) {
    return false;
  }
  if (c.minStreetDiscoveries !== undefined && stats.streetDiscoveryCount < c.minStreetDiscoveries) {
    return false;
  }
  if (c.requiredInteriors) {
    for (const interior of c.requiredInteriors) {
      if (!stats.completedInteriors.has(interior)) return false;
    }
  }
  if (c.requiredCafeCycles) {
    for (const cycle of c.requiredCafeCycles) {
      if (!stats.completedCafeCycles.has(cycle)) return false;
    }
  }
  return true;
}

/**
 * Evaluates real CEFR fluency readiness across Café cycles, street actions, 3D interiors
 * (including Pizzeria & Pharmacy), constellation maturity, and Neighborhood Milestones
 * using the hybrid Pre-A1 -> A1 -> A2 -> B1 model defined in `curriculumMap.ts`.
 *
 * Pre-A1 -> A1 requires ALL 5 pillars:
 * 1. Cycle 1 (drinks & temperature)
 * 2. Cycle 2 (food, milk, sugar, cake, sweet, more)
 * 3. Cycle 3 (big/small, one/two, full/empty)
 * 4. At least 3 real street-world discoveries (Parallel Talk / micro-events)
 * 5. Pre-A1 Graduation Shift (dynamic combined customer orders)
 *
 * A1 -> A2 requires Pre-A1 readiness + Market + Plaza + Café A1 Spiral return
 * (preserving backwards compatibility with existing progression).
 *
 * A2 -> B1 requires A2 + all 5 neighborhood interiors (including Pizzeria & Pharmacy),
 * constellation maturity (root/voice/fluent) per `CURRICULUM_MILESTONES.a2_festival_night`,
 * and completing the A2 Neighborhood Milestone (`a2_festival_night`).
 */
export function evaluateCefrProgress(profile: LearnerProfile): CefrProgress {
  const cycles = new Set<CafeCycleId>(profile.completedCafeCycles ?? []);
  if (profile.completedLessonIds.includes('lesson1_cafe')) {
    cycles.add('cafe_c1_drinks');
  }

  const discoveries = profile.streetDiscoveries ?? [];
  const streetDiscoveryCount = discoveries.length;
  const hasC1 = cycles.has('cafe_c1_drinks');
  const hasC2 = cycles.has('cafe_c2_food');
  const hasC3 = cycles.has('cafe_c3_quantity');
  const hasStreet = streetDiscoveryCount >= PRE_A1_REQUIRED_STREET_DISCOVERIES;
  const hasShift = cycles.has('cafe_pre_a1_shift');

  const preA1StepsDone =
    (hasC1 ? 1 : 0) +
    (hasC2 ? 1 : 0) +
    (hasC3 ? 1 : 0) +
    (hasStreet ? 1 : 0) +
    (hasShift ? 1 : 0);
  const preA1StepsTotal = 5;
  const preA1Ready = preA1StepsDone >= preA1StepsTotal;

  const explicitInteriors = new Set<InteriorId>(profile.completedInteriors ?? []);
  const cafeFamiliar =
    hasC1 || profile.locations.cafe === 'familiar' || explicitInteriors.has('cafe');
  const marketFamiliar =
    profile.locations.market === 'familiar' ||
    profile.completedLessonIds.includes('lesson2_market') ||
    explicitInteriors.has('market');
  const plazaFamiliar =
    profile.locations.plaza === 'familiar' ||
    profile.completedLessonIds.includes('lesson3_plaza') ||
    explicitInteriors.has('plaza');
  const pizzeriaCompleted =
    explicitInteriors.has('pizzeria') ||
    discoveries.includes('world_pizzeria_kitchen') ||
    profile.completedLessonIds.includes('lesson_pizzeria');
  const pharmacyCompleted =
    explicitInteriors.has('pharmacy') ||
    discoveries.includes('world_pharmacy_counter') ||
    profile.completedLessonIds.includes('lesson_pharmacy');

  const completedInteriorSet = new Set<InteriorId>();
  if (cafeFamiliar) completedInteriorSet.add('cafe');
  if (marketFamiliar) completedInteriorSet.add('market');
  if (plazaFamiliar) completedInteriorSet.add('plaza');
  if (pizzeriaCompleted) completedInteriorSet.add('pizzeria');
  if (pharmacyCompleted) completedInteriorSet.add('pharmacy');

  const nodes = Object.values(profile.constellation).filter((n): n is ConceptNode => Boolean(n));
  let conceptsAtLeastRoot = 0;
  let conceptsAtLeastVoice = 0;
  let conceptsFluent = 0;
  for (const node of nodes) {
    const rank = STAGE_RANK[node.stage];
    if (rank >= STAGE_RANK.root) conceptsAtLeastRoot += 1;
    if (rank >= STAGE_RANK.voice) conceptsAtLeastVoice += 1;
    if (rank >= STAGE_RANK.fluent) conceptsFluent += 1;
  }

  const completedMilestones = new Set<string>(profile.completedMilestoneIds ?? []);
  if (hasShift) {
    completedMilestones.add('pre_a1_graduation_shift');
  }

  const hasA1CafeReturn = cycles.has('cafe_a1_spiral');
  const a2Reached = preA1Ready && marketFamiliar && plazaFamiliar && hasA1CafeReturn;

  const readinessStats = {
    conceptsAtLeastRoot,
    conceptsAtLeastVoice,
    conceptsFluent,
    completedInteriors: completedInteriorSet,
    completedCafeCycles: cycles,
    streetDiscoveryCount,
  };

  const b1Reached =
    a2Reached &&
    completedMilestones.has(CURRICULUM_MILESTONES.a2_festival_night.id) &&
    meetsMilestoneReadiness(CURRICULUM_MILESTONES.a2_festival_night, readinessStats);

  let level: CefrLevel = 'pre_a1';
  if (b1Reached) {
    level = 'b1';
  } else if (a2Reached) {
    level = 'a2';
  } else if (preA1Ready) {
    level = 'a1';
  }

  const levelLabel = getCefrLabel(level);
  const currentLevelSpec = getCurriculumLevel(level);
  const nextLevel = getNextCefrLevel(level);
  const nextMilestone = getMilestoneForLevel(level);
  const milestoneReady =
    !completedMilestones.has(nextMilestone.id) &&
    meetsMilestoneReadiness(nextMilestone, readinessStats);

  let nextCafeCycle: CafeCycleId;
  if (!hasC1) {
    nextCafeCycle = 'cafe_c1_drinks';
  } else if (!hasC2) {
    nextCafeCycle = 'cafe_c2_food';
  } else if (!hasC3) {
    nextCafeCycle = 'cafe_c3_quantity';
  } else if (!hasShift) {
    nextCafeCycle = 'cafe_pre_a1_shift';
  } else {
    nextCafeCycle = 'cafe_a1_spiral';
  }

  return {
    level,
    levelLabel,
    completedCafeCycles: Array.from(cycles),
    streetDiscoveryCount,
    preA1StepsDone,
    preA1StepsTotal,
    preA1Ready,
    marketUnlocked: preA1Ready || profile.locations.market !== 'unexplored',
    plazaUnlocked: marketFamiliar || profile.locations.plaza !== 'unexplored',
    nextCafeCycle,
    pizzeriaCompleted,
    pharmacyCompleted,
    completedInteriors: Array.from(completedInteriorSet),
    conceptsAtLeastRoot,
    conceptsAtLeastVoice,
    conceptsFluent,
    currentLevelSpec,
    nextLevel,
    nextMilestone,
    milestoneReady,
  };
}
