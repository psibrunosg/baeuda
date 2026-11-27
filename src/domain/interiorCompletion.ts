import { awardCoins, updateDailyStreak } from './avatarShop';
import { recordPedagogicalEvidence } from './learnerMemory';
import type { ConceptId, LearnerProfile, SpeechKey } from './types';

export const INTERIOR_TASK_REWARD_COINS = 20;

/** Keyed by the line each interior task says when it ends. */
export const INTERIOR_TASKS: Partial<
  Record<SpeechKey, { activityId: string; concepts: readonly ConceptId[] }>
> = {
  bakery_done: { activityId: 'interior_bakery', concepts: ['bread', 'butter', 'croissant', 'cake'] },
  barber_done: { activityId: 'interior_barber', concepts: ['comb', 'scissors', 'beard'] },
  school_done: { activityId: 'interior_school', concepts: ['notebook', 'pencil', 'globe'] },
  family_done: { activityId: 'interior_family_home', concepts: ['bed', 'stove', 'desk'] },
};

/**
 * Records a finished interior task. Returns the same profile when `key` ends no task or the
 * task was already recorded: the done line repeats (tapping the NPC again), so it cannot pay twice.
 * shortcut: replays add no new evidence; give them spaced-review credit when interiors get a revisit task.
 */
export function recordInteriorCompletion(
  profile: LearnerProfile,
  key: SpeechKey,
  nowIso: string,
): LearnerProfile {
  const task = INTERIOR_TASKS[key];
  if (!task || profile.completedLessonIds.includes(task.activityId)) return profile;
  const recorded = recordPedagogicalEvidence(profile, {
    mode: 'interior_3d',
    contextId: task.activityId,
    concepts: task.concepts,
    completedActivityId: task.activityId,
    bucket: 'spiral',
    nowIso,
  });
  return updateDailyStreak(awardCoins(recorded, INTERIOR_TASK_REWARD_COINS), nowIso.slice(0, 10));
}
