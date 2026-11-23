import type { CafeCycleId, CefrLevel, ConceptId, LearnerProfile } from './types';

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
  levelLabel: 'Pre-A1' | 'A1' | 'A2';
  completedCafeCycles: readonly CafeCycleId[];
  streetDiscoveryCount: number;
  preA1StepsDone: number;
  preA1StepsTotal: number;
  preA1Ready: boolean;
  marketUnlocked: boolean;
  plazaUnlocked: boolean;
  nextCafeCycle: CafeCycleId;
}

/**
 * Evaluates real CEFR fluency readiness across Café cycles, street actions, and city districts.
 *
 * Pre-A1 -> A1 requires ALL 5 pillars:
 * 1. Cycle 1 (drinks & temperature)
 * 2. Cycle 2 (food, milk, sugar, cake, sweet, more)
 * 3. Cycle 3 (big/small, one/two, full/empty)
 * 4. At least 3 real street-world discoveries (Parallel Talk / micro-events)
 * 5. Pre-A1 Graduation Shift (dynamic combined customer orders)
 *
 * Only once A1 is reached does the Local Market unlock, AND returning to the Café
 * automatically activates the Spiral Curriculum A1 layer (`cafe_a1_spiral`).
 */
export function evaluateCefrProgress(profile: LearnerProfile): CefrProgress {
  const cycles = new Set<CafeCycleId>(profile.completedCafeCycles ?? []);
  if (profile.completedLessonIds.includes('lesson1_cafe')) {
    cycles.add('cafe_c1_drinks');
  }

  const streetDiscoveryCount = (profile.streetDiscoveries ?? []).length;
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

  const marketFamiliar =
    profile.locations.market === 'familiar' ||
    profile.completedLessonIds.includes('lesson2_market');
  const plazaFamiliar =
    profile.locations.plaza === 'familiar' ||
    profile.completedLessonIds.includes('lesson3_plaza');
  const hasA1CafeReturn = cycles.has('cafe_a1_spiral');

  let level: CefrLevel = 'pre_a1';
  if (preA1Ready && marketFamiliar && plazaFamiliar && hasA1CafeReturn) {
    level = 'a2';
  } else if (preA1Ready) {
    level = 'a1';
  }

  const levelLabel: CefrProgress['levelLabel'] =
    level === 'pre_a1' ? 'Pre-A1' : level === 'a1' ? 'A1' : 'A2';

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
  };
}
