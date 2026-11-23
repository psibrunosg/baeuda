import type { AvatarStyle, LearnerProfile } from './types';

export type AvatarSlot = 'coat' | 'hat' | 'hair';

export interface AvatarShopItem {
  id: string;
  slot: AvatarSlot;
  shop: 'Boutique' | 'Barber';
  label: string;
  color: string;
  price: number;
}

export const DEFAULT_AVATAR_STYLE: AvatarStyle = {
  coatColor: '#e09f3e',
  hatColor: '#e05a47',
  hairColor: '#292524',
};

export const AVATAR_SHOP_ITEMS: readonly AvatarShopItem[] = [
  // Boutique Coats
  { id: 'coat_mustard', slot: 'coat', shop: 'Boutique', label: 'Mustard Coat', color: '#e09f3e', price: 0 },
  { id: 'coat_blue', slot: 'coat', shop: 'Boutique', label: 'Blue Coat', color: '#2563eb', price: 10 },
  { id: 'coat_emerald', slot: 'coat', shop: 'Boutique', label: 'Green Coat', color: '#10b981', price: 10 },
  { id: 'coat_rose', slot: 'coat', shop: 'Boutique', label: 'Red Coat', color: '#e11d48', price: 15 },
  // Boutique Hats
  { id: 'hat_coral', slot: 'hat', shop: 'Boutique', label: 'Coral Beret', color: '#e05a47', price: 0 },
  { id: 'hat_yellow', slot: 'hat', shop: 'Boutique', label: 'Yellow Hat', color: '#facc15', price: 10 },
  { id: 'hat_navy', slot: 'hat', shop: 'Boutique', label: 'Navy Hat', color: '#1e3a8a', price: 10 },
  { id: 'hat_mint', slot: 'hat', shop: 'Boutique', label: 'Mint Hat', color: '#34d399', price: 15 },
  // Barber Hair Colors
  { id: 'hair_dark', slot: 'hair', shop: 'Barber', label: 'Dark Hair', color: '#292524', price: 0 },
  { id: 'hair_chestnut', slot: 'hair', shop: 'Barber', label: 'Brown Hair', color: '#78350f', price: 5 },
  { id: 'hair_blonde', slot: 'hair', shop: 'Barber', label: 'Blonde Hair', color: '#eab308', price: 10 },
  { id: 'hair_auburn', slot: 'hair', shop: 'Barber', label: 'Red Hair', color: '#b45309', price: 10 },
];

export function getEffectiveCoins(profile: LearnerProfile): number {
  return profile.coins ?? 15;
}

export function getEffectiveAvatarStyle(profile: LearnerProfile): AvatarStyle {
  return profile.avatarStyle ?? DEFAULT_AVATAR_STYLE;
}

export function getUnlockedStyleIds(profile: LearnerProfile): string[] {
  const defaults = AVATAR_SHOP_ITEMS.filter((i) => i.price === 0).map((i) => i.id);
  return Array.from(new Set([...defaults, ...(profile.unlockedStyleIds ?? [])]));
}

export function awardCoins(profile: LearnerProfile, amount: number): LearnerProfile {
  return {
    ...profile,
    coins: Math.max(0, getEffectiveCoins(profile) + amount),
  };
}

export function purchaseOrEquipStyle(
  profile: LearnerProfile,
  itemId: string,
): { profile: LearnerProfile; purchased: boolean; insufficientCoins: boolean } {
  const item = AVATAR_SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { profile, purchased: false, insufficientCoins: false };

  const unlocked = getUnlockedStyleIds(profile);
  const currentCoins = getEffectiveCoins(profile);
  const currentStyle = getEffectiveAvatarStyle(profile);

  const alreadyOwned = unlocked.includes(item.id);
  if (!alreadyOwned && currentCoins < item.price) {
    return { profile, purchased: false, insufficientCoins: true };
  }

  const nextStyle: AvatarStyle = { ...currentStyle };
  if (item.slot === 'coat') nextStyle.coatColor = item.color;
  if (item.slot === 'hat') nextStyle.hatColor = item.color;
  if (item.slot === 'hair') nextStyle.hairColor = item.color;

  return {
    profile: {
      ...profile,
      coins: alreadyOwned ? currentCoins : currentCoins - item.price,
      unlockedStyleIds: alreadyOwned ? unlocked : [...unlocked, item.id],
      avatarStyle: nextStyle,
    },
    purchased: !alreadyOwned,
    insufficientCoins: false,
  };
}

export function updateDailyStreak(
  profile: LearnerProfile,
  todayDateStr: string = new Date().toISOString().slice(0, 10),
): LearnerProfile {
  const prev = profile.dailyStreak;
  if (prev?.lastDate === todayDateStr) return profile;

  let nextCount = 1;
  if (prev?.lastDate) {
    const prevMs = Date.parse(`${prev.lastDate}T00:00:00Z`);
    const todayMs = Date.parse(`${todayDateStr}T00:00:00Z`);
    const diffDays = Math.round((todayMs - prevMs) / 86_400_000);
    if (diffDays === 1) {
      nextCount = prev.count + 1;
    }
  }

  return {
    ...profile,
    dailyStreak: { count: nextCount, lastDate: todayDateStr },
  };
}
