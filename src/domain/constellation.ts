import type {
  AcquisitionStage,
  ConceptId,
  ConceptNode,
  ConstellationEdge,
  LocationId,
} from './types';

export const LESSON1_CONCEPTS: readonly ConceptId[] = [
  'cup',
  'coffee',
  'water',
  'hot',
  'cold',
  'pour',
] as const;

export const LESSON1_EDGES: readonly ConstellationEdge[] = [
  { from: 'cup', to: 'coffee', kind: 'situational' },
  { from: 'cup', to: 'water', kind: 'situational' },
  { from: 'coffee', to: 'pour', kind: 'situational' },
  { from: 'water', to: 'pour', kind: 'situational' },
  { from: 'coffee', to: 'hot', kind: 'situational' },
  { from: 'water', to: 'cold', kind: 'situational' },
  { from: 'hot', to: 'cold', kind: 'contrast' },
] as const;

export const STAGE_RANK: Record<AcquisitionStage, number> = {
  seed: 1,
  root: 2,
  voice: 3,
};

export function promoteStage(
  current: AcquisitionStage | undefined,
  next: AcquisitionStage,
): AcquisitionStage {
  if (!current) return next;
  return STAGE_RANK[next] > STAGE_RANK[current] ? next : current;
}

export function upsertConceptNode(
  constellation: Partial<Record<ConceptId, ConceptNode>>,
  conceptId: ConceptId,
  nextStage: AcquisitionStage,
  neededHint: boolean,
  originLocation: LocationId,
  nowIso: string,
): Partial<Record<ConceptId, ConceptNode>> {
  const existing = constellation[conceptId];
  return {
    ...constellation,
    [conceptId]: {
      id: conceptId,
      stage: promoteStage(existing?.stage, nextStage),
      originLocation: existing?.originLocation ?? originLocation,
      neededHint,
      lastContactAt: nowIso,
    },
  };
}

export function getContrastPartner(conceptId: ConceptId): ConceptId | null {
  for (const edge of LESSON1_EDGES) {
    if (edge.kind !== 'contrast') continue;
    if (edge.from === conceptId) return edge.to;
    if (edge.to === conceptId) return edge.from;
  }
  return null;
}
