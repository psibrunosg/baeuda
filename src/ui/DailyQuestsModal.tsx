import {
  DAILY_CHEST_REWARD_COINS,
  evaluateDailyQuestItems,
  getEffectiveDailyQuests,
  isDailyChestReady,
} from '../domain/dailyQuests';
import { PRACTICE_UNITS } from '../domain/practiceLessons';
import type { LearnerProfile } from '../domain/types';
import { CoinIcon } from './CoinIcon';

interface DailyQuestsModalProps {
  profile: LearnerProfile;
  onClaimChest: () => void;
  onOpenPractice: () => void;
  onOpenStories: () => void;
  onClose: () => void;
}

export function DailyQuestsModal({
  profile,
  onClaimChest,
  onOpenPractice,
  onOpenStories,
  onClose,
}: DailyQuestsModalProps) {
  const questState = getEffectiveDailyQuests(profile);
  const items = evaluateDailyQuestItems(questState);
  const completedCount = items.filter((i) => i.done).length;
  const chestReady = isDailyChestReady(questState);
  const completedUnits = profile.completedPracticeUnitIds ?? [];

  return (
    <section
      className="badges-hub-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Daily Quests and Learning Path"
    >
      <div className="badges-hub-panel practice-panel">
        <header className="badges-hub-header">
          <strong style={{ fontSize: 16 }}>🎯 Daily Quests &amp; City Path</strong>
          <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* Daily Goals List */}
        <div className="daily-quests-list">
          {items.map((q) => {
            const pct = Math.round((q.current / q.target) * 100);
            return (
              <div key={q.id} className={`daily-quest-row ${q.done ? 'done' : ''}`}>
                <span className="daily-quest-icon" aria-hidden="true">{q.icon}</span>
                <div className="daily-quest-body">
                  <div className="daily-quest-title-row">
                    <span>{q.title}</span>
                    <strong>
                      {q.current}/{q.target}
                    </strong>
                  </div>
                  <div className="practice-progress-track">
                    <div className="practice-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Daily Treasure Chest */}
        <div className={`daily-chest-card ${chestReady ? 'ready' : ''} ${questState.chestClaimed ? 'claimed' : ''}`}>
          <div className="daily-chest-info">
            <span style={{ fontSize: 28 }} aria-hidden="true">
              {questState.chestClaimed ? '✅' : chestReady ? '🎁' : '🧰'}
            </span>
            <div>
              <strong>Daily Treasure Chest</strong>
              <div style={{ fontSize: 12, color: '#57534e' }}>
                {questState.chestClaimed
                  ? 'Claimed today! Come back tomorrow.'
                  : chestReady
                    ? 'All 3 daily goals done! Open your chest!'
                    : `Complete ${3 - completedCount} more goal(s) to unlock +${DAILY_CHEST_REWARD_COINS} coins.`}
              </div>
            </div>
          </div>
          {chestReady && (
            <button type="button" className="practice-primary-btn" style={{ width: 'auto', padding: '8px 14px' }} onClick={onClaimChest}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                Open <CoinIcon size={14} /> +{DAILY_CHEST_REWARD_COINS}
              </span>
            </button>
          )}
        </div>

        {/* Visual CEFR Learning Path */}
        <div className="city-path-section">
          <div className="minimap-section-label" style={{ marginBottom: 8 }}>
            🗺 City Learning Path (Pre-A1 → A2)
          </div>
          <div className="city-path-nodes">
            {PRACTICE_UNITS.map((unit, idx) => {
              const done = completedUnits.includes(unit.id);
              const isNext = !done && (idx === 0 || completedUnits.includes(PRACTICE_UNITS[idx - 1].id));
              return (
                <button
                  key={unit.id}
                  type="button"
                  className={`city-path-node ${done ? 'done' : isNext ? 'next' : ''}`}
                  onClick={onOpenPractice}
                >
                  <span className="city-path-badge" aria-hidden="true">
                    {done ? '✓' : unit.icon}
                  </span>
                  <div className="city-path-text">
                    <strong>
                      Unit {idx + 1}: {unit.title}
                    </strong>
                    <span>{unit.cefrTag} · {done ? 'Mastered' : isNext ? 'Up next!' : 'Tap to practice'}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="practice-secondary-btn"
            style={{ marginTop: 10 }}
            onClick={onOpenStories}
          >
            📖 Read a Neighborhood Story Episode →
          </button>
        </div>
      </div>
    </section>
  );
}
