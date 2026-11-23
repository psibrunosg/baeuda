import type {
  ConceptId,
  ContrastDemoBeat,
  ContrastRound,
  CounterDemoBeat,
  DrinkChoice,
  Lesson1Script,
  PourRound,
  PropName,
  SpeechKey,
  TprRound,
} from '../domain/types';

export type {
  ContrastDemoBeat,
  ContrastRound,
  CounterDemoBeat,
  PourRound,
  TprRound,
} from '../domain/types';

export interface ConceptVisualMeta {
  id: ConceptId;
  color: string;
  position3D: readonly [number, number, number];
  iconSymbol: string;
}

export const COUNTER_DEMO_BEATS: readonly CounterDemoBeat[] = [
  { prop: 'prop_cup_empty', concept: 'cup', audioKey: 'demo_cup', leoAnim: 'present_left' },
  { prop: 'prop_jar_coffee', concept: 'coffee', audioKey: 'demo_coffee', leoAnim: 'present_right' },
  { prop: 'prop_water_cold', concept: 'water', audioKey: 'demo_water', leoAnim: 'present_right' },
];

export const TPR_ROUNDS: readonly TprRound[] = [
  {
    targetProp: 'prop_cup_empty',
    concept: 'cup',
    promptAudio: 'ask_cup',
    thanksAudio: 'thanks_cup',
    helpAudio: 'demo_cup',
  },
  {
    targetProp: 'prop_water_cold',
    concept: 'water',
    promptAudio: 'ask_water',
    thanksAudio: 'thanks_water',
    helpAudio: 'demo_water',
  },
  {
    targetProp: 'prop_jar_coffee',
    concept: 'coffee',
    promptAudio: 'ask_coffee',
    thanksAudio: 'thanks_coffee',
    helpAudio: 'demo_coffee',
  },
];

export const CONTRAST_DEMO_BEATS: readonly ContrastDemoBeat[] = [
  { prop: 'prop_cup_hot', concept: 'hot', audioKey: 'demo_hot_coffee', leoAnim: 'blow_hot' },
  { prop: 'prop_water_cold', concept: 'cold', audioKey: 'demo_cold_water', leoAnim: 'shiver_cold' },
];

export const CONTRAST_ROUNDS: readonly ContrastRound[] = [
  {
    customerMood: 'cold',
    targetProp: 'prop_cup_hot',
    concepts: ['hot', 'coffee'],
    promptAudio: 'customer_hot_coffee',
    thanksAudio: 'thanks_coffee',
    helpAudio: 'word_hot',
  },
  {
    customerMood: 'warm',
    targetProp: 'prop_water_cold',
    concepts: ['cold', 'water'],
    promptAudio: 'customer_cold_water',
    thanksAudio: 'thanks_water',
    helpAudio: 'word_cold',
  },
];

export const POUR_ROUNDS: readonly PourRound[] = [
  {
    liquid: 'coffee',
    vesselProp: 'prop_jar_coffee',
    promptAudio: 'pour_coffee_prompt',
    doneAudio: 'pour_coffee_done',
    helpAudio: 'pour_coffee_prompt',
  },
  {
    liquid: 'water',
    vesselProp: 'prop_water_cold',
    promptAudio: 'pour_water_prompt',
    doneAudio: 'pour_water_done',
    helpAudio: 'pour_coffee_prompt',
  },
];

export const DRINK_TO_CONCEPTS: Record<DrinkChoice, readonly ConceptId[]> = {
  hot_coffee: ['cup', 'coffee', 'hot'],
  cold_water: ['cup', 'water', 'cold'],
  cold_coffee: ['cup', 'coffee', 'cold'],
};

export const PROP_TO_DRINK: Partial<Record<PropName, DrinkChoice>> = {
  prop_cup_hot: 'hot_coffee',
  prop_water_cold: 'cold_water',
  prop_iced_coffee: 'cold_coffee',
};

export const PROP_RECAST_AUDIO: Partial<Record<PropName, SpeechKey>> = {
  prop_cup_empty: 'recast_cup',
  prop_jar_coffee: 'recast_coffee',
  prop_water_cold: 'recast_water',
  prop_cup_hot: 'recast_hot_coffee',
};

export const CONCEPT_VISUALS: Record<ConceptId, ConceptVisualMeta> = {
  cup: { id: 'cup', color: '#f4d9b0', position3D: [-1.1, 0.25, 0.2], iconSymbol: '☕' },
  coffee: { id: 'coffee', color: '#9c5a2d', position3D: [-0.25, 0.95, -0.35], iconSymbol: '🫘' },
  water: { id: 'water', color: '#6ec5e9', position3D: [0.95, 0.85, -0.2], iconSymbol: '💧' },
  hot: { id: 'hot', color: '#f97316', position3D: [-1.25, 1.35, -0.75], iconSymbol: '🔥' },
  cold: { id: 'cold', color: '#38bdf8', position3D: [1.35, 1.35, -0.75], iconSymbol: '❄️' },
  pour: { id: 'pour', color: '#eab308', position3D: [0.1, -0.35, 0.45], iconSymbol: '💧' },
  // Lesson 2: Local Market cluster (left wing)
  apple: { id: 'apple', color: '#ef4444', position3D: [-2.15, 0.1, 0.35], iconSymbol: '🍎' },
  bread: { id: 'bread', color: '#d97706', position3D: [-2.35, -0.7, 0.65], iconSymbol: '🥖' },
  big: { id: 'big', color: '#fb7185', position3D: [-2.55, 0.95, -0.2], iconSymbol: '🟠' },
  small: { id: 'small', color: '#fde047', position3D: [-1.9, -0.85, 0.15], iconSymbol: '🔸' },
  // Lesson 3: Central Plaza cluster (right wing)
  bird: { id: 'bird', color: '#60a5fa', position3D: [2.1, 0.2, 0.3], iconSymbol: '🐦' },
  music: { id: 'music', color: '#a855f7', position3D: [2.35, -0.65, 0.55], iconSymbol: '🎵' },
  fast: { id: 'fast', color: '#f43f5e', position3D: [2.5, 0.95, -0.25], iconSymbol: '⚡' },
  slow: { id: 'slow', color: '#34d399', position3D: [1.85, -0.85, 0.15], iconSymbol: '🍃' },
};

export const LESSON1_CAFE_SCRIPT: Lesson1Script = {
  counterDemoBeats: COUNTER_DEMO_BEATS,
  tprRounds: TPR_ROUNDS,
  contrastDemoBeats: CONTRAST_DEMO_BEATS,
  contrastRounds: CONTRAST_ROUNDS,
  pourRounds: POUR_ROUNDS,
  drinkToConcepts: DRINK_TO_CONCEPTS,
  propToDrink: PROP_TO_DRINK,
  propRecastAudio: PROP_RECAST_AUDIO,
};
