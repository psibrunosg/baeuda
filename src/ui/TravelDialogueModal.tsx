import { useState } from 'react';
import { playRewardFanfare, playSuccessChime } from '../services/soundEngine';

interface TravelTurn {
  id: string;
  baristaLine: string;
  options: readonly { label: string; reply: string }[];
}

const TRAVEL_CAFE_TURNS: readonly TravelTurn[] = [
  {
    id: 'drink',
    baristaLine: 'Hi! Welcome to the café. What would you like to drink?',
    options: [
      { label: 'One hot coffee, please.', reply: 'Great! One hot coffee.' },
      { label: 'Cold water, please.', reply: 'Sure! One cold water.' },
      { label: 'Coffee with milk, please.', reply: 'Nice choice! Coffee with milk.' },
    ],
  },
  {
    id: 'here_or_to_go',
    baristaLine: 'For here or to go?',
    options: [
      { label: 'For here, please.', reply: 'Great, have a seat!' },
      { label: 'To go, please.', reply: 'No problem, I will pack it to go.' },
    ],
  },
  {
    id: 'anything_else',
    baristaLine: 'Anything else? Fresh cake or bread?',
    options: [
      { label: 'Yes, one slice of cake, please!', reply: 'Delicious! Coming right up.' },
      { label: 'No, thank you. How much is it?', reply: 'Two coins, please. Thank you!' },
    ],
  },
];

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
  onComplete: () => void;
  onClose: () => void;
}

export function TravelDialogueModal({ onComplete, onClose }: TravelDialogueModalProps) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const turn = TRAVEL_CAFE_TURNS[turnIndex];

  const handleChoose = (opt: { label: string; reply: string }) => {
    setLastReply(opt.reply);
    speakEnglish(opt.reply);
    if (turnIndex + 1 >= TRAVEL_CAFE_TURNS.length) {
      playRewardFanfare();
      setDone(true);
      onComplete();
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
      aria-label="Travel Café Conversation"
    >
      <div className="badges-hub-panel" style={{ maxWidth: 460 }}>
        <header className="badges-hub-header">
          <strong style={{ fontSize: 15 }}>💬 Real Travel Order · {Math.min(turnIndex + 1, 3)}/3</strong>
          <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        {lastReply && (
          <div className="curiosity-feedback ok" role="status" aria-live="polite">
            ☕ Leo: “{lastReply}”
          </div>
        )}

        {!done ? (
          <>
            <div className="travel-barista-bubble">
              <span>☕</span>
              <span>“{turn.baristaLine}”</span>
              <button
                type="button"
                className="curiosity-icon-btn"
                aria-label="Hear Leo"
                onClick={() => speakEnglish(turn.baristaLine)}
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
            <span>🎉 You ordered in English like a traveler!</span>
            <button type="button" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
