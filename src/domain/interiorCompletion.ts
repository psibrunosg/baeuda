import { awardCoins, updateDailyStreak } from './avatarShop';
import { upsertConceptNode } from './constellation';
import { recordPedagogicalEvidence } from './learnerMemory';
import type { ConceptId, LearnerProfile, SpeechKey } from './types';

export const INTERIOR_TASK_REWARD_COINS = 20;

/** Keyed by the line each interior task says when it ends. */
export const INTERIOR_TASKS: Partial<
  Record<
    SpeechKey,
    { activityId: string; concepts: readonly ConceptId[]; heard?: readonly ConceptId[] }
  >
> = {
  bakery_done: { activityId: 'interior_bakery', concepts: ['bread', 'butter', 'croissant', 'cake'] },
  barber_done: { activityId: 'interior_barber', concepts: ['comb', 'scissors', 'beard'] },
  school_done: { activityId: 'interior_school', concepts: ['notebook', 'pencil', 'globe'] },
  family_done: { activityId: 'interior_family_home', concepts: ['bed', 'stove', 'desk'] },
  bookshop_done: {
    activityId: 'interior_bookshop',
    concepts: ['book', 'notebook', 'pen'],
    heard: ['read', 'write', 'story', 'page', 'chapter'],
  },
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
  // Words only heard in the task lines are a first contact (seed), not recall (PEDAGOGY §3.2).
  const constellation = (task.heard ?? []).reduce(
    (nodes, id) =>
      upsertConceptNode(nodes, id, 'seed', false, 'cafe', nowIso, {
        contextId: task.activityId,
        mode: 'interior_3d',
        intervalHours: 4,
      }),
    recorded.constellation,
  );
  return updateDailyStreak(
    awardCoins({ ...recorded, constellation }, INTERIOR_TASK_REWARD_COINS),
    nowIso.slice(0, 10),
  );
}
