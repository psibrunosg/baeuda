import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  checkCuriosityAnswer,
  getCuriosityChoices,
  maskWordHint,
  type CuriosityItem,
} from '../domain/curiosityCatalog';
import type { SpeechKey } from '../domain/types';
import { playSoftErrorTone, playSuccessChime } from '../services/soundEngine';

interface CuriosityModalProps {
  item: CuriosityItem;
  onPlayAudio: (key: SpeechKey) => void;
  onSolved: (item: CuriosityItem) => void;
  onClose: () => void;
}

export function CuriosityModal({
  item,
  onPlayAudio,
  onSolved,
  onClose,
}: CuriosityModalProps) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'try_again'>('idle');
  const [wrongCount, setWrongCount] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [listening, setListening] = useState(false);

  const choices = useMemo(() => getCuriosityChoices(item), [item]);

  useEffect(() => {
    setInput('');
    setStatus('idle');
    setWrongCount(0);
    setShowChoices(false);
    setListening(false);
  }, [item.id]);

  const evaluate = (value: string) => {
    if (checkCuriosityAnswer(item, value)) {
      setStatus('correct');
      playSuccessChime();
      onPlayAudio(item.speechKey);
      onSolved(item);
    } else {
      setWrongCount((c) => c + 1);
      setStatus('try_again');
      setShowChoices(true);
      playSoftErrorTone();
      onPlayAudio(item.speechKey);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    evaluate(input);
  };

  const handleSpeak = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      onPlayAudio(item.speechKey);
      setShowChoices(true);
      setStatus('try_again');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 2;
      setListening(true);
      rec.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript ?? '';
        setInput(transcript);
        setListening(false);
        evaluate(transcript);
      };
      rec.onerror = () => {
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
      };
      rec.start();
    } catch {
      setListening(false);
      onPlayAudio(item.speechKey);
    }
  };

  return (
    <div className="curiosity-card" role="dialog" aria-modal="true" aria-label={item.question}>
      <div className="curiosity-top">
        <span className="curiosity-icon" aria-hidden="true">
          {item.icon}
        </span>
        <div className="curiosity-heading">
          <div className="curiosity-question">{item.question}</div>
          {status === 'correct' && (
            <div className="curiosity-feedback ok" role="status" aria-live="polite">
              ✓ {item.canonicalAnswer}!
            </div>
          )}
          {status === 'try_again' && (
            <div className="curiosity-feedback hint" role="status" aria-live="polite">
              🔊 {wrongCount >= 2 ? `Try: ${item.canonicalAnswer}` : `Hint: ${maskWordHint(item.canonicalAnswer)}`}
            </div>
          )}
        </div>
        <button
          type="button"
          className="curiosity-icon-btn"
          aria-label="Show word hints"
          aria-pressed={showChoices}
          onClick={() => setShowChoices((v) => !v)}
        >
          💡
        </button>
        <button
          type="button"
          className="curiosity-icon-btn"
          aria-label="Hear word"
          onClick={() => onPlayAudio(item.speechKey)}
        >
          🔊
        </button>
        <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>

      {showChoices && status !== 'correct' && (
        <div className="curiosity-choices">
          {choices.map((word) => (
            <button
              key={word}
              type="button"
              className="curiosity-choice-chip"
              onClick={() => {
                setInput(word);
                evaluate(word);
              }}
            >
              {word}
            </button>
          ))}
        </div>
      )}

      <form className="curiosity-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="curiosity-input"
          aria-label="Type your answer in English"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder="Type in English..."
          autoFocus
        />
        <button
          type="button"
          className={`curiosity-mic-btn ${listening ? 'listening' : ''}`}
          aria-label="Speak answer"
          aria-pressed={listening}
          onClick={handleSpeak}
        >
          🎤
        </button>
        <button type="submit" className="curiosity-submit-btn" aria-label="Check answer">
          ✓
        </button>
      </form>
    </div>
  );
}
