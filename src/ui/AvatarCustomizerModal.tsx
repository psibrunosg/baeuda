import { useState } from 'react';
import {
  AVATAR_SHOP_ITEMS,
  getEffectiveAvatarStyle,
  getEffectiveCoins,
  getUnlockedStyleIds,
  type AvatarShopItem,
  type AvatarSlot,
} from '../domain/avatarShop';
import type { LearnerProfile } from '../domain/types';
import { CoinIcon } from './CoinIcon';

interface AvatarCustomizerModalProps {
  profile: LearnerProfile;
  onSelectItem: (item: AvatarShopItem) => { purchased: boolean; insufficientCoins: boolean };
  onClose: () => void;
}

const SECTIONS: { slot: AvatarSlot; title: string; emoji: string }[] = [
  { slot: 'coat', title: 'Boutique · Coats', emoji: '🧥' },
  { slot: 'hat', title: 'Boutique · Hats', emoji: '🎩' },
  { slot: 'hair', title: 'Barber · Hair', emoji: '💈' },
];

export function AvatarCustomizerModal({
  profile,
  onSelectItem,
  onClose,
}: AvatarCustomizerModalProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const coins = getEffectiveCoins(profile);
  const style = getEffectiveAvatarStyle(profile);
  const unlocked = getUnlockedStyleIds(profile);
  const streakCount = profile.dailyStreak?.count ?? 1;

  const isEquipped = (item: AvatarShopItem): boolean => {
    if (item.slot === 'coat') return style.coatColor === item.color;
    if (item.slot === 'hat') return style.hatColor === item.color;
    return style.hairColor === item.color;
  };

  const handleClick = (item: AvatarShopItem) => {
    const res = onSelectItem(item);
    if (res.insufficientCoins) {
      setFeedback(`Need ${item.price} coins — solve quizzes, mini-games or quests to earn more!`);
    } else if (res.purchased) {
      setFeedback(`✨ Unlocked & wearing ${item.label}!`);
    } else {
      setFeedback(`👕 Wearing ${item.label}!`);
    }
  };

  return (
    <section className="badges-hub-backdrop" role="dialog" aria-modal="true" aria-label="Avatar Wardrobe">
      <div className="badges-hub-panel avatar-wardrobe-card" style={{ maxWidth: 520 }}>
        <header className="badges-hub-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }} aria-hidden="true">🧥</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 16 }}>Avatar Wardrobe</h2>
              <p className="avatar-wardrobe-sub" style={{ margin: 0 }}>Boutique &amp; Barber Style Shop</p>
            </div>
          </div>
          <div className="avatar-wallet-badges">
            <span className="avatar-stat-chip" title="Daily Streak">🔥 {streakCount}d</span>
            <span className="avatar-stat-chip coins" title="Coins">
              <CoinIcon size={14} /> {coins}
            </span>
            <button
              type="button"
              className="badges-close-btn"
              aria-label="Close wardrobe"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </header>

        {feedback && (
          <div className="avatar-shop-feedback" role="status">
            {feedback}
          </div>
        )}

        <div className="avatar-shop-sections">
          {SECTIONS.map((sec) => {
            const items = AVATAR_SHOP_ITEMS.filter((i) => i.slot === sec.slot);
            return (
              <section key={sec.slot} className="avatar-shop-section">
                <h3 className="avatar-shop-heading">
                  <span>{sec.emoji}</span> {sec.title}
                </h3>
                <div className="avatar-shop-grid">
                  {items.map((item) => {
                    const owned = unlocked.includes(item.id);
                    const equipped = isEquipped(item);
                    const canAfford = coins >= item.price;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`avatar-swatch-card ${equipped ? 'equipped' : ''} ${!owned && !canAfford ? 'locked' : ''}`}
                        onClick={() => handleClick(item)}
                      >
                        <span
                          className="avatar-swatch-dot"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                        <span className="avatar-swatch-label">{item.label}</span>
                        <span className="avatar-swatch-price">
                          {equipped ? (
                            '✓ On'
                          ) : owned ? (
                            'Wear'
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CoinIcon size={13} />
                              {item.price}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
