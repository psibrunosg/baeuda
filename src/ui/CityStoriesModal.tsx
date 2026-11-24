import { useState } from 'react';
import { CITY_STORIES, type CityStoryEpisode, type StoryChoice } from '../domain/cityStories';
import { playRewardFanfare, playSoftErrorTone, playSuccessChime } from '../services/soundEngine';
import { CoinIcon } from './CoinIcon';

function speakStoryLine(text: string, rate = 0.94) {
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
      // ignore restricted environments
    }
  }
}

interface CityStoriesModalProps {
  completedStoryIds: readonly string[];
  onCompleteStory: (story: CityStoryEpisode) => void;
  onClose: () => void;
}

export function CityStoriesModal({
  completedStoryIds,
  onCompleteStory,
  onClose,
}: CityStoriesModalProps) {
  const [activeStory, setActiveStory] = useState<CityStoryEpisode | null>(null);
  const [visibleCount, setVisibleCount] = useState(1);
  const [questionSolved, setQuestionSolved] = useState(false);
  const [choiceFeedback, setChoiceFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [finished, setFinished] = useState(false);

  const openStory = (story: CityStoryEpisode) => {
    setActiveStory(story);
    setVisibleCount(1);
    setQuestionSolved(false);
    setChoiceFeedback(null);
    setFinished(false);
    if (story.steps[0]) {
      speakStoryLine(story.steps[0].line, 0.94);
    }
  };

  const currentStep = activeStory ? activeStory.steps[visibleCount - 1] : null;
  const needsQuestion = Boolean(currentStep?.question && currentStep.choices && !questionSolved);

  const handleChoice = (choice: StoryChoice) => {
    setChoiceFeedback({ text: choice.feedback, ok: choice.isCorrect });
    if (choice.isCorrect) {
      playSuccessChime();
      setQuestionSolved(true);
    } else {
      playSoftErrorTone();
    }
  };

  const handleNext = () => {
    if (!activeStory) return;
    if (visibleCount >= activeStory.steps.length) {
      playRewardFanfare();
      setFinished(true);
      onCompleteStory(activeStory);
      return;
    }
    const nextCount = visibleCount + 1;
    setVisibleCount(nextCount);
    setQuestionSolved(false);
    setChoiceFeedback(null);
    const nextStep = activeStory.steps[nextCount - 1];
    if (nextStep) speakStoryLine(nextStep.line, 0.94);
  };

  return (
    <section
      className="badges-hub-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Baeuda Neighborhood Stories"
    >
      <div className="badges-hub-panel practice-panel">
        {!activeStory ? (
          <>
            <header className="badges-hub-header">
              <strong style={{ fontSize: 16 }}>📖 Baeuda Stories · Neighborhood Episodes</strong>
              <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
                ✕
              </button>
            </header>
            <div className="story-picker-list">
              {CITY_STORIES.map((story) => {
                const done = completedStoryIds.includes(story.id);
                return (
                  <button
                    key={story.id}
                    type="button"
                    className={`practice-unit-card ${done ? 'done' : ''}`}
                    onClick={() => openStory(story)}
                  >
                    <div className="practice-unit-top">
                      <span className="practice-unit-icon" aria-hidden="true">{story.icon}</span>
                      <span className="cefr-pill-tag">{story.cefrTag}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {done ? '✓ Read' : (
                          <>
                            <CoinIcon size={13} /> +{story.rewardCoins}
                          </>
                        )}
                      </span>
                    </div>
                    <strong className="practice-unit-title">{story.title}</strong>
                    <span className="practice-unit-desc">{story.teaser}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <header className="practice-session-header">
              <button
                type="button"
                className="badges-close-btn"
                aria-label="Back to stories"
                onClick={() => setActiveStory(null)}
              >
                ←
              </button>
              <strong style={{ flex: 1, fontSize: 15 }}>
                {activeStory.icon} {activeStory.title} ({activeStory.cefrTag})
              </strong>
              <button type="button" className="badges-close-btn" aria-label="Close" onClick={onClose}>
                ✕
              </button>
            </header>

            <div className="story-feed">
              {activeStory.steps.slice(0, visibleCount).map((step) => (
                <div key={step.id} className="story-bubble">
                  <div className="story-bubble-head">
                    <span aria-hidden="true">{step.speakerIcon}</span>
                    <strong>{step.speakerName}</strong>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="story-mini-audio"
                        aria-label="Listen"
                        onClick={() => speakStoryLine(step.line, 0.94)}
                      >
                        🔊
                      </button>
                      <button
                        type="button"
                        className="story-mini-audio"
                        aria-label="Listen slowly"
                        onClick={() => speakStoryLine(step.line, 0.7)}
                      >
                        🐢
                      </button>
                    </div>
                  </div>
                  <p className="story-bubble-line">“{step.line}”</p>
                </div>
              ))}
            </div>

            {!finished && currentStep?.question && currentStep.choices && (
              <div className="story-question-box">
                <div className="story-question-title">❓ {currentStep.question}</div>
                <div className="practice-options-list">
                  {currentStep.choices.map((ch) => (
                    <button
                      key={ch.label}
                      type="button"
                      className="practice-option-card"
                      disabled={questionSolved}
                      onClick={() => handleChoice(ch)}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
                {choiceFeedback && (
                  <div className={`practice-feedback-bar ${choiceFeedback.ok ? 'correct' : 'wrong'}`}>
                    <strong>{choiceFeedback.ok ? '✨ ' : '💡 '}{choiceFeedback.text}</strong>
                  </div>
                )}
              </div>
            )}

            {!finished ? (
              <button
                type="button"
                className="practice-primary-btn"
                disabled={needsQuestion}
                onClick={handleNext}
              >
                {visibleCount >= activeStory.steps.length ? 'Finish Story →' : 'Continue →'}
              </button>
            ) : (
              <div className="game-win-banner">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🎉 Story complete! <CoinIcon size={15} /> +{activeStory.rewardCoins}
                </span>
                <button type="button" onClick={() => setActiveStory(null)}>
                  More Stories
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
