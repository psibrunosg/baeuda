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

export const CAFE_EXTENDED_CONCEPTS: readonly ConceptId[] = [
  'milk',
  'sugar',
  'cake',
  'sweet',
  'more',
  'one',
  'two',
  'full',
  'empty',
  'plate',
  'next_to',
  'coin',
  'like',
] as const;

export const LESSON2_CONCEPTS: readonly ConceptId[] = [
  'apple',
  'bread',
  'big',
  'small',
] as const;

export const LESSON3_CONCEPTS: readonly ConceptId[] = [
  'music',
  'bird',
  'fast',
  'slow',
] as const;

export const ALL_CONCEPTS: readonly ConceptId[] = [
  ...LESSON1_CONCEPTS,
  ...CAFE_EXTENDED_CONCEPTS,
  ...LESSON2_CONCEPTS,
  ...LESSON3_CONCEPTS,
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

export const ALL_CONSTELLATION_EDGES: readonly ConstellationEdge[] = [
  ...LESSON1_EDGES,
  // Café Pre-A1 extended & A1 spiral edges
  { from: 'coffee', to: 'milk', kind: 'situational' },
  { from: 'milk', to: 'sugar', kind: 'situational' },
  { from: 'sugar', to: 'sweet', kind: 'situational' },
  { from: 'sweet', to: 'cake', kind: 'situational' },
  { from: 'pour', to: 'full', kind: 'situational' },
  { from: 'full', to: 'empty', kind: 'contrast' },
  { from: 'one', to: 'two', kind: 'situational' },
  { from: 'cake', to: 'plate', kind: 'situational' },
  { from: 'plate', to: 'next_to', kind: 'situational' },
  { from: 'coin', to: 'like', kind: 'situational' },
  // Lesson 2: Local Market
  { from: 'cup', to: 'apple', kind: 'narrative' },
  { from: 'apple', to: 'bread', kind: 'situational' },
  { from: 'apple', to: 'big', kind: 'situational' },
  { from: 'apple', to: 'small', kind: 'situational' },
  { from: 'big', to: 'small', kind: 'contrast' },
  // Lesson 3: Central Plaza
  { from: 'water', to: 'bird', kind: 'narrative' },
  { from: 'bird', to: 'music', kind: 'situational' },
  { from: 'music', to: 'fast', kind: 'situational' },
  { from: 'music', to: 'slow', kind: 'situational' },
  { from: 'fast', to: 'slow', kind: 'contrast' },
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
  for (const edge of ALL_CONSTELLATION_EDGES) {
    if (edge.kind !== 'contrast') continue;
    if (edge.from === conceptId) return edge.to;
    if (edge.to === conceptId) return edge.from;
  }
  return null;
}
