import {
  PRE_A1_REQUIRED_STREET_DISCOVERIES,
  evaluateCefrProgress,
  type CefrProgress,
} from './cefrEngine';
import { CITY_STORIES } from './cityStories';
import {
  CEFR_LEVEL_ORDER,
  CURRICULUM_MAP,
  SESSION_BUCKET_TARGET_RATIO,
} from './curriculumMap';
import { PRACTICE_UNITS } from './practiceLessons';
import { getRetentionStatus } from './srsEngine';
import { TRAVEL_DIALOGUE_SCENARIOS } from './travelDialogues';
import type {
  CefrLevel,
  LearnerProfile,
  NextStepRecommendation,
  SessionBucket,
} from './types';

function levelsUpTo(level: CefrLevel): readonly CefrLevel[] {
  const idx = CEFR_LEVEL_ORDER.indexOf(level);
  return CEFR_LEVEL_ORDER.slice(0, Math.max(0, idx) + 1);
}

function buildRetentionCandidate(
  profile: LearnerProfile,
  cefr: CefrProgress,
  nowMs: number,
): NextStepRecommendation | null {
  const retention = getRetentionStatus(profile, nowMs);
  if (!retention.needsRetention) return null;

  if (retention.hasMistakes) {
    const count = retention.mistakeCount;
    return {
      id: 'retention_mistakes_lab',
      bucket: 'retention',
      title: 'Mistakes Lab',
      subtitle: count === 1 ? 'Review 1 tricky phrase' : `Review ${count} tricky phrases`,
      reason: 'Active recall on recent mistakes prevents fossilization.',
      cefrLevel: cefr.level,
      target: { kind: 'open_practice', mistakesOnly: true },
      priority: Math.min(95, 70 + count * 5),
    };
  }

  const dueCount = retention.urgentConceptIds.length;
  return {
    id: 'retention_srs_review',
    bucket: 'retention',
    title: 'Smart Review',
    subtitle: dueCount === 1 ? 'Refresh 1 fading word' : `Refresh ${dueCount} fading words`,
    reason: 'Spaced repetition strengthens concepts before they fade.',
    cefrLevel: cefr.level,
    target: { kind: 'open_srs' },
    priority: Math.min(92, Math.round(50 + retention.maxUrgency * 0.45)),
  };
}

function findNextPracticeUnit(profile: LearnerProfile, level: CefrLevel): string | null {
  const completed = new Set(profile.completedPracticeUnitIds ?? []);
  const relevantLevels = levelsUpTo(level);

  for (const lvl of relevantLevels) {
    for (const unitId of CURRICULUM_MAP[lvl].practiceUnitIds) {
      if (!completed.has(unitId)) return unitId;
    }
  }

  for (const unit of PRACTICE_UNITS) {
    if (!completed.has(unit.id)) return unit.id;
  }

  return null;
}

function buildSpiralCandidate(
  profile: LearnerProfile,
  cefr: CefrProgress,
): NextStepRecommendation {
  const cycles = new Set(cefr.completedCafeCycles);

  if (!cycles.has('cafe_c1_drinks')) {
    return {
      id: 'spiral_cafe_c1',
      bucket: 'spiral',
      title: 'Corner Café · Drinks',
      subtitle: 'Meet Leo & order hot or cold',
      reason: 'Start your Pre-A1 foundation with concrete counter actions.',
      cefrLevel: 'pre_a1',
      target: { kind: 'enter_interior', interiorId: 'cafe', cafeCycleId: 'cafe_c1_drinks' },
      priority: 95,
    };
  }

  if (!cycles.has('cafe_c2_food')) {
    return {
      id: 'spiral_cafe_c2',
      bucket: 'spiral',
      title: 'Corner Café · Food',
      subtitle: 'Milk, sugar & sweet cake',
      reason: 'Build your Pre-A1 vocabulary in the Café.',
      cefrLevel: 'pre_a1',
      target: { kind: 'enter_interior', interiorId: 'cafe', cafeCycleId: 'cafe_c2_food' },
      priority: 86,
    };
  }

  if (!cycles.has('cafe_c3_quantity')) {
    return {
      id: 'spiral_cafe_c3',
      bucket: 'spiral',
      title: 'Corner Café · Quantities',
      subtitle: 'Big, small, one & two',
      reason: 'Practice size and quantity contrasts at the counter.',
      cefrLevel: 'pre_a1',
      target: { kind: 'enter_interior', interiorId: 'cafe', cafeCycleId: 'cafe_c3_quantity' },
      priority: 85,
    };
  }

  if (cefr.streetDiscoveryCount < PRE_A1_REQUIRED_STREET_DISCOVERIES) {
    const remaining = PRE_A1_REQUIRED_STREET_DISCOVERIES - cefr.streetDiscoveryCount;
    return {
      id: 'spiral_street_discoveries',
      bucket: 'spiral',
      title: 'Explore the Boulevard',
      subtitle: `${cefr.streetDiscoveryCount}/${PRE_A1_REQUIRED_STREET_DISCOVERIES} street discoveries`,
      reason: `Discover ${remaining} more street object(s) to unlock your Graduation Shift.`,
      cefrLevel: 'pre_a1',
      target: { kind: 'explore_street', minDiscoveries: PRE_A1_REQUIRED_STREET_DISCOVERIES },
      priority: 84,
    };
  }

  if (!cycles.has('cafe_pre_a1_shift')) {
    return {
      id: 'spiral_cafe_graduation_shift',
      bucket: 'spiral',
      title: 'Pre-A1 Graduation Shift',
      subtitle: 'Serve combined orders without hints',
      reason: 'Complete the Café milestone to graduate to A1 and unlock the Market.',
      cefrLevel: 'pre_a1',
      target: { kind: 'enter_interior', interiorId: 'cafe', cafeCycleId: 'cafe_pre_a1_shift' },
      priority: 90,
    };
  }

  if (!cycles.has('cafe_a1_spiral')) {
    return {
      id: 'spiral_cafe_a1',
      bucket: 'spiral',
      title: 'Corner Café · A1 Spiral',
      subtitle: 'Spatial position, coins & likes',
      reason: 'Revisit the Café with A1 constructions in a familiar space.',
      cefrLevel: 'a1',
      target: { kind: 'enter_interior', interiorId: 'cafe', cafeCycleId: 'cafe_a1_spiral' },
      priority: 84,
    };
  }

  if (!cefr.completedInteriors.includes('market')) {
    return {
      id: 'spiral_market',
      bucket: 'spiral',
      title: 'Local Market',
      subtitle: 'Fresh fruit, bread & sizes',
      reason: 'Expand A1 vocabulary with Grocer Maya.',
      cefrLevel: 'a1',
      target: { kind: 'enter_interior', interiorId: 'market' },
      priority: 84,
    };
  }

  if (!cefr.completedInteriors.includes('plaza')) {
    return {
      id: 'spiral_plaza',
      bucket: 'spiral',
      title: 'Central Plaza',
      subtitle: 'Music, tempo & rhythm',
      reason: 'Practice fast/slow contrasts with Musician Sam.',
      cefrLevel: 'a1',
      target: { kind: 'enter_interior', interiorId: 'plaza' },
      priority: 83,
    };
  }

  if (!cefr.pizzeriaCompleted) {
    return {
      id: 'spiral_pizzeria',
      bucket: 'spiral',
      title: 'Neighborhood Pizzeria',
      subtitle: 'Build a pizza in the kitchen',
      reason: 'Transfer food and order phrases to a new 3D interior.',
      cefrLevel: cefr.level === 'pre_a1' ? 'a1' : cefr.level,
      target: { kind: 'enter_interior', interiorId: 'pizzeria' },
      priority: 82,
    };
  }

  if (!cefr.pharmacyCompleted) {
    return {
      id: 'spiral_pharmacy',
      bucket: 'spiral',
      title: 'Corner Pharmacy',
      subtitle: 'Help a patient at the counter',
      reason: 'Practice everyday health requests in a real service scene.',
      cefrLevel: cefr.level === 'pre_a1' ? 'a1' : cefr.level,
      target: { kind: 'enter_interior', interiorId: 'pharmacy' },
      priority: 82,
    };
  }

  const nextUnitId = findNextPracticeUnit(profile, cefr.level);
  if (nextUnitId) {
    const unit = PRACTICE_UNITS.find((u) => u.id === nextUnitId);
    return {
      id: `spiral_practice_${nextUnitId}`,
      bucket: 'spiral',
      title: unit ? `Practice · ${unit.title}` : 'Guided Practice',
      subtitle: unit?.description ?? 'Consolidate key sentence patterns',
      reason: 'Structured production builds sentence fluency.',
      cefrLevel: cefr.level,
      target: { kind: 'open_practice', unitId: nextUnitId },
      priority: 78,
    };
  }

  return {
    id: 'spiral_practice_refresh',
    bucket: 'spiral',
    title: 'Practice · City A2',
    subtitle: 'Directions & past tense drills',
    reason: 'Keep sharpening spiral constructions across the neighborhood.',
    cefrLevel: cefr.level,
    target: { kind: 'open_practice', unitId: 'unit_4_city_a2' },
    priority: 70,
  };
}

function buildApplicationCandidate(
  profile: LearnerProfile,
  cefr: CefrProgress,
): NextStepRecommendation | null {
  const cycles = new Set(cefr.completedCafeCycles);
  if (!cycles.has('cafe_c1_drinks')) return null;

  const completedStories = new Set(profile.completedStoryIds ?? []);
  const completedDialogues = new Set(profile.completedDialogueIds ?? []);
  const relevantLevels = levelsUpTo(cefr.level);

  let nextStoryId: string | null = null;
  for (const lvl of relevantLevels) {
    for (const storyId of CURRICULUM_MAP[lvl].storyIds) {
      if (!completedStories.has(storyId)) {
        nextStoryId = storyId;
        break;
      }
    }
    if (nextStoryId) break;
  }

  let nextDialogueId: string | null = null;
  for (const lvl of relevantLevels) {
    for (const scenarioId of CURRICULUM_MAP[lvl].dialogueScenarioIds) {
      if (!completedDialogues.has(scenarioId)) {
        nextDialogueId = scenarioId;
        break;
      }
    }
    if (nextDialogueId) break;
  }

  const preferStory =
    nextStoryId !== null &&
    (nextDialogueId === null || completedStories.size <= completedDialogues.size);

  if (preferStory && nextStoryId) {
    const story = CITY_STORIES.find((s) => s.id === nextStoryId);
    return {
      id: `application_story_${nextStoryId}`,
      bucket: 'application',
      title: story ? `Story · ${story.title}` : 'Neighborhood Story',
      subtitle: story?.teaser ?? 'Listen and follow a neighborhood episode',
      reason: 'Apply your vocabulary inside a real multi-character story.',
      cefrLevel: cefr.level,
      target: { kind: 'open_story', storyId: nextStoryId },
      priority: 74,
    };
  }

  const chosenDialogueId =
    nextDialogueId ??
    CURRICULUM_MAP[cefr.level].dialogueScenarioIds[0] ??
    TRAVEL_DIALOGUE_SCENARIOS[0].id;
  const scenario = TRAVEL_DIALOGUE_SCENARIOS.find((s) => s.id === chosenDialogueId);

  return {
    id: `application_talk_${chosenDialogueId}`,
    bucket: 'application',
    title: scenario ? `Talk · ${scenario.title}` : 'Travel Dialogue',
    subtitle: scenario ? `Chat with ${scenario.npcName}` : 'Practice a real conversation',
    reason: 'Open dialogue turns passive knowledge into spoken confidence.',
    cefrLevel: cefr.level,
    target: { kind: 'open_talk', scenarioId: chosenDialogueId },
    priority: 72,
  };
}

export function computeSessionBucketRatios(
  recentBuckets: readonly SessionBucket[] = [],
): Record<SessionBucket, number> {
  if (recentBuckets.length === 0) {
    return { spiral: 0, retention: 0, application: 0 };
  }
  const counts: Record<SessionBucket, number> = {
    spiral: 0,
    retention: 0,
    application: 0,
  };
  for (const bucket of recentBuckets) {
    counts[bucket] += 1;
  }
  const total = recentBuckets.length;
  return {
    spiral: counts.spiral / total,
    retention: counts.retention / total,
    application: counts.application / total,
  };
}

/**
 * Computes the single clearest, deterministic Next Best Step for the learner,
 * balancing the session rhythm (~60% spiral, ~25% retention, ~15% application)
 * defined in `docs/PEDAGOGY.md` §3.4.
 */
export function computeNextBestStep(
  profile: LearnerProfile,
  nowMs = Date.now(),
): NextStepRecommendation {
  const cefr = evaluateCefrProgress(profile);
  const spiral = buildSpiralCandidate(profile, cefr);
  const retention = buildRetentionCandidate(profile, cefr, nowMs);
  const application = buildApplicationCandidate(profile, cefr);

  // Brand-new learner always begins in the Café before any review or side activity
  if (!cefr.completedCafeCycles.includes('cafe_c1_drinks')) {
    return spiral;
  }

  const recent = profile.recentSessionBuckets ?? [];
  const lastBucket = recent.length > 0 ? recent[recent.length - 1] : null;

  // High-urgency retention override (many mistakes or severely overdue SRS),
  // avoided on back-to-back retention turns to keep session variety healthy.
  const retentionStatus = getRetentionStatus(profile, nowMs);
  if (
    retention &&
    lastBucket !== 'retention' &&
    (retentionStatus.mistakeCount >= 3 || retentionStatus.maxUrgency >= 75)
  ) {
    return retention;
  }

  const candidates: Partial<Record<SessionBucket, NextStepRecommendation>> = {
    spiral,
    ...(retention ? { retention } : {}),
    ...(application ? { application } : {}),
  };

  const ratios = computeSessionBucketRatios(recent);
  const bucketOrder: readonly SessionBucket[] = ['spiral', 'retention', 'application'];

  let bestBucket: SessionBucket = 'spiral';
  let bestDeficit = -Infinity;

  for (const bucket of bucketOrder) {
    if (!candidates[bucket]) continue;
    const deficit = SESSION_BUCKET_TARGET_RATIO[bucket] - ratios[bucket];
    if (deficit > bestDeficit) {
      bestDeficit = deficit;
      bestBucket = bucket;
    }
  }

  return candidates[bestBucket] ?? spiral;
}
