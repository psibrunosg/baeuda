import type { LessonPhase } from '../domain/lessonEngine';
import type { ActiveView } from '../scene/ExperienceCanvas';
import { PourIcon } from './PourIcon';

interface LessonHudProps {
  activeView: ActiveView;
  phase: LessonPhase;
  awaitingInput: boolean;
  pourProgress: number;
  isListening: boolean;
  voiceLevel: number;
  onStartCafe: () => void;
  onRequestHelp: () => void;
  onStartMic: () => void;
  onSilentWave: () => void;
  onHoldPourStart: () => void;
  onHoldPourEnd: () => void;
}

export function LessonHud({
  activeView,
  phase,
  awaitingInput,
  pourProgress,
  isListening,
  voiceLevel,
  onStartCafe,
  onRequestHelp,
  onStartMic,
  onSilentWave,
  onHoldPourStart,
  onHoldPourEnd,
}: LessonHudProps) {
  if (activeView === 'map') {
    return (
      <div className="hud-bottom-center">
        <button
          type="button"
          className="icon-btn play-btn"
          aria-label="Enter"
          onClick={onStartCafe}
        >
          ▶
        </button>
      </div>
    );
  }

  if (activeView !== 'lesson') return null;

  const ringDegrees = Math.round(pourProgress * 360);

  return (
    <>
      {phase === 'action_pour' && awaitingInput && (
        <div className="hud-bottom-center">
          <button
            type="button"
            className="icon-btn pour-ring"
            aria-label="Pour"
            style={{
              background: `conic-gradient(#ea580c ${ringDegrees}deg, rgba(255,250,242,0.88) ${ringDegrees}deg)`,
            }}
            onPointerDown={onHoldPourStart}
            onPointerUp={onHoldPourEnd}
            onPointerLeave={onHoldPourEnd}
            onPointerCancel={onHoldPourEnd}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault();
                onHoldPourStart();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onHoldPourEnd();
              }
            }}
          >
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: '999px',
                background: 'rgba(255,250,242,0.94)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PourIcon />
            </span>
          </button>
        </div>
      )}

      {phase === 'micro_echo' && awaitingInput && (
        <div className="hud-bottom-center">
          <button
            type="button"
            className="icon-btn mic-btn"
            aria-label="Speak"
            onClick={onStartMic}
            style={{
              transform: isListening ? `scale(${1 + voiceLevel * 0.25})` : undefined,
              boxShadow: isListening
                ? `0 0 ${14 + voiceLevel * 28}px rgba(16, 185, 129, 0.9)`
                : undefined,
            }}
          >
            🎙
          </button>
          <button
            type="button"
            className="icon-btn wave-btn"
            aria-label="Continue"
            onClick={onSilentWave}
          >
            👋
          </button>
        </div>
      )}

      {awaitingInput && (
        <button
          type="button"
          className="icon-btn help-btn"
          aria-label="Help"
          onClick={onRequestHelp}
        >
          ?
        </button>
      )}
    </>
  );
}
