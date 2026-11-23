import { getGuidanceCopy, type GuidanceContext } from '../domain/immersion';

interface GuidancePillProps {
  context: GuidanceContext;
  starCount: number;
  darkSurface?: boolean;
}

/**
 * Progressive immersion command coach:
 * starts in simple Portuguese scaffolding (0-2 stars), blends English keywords (3-5 stars),
 * and transitions to concise English-only commands (6+ stars).
 */
export function GuidancePill({
  context,
  starCount,
  darkSurface = false,
}: GuidancePillProps) {
  const copy = getGuidanceCopy(context, starCount);

  return (
    <div
      className={`guidance-pill ${darkSurface ? 'guidance-pill-dark' : ''}`}
      data-immersion-tier={copy.tier}
      role="status"
      aria-live="polite"
    >
      <span className="guidance-dots" aria-hidden="true">
        {[1, 2, 3].map((level) => (
          <span
            key={level}
            className={`guidance-dot ${copy.tierIndex >= level ? 'lit' : ''}`}
          />
        ))}
      </span>
      <span className="guidance-text">
        {copy.segments.map((seg, idx) =>
          seg.highlight ? (
            <strong key={idx} className="guidance-keyword">
              {seg.text}
            </strong>
          ) : (
            <span key={idx}>{seg.text}</span>
          ),
        )}
      </span>
    </div>
  );
}
