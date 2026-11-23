import type { ActiveView, CameraMode } from '../scene/ExperienceCanvas';

interface TopNavProps {
  activeView: ActiveView;
  cameraMode?: CameraMode;
  starCount: number;
  immersionSeconds: number;
  onSelectView: (view: 'map' | 'badges') => void;
  onCycleCameraMode?: () => void;
}

function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TopNav({
  activeView,
  cameraMode = 'third_person',
  starCount,
  immersionSeconds,
  onSelectView,
  onCycleCameraMode,
}: TopNavProps) {
  const cameraIcon =
    cameraMode === 'first_person' ? '👁' : cameraMode === 'overview' ? '🛰' : '🚶';

  return (
    <nav className="top-nav" aria-label="Navigation">
      <div className="clock-pill" aria-label="Immersion time">
        <span aria-hidden="true">⏱</span>
        <span>{formatClock(immersionSeconds)}</span>
      </div>

      {activeView === 'map' && onCycleCameraMode && (
        <button
          type="button"
          className="icon-btn time-toggle-btn"
          aria-label="Camera view"
          onClick={onCycleCameraMode}
        >
          {cameraIcon}
        </button>
      )}

      <div className="pill-toggle">
        <button
          type="button"
          className={activeView !== 'badges' ? 'active' : ''}
          aria-label="Map"
          onClick={() => onSelectView('map')}
        >
          🗺
        </button>
        <button
          type="button"
          className={activeView === 'badges' ? 'active' : ''}
          aria-label="Badges"
          onClick={() => onSelectView('badges')}
        >
          🏆
          {starCount > 0 && <span className="star-badge">{starCount}</span>}
        </button>
      </div>
    </nav>
  );
}
