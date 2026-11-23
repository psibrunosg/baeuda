import type { ActiveView } from '../scene/ExperienceCanvas';

interface TopNavProps {
  activeView: ActiveView;
  starCount: number;
  immersionSeconds: number;
  timeOfDay?: 'day' | 'night';
  onToggleTimeOfDay?: () => void;
  onSelectView: (view: 'map' | 'constellation') => void;
}

function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TopNav({
  activeView,
  starCount,
  immersionSeconds,
  timeOfDay = 'day',
  onToggleTimeOfDay,
  onSelectView,
}: TopNavProps) {
  return (
    <nav className="top-nav" aria-label="Navigation">
      {activeView === 'map' && onToggleTimeOfDay && (
        <button
          type="button"
          className="icon-btn time-toggle-btn"
          aria-label={timeOfDay === 'day' ? 'Night' : 'Day'}
          onClick={onToggleTimeOfDay}
        >
          {timeOfDay === 'day' ? '🌙' : '☀️'}
        </button>
      )}

      <div className="clock-pill" aria-label="Immersion time">
        <span aria-hidden="true">⏱</span>
        <span>{formatClock(immersionSeconds)}</span>
      </div>

      <div className="pill-toggle">
        <button
          type="button"
          className={activeView !== 'constellation' ? 'active' : ''}
          aria-label="Map"
          onClick={() => onSelectView('map')}
        >
          🗺
        </button>
        <button
          type="button"
          className={activeView === 'constellation' ? 'active' : ''}
          aria-label="Constellation"
          onClick={() => onSelectView('constellation')}
        >
          ✨
          {starCount > 0 && <span className="star-badge">{starCount}</span>}
        </button>
      </div>
    </nav>
  );
}
