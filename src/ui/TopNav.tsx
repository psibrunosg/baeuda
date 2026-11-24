import type { ActiveView, CameraMode } from '../scene/ExperienceCanvas';
import { CoinIcon } from './CoinIcon';

interface TopNavProps {
  activeView: ActiveView;
  cameraMode?: CameraMode;
  starCount: number;
  immersionSeconds: number;
  coins?: number;
  streakCount?: number;
  onSelectView: (view: 'map' | 'badges') => void;
  onCycleCameraMode?: () => void;
  onOpenWardrobe?: () => void;
}

function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TopNav({
  activeView,
  cameraMode = 'fixed_2_5d',
  starCount,
  immersionSeconds,
  coins,
  streakCount,
  onSelectView,
  onCycleCameraMode,
  onOpenWardrobe,
}: TopNavProps) {
  const cameraIcon = cameraMode === 'overview' ? '🛰' : '🚶';

  return (
    <nav className="top-nav" aria-label="Navigation">
      <div className="hud-status-cluster">
        <div className="hud-stat-item" aria-label="Immersion time">
          <span aria-hidden="true">⏱</span>
          <span>{formatClock(immersionSeconds)}</span>
        </div>

        {typeof streakCount === 'number' && streakCount > 0 && (
          <div className="hud-stat-item streak" aria-label="Daily streak">
            <span aria-hidden="true">🔥</span>
            <span>{streakCount}</span>
          </div>
        )}

        {typeof coins === 'number' && onOpenWardrobe && (
          <button
            type="button"
            className="hud-coin-trigger"
            aria-label="Avatar wardrobe and coins"
            onClick={onOpenWardrobe}
          >
            <CoinIcon size={15} />
            <span>{coins}</span>
          </button>
        )}
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
