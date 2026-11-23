import type { LearnerProfile, SpeechKey } from './types';

export type BadgeTier = 'locked' | 'bronze' | 'gold';

export interface NeighborhoodBadge {
  id: string;
  icon: string;
  title: string;
  profession: string;
  tier: BadgeTier;
  progress: number;
  target: number;
  speechKey: SpeechKey;
}

export type EvaluationDeckId = 'cafe_food' | 'city_shops' | 'professions';

export interface EvaluationPair {
  id: string;
  icon: string;
  label: string;
  hint: string;
  speechKey: SpeechKey;
}

export interface EvaluationDeck {
  id: EvaluationDeckId;
  icon: string;
  title: string;
  pairs: readonly EvaluationPair[];
}

export const EVALUATION_DECKS: readonly EvaluationDeck[] = [
  {
    id: 'cafe_food',
    icon: '☕',
    title: 'Café & Food',
    pairs: [
      { id: 'coffee', icon: '☕', label: 'Hot coffee', hint: 'Warm cup', speechKey: 'demo_hot_coffee' },
      { id: 'water', icon: '💧', label: 'Cold water', hint: 'Cool glass', speechKey: 'demo_cold_water' },
      { id: 'cake', icon: '🧁', label: 'Sweet cake', hint: 'Dessert', speechKey: 'cafe_c2_cake' },
      { id: 'milk', icon: '🥛', label: 'Fresh milk', hint: 'White pour', speechKey: 'cafe_c2_milk' },
      { id: 'bread', icon: '🥖', label: 'Fresh bread', hint: 'Bakery loaf', speechKey: 'world_bakery_bread' },
      { id: 'apple', icon: '🍎', label: 'Red apple', hint: 'Market fruit', speechKey: 'market_apple' },
    ],
  },
  {
    id: 'city_shops',
    icon: '🏙️',
    title: 'Everyday City',
    pairs: [
      { id: 'tire', icon: '🛞', label: 'Full tire', hint: 'Pump air', speechKey: 'world_tire_pump' },
      { id: 'shirt', icon: '👕', label: 'Red shirt', hint: 'Clothes rack', speechKey: 'world_clothes_shirt' },
      { id: 'hat', icon: '👒', label: 'Yellow hat', hint: 'Sun hat', speechKey: 'world_clothes_hat' },
      { id: 'laptop', icon: '💻', label: 'Computer', hint: 'Screen on', speechKey: 'world_tech_laptop' },
      { id: 'phone', icon: '📱', label: 'Phone', hint: 'Battery full', speechKey: 'world_tech_phone' },
      { id: 'bricks', icon: '🧱', label: 'Red bricks', hint: 'Build wall', speechKey: 'world_construction_bricks' },
    ],
  },
  {
    id: 'professions',
    icon: '👷',
    title: 'Professions',
    pairs: [
      { id: 'barista', icon: '☕', label: 'Barista', hint: 'Makes coffee', speechKey: 'job_barista' },
      { id: 'baker', icon: '👨‍🍳', label: 'Baker', hint: 'Bakes bread', speechKey: 'job_baker' },
      { id: 'mechanic', icon: '🔧', label: 'Mechanic', hint: 'Fixes tires', speechKey: 'job_mechanic' },
      { id: 'shopkeeper', icon: '👗', label: 'Shopkeeper', hint: 'Sells clothes', speechKey: 'job_shopkeeper' },
      { id: 'technician', icon: '💻', label: 'Technician', hint: 'Fixes phones', speechKey: 'job_technician' },
      { id: 'builder', icon: '👷', label: 'Builder', hint: 'Builds walls', speechKey: 'job_builder' },
    ],
  },
];

function countPrefix(items: readonly string[], prefix: string): number {
  return items.filter((item) => item.startsWith(prefix)).length;
}

function resolveTier(progress: number, target: number): BadgeTier {
  if (progress >= target) return 'gold';
  if (progress > 0) return 'bronze';
  return 'locked';
}

export function evaluateNeighborhoodBadges(profile: LearnerProfile): NeighborhoodBadge[] {
  const discoveries = profile.streetDiscoveries ?? [];
  const cycles = profile.completedCafeCycles ?? [];
  const concepts = Object.keys(profile.constellation);

  const cafeProgress = Math.min(3, cycles.length + (concepts.includes('coffee') ? 1 : 0));
  const bakeryProgress = Math.min(3, countPrefix(discoveries, 'world_bakery_'));
  const tireProgress = Math.min(3, countPrefix(discoveries, 'world_tire_'));
  const clothesProgress = Math.min(3, countPrefix(discoveries, 'world_clothes_'));
  const techProgress = Math.min(3, countPrefix(discoveries, 'world_tech_'));
  const constructionProgress = Math.min(3, countPrefix(discoveries, 'world_construction_'));
  const marketProgress = profile.locations.market === 'familiar' ? 2 : profile.locations.market === 'discovered' ? 1 : 0;
  const plazaProgress = profile.locations.plaza === 'familiar' ? 2 : profile.locations.plaza === 'discovered' ? 1 : 0;

  return [
    {
      id: 'badge_barista',
      icon: '☕',
      title: 'Café',
      profession: 'Barista',
      tier: resolveTier(cafeProgress, 3),
      progress: cafeProgress,
      target: 3,
      speechKey: 'job_barista',
    },
    {
      id: 'badge_baker',
      icon: '🥖',
      title: 'Bakery',
      profession: 'Baker',
      tier: resolveTier(bakeryProgress, 2),
      progress: bakeryProgress,
      target: 2,
      speechKey: 'job_baker',
    },
    {
      id: 'badge_mechanic',
      icon: '🛞',
      title: 'Tire Shop',
      profession: 'Mechanic',
      tier: resolveTier(tireProgress, 2),
      progress: tireProgress,
      target: 2,
      speechKey: 'job_mechanic',
    },
    {
      id: 'badge_boutique',
      icon: '👗',
      title: 'Boutique',
      profession: 'Shopkeeper',
      tier: resolveTier(clothesProgress, 2),
      progress: clothesProgress,
      target: 2,
      speechKey: 'job_shopkeeper',
    },
    {
      id: 'badge_tech',
      icon: '💻',
      title: 'Tech Shop',
      profession: 'Technician',
      tier: resolveTier(techProgress, 2),
      progress: techProgress,
      target: 2,
      speechKey: 'job_technician',
    },
    {
      id: 'badge_builder',
      icon: '👷',
      title: 'Work Site',
      profession: 'Builder',
      tier: resolveTier(constructionProgress, 2),
      progress: constructionProgress,
      target: 2,
      speechKey: 'job_builder',
    },
    {
      id: 'badge_market',
      icon: '🍎',
      title: 'Market',
      profession: 'Grocer',
      tier: resolveTier(marketProgress, 2),
      progress: marketProgress,
      target: 2,
      speechKey: 'market_hi_maya',
    },
    {
      id: 'badge_plaza',
      icon: '🎵',
      title: 'Plaza',
      profession: 'Musician',
      tier: resolveTier(plazaProgress, 2),
      progress: plazaProgress,
      target: 2,
      speechKey: 'plaza_hi_sam',
    },
  ];
}

export function countEarnedBadges(badges: readonly NeighborhoodBadge[]): number {
  return badges.filter((b) => b.tier !== 'locked').length;
}

export interface MemoryCard {
  cardId: string;
  pairId: string;
  kind: 'icon' | 'word';
  display: string;
  speechKey: SpeechKey;
}

function deterministicShuffle<T>(items: readonly T[], seed: number): T[] {
  const arr = [...items];
  let s = seed + 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function createMemoryCards(deckId: EvaluationDeckId, seed = 7): MemoryCard[] {
  const deck = EVALUATION_DECKS.find((d) => d.id === deckId) ?? EVALUATION_DECKS[0];
  const raw: MemoryCard[] = [];
  for (const pair of deck.pairs) {
    raw.push({
      cardId: `${pair.id}_icon`,
      pairId: pair.id,
      kind: 'icon',
      display: pair.icon,
      speechKey: pair.speechKey,
    });
    raw.push({
      cardId: `${pair.id}_word`,
      pairId: pair.id,
      kind: 'word',
      display: pair.label,
      speechKey: pair.speechKey,
    });
  }
  return deterministicShuffle(raw, seed);
}

export function createConnectColumns(deckId: EvaluationDeckId, seed = 11): {
  left: EvaluationPair[];
  right: EvaluationPair[];
} {
  const deck = EVALUATION_DECKS.find((d) => d.id === deckId) ?? EVALUATION_DECKS[0];
  return {
    left: [...deck.pairs],
    right: deterministicShuffle(deck.pairs, seed),
  };
}
