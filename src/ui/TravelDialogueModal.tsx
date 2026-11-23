import { useState } from 'react';
import {
  getDialogueScenario,
  TRAVEL_DIALOGUE_SCENARIOS,
  type DialogueOption,
  type DialogueScenarioId,
} from '../domain/travelDialogues';
import type { SpeechKey } from '../domain/types';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';

function speakEnglish(text: string) {
  if (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  ) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.96;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speechSynthesis errors in restricted sandboxes
    }
  }
}

interface TravelDialogueModalProps {
  initialScenarioId?: DialogueScenarioId;
  completedDiscoveries?: readonly string[];
  onPlayAudio?: (key: SpeechKey) => void;
  onComplete: (scenarioId: DialogueScenarioId) => void;
  onClose: () => void;
}

export function TravelDialogueModal({
  initialScenarioId = 'cafe',
  completedDiscoveries = [],
  onComplete,
  onClose,
}: TravelDialogueModalProps) {
  const [scenarioId, setScenarioId] = useState<DialogueScenarioId>(initialScenarioId);
  const [turnIndex, setTurnIndex] = useState(0);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastReplyKind, setLastReplyKind] = useState<'ok' | 'hint'>('ok');
  const [done, setDone] = useState(false);

  const scenario = getDialogueScenario(scenarioId);
  const turn = scenario.turns[turnIndex];

  const selectScenario = (nextId: DialogueScenarioId) => {
    setScenarioId(nextId);
    setTurnIndex(0);
    setLastReply(null);
    setLastReplyKind('ok');
    setDone(false);
    const nextScenario = getDialogueScenario(nextId);
    speakEnglish(nextScenario.turns[0].npcLine);
  };

  const handleChoose = (opt: DialogueOption) => {
    setLastReply(opt.reply);
    speakEnglish(opt.reply);
    if (opt.isCorrect === false) {
      setLastReplyKind('hint');
      playSoftErrorTone();
      return;
    }
    setLastReplyKind('ok');
    if (turnIndex + 1 >= scenario.turns.length) {
      playRewardFanfare();
      setDone(true);
      onComplete(scenario.id);
    } else {
      playSuccessChime();
      setTurnIndex((i) => i + 1);
    }
  };

  return (
    <section
      className="badges-hub-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Travel City Conversations"
    >
      <div className="badges-hub-panel" style={{ maxWidth: 520 }}>
        <header className="badges-hub-header">
          <strong style={{ fontSize: 15 }}>
            💬 {scenario.icon} {scenario.title} · {scenario.cefrTag} ({Math.min(turnIndex + 1, 3)}/3)
          </strong>
          <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="deck-selector">
          {TRAVEL_DIALOGUE_SCENARIOS.map((s) => {
            const mastered = completedDiscoveries.includes(`world_dialogue_${s.id}`);
            return (
              <button
                key={s.id}
                type="button"
                className={scenarioId === s.id ? 'deck-pill active' : 'deck-pill'}
                onClick={() => selectScenario(s.id)}
              >
                <span>{s.icon}</span>
                <span>{s.title}</span>
                {mastered && <span aria-label="Completed">✓</span>}
              </button>
            );
          })}
        </div>

        {lastReply && (
          <div className={`curiosity-feedback ${lastReplyKind}`} role="status" aria-live="polite">
            {scenario.icon} {scenario.npcName}: “{lastReply}”
          </div>
        )}

        {!done ? (
          <>
            <div className="travel-barista-bubble">
              <span>{scenario.icon}</span>
              <span>“{turn.npcLine}”</span>
              <button
                type="button"
                className="curiosity-icon-btn"
                aria-label={`Hear ${scenario.npcName}`}
                onClick={() => speakEnglish(turn.npcLine)}
              >
                🔊
              </button>
            </div>
            <div className="travel-options">
              {turn.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className="travel-option-btn"
                  onClick={() => handleChoose(opt)}
                >
                  “{opt.label}”
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="game-win-banner">
            <span>🎉 {scenario.title} conversation mastered!</span>
            <button type="button" onClick={() => selectScenario(scenario.id)}>
              Practice again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
