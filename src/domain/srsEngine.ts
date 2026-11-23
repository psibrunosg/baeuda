import { CONCEPT_AUDIO_KEY } from '../content/audioManifest';
import type { ConceptId, ConceptNode, LearnerProfile } from './types';
import type { EvaluationPair } from './badgesAndGames';

const CONCEPT_META: Record<ConceptId, { icon: string; label: string; hint: string }> = {
  cup: { icon: '🥤', label: 'Cup', hint: 'Drink vessel' },
  coffee: { icon: '☕', label: 'Coffee', hint: 'Warm roast' },
  water: { icon: '💧', label: 'Water', hint: 'Clear drink' },
  hot: { icon: '🔥', label: 'Hot', hint: 'Steaming warm' },
  cold: { icon: '❄️', label: 'Cold', hint: 'Chilled ice' },
  pour: { icon: '🫗', label: 'Pour', hint: 'Fill the cup' },
  milk: { icon: '🥛', label: 'Milk', hint: 'Creamy white' },
  sugar: { icon: '🍬', label: 'Sugar', hint: 'Sweet crystal' },
  cake: { icon: '🧁', label: 'Cake', hint: 'Bakery treat' },
  sweet: { icon: '🍯', label: 'Sweet', hint: 'Sugary taste' },
  more: { icon: '➕', label: 'More', hint: 'Extra please' },
  one: { icon: '1️⃣', label: 'One', hint: 'Single item' },
  two: { icon: '2️⃣', label: 'Two', hint: 'A pair' },
  full: { icon: '🥛', label: 'Full', hint: 'Filled up' },
  empty: { icon: '🫙', label: 'Empty', hint: 'Nothing inside' },
  plate: { icon: '🍽️', label: 'Plate', hint: 'Dish for food' },
  next_to: { icon: '↔️', label: 'Next to', hint: 'Right beside' },
  coin: { icon: '🪙', label: 'Coin', hint: 'Pay at counter' },
  like: { icon: '❤️', label: 'Like', hint: 'Favorite' },
  apple: { icon: '🍎', label: 'Apple', hint: 'Crisp fruit' },
  bread: { icon: '🥖', label: 'Bread', hint: 'Baked loaf' },
  big: { icon: '🐘', label: 'Big', hint: 'Large size' },
  small: { icon: '🐭', label: 'Small', hint: 'Tiny size' },
  music: { icon: '🎵', label: 'Music', hint: 'Guitar melody' },
  bird: { icon: '🐦', label: 'Bird', hint: 'Singing wings' },
  fast: { icon: '⚡', label: 'Fast', hint: 'Quick tempo' },
  slow: { icon: '🐢', label: 'Slow', hint: 'Calm tempo' },
};

/**
 * Computes SRS urgency score for a concept node:
 * higher score = more urgent to review (neededHint, lower stage, older lastContactAt).
 */
export function computeReviewUrgency(node: ConceptNode, nowMs: number): number {
  const stagePenalty = node.stage === 'seed' ? 40 : node.stage === 'root' ? 20 : 5;
  const hintBonus = node.neededHint ? 25 : 0;
  const lastMs = Date.parse(node.lastContactAt);
  const ageHours = Number.isFinite(lastMs) ? Math.max(0, (nowMs - lastMs) / 3_600_000) : 24;
  return stagePenalty + hintBonus + Math.min(48, ageHours);
}

/**
 * Selects up to `limit` most urgent concepts from the learner's profile for spaced repetition,
 * falling back to core Pre-A1 foundations if the learner has fewer than `limit` concepts yet.
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

  const selectedIds: ConceptId[] = sorted.slice(0, limit).map((n) => n.id);
  const defaults: ConceptId[] = ['coffee', 'water', 'hot', 'cold', 'cup', 'bread'];
  for (const fallbackId of defaults) {
    if (selectedIds.length >= limit) break;
    if (!selectedIds.includes(fallbackId)) {
      selectedIds.push(fallbackId);
    }
  }

  return selectedIds.map((id) => {
    const meta = CONCEPT_META[id];
    return {
      id: `srs_${id}`,
      icon: meta.icon,
      label: meta.label,
      hint: meta.hint,
      speechKey: CONCEPT_AUDIO_KEY[id],
    };
  });
}
