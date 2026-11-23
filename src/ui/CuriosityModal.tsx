import { useEffect, useState, type FormEvent } from 'react';
import { checkCuriosityAnswer, type CuriosityItem } from '../domain/curiosityCatalog';
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
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setInput('');
    setStatus('idle');
    setListening(false);
  }, [item.id]);

  const evaluate = (value: string) => {
    if (checkCuriosityAnswer(item, value)) {
      setStatus('correct');
      playSuccessChime();
      onPlayAudio(item.speechKey);
      onSolved(item);
    } else {
      setStatus('try_again');
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
      // Honest degradation when browser lacks Web Speech API: play audio & hint without faking pass
      onPlayAudio(item.speechKey);
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
    <div className="curiosity-card" role="dialog" aria-label={item.question}>
      <div className="curiosity-top">
        <span className="curiosity-icon" aria-hidden="true">
          {item.icon}
        </span>
        <div className="curiosity-heading">
          <div className="curiosity-question">{item.question}</div>
          {status === 'correct' && (
            <div className="curiosity-feedback ok">✓ {item.canonicalAnswer}!</div>
          )}
          {status === 'try_again' && (
            <div className="curiosity-feedback hint">🔊 Listen &amp; try: {item.canonicalAnswer}</div>
          )}
        </div>
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

      <form className="curiosity-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="curiosity-input"
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
