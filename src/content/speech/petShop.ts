import { line, type SpeechLine } from './line';

// Prefix is `petshop_`, never `world_pet_`: that one counts toward the street badge.
export type PetShopSpeechKey =
  | 'petshop_welcome'
  | 'petshop_ask_feed'
  | 'petshop_ask_wash'
  | 'petshop_ask_cat'
  | 'petshop_ask_brush'
  | 'petshop_ask_play'
  | 'pet_shop_done'
  | 'petshop_that_dog'
  | 'petshop_that_bowl'
  | 'petshop_that_tub'
  | 'petshop_that_cat'
  | 'petshop_that_brush'
  | 'petshop_that_ball'
  | 'petshop_that_collar'
  | 'petshop_that_stethoscope'
  | 'petshop_word_dog'
  | 'petshop_word_cat'
  | 'petshop_word_feed'
  | 'petshop_word_wash'
  | 'petshop_word_brush'
  | 'petshop_word_play'
  | 'petshop_word_happy'
  | 'petshop_word_gentle';

export const PET_SHOP_AUDIO_LINES: Record<PetShopSpeechKey, SpeechLine> = {
  petshop_welcome: line('petshop_welcome', 'Hello! Can you find the dog?', 2300, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.7, viseme: 'viseme_aa' },
    { at: 1.2, viseme: 'viseme_fv' },
    { at: 1.75, viseme: 'viseme_oo' },
    { at: 2.15, viseme: null },
  ]),
  petshop_ask_feed: line('petshop_ask_feed', 'Feed the dog.', 1300, [
    { at: 0.0, viseme: 'viseme_fv' },
    { at: 0.25, viseme: 'viseme_ee' },
    { at: 0.8, viseme: 'viseme_oo' },
    { at: 1.2, viseme: null },
  ]),
  petshop_ask_wash: line('petshop_ask_wash', 'Wash the dog.', 1300, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.25, viseme: 'viseme_aa' },
    { at: 0.8, viseme: 'viseme_oo' },
    { at: 1.2, viseme: null },
  ]),
  petshop_ask_cat: line('petshop_ask_cat', 'Now find the cat. Be gentle.', 2600, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_fv' },
    { at: 1.1, viseme: 'viseme_aa' },
    { at: 1.7, viseme: 'viseme_mbp' },
    { at: 2.0, viseme: 'viseme_ee' },
    { at: 2.5, viseme: null },
  ]),
  petshop_ask_brush: line('petshop_ask_brush', 'Brush the cat gently.', 1900, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.25, viseme: 'viseme_aa' },
    { at: 0.8, viseme: 'viseme_aa' },
    { at: 1.3, viseme: 'viseme_ee' },
    { at: 1.8, viseme: null },
  ]),
  petshop_ask_play: line('petshop_ask_play', 'Play with the dog.', 1600, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.2, viseme: 'viseme_ee' },
    { at: 0.6, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.5, viseme: null },
  ]),
  pet_shop_done: line('pet_shop_done', 'The dog and the cat are happy. Great job!', 3300, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.65, viseme: 'viseme_aa' },
    { at: 1.35, viseme: 'viseme_aa' },
    { at: 1.85, viseme: 'viseme_mbp' },
    { at: 2.4, viseme: 'viseme_ee' },
    { at: 2.85, viseme: 'viseme_oo' },
    { at: 3.2, viseme: null },
  ]),
  petshop_that_dog: line('petshop_that_dog', "That's a dog.", 1250, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.65, viseme: 'viseme_oo' },
    { at: 1.15, viseme: null },
  ]),
  petshop_that_bowl: line('petshop_that_bowl', "That's the food.", 1350, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.6, viseme: 'viseme_fv' },
    { at: 0.8, viseme: 'viseme_oo' },
    { at: 1.25, viseme: null },
  ]),
  petshop_that_tub: line('petshop_that_tub', "That's the bath.", 1350, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.6, viseme: 'viseme_mbp' },
    { at: 0.8, viseme: 'viseme_aa' },
    { at: 1.25, viseme: null },
  ]),
  petshop_that_cat: line('petshop_that_cat', "That's a cat.", 1250, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_ee' },
    { at: 0.75, viseme: 'viseme_aa' },
    { at: 1.15, viseme: null },
  ]),
  petshop_that_brush: line('petshop_that_brush', "That's a brush.", 1350, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_mbp' },
    { at: 0.8, viseme: 'viseme_aa' },
    { at: 1.25, viseme: null },
  ]),
  petshop_that_ball: line('petshop_that_ball', "That's a ball.", 1250, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_mbp' },
    { at: 0.75, viseme: 'viseme_oo' },
    { at: 1.15, viseme: null },
  ]),
  petshop_that_collar: line('petshop_that_collar', "That's a collar.", 1400, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_oo' },
    { at: 0.95, viseme: 'viseme_aa' },
    { at: 1.3, viseme: null },
  ]),
  petshop_that_stethoscope: line('petshop_that_stethoscope', "That's a stethoscope.", 1800, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_ee' },
    { at: 0.95, viseme: 'viseme_oo' },
    { at: 1.45, viseme: 'viseme_mbp' },
    { at: 1.7, viseme: null },
  ]),
  petshop_word_dog: line('petshop_word_dog', 'A dog.', 900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.3, viseme: 'viseme_oo' },
    { at: 0.8, viseme: null },
  ]),
  petshop_word_cat: line('petshop_word_cat', 'A cat.', 900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.3, viseme: 'viseme_ee' },
    { at: 0.8, viseme: null },
  ]),
  petshop_word_feed: line('petshop_word_feed', 'Feed.', 800, [
    { at: 0.0, viseme: 'viseme_fv' },
    { at: 0.2, viseme: 'viseme_ee' },
    { at: 0.7, viseme: null },
  ]),
  petshop_word_wash: line('petshop_word_wash', 'Wash.', 800, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.25, viseme: 'viseme_aa' },
    { at: 0.7, viseme: null },
  ]),
  petshop_word_brush: line('petshop_word_brush', 'Brush.', 850, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.2, viseme: 'viseme_aa' },
    { at: 0.75, viseme: null },
  ]),
  petshop_word_play: line('petshop_word_play', 'Play.', 800, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.2, viseme: 'viseme_ee' },
    { at: 0.7, viseme: null },
  ]),
  petshop_word_happy: line('petshop_word_happy', 'Happy.', 900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.35, viseme: 'viseme_mbp' },
    { at: 0.55, viseme: 'viseme_ee' },
    { at: 0.8, viseme: null },
  ]),
  petshop_word_gentle: line('petshop_word_gentle', 'Gentle.', 900, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.5, viseme: 'viseme_oo' },
    { at: 0.8, viseme: null },
  ]),
};
