import { LESSON1_CONCEPTS, upsertConceptNode } from './constellation';
import type { AcquisitionStage, ConceptId, DrinkChoice, LearnerProfile, OralComfort } from './types';

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

  return {
    ...profile,
    preferredDrink: outcome.preferredDrink,
    oralComfort: outcome.oralComfort,
    completedLessonIds,
    locations: {
      ...profile.locations,
      cafe: 'familiar',
      market:
        profile.locations.market === 'unexplored' ? 'discovered' : profile.locations.market,
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
