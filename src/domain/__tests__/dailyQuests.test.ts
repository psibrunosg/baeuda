import { describe, expect, it } from 'vitest';
import {
  claimDailyChest,
  DAILY_CHEST_REWARD_COINS,
  evaluateDailyQuestItems,
  getEffectiveDailyQuests,
  isDailyChestReady,
  recordDailyQuestProgress,
} from '../dailyQuests';
import { getEffectiveCoins } from '../avatarShop';
import { createInitialProfile } from '../learnerMemory';

describe('dailyQuests (Module B)', () => {
  it('tracks 3 daily goals, unlocks the treasure chest, awards coins once, and resets on a new day', () => {
    let profile = createInitialProfile();
    const day1 = '2026-11-24';

    expect(isDailyChestReady(getEffectiveDailyQuests(profile, day1))).toBe(false);

    profile = recordDailyQuestProgress(profile, 'practice', day1);
    profile = recordDailyQuestProgress(profile, 'discovery', day1);
    profile = recordDailyQuestProgress(profile, 'discovery', day1);
    profile = recordDailyQuestProgress(profile, 'discovery', day1);
    profile = recordDailyQuestProgress(profile, 'story_or_dialogue', day1);

    const state = getEffectiveDailyQuests(profile, day1);
    expect(evaluateDailyQuestItems(state).every((q) => q.done)).toBe(true);
    expect(isDailyChestReady(state)).toBe(true);

    const coinsBefore = getEffectiveCoins(profile);
    const firstClaim = claimDailyChest(profile, day1);
    expect(firstClaim.claimed).toBe(true);
    expect(getEffectiveCoins(firstClaim.profile)).toBe(coinsBefore + DAILY_CHEST_REWARD_COINS);

    // Claiming twice on the same day does nothing
    const secondClaim = claimDailyChest(firstClaim.profile, day1);
    expect(secondClaim.claimed).toBe(false);

    // Next day resets cleanly
    const nextDayState = getEffectiveDailyQuests(firstClaim.profile, '2026-11-25');
    expect(nextDayState.practiceCompleted).toBe(0);
    expect(nextDayState.chestClaimed).toBe(false);
  });
});
