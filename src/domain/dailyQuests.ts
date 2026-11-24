import { awardCoins } from './avatarShop';
import type { DailyQuestState, LearnerProfile } from './types';

export type DailyQuestMetric = 'practice' | 'discovery' | 'story_or_dialogue';

export interface DailyQuestItem {
  id: DailyQuestMetric;
  icon: string;
  title: string;
  current: number;
  target: number;
  done: boolean;
}

export const DAILY_CHEST_REWARD_COINS = 35;

export function createFreshDailyQuests(todayStr: string): DailyQuestState {
  return {
    date: todayStr,
    practiceCompleted: 0,
    discoveriesCount: 0,
    dialoguesOrStories: 0,
    chestClaimed: false,
  };
}

export function getEffectiveDailyQuests(
  profile: LearnerProfile,
  todayStr: string = new Date().toISOString().slice(0, 10),
): DailyQuestState {
  const existing = profile.dailyQuests;
  if (!existing || existing.date !== todayStr) {
    return createFreshDailyQuests(todayStr);
  }
  return existing;
}

export function evaluateDailyQuestItems(state: DailyQuestState): DailyQuestItem[] {
  return [
    {
      id: 'practice',
      icon: '⚡',
      title: 'Complete 1 Practice Unit or Mini-Game',
      current: Math.min(state.practiceCompleted, 1),
      target: 1,
      done: state.practiceCompleted >= 1,
    },
    {
      id: 'discovery',
      icon: '🔍',
      title: 'Discover 3 objects or quizzes on the street',
      current: Math.min(state.discoveriesCount, 3),
      target: 3,
      done: state.discoveriesCount >= 3,
    },
    {
      id: 'story_or_dialogue',
      icon: '📖',
      title: 'Finish 1 Story Episode or Talk Dialogue',
      current: Math.min(state.dialoguesOrStories, 1),
      target: 1,
      done: state.dialoguesOrStories >= 1,
    },
  ];
}

export function isDailyChestReady(state: DailyQuestState): boolean {
  return !state.chestClaimed && evaluateDailyQuestItems(state).every((item) => item.done);
}

export function recordDailyQuestProgress(
  profile: LearnerProfile,
  metric: DailyQuestMetric,
  todayStr: string = new Date().toISOString().slice(0, 10),
): LearnerProfile {
  const current = getEffectiveDailyQuests(profile, todayStr);
  const next: DailyQuestState = {
    ...current,
    practiceCompleted:
      metric === 'practice' ? current.practiceCompleted + 1 : current.practiceCompleted,
    discoveriesCount:
      metric === 'discovery' ? current.discoveriesCount + 1 : current.discoveriesCount,
    dialoguesOrStories:
      metric === 'story_or_dialogue' ? current.dialoguesOrStories + 1 : current.dialoguesOrStories,
  };
  return {
    ...profile,
    dailyQuests: next,
  };
}

export function claimDailyChest(
  profile: LearnerProfile,
  todayStr: string = new Date().toISOString().slice(0, 10),
): { profile: LearnerProfile; claimed: boolean } {
  const state = getEffectiveDailyQuests(profile, todayStr);
  if (!isDailyChestReady(state)) {
    return { profile, claimed: false };
  }
  const withCoins = awardCoins(profile, DAILY_CHEST_REWARD_COINS);
  return {
    profile: {
      ...withCoins,
      dailyQuests: {
        ...state,
        chestClaimed: true,
      },
    },
    claimed: true,
  };
}
