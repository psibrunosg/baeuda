import { describe, expect, it } from 'vitest';
import {
  awardCoins,
  getEffectiveAvatarStyle,
  getEffectiveCoins,
  purchaseOrEquipStyle,
  updateDailyStreak,
} from '../avatarShop';
import { createInitialProfile } from '../learnerMemory';

describe('avatarShop', () => {
  it('supports purchasing and equipping 3D avatar styles with coins', () => {
    let profile = createInitialProfile();
    expect(getEffectiveCoins(profile)).toBe(15);

    const buyBlue = purchaseOrEquipStyle(profile, 'coat_blue');
    expect(buyBlue.purchased).toBe(true);
    expect(buyBlue.insufficientCoins).toBe(false);
    expect(getEffectiveCoins(buyBlue.profile)).toBe(5);
    expect(getEffectiveAvatarStyle(buyBlue.profile).coatColor).toBe('#2563eb');

    // Too expensive with only 5 coins
    const failBuy = purchaseOrEquipStyle(buyBlue.profile, 'hat_mint');
    expect(failBuy.insufficientCoins).toBe(true);

    // Earn coins and buy
    profile = awardCoins(buyBlue.profile, 20);
    const okBuy = purchaseOrEquipStyle(profile, 'hat_mint');
    expect(okBuy.purchased).toBe(true);
    expect(getEffectiveAvatarStyle(okBuy.profile).hatColor).toBe('#34d399');
  });

  it('tracks consecutive daily streaks accurately', () => {
    let profile = createInitialProfile();
    profile = updateDailyStreak(profile, '2026-11-22');
    expect(profile.dailyStreak?.count).toBe(1);
    profile = updateDailyStreak(profile, '2026-11-23');
    expect(profile.dailyStreak?.count).toBe(2);
    // Same day does not double-count
    profile = updateDailyStreak(profile, '2026-11-23');
    expect(profile.dailyStreak?.count).toBe(2);
  });
});
