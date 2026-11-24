import type {
  AcquisitionStage,
  ConceptId,
  ConceptNode,
  ConstellationEdge,
  LocationId,
  PedagogicalMode,
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
  fluent: 4,
};

export interface UpsertConceptOptions {
  contextId?: string;
  mode?: PedagogicalMode;
  succeeded?: boolean;
  reviewCount?: number;
  intervalHours?: number;
}

export function promoteStage(
  current: AcquisitionStage | undefined,
  next: AcquisitionStage,
): AcquisitionStage {
  if (!current) return next;
  return STAGE_RANK[next] > STAGE_RANK[current] ? next : current;
}

/**
 * A concept qualifies for promotion to `fluent` when it has already reached `voice`
 * and is used correctly without a hint in a distinct new context (spiral transfer).
 */
export function canPromoteToFluent(
  existing: ConceptNode | undefined,
  contextId: string | undefined,
  neededHint: boolean,
  succeeded = true,
): boolean {
  if (!existing || !succeeded || neededHint || !contextId) return false;
  if (STAGE_RANK[existing.stage] < STAGE_RANK.voice) return false;
  if (existing.stage === 'fluent') return true;
  const seen = existing.contextsSeen ?? [];
  if (seen.length > 0) {
    return !seen.includes(contextId);
  }
  return contextId !== existing.originLocation;
}

export function upsertConceptNode(
  constellation: Partial<Record<ConceptId, ConceptNode>>,
  conceptId: ConceptId,
  nextStage: AcquisitionStage,
  neededHint: boolean,
  originLocation: LocationId,
  nowIso: string,
  options?: UpsertConceptOptions,
): Partial<Record<ConceptId, ConceptNode>> {
  const existing = constellation[conceptId];
  const succeeded = options?.succeeded ?? true;
  const effectiveStage: AcquisitionStage = canPromoteToFluent(
    existing,
    options?.contextId,
    neededHint,
    succeeded,
  )
    ? 'fluent'
    : nextStage;

  const node: ConceptNode = {
    id: conceptId,
    stage: promoteStage(existing?.stage, effectiveStage),
    originLocation: existing?.originLocation ?? originLocation,
    neededHint,
    lastContactAt: nowIso,
  };

  const reviewCount = options?.reviewCount ?? existing?.reviewCount;
  if (reviewCount !== undefined) {
    node.reviewCount = reviewCount;
  }

  const intervalHours = options?.intervalHours ?? existing?.intervalHours;
  if (intervalHours !== undefined) {
    node.intervalHours = intervalHours;
  }

  let contextsSeen = existing?.contextsSeen;
  if (options?.contextId && succeeded) {
    const prev = existing?.contextsSeen ?? [];
    contextsSeen = prev.includes(options.contextId) ? prev : [...prev, options.contextId];
  }
  if (contextsSeen !== undefined) {
    node.contextsSeen = contextsSeen;
  }

  const lastMode = options?.mode ?? existing?.lastMode;
  if (lastMode !== undefined) {
    node.lastMode = lastMode;
  }

  return {
    ...constellation,
    [conceptId]: node,
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
