import { CONCEPT_VISUALS } from '../content/lesson1Cafe';
import { getContrastPartner, STAGE_RANK } from '../domain/constellation';
import type { ConceptId, ConceptNode } from '../domain/types';
import { PourIcon } from './PourIcon';

function renderConceptIcon(id: ConceptId, symbol: string) {
  return id === 'pour' ? <PourIcon /> : symbol;
}

interface SensoryCardProps {
  node: ConceptNode | null;
  isListening: boolean;
  onReplayAudio: (id: ConceptId) => void;
  onSelectConcept: (id: ConceptId) => void;
  onGoToCafe: () => void;
  onQuickEcho: (id: ConceptId) => void;
  onClose: () => void;
}

export function SensoryCard({
  node,
  isListening,
  onReplayAudio,
  onSelectConcept,
  onGoToCafe,
  onQuickEcho,
  onClose,
}: SensoryCardProps) {
  if (!node) return null;

  const visual = CONCEPT_VISUALS[node.id];
  const contrastId = getContrastPartner(node.id);
  const contrastVisual = contrastId ? CONCEPT_VISUALS[contrastId] : null;
  const rank = STAGE_RANK[node.stage];

  return (
    <div className="sensory-card" role="dialog" aria-label={node.id}>
      <div className="sensory-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: '999px',
              background: visual.color,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            {renderConceptIcon(node.id, visual.iconSymbol)}
          </span>
          <div className="stage-dots" aria-label={node.stage}>
            {[1, 2, 3].map((level) => (
              <span key={level} className={`stage-dot ${rank >= level ? 'lit' : ''}`} />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Close"
          onClick={onClose}
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.14)', color: '#fff' }}
        >
          ✕
        </button>
      </div>

      <div className="sensory-row">
        <button
          type="button"
          className="icon-btn"
          aria-label="Listen"
          onClick={() => onReplayAudio(node.id)}
          style={{ width: 52, height: 52, background: '#f59e0b', color: '#111827', fontSize: 22 }}
        >
          🔊
        </button>

        {contrastVisual && contrastId && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Contrast"
            onClick={() => {
              onSelectConcept(contrastId);
              onReplayAudio(contrastId);
            }}
            style={{
              height: 48,
              padding: '0 14px',
              gap: 8,
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: 20,
            }}
          >
            <span>{renderConceptIcon(node.id, visual.iconSymbol)}</span>
            <span>↔</span>
            <span>{renderConceptIcon(contrastId, contrastVisual.iconSymbol)}</span>
          </button>
        )}

        <button
          type="button"
          className="icon-btn"
          aria-label="Echo"
          onClick={() => onQuickEcho(node.id)}
          style={{
            width: 52,
            height: 52,
            background: isListening ? '#10b981' : 'rgba(16,185,129,0.28)',
            color: '#fff',
            fontSize: 22,
          }}
        >
          🎙
        </button>

        <button
          type="button"
          className="icon-btn"
          aria-label="Cafe"
          onClick={onGoToCafe}
          style={{
            width: 48,
            height: 48,
            background: 'rgba(255,255,255,0.14)',
            color: '#fff',
            fontSize: 20,
          }}
        >
          🏠
        </button>
      </div>
    </div>
  );
}
