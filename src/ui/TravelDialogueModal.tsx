import { useCallback, useEffect, useMemo, useState } from 'react';
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

  // Deterministically shuffle options per scenario + turn so distractors are not always in position 3
  const displayOptions = useMemo(() => {
    const arr = [...turn.options];
    let seed = turnIndex * 31 + scenarioId.charCodeAt(0) * 17 + scenarioId.length * 7;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [scenarioId, turn.options, turnIndex]);

  const selectScenario = (nextId: DialogueScenarioId) => {
    setScenarioId(nextId);
    setTurnIndex(0);
    setLastReply(null);
    setLastReplyKind('ok');
    setDone(false);
    const nextScenario = getDialogueScenario(nextId);
    speakEnglish(nextScenario.turns[0].npcLine);
  };

  const handleChoose = useCallback(
    (opt: DialogueOption) => {
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
    },
    [onComplete, scenario.id, scenario.turns.length, turnIndex],
  );

  // Keyboard shortcuts 1 / 2 / 3 to select dialogue options rapidly
  useEffect(() => {
    if (done) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < displayOptions.length) {
        e.preventDefault();
        handleChoose(displayOptions[idx]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [done, handleChoose, displayOptions]);

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
              {displayOptions.map((opt, idx) => (
                <button
                  key={`${scenarioId}-${turnIndex}-${opt.label}`}
                  type="button"
                  className="travel-option-btn"
                  onClick={() => handleChoose(opt)}
                >
                  <strong>{idx + 1}.</strong> “{opt.label}”
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
