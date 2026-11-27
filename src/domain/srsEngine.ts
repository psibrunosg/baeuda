import { CONCEPT_AUDIO_KEY } from '../content/audioManifest';
import { CURIOSITY_CATALOG } from './curiosityCatalog';
import type { ConceptId, ConceptNode, LearnerProfile } from './types';
import type { EvaluationPair } from './badgesAndGames';

const CONCEPT_META: Record<ConceptId, { icon: string; label: string; hint: string }> = {
  cup: { icon: '🥤', label: 'Cup', hint: 'Drink vessel' },
  coffee: { icon: '☕', label: 'Coffee', hint: 'Warm roast' },
  water: { icon: '💧', label: 'Water', hint: 'Clear drink' },
  hot: { icon: '🔥', label: 'Hot', hint: 'Steaming warm' },
  cold: { icon: '❄️', label: 'Cold', hint: 'Chilled ice' },
  pour: { icon: '💧', label: 'Pour', hint: 'Fill the cup' },
  milk: { icon: '🥛', label: 'Milk', hint: 'Creamy white' },
  sugar: { icon: '🍬', label: 'Sugar', hint: 'Sweet crystal' },
  cake: { icon: '🧁', label: 'Cake', hint: 'Bakery treat' },
  sweet: { icon: '🍯', label: 'Sweet', hint: 'Sugary taste' },
  more: { icon: '➕', label: 'More', hint: 'Extra please' },
  one: { icon: '1️⃣', label: 'One', hint: 'Single item' },
  two: { icon: '2️⃣', label: 'Two', hint: 'A pair' },
  full: { icon: '🥛', label: 'Full', hint: 'Filled up' },
  empty: { icon: '⭕', label: 'Empty', hint: 'Nothing inside' },
  plate: { icon: '🍽️', label: 'Plate', hint: 'Dish for food' },
  next_to: { icon: '↔️', label: 'Next to', hint: 'Right beside' },
  coin: { icon: '💰', label: 'Coin', hint: 'Pay at counter' },
  like: { icon: '❤️', label: 'Like', hint: 'Favorite' },
  apple: { icon: '🍎', label: 'Apple', hint: 'Crisp fruit' },
  bread: { icon: '🥖', label: 'Bread', hint: 'Baked loaf' },
  big: { icon: '🐘', label: 'Big', hint: 'Large size' },
  small: { icon: '🐭', label: 'Small', hint: 'Tiny size' },
  music: { icon: '🎵', label: 'Music', hint: 'Guitar melody' },
  bird: { icon: '🐦', label: 'Bird', hint: 'Singing wings' },
  fast: { icon: '⚡', label: 'Fast', hint: 'Quick tempo' },
  slow: { icon: '🐢', label: 'Slow', hint: 'Calm tempo' },
  butter: { icon: '🧈', label: 'Butter', hint: 'Spread on bread' },
  croissant: { icon: '🥐', label: 'Croissant', hint: 'Curved pastry' },
  notebook: { icon: '📓', label: 'Notebook', hint: 'Write in it' },
  pencil: { icon: '✏️', label: 'Pencil', hint: 'Draws a line' },
  globe: { icon: '🌍', label: 'Globe', hint: 'Round world map' },
  bed: { icon: '🛏️', label: 'Bed', hint: 'Where you sleep' },
  stove: { icon: '🍳', label: 'Stove', hint: 'Where you cook' },
  desk: { icon: '📚', label: 'Desk', hint: 'Where you study' },
  comb: { icon: '💈', label: 'Comb', hint: 'Tidies hair' },
  scissors: { icon: '✂️', label: 'Scissors', hint: 'Cuts hair' },
  beard: { icon: '🧔', label: 'Beard', hint: 'Hair on the chin' },
  book: { icon: '📖', label: 'Book', hint: 'Pages with a cover' },
  pen: { icon: '🖊️', label: 'Pen', hint: 'Full of blue ink' },
  read: { icon: '👀', label: 'Read', hint: 'Look at words' },
  write: { icon: '✍️', label: 'Write', hint: 'Make letters' },
  story: { icon: '🏰', label: 'Story', hint: 'A tale to tell' },
  page: { icon: '📄', label: 'Page', hint: 'One side of paper' },
  chapter: { icon: '🔖', label: 'Chapter', hint: 'Part of a book' },
  dog: { icon: '🐶', label: 'Dog', hint: 'Wags its tail' },
  cat: { icon: '🐱', label: 'Cat', hint: 'Soft and says meow' },
  feed: { icon: '🦴', label: 'Feed', hint: 'Give food' },
  wash: { icon: '🧼', label: 'Wash', hint: 'Soap and water' },
  brush: { icon: '🖌️', label: 'Brush', hint: 'Tidy the fur' },
  play: { icon: '🎾', label: 'Play', hint: 'Have fun' },
  happy: { icon: '😊', label: 'Happy', hint: 'Feeling good' },
  gentle: { icon: '🤲', label: 'Gentle', hint: 'Soft and careful' },
};

export const URGENT_REVIEW_THRESHOLD = 35;

export interface RetentionStatus {
  hasUrgentSrs: boolean;
  urgentConceptIds: ConceptId[];
  maxUrgency: number;
  mistakeCount: number;
  hasMistakes: boolean;
  needsRetention: boolean;
}

/**
 * Computes SRS urgency score for a concept node:
 * higher score = more urgent to review (neededHint, lower stage, older lastContactAt).
 * `'fluent'` concepts carry the lowest base urgency and a longer default interval,
 * but still surface for long-term refresh after extended elapsed time.
 */
export function computeReviewUrgency(node: ConceptNode, nowMs: number): number {
  const stagePenalty =
    node.stage === 'seed'
      ? 40
      : node.stage === 'root'
        ? 20
        : node.stage === 'voice'
          ? 5
          : 0;
  const hintBonus = node.neededHint ? 25 : 0;
  const lastMs = Date.parse(node.lastContactAt);
  const ageHours = Number.isFinite(lastMs) ? Math.max(0, (nowMs - lastMs) / 3_600_000) : 24;
  const defaultIntervalHours = node.stage === 'fluent' ? 168 : 8;
  const intervalHours = Math.max(4, node.intervalHours ?? defaultIntervalHours);
  const overdueScore = Math.min(60, (ageHours / intervalHours) * 16);
  return stagePenalty + hintBonus + overdueScore;
}

/**
 * Evaluates whether the learner currently has urgent SRS reviews or pending Mistakes Lab items.
 */
export function getRetentionStatus(
  profile: LearnerProfile,
  nowMs = Date.now(),
  urgencyThreshold = URGENT_REVIEW_THRESHOLD,
): RetentionStatus {
  const nodes = Object.values(profile.constellation).filter((n): n is ConceptNode => Boolean(n));
  const scored = nodes
    .map((node) => ({ id: node.id, urgency: computeReviewUrgency(node, nowMs) }))
    .sort((a, b) => b.urgency - a.urgency);

  const urgentConceptIds = scored
    .filter((entry) => entry.urgency >= urgencyThreshold)
    .map((entry) => entry.id);
  const maxUrgency = scored.length > 0 ? scored[0].urgency : 0;
  const mistakeCount = (profile.mistakeExerciseIds ?? []).length;
  const hasUrgentSrs = urgentConceptIds.length > 0;
  const hasMistakes = mistakeCount > 0;

  return {
    hasUrgentSrs,
    urgentConceptIds,
    maxUrgency,
    mistakeCount,
    hasMistakes,
    needsRetention: hasMistakes || hasUrgentSrs,
  };
}

/**
 * Selects up to `limit` most urgent concepts from the learner's profile for spaced repetition,
 * also mixing in discovered city shop/fruit vocabulary from `CURIOSITY_CATALOG` and falling back
 * to core Pre-A1 foundations if needed.
 */
export function buildSrsReviewPairs(
  profile: LearnerProfile,
  limit = 6,
  nowMs = Date.now(),
): EvaluationPair[] {
  const nodes = Object.values(profile.constellation).filter((n): n is ConceptNode => Boolean(n));
  const sorted = [...nodes].sort(
    (a, b) => computeReviewUrgency(b, nowMs) - computeReviewUrgency(a, nowMs),
  );

  const pairs: EvaluationPair[] = [];
  const usedLabels = new Set<string>();

  for (const node of sorted) {
    if (pairs.length >= limit) break;
    const meta = CONCEPT_META[node.id];
    pairs.push({
      id: `srs_${node.id}`,
      icon: meta.icon,
      label: meta.label,
      hint: meta.hint,
      speechKey: CONCEPT_AUDIO_KEY[node.id],
    });
    usedLabels.add(meta.label.toLowerCase());
  }

  // Mix in discovered city curiosity vocabulary (shops, fruits, everyday objects)
  const discoveries = new Set(profile.streetDiscoveries ?? []);
  if (pairs.length < limit && discoveries.size > 0) {
    for (const item of Object.values(CURIOSITY_CATALOG)) {
      if (pairs.length >= limit) break;
      if (!discoveries.has(item.discoveryKey)) continue;
      const lower = item.canonicalAnswer.toLowerCase();
      if (usedLabels.has(lower)) continue;
      pairs.push({
        id: `srs_city_${item.id}`,
        icon: item.icon,
        label: item.canonicalAnswer.charAt(0).toUpperCase() + item.canonicalAnswer.slice(1),
        hint: item.question,
        speechKey: item.speechKey,
      });
      usedLabels.add(lower);
    }
  }

  const defaults: ConceptId[] = ['coffee', 'water', 'hot', 'cold', 'cup', 'bread'];
  for (const fallbackId of defaults) {
    if (pairs.length >= limit) break;
    const meta = CONCEPT_META[fallbackId];
    if (usedLabels.has(meta.label.toLowerCase())) continue;
    pairs.push({
      id: `srs_${fallbackId}`,
      icon: meta.icon,
      label: meta.label,
      hint: meta.hint,
      speechKey: CONCEPT_AUDIO_KEY[fallbackId],
    });
    usedLabels.add(meta.label.toLowerCase());
  }

  return pairs;
}
