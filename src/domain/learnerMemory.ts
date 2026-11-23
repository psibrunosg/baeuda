import {
  evaluateCefrProgress,
} from './cefrEngine';
import {
  LESSON1_CONCEPTS,
  LESSON2_CONCEPTS,
  LESSON3_CONCEPTS,
  upsertConceptNode,
} from './constellation';
import type {
  AcquisitionStage,
  CafeCycleId,
  ConceptId,
  DrinkChoice,
  LearnerProfile,
  OralComfort,
} from './types';

export interface Lesson1Outcome {
  preferredDrink: DrinkChoice;
  oralComfort: Exclude<OralComfort, 'unknown'>;
  hintedConcepts: readonly ConceptId[];
  vocalConcepts: readonly ConceptId[];
  nowIso: string;
}

export function createInitialProfile(): LearnerProfile {
  return {
    schemaVersion: 1,
    preferredDrink: null,
    oralComfort: 'unknown',
    immersionSeconds: 0,
    completedLessonIds: [],
    completedCafeCycles: [],
    streetDiscoveries: [],
    inventoryIds: [],
    completedQuestIds: [],
    locations: {
      cafe: 'discovered',
      market: 'unexplored',
      plaza: 'unexplored',
    },
    constellation: {},
  };
}

export function applyLesson1Outcome(
  profile: LearnerProfile,
  outcome: Lesson1Outcome,
): LearnerProfile {
  const hinted = new Set(outcome.hintedConcepts);
  const vocal = new Set(outcome.vocalConcepts);

  let nextConstellation = { ...profile.constellation };

  for (const conceptId of LESSON1_CONCEPTS) {
    let stage: AcquisitionStage = 'root';
    if (vocal.has(conceptId)) {
      stage = 'voice';
    } else if (hinted.has(conceptId)) {
      stage = 'seed';
    }

    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      stage,
      hinted.has(conceptId),
      'cafe',
      outcome.nowIso,
    );
  }

  const completedLessonIds = profile.completedLessonIds.includes('lesson1_cafe')
    ? profile.completedLessonIds
    : [...profile.completedLessonIds, 'lesson1_cafe'];

  const completedCafeCycles: CafeCycleId[] = (profile.completedCafeCycles ?? []).includes(
    'cafe_c1_drinks',
  )
    ? [...(profile.completedCafeCycles ?? [])]
    : [...(profile.completedCafeCycles ?? []), 'cafe_c1_drinks'];

  const draft: LearnerProfile = {
    ...profile,
    preferredDrink: outcome.preferredDrink,
    oralComfort: outcome.oralComfort,
    completedLessonIds,
    completedCafeCycles,
    locations: {
      ...profile.locations,
      cafe: 'familiar',
    },
    constellation: nextConstellation,
  };

  const progress = evaluateCefrProgress(draft);
  return {
    ...draft,
    locations: {
      ...draft.locations,
      market:
        progress.marketUnlocked && draft.locations.market === 'unexplored'
          ? 'discovered'
          : draft.locations.market,
    },
  };
}

export function recordStreetDiscovery(
  profile: LearnerProfile,
  discoveryId: string,
): LearnerProfile {
  const existing = profile.streetDiscoveries ?? [];
  if (existing.includes(discoveryId)) return profile;

  const draft: LearnerProfile = {
    ...profile,
    streetDiscoveries: [...existing, discoveryId],
  };
  const progress = evaluateCefrProgress(draft);
  return {
    ...draft,
    locations: {
      ...draft.locations,
      market:
        progress.marketUnlocked && draft.locations.market === 'unexplored'
          ? 'discovered'
          : draft.locations.market,
    },
  };
}

export function applyCafeCycleOutcome(
  profile: LearnerProfile,
  cycleId: CafeCycleId,
  concepts: readonly ConceptId[],
  nowIso: string,
): LearnerProfile {
  let nextConstellation = { ...profile.constellation };
  for (const conceptId of concepts) {
    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      'root',
      false,
      'cafe',
      nowIso,
    );
  }

  const prevCycles = profile.completedCafeCycles ?? [];
  const completedCafeCycles = prevCycles.includes(cycleId) ? prevCycles : [...prevCycles, cycleId];

  const draft: LearnerProfile = {
    ...profile,
    completedCafeCycles,
    locations: {
      ...profile.locations,
      cafe: 'familiar',
    },
    constellation: nextConstellation,
  };

  const progress = evaluateCefrProgress(draft);
  return {
    ...draft,
    locations: {
      ...draft.locations,
      market:
        progress.marketUnlocked && draft.locations.market === 'unexplored'
          ? 'discovered'
          : draft.locations.market,
    },
  };
}

export function applyLesson2Outcome(
  profile: LearnerProfile,
  nowIso: string,
): LearnerProfile {
  let nextConstellation = { ...profile.constellation };
  for (const conceptId of LESSON2_CONCEPTS) {
    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      'root',
      false,
      'market',
      nowIso,
    );
  }
  const completedLessonIds = profile.completedLessonIds.includes('lesson2_market')
    ? profile.completedLessonIds
    : [...profile.completedLessonIds, 'lesson2_market'];

  return {
    ...profile,
    completedLessonIds,
    locations: {
      ...profile.locations,
      market: 'familiar',
      plaza: profile.locations.plaza === 'unexplored' ? 'discovered' : profile.locations.plaza,
    },
    constellation: nextConstellation,
  };
}

export function applyLesson3Outcome(
  profile: LearnerProfile,
  nowIso: string,
): LearnerProfile {
  let nextConstellation = { ...profile.constellation };
  for (const conceptId of LESSON3_CONCEPTS) {
    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      'root',
      false,
      'plaza',
      nowIso,
    );
  }
  const completedLessonIds = profile.completedLessonIds.includes('lesson3_plaza')
    ? profile.completedLessonIds
    : [...profile.completedLessonIds, 'lesson3_plaza'];

  return {
    ...profile,
    completedLessonIds,
    locations: {
      ...profile.locations,
      plaza: 'familiar',
    },
    constellation: nextConstellation,
  };
}

export function promoteConceptToVoice(
  profile: LearnerProfile,
  conceptId: ConceptId,
  nowIso: string,
): LearnerProfile {
  const existing = profile.constellation[conceptId];
  return {
    ...profile,
    oralComfort: 'vocal',
    constellation: upsertConceptNode(
      profile.constellation,
      conceptId,
      'voice',
      existing?.neededHint ?? false,
      existing?.originLocation ?? 'cafe',
      nowIso,
    ),
  };
}

export function applySrsReviewOutcome(
  profile: LearnerProfile,
  reviewedConceptIds: readonly ConceptId[],
  nowIso: string,
): LearnerProfile {
  if (reviewedConceptIds.length === 0) return profile;
  let nextConstellation = { ...profile.constellation };
  for (const conceptId of reviewedConceptIds) {
    const existing = nextConstellation[conceptId];
    const nextStage: AcquisitionStage = existing?.stage === 'voice' ? 'voice' : 'root';
    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      nextStage,
      false,
      existing?.originLocation ?? 'cafe',
      nowIso,
    );
  }
  return {
    ...profile,
    constellation: nextConstellation,
  };
}

export function addInventoryItem(profile: LearnerProfile, itemId: string): LearnerProfile {
  const current = profile.inventoryIds ?? [];
  if (current.includes(itemId)) return profile;
  return {
    ...profile,
    inventoryIds: [...current, itemId],
  };
}

export function completeQuestInProfile(
  profile: LearnerProfile,
  questId: string,
  targetItemId: string,
): LearnerProfile {
  const nextInventory = (profile.inventoryIds ?? []).filter((id) => id !== targetItemId);
  const prevCompleted = profile.completedQuestIds ?? [];
  const nextCompleted = prevCompleted.includes(questId)
    ? prevCompleted
    : [...prevCompleted, questId];
  return {
    ...profile,
    inventoryIds: nextInventory,
    completedQuestIds: nextCompleted,
  };
}
