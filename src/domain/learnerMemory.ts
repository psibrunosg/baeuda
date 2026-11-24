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
  InteriorId,
  LearnerProfile,
  LocationId,
  OralComfort,
  PedagogicalEvidence,
  SessionBucket,
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

const SRS_INTERVAL_LADDER_HOURS = [4, 24, 72, 168, 336] as const;
const MAX_RECENT_SESSION_BUCKETS = 20;

function inferSessionBucket(evidence: PedagogicalEvidence): SessionBucket {
  if (evidence.bucket) return evidence.bucket;
  if (evidence.mode === 'srs' || evidence.contextId.includes('mistake')) {
    return 'retention';
  }
  if (evidence.mode === 'story' || evidence.mode === 'talk' || evidence.completedMilestoneId) {
    return 'application';
  }
  return 'spiral';
}

function inferOriginLocation(
  explicit: LocationId | undefined,
  interiorId: InteriorId | undefined,
): LocationId {
  if (explicit) return explicit;
  if (interiorId === 'market') return 'market';
  if (interiorId === 'plaza') return 'plaza';
  return 'cafe';
}

function appendUnique<T>(list: readonly T[] | undefined, item: T): T[] {
  const prev = list ?? [];
  return prev.includes(item) ? [...prev] : [...prev, item];
}

/**
 * Unified pedagogical memory recorder across all Baeuda modes
 * (`interior_3d` including Pizzeria/Pharmacy, `street`, `practice`, `story`, `talk`, `srs`).
 *
 * Updates concept constellation (`contextsSeen`, `lastMode`, `stage` up to `fluent`,
 * `reviewCount`, `intervalHours`), completion records, continuity rhythm buckets,
 * and CEFR-driven district unlocks.
 */
export function recordPedagogicalEvidence(
  profile: LearnerProfile,
  evidence: PedagogicalEvidence,
): LearnerProfile {
  const succeeded = evidence.succeeded ?? true;
  const neededHint = evidence.neededHint ?? false;
  const producedOutput = evidence.producedOutput ?? false;
  const originLocation = inferOriginLocation(evidence.originLocation, evidence.interiorId);
  const bucket = inferSessionBucket(evidence);

  let nextConstellation = { ...profile.constellation };

  for (const conceptId of evidence.concepts) {
    const existing = nextConstellation[conceptId];
    let targetStage: AcquisitionStage;
    if (!succeeded) {
      targetStage = existing?.stage ?? 'seed';
    } else if (producedOutput || evidence.mode === 'talk') {
      targetStage = 'voice';
    } else if (neededHint || evidence.mode === 'street') {
      targetStage = 'seed';
    } else {
      targetStage = 'root';
    }

    const nextReviewCount = succeeded
      ? (existing?.reviewCount ?? 0) + 1
      : existing?.reviewCount ?? 0;
    const ladderInterval =
      SRS_INTERVAL_LADDER_HOURS[
        Math.min(nextReviewCount, SRS_INTERVAL_LADDER_HOURS.length - 1)
      ];
    const nextIntervalHours = succeeded ? ladderInterval : 4;

    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      targetStage,
      neededHint || !succeeded,
      originLocation,
      evidence.nowIso,
      {
        contextId: evidence.contextId,
        mode: evidence.mode,
        succeeded,
        reviewCount: nextReviewCount,
        intervalHours: nextIntervalHours,
      },
    );

    const updated = nextConstellation[conceptId];
    if (updated && updated.stage === 'fluent' && (updated.intervalHours ?? 0) < 168) {
      nextConstellation[conceptId] = {
        ...updated,
        intervalHours: 168,
      };
    }
  }

  let completedLessonIds = profile.completedLessonIds;
  let completedPracticeUnitIds = profile.completedPracticeUnitIds;
  let completedStoryIds = profile.completedStoryIds;
  let completedDialogueIds = profile.completedDialogueIds;
  let completedInteriors = profile.completedInteriors;
  let completedMilestoneIds = profile.completedMilestoneIds;
  let streetDiscoveries = profile.streetDiscoveries;
  let locations = { ...profile.locations };

  if (succeeded) {
    if (evidence.interiorId) {
      completedInteriors = appendUnique(completedInteriors, evidence.interiorId);
      if (evidence.interiorId === 'cafe') {
        locations.cafe = 'familiar';
      } else if (evidence.interiorId === 'market') {
        locations.market = 'familiar';
        if (locations.plaza === 'unexplored') {
          locations.plaza = 'discovered';
        }
      } else if (evidence.interiorId === 'plaza') {
        locations.plaza = 'familiar';
      } else if (evidence.interiorId === 'pizzeria') {
        streetDiscoveries = appendUnique(streetDiscoveries, 'world_pizzeria_kitchen');
      } else if (evidence.interiorId === 'pharmacy') {
        streetDiscoveries = appendUnique(streetDiscoveries, 'world_pharmacy_counter');
      }
    }

    if (evidence.completedActivityId) {
      if (evidence.mode === 'practice' && !evidence.contextId.includes('mistake')) {
        completedPracticeUnitIds = appendUnique(
          completedPracticeUnitIds,
          evidence.completedActivityId,
        );
      } else if (evidence.mode === 'story') {
        completedStoryIds = appendUnique(completedStoryIds, evidence.completedActivityId);
      } else if (evidence.mode === 'street') {
        streetDiscoveries = appendUnique(streetDiscoveries, evidence.completedActivityId);
      } else if (evidence.mode === 'interior_3d') {
        completedLessonIds = appendUnique(completedLessonIds, evidence.completedActivityId);
      }
    }

    if (evidence.completedDialogueId) {
      completedDialogueIds = appendUnique(completedDialogueIds, evidence.completedDialogueId);
    }

    if (evidence.completedMilestoneId) {
      completedMilestoneIds = appendUnique(completedMilestoneIds, evidence.completedMilestoneId);
    }
  }

  const prevBuckets = profile.recentSessionBuckets ?? [];
  const recentSessionBuckets = [...prevBuckets, bucket].slice(-MAX_RECENT_SESSION_BUCKETS);

  const draft: LearnerProfile = {
    ...profile,
    oralComfort: succeeded && producedOutput ? 'vocal' : profile.oralComfort,
    completedLessonIds,
    ...(completedPracticeUnitIds !== undefined ? { completedPracticeUnitIds } : {}),
    ...(completedStoryIds !== undefined ? { completedStoryIds } : {}),
    ...(completedDialogueIds !== undefined ? { completedDialogueIds } : {}),
    ...(completedInteriors !== undefined ? { completedInteriors } : {}),
    ...(completedMilestoneIds !== undefined ? { completedMilestoneIds } : {}),
    ...(streetDiscoveries !== undefined ? { streetDiscoveries } : {}),
    recentSessionBuckets,
    locations,
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
      plaza:
        progress.plazaUnlocked && draft.locations.plaza === 'unexplored'
          ? 'discovered'
          : draft.locations.plaza,
    },
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
    const nextStage: AcquisitionStage =
      existing?.stage === 'fluent'
        ? 'fluent'
        : existing?.stage === 'voice'
          ? 'voice'
          : 'root';
    const nextReviewCount = (existing?.reviewCount ?? 0) + 1;
    const nextIntervalHours =
      SRS_INTERVAL_LADDER_HOURS[
        Math.min(nextReviewCount, SRS_INTERVAL_LADDER_HOURS.length - 1)
      ];
    nextConstellation = upsertConceptNode(
      nextConstellation,
      conceptId,
      nextStage,
      false,
      existing?.originLocation ?? 'cafe',
      nowIso,
      {
        mode: 'srs',
        succeeded: true,
        reviewCount: nextReviewCount,
        intervalHours: nextStage === 'fluent' ? Math.max(nextIntervalHours, 168) : nextIntervalHours,
      },
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
