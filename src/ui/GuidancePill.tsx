import { getGuidanceCopy, type GuidanceContext } from '../domain/immersion';
import type { NextStepRecommendation, SessionBucket } from '../domain/types';

const BUCKET_LABELS: Record<SessionBucket, string> = {
  spiral: 'Avanço',
  retention: 'Revisão',
  application: 'Aplicação',
};

interface GuidancePillProps {
  context: GuidanceContext;
  starCount: number;
  cefrBadge?: string;
  darkSurface?: boolean;
  nextStep?: NextStepRecommendation;
  onTriggerNextStep?: (step: NextStepRecommendation) => void;
}

/**
 * Progressive immersion command coach:
 * starts in simple Portuguese scaffolding (0-2 stars), blends English keywords (3-5 stars),
 * and transitions to concise English-only commands (6+ stars).
 */
export function GuidancePill({
  context,
  starCount,
  cefrBadge,
  darkSurface = false,
  nextStep,
  onTriggerNextStep,
}: GuidancePillProps) {
  const copy = getGuidanceCopy(context, starCount);
  const showNextAction = Boolean(nextStep && onTriggerNextStep);

  return (
    <div
      className={`guidance-pill ${darkSurface ? 'guidance-pill-dark' : ''} ${
        showNextAction ? 'guidance-pill-has-action' : ''
      }`}
      data-immersion-tier={copy.tier}
      role="status"
      aria-live="polite"
    >
      {cefrBadge && <span className="cefr-pill-tag">{cefrBadge}</span>}
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
      {nextStep && onTriggerNextStep && (
        <button
          type="button"
          className={`guidance-next-btn bucket-${nextStep.bucket}`}
          onClick={() => onTriggerNextStep(nextStep)}
          title={nextStep.reason}
          aria-label={`${BUCKET_LABELS[nextStep.bucket]}: ${nextStep.title}`}
        >
          <span className="guidance-next-bucket">{BUCKET_LABELS[nextStep.bucket]}</span>
          <span className="guidance-next-title">{nextStep.title}</span>
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
