import { useState } from 'react';
import type { LessonPhase } from '../domain/lessonEngine';
import type { AudioStatus } from '../services/audioPlayer';
import type { AssetMode } from '../scene/contracts';

interface DebugAudioBarProps {
  audioStatus: AudioStatus;
  phase: LessonPhase;
  assetMode: AssetMode;
  onToggleAssetMode: () => void;
  onJumpPhase: (phase: LessonPhase) => void;
  onSimulateVoice: () => void;
  onResetProfile: () => void;
}

const PHASES: readonly LessonPhase[] = [
  'map_arrival',
  'counter_intro',
  'thermal_contrast',
  'action_pour',
  'personal_choice',
  'micro_echo',
  'farewell_constellation',
];

export function DebugAudioBar({
  audioStatus,
  phase,
  assetMode,
  onToggleAssetMode,
  onJumpPhase,
  onSimulateVoice,
  onResetProfile,
}: DebugAudioBarProps) {
  const [open, setOpen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const showFallbackPill =
    showCaptions && audioStatus.mode === 'fallback' && audioStatus.phrase !== null;

  return (
    <aside className="dev-container">
      <div className="dev-row">
        <button
          type="button"
          className="dev-badge"
          onClick={() => setOpen((v) => !v)}
        >
          DEV · {phase}
        </button>
      </div>

      {showFallbackPill && (
        <div className="dev-caption-pill">
          <div>
            {audioStatus.isPlaying ? '🔊 ' : '✓ '}
            “{audioStatus.phrase}”
          </div>
          <div className="dev-caption-meta">fallback (missing {audioStatus.src})</div>
        </div>
      )}

      {open && (
        <div className="dev-drawer">
          <div className="dev-actions">
            <button type="button" onClick={() => setShowCaptions((v) => !v)}>
              Captions: {showCaptions ? 'ON' : 'OFF'}
            </button>
            <button type="button" onClick={onToggleAssetMode}>
              3D: {assetMode.toUpperCase()}
            </button>
            <button type="button" onClick={onSimulateVoice}>
              Simulate Voice
            </button>
            <button type="button" onClick={onResetProfile}>
              Reset Storage
            </button>
          </div>
          <div className="dev-actions">
            {PHASES.map((p, idx) => (
              <button key={p} type="button" onClick={() => onJumpPhase(p)}>
                {idx + 1}. {p.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
