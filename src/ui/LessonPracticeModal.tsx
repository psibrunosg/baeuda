import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildMistakeExercises,
  checkPracticeAnswer,
  computeLessonRewards,
  evaluateSpokenWords,
  PRACTICE_UNITS,
  type PracticeExercise,
} from '../domain/practiceLessons';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';
import { CoinIcon } from './CoinIcon';

interface SpeechRecLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function speakLine(text: string, rate = 0.95) {
  if (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  ) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = rate;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore restricted speechSynthesis environments
    }
  }
}

export interface PracticeCompletionPayload {
  unitId: string | null;
  coinsEarned: number;
  xpEarned: number;
  accuracy: number;
  newMistakeIds: string[];
  clearedMistakeIds: string[];
}

interface LessonPracticeModalProps {
  completedUnitIds: readonly string[];
  mistakeExerciseIds: readonly string[];
  onCompleteSession: (payload: PracticeCompletionPayload) => void;
  onClose: () => void;
}

export function LessonPracticeModal({
  completedUnitIds,
  mistakeExerciseIds,
  onCompleteSession,
  onClose,
}: LessonPracticeModalProps) {
  const [activeUnitId, setActiveUnitId] = useState<string | 'mistakes' | null>(null);
  const [queue, setQueue] = useState<PracticeExercise[]>([]);
  const [cursor, setCursor] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [sessionMistakes, setSessionMistakes] = useState<string[]>([]);
  const [sessionCleared, setSessionCleared] = useState<string[]>([]);
  const [combo, setCombo] = useState(0);
  const [startMs, setStartMs] = useState(() => Date.now());

  // Per-exercise interaction state
  const [selectedTileIndices, setSelectedTileIndices] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spokenText, setSpokenText] = useState('');
  const [listening, setListening] = useState(false);
  const [checkedStatus, setCheckedStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [summary, setSummary] = useState<{
    accuracy: number;
    coinsEarned: number;
    xpEarned: number;
    seconds: number;
  } | null>(null);

  const recRef = useRef<SpeechRecLike | null>(null);
  const current = queue[cursor] ?? null;

  const stopMic = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    recRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stopMic(), [stopMic]);

  const resetExerciseInputs = useCallback(() => {
    stopMic();
    setSelectedTileIndices([]);
    setSelectedOption(null);
    setSpokenText('');
    setCheckedStatus('idle');
  }, [stopMic]);

  const startSession = useCallback(
    (unitOrMistakes: string | 'mistakes') => {
      const exercises =
        unitOrMistakes === 'mistakes'
          ? buildMistakeExercises(mistakeExerciseIds)
          : [...(PRACTICE_UNITS.find((u) => u.id === unitOrMistakes)?.exercises ?? [])];
      if (exercises.length === 0) return;

      setActiveUnitId(unitOrMistakes);
      setQueue(exercises);
      setCursor(0);
      setInitialTotal(exercises.length);
      setFirstTryCorrect(0);
      setSeenIds(new Set());
      setSessionMistakes([]);
      setSessionCleared([]);
      setCombo(0);
      setStartMs(Date.now());
      setSummary(null);
      resetExerciseInputs();
      speakLine(exercises[0].audioText, 0.95);
    },
    [mistakeExerciseIds, resetExerciseInputs],
  );

  // Deterministic option shuffle for fill_blank & listen_choose
  const shuffledOptions = useMemo(() => {
    if (!current?.options) return [];
    const arr = [...current.options];
    let seed = current.id.charCodeAt(0) * 29 + current.id.length * 13 + cursor * 7;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [current, cursor]);

  const currentAnswerText = useMemo(() => {
    if (!current) return '';
    if (current.kind === 'word_bank') {
      return selectedTileIndices.map((idx) => current.wordTiles?.[idx] ?? '').join(' ');
    }
    if (current.kind === 'speak_aloud') return spokenText;
    return selectedOption ?? '';
  }, [current, selectedOption, selectedTileIndices, spokenText]);

  const spokenEval = useMemo(() => {
    if (!current || current.kind !== 'speak_aloud') return null;
    return evaluateSpokenWords(current.targetAnswer, spokenText);
  }, [current, spokenText]);

  const handleCheck = useCallback(
    (overrideAnswer?: string) => {
      if (!current || checkedStatus !== 'idle') return;
      stopMic();
      const answer = overrideAnswer ?? currentAnswerText;
      const ok = checkPracticeAnswer(current, answer);
      const isFirstAttempt = !seenIds.has(current.id);
      setSeenIds((prev) => new Set(prev).add(current.id));

      if (ok) {
        playSuccessChime();
        setCheckedStatus('correct');
        setCombo((c) => c + 1);
        if (isFirstAttempt) {
          setFirstTryCorrect((n) => n + 1);
        }
        setSessionCleared((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
      } else {
        playSoftErrorTone();
        setCheckedStatus('wrong');
        setCombo(0);
        setSessionMistakes((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
        // Re-queue missed exercise at the end of the session (Duolingo-style mastery loop)
        setQueue((prev) => [...prev, current]);
      }
    },
    [checkedStatus, current, currentAnswerText, seenIds, stopMic],
  );

  const handleContinue = useCallback(() => {
    if (!current) return;
    if (cursor + 1 >= queue.length) {
      const rewards = computeLessonRewards(initialTotal, firstTryCorrect);
      const seconds = Math.max(5, Math.round((Date.now() - startMs) / 1000));
      playRewardFanfare();
      setSummary({ ...rewards, seconds });
      onCompleteSession({
        unitId: activeUnitId === 'mistakes' ? null : activeUnitId,
        coinsEarned: rewards.coinsEarned,
        xpEarned: rewards.xpEarned,
        accuracy: rewards.accuracy,
        newMistakeIds: sessionMistakes,
        clearedMistakeIds: sessionCleared.filter((id) => !sessionMistakes.includes(id)),
      });
      return;
    }
    const nextIdx = cursor + 1;
    setCursor(nextIdx);
    resetExerciseInputs();
    const nextEx = queue[nextIdx];
    if (nextEx) speakLine(nextEx.audioText, 0.95);
  }, [
    activeUnitId,
    current,
    cursor,
    firstTryCorrect,
    initialTotal,
    onCompleteSession,
    queue,
    resetExerciseInputs,
    sessionCleared,
    sessionMistakes,
    startMs,
  ]);

  const handleStartSpeakMic = () => {
    if (listening) {
      stopMic();
      return;
    }
    const SpeechRecCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecLike })
        .webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      setSpokenText(current?.targetAnswer ?? '');
      return;
    }

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const latest = event.results[event.results.length - 1]?.[0]?.transcript ?? '';
        setSpokenText(latest);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const progressPct =
    queue.length > 0 ? Math.min(100, Math.round(((cursor + (checkedStatus !== 'idle' ? 1 : 0)) / queue.length) * 100)) : 0;

  return (
    <section
      className="badges-hub-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive English Practice"
    >
      <div className="badges-hub-panel practice-panel">
        {/* UNIT PICKER VIEW */}
        {!activeUnitId && (
          <>
            <header className="badges-hub-header">
              <strong style={{ fontSize: 16 }}>⚡ Interactive Practice · Units</strong>
              <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
                ✕
              </button>
            </header>

            {mistakeExerciseIds.length > 0 && (
              <button
                type="button"
                className="practice-mistakes-banner"
                onClick={() => startSession('mistakes')}
              >
                <span>🩹 Mistakes Lab · Review {mistakeExerciseIds.length} missed item(s)</span>
                <strong>Practice →</strong>
              </button>
            )}

            <div className="practice-units-grid">
              {PRACTICE_UNITS.map((unit) => {
                const done = completedUnitIds.includes(unit.id);
                return (
                  <button
                    key={unit.id}
                    type="button"
                    className={`practice-unit-card ${done ? 'done' : ''}`}
                    onClick={() => startSession(unit.id)}
                  >
                    <div className="practice-unit-top">
                      <span className="practice-unit-icon" aria-hidden="true">{unit.icon}</span>
                      <span className="cefr-pill-tag">{unit.cefrTag}</span>
                      {done && <span className="practice-done-chip">✓ Done</span>}
                    </div>
                    <strong className="practice-unit-title">{unit.title}</strong>
                    <span className="practice-unit-desc">{unit.description}</span>
                    <span className="practice-unit-meta">
                      4 challenges · Word Bank · Listen · Speak
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* SUMMARY CELEBRATION VIEW */}
        {activeUnitId && summary && (
          <div className="practice-summary">
            <div className="practice-summary-trophy" aria-hidden="true">🏆</div>
            <h2 style={{ margin: '4px 0 2px', fontSize: 22 }}>Lesson Complete!</h2>
            <p style={{ margin: '0 0 14px', color: '#57534e', fontSize: 13 }}>
              Great work building active recall and spoken confidence!
            </p>
            <div className="practice-summary-stats">
              <div className="practice-stat-box">
                <span className="practice-stat-label">Accuracy</span>
                <strong>{summary.accuracy}%</strong>
              </div>
              <div className="practice-stat-box">
                <span className="practice-stat-label">Coins</span>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CoinIcon size={16} /> +{summary.coinsEarned}
                </strong>
              </div>
              <div className="practice-stat-box">
                <span className="practice-stat-label">Time</span>
                <strong>{summary.seconds}s</strong>
              </div>
            </div>
            <div className="practice-summary-actions">
              <button
                type="button"
                className="practice-primary-btn"
                onClick={() => {
                  setActiveUnitId(null);
                  setSummary(null);
                }}
              >
                Choose Next Unit
              </button>
              <button type="button" className="practice-secondary-btn" onClick={onClose}>
                Back to City
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE EXERCISE VIEW */}
        {activeUnitId && !summary && current && (
          <>
            <header className="practice-session-header">
              <button
                type="button"
                className="badges-close-btn"
                aria-label="Back to units"
                onClick={() => {
                  stopMic();
                  setActiveUnitId(null);
                }}
              >
                ←
              </button>
              <div className="practice-progress-track" aria-label="Lesson progress">
                <div className="practice-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              {combo >= 2 && <span className="practice-combo-pill">🔥 x{combo}</span>}
              <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
                ✕
              </button>
            </header>

            <div className="practice-prompt-card">
              <div className="practice-npc-row">
                <span className="practice-npc-badge" aria-hidden="true">{current.npcIcon}</span>
                <div>
                  <div className="practice-npc-name">{current.npcName}</div>
                  <div className="practice-prompt-text">{current.prompt}</div>
                </div>
              </div>
              <div className="practice-audio-controls">
                <button
                  type="button"
                  className="practice-audio-btn"
                  onClick={() => speakLine(current.audioText, 0.95)}
                >
                  🔊 Listen
                </button>
                <button
                  type="button"
                  className="practice-audio-btn slow"
                  onClick={() => speakLine(current.audioText, 0.7)}
                >
                  🐢 Slow
                </button>
              </div>
            </div>

            {/* 1. WORD BANK */}
            {current.kind === 'word_bank' && (
              <div className="practice-wordbank">
                <div className="practice-answer-slots" aria-label="Your sentence">
                  {selectedTileIndices.length === 0 ? (
                    <span className="practice-slots-placeholder">Tap words below to build the sentence...</span>
                  ) : (
                    selectedTileIndices.map((tileIdx, pos) => (
                      <button
                        key={`${tileIdx}-${pos}`}
                        type="button"
                        className="practice-tile chosen"
                        disabled={checkedStatus !== 'idle'}
                        onClick={() =>
                          setSelectedTileIndices((prev) => prev.filter((_, i) => i !== pos))
                        }
                      >
                        {current.wordTiles?.[tileIdx]}
                      </button>
                    ))
                  )}
                </div>
                <div className="practice-tiles-pool">
                  {(current.wordTiles ?? []).map((word, idx) => {
                    const used = selectedTileIndices.includes(idx);
                    return (
                      <button
                        key={`${word}-${idx}`}
                        type="button"
                        className={`practice-tile ${used ? 'used' : ''}`}
                        disabled={used || checkedStatus !== 'idle'}
                        onClick={() => {
                          speakLine(word, 1.0);
                          setSelectedTileIndices((prev) => [...prev, idx]);
                        }}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. FILL IN THE BLANK */}
            {current.kind === 'fill_blank' && (
              <div className="practice-choice-area">
                <div className="practice-blank-sentence">
                  {(current.sentenceWithBlank ?? '').replace('___', selectedOption ?? '______')}
                </div>
                <div className="practice-options-list">
                  {shuffledOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`practice-option-card ${selectedOption === opt ? 'selected' : ''}`}
                      disabled={checkedStatus !== 'idle'}
                      onClick={() => {
                        setSelectedOption(opt);
                        speakLine(opt, 0.95);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. LISTEN & CHOOSE */}
            {current.kind === 'listen_choose' && (
              <div className="practice-options-list">
                {shuffledOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`practice-option-card ${selectedOption === opt ? 'selected' : ''}`}
                    disabled={checkedStatus !== 'idle'}
                    onClick={() => setSelectedOption(opt)}
                  >
                    “{opt}”
                  </button>
                ))}
              </div>
            )}

            {/* 4. SPEAK ALOUD (word-by-word highlight) */}
            {current.kind === 'speak_aloud' && (
              <div className="practice-speak-area">
                <div className="practice-speak-words">
                  {(spokenEval?.words ?? []).map((w, idx) => (
                    <span
                      key={`${w.word}-${idx}`}
                      className={`practice-speak-word ${w.matched ? 'matched' : ''}`}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
                <div className="practice-speak-actions">
                  <button
                    type="button"
                    className={`practice-mic-btn ${listening ? 'listening' : ''}`}
                    disabled={checkedStatus !== 'idle'}
                    onClick={handleStartSpeakMic}
                  >
                    {listening ? '⏹ Listening... Tap to stop' : '🎙️ Tap to Speak'}
                  </button>
                  <button
                    type="button"
                    className="practice-skip-mic-btn"
                    disabled={checkedStatus !== 'idle'}
                    onClick={() => handleCheck(current.targetAnswer)}
                  >
                    Can&apos;t speak now · Continue
                  </button>
                </div>
              </div>
            )}

            {/* FEEDBACK / CHECK BAR */}
            {checkedStatus === 'idle' ? (
              <button
                type="button"
                className="practice-primary-btn"
                disabled={!currentAnswerText.trim()}
                onClick={() => handleCheck()}
              >
                Check Answer
              </button>
            ) : (
              <div className={`practice-feedback-bar ${checkedStatus}`} role="status" aria-live="polite">
                <div>
                  <strong>
                    {checkedStatus === 'correct'
                      ? '✨ Great job!'
                      : `Almost! Correct answer: "${current.targetAnswer}"`}
                  </strong>
                  <div className="practice-feedback-tip">{current.tip}</div>
                </div>
                <button type="button" className="practice-primary-btn" onClick={handleContinue}>
                  Continue →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
