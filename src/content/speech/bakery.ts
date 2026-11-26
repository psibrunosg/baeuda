import { line, type SpeechLine } from './line';

export type BakerySpeechKey =
  | 'bakery_welcome'
  | 'bakery_baking'
  | 'bakery_ready'
  | 'bakery_ask_bread'
  | 'bakery_ask_butter'
  | 'bakery_ask_croissant'
  | 'bakery_ask_slice'
  | 'bakery_ring'
  | 'bakery_done'
  | 'bakery_that_bread'
  | 'bakery_that_butter'
  | 'bakery_that_croissant'
  | 'bakery_that_slice';

export const BAKERY_AUDIO_LINES: Record<BakerySpeechKey, SpeechLine> = {
  bakery_welcome: line('bakery_welcome', "Hello! Let's bake bread. Tap the dough.", 2600, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.6, viseme: 'viseme_ee' },
    { at: 1.2, viseme: 'viseme_mbp' },
    { at: 1.9, viseme: 'viseme_aa' },
    { at: 2.45, viseme: null },
  ]),
  bakery_baking: line('bakery_baking', 'The oven is hot. The bread is baking.', 2400, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_oo' },
    { at: 1.25, viseme: 'viseme_mbp' },
    { at: 1.8, viseme: 'viseme_ee' },
    { at: 2.25, viseme: null },
  ]),
  bakery_ready: line('bakery_ready', 'The bread is warm. Take it out!', 2100, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.5, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_ee' },
    { at: 1.6, viseme: 'viseme_aa' },
    { at: 1.95, viseme: null },
  ]),
  bakery_ask_bread: line('bakery_ask_bread', 'Warm, fresh bread in the basket, please.', 2500, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.55, viseme: 'viseme_fv' },
    { at: 1.1, viseme: 'viseme_mbp' },
    { at: 1.9, viseme: 'viseme_ee' },
    { at: 2.35, viseme: null },
  ]),
  bakery_ask_butter: line('bakery_ask_butter', 'Now butter, please.', 1500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.4, viseme: 'viseme_mbp' },
    { at: 0.95, viseme: 'viseme_ee' },
    { at: 1.35, viseme: null },
  ]),
  bakery_ask_croissant: line('bakery_ask_croissant', 'A fresh croissant, please.', 1800, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.3, viseme: 'viseme_fv' },
    { at: 0.8, viseme: 'viseme_oo' },
    { at: 1.3, viseme: 'viseme_ee' },
    { at: 1.65, viseme: null },
  ]),
  bakery_ask_slice: line('bakery_ask_slice', 'A sweet slice, please.', 1700, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.35, viseme: 'viseme_ee' },
    { at: 0.8, viseme: 'viseme_aa' },
    { at: 1.2, viseme: 'viseme_ee' },
    { at: 1.55, viseme: null },
  ]),
  bakery_ring: line('bakery_ring', 'The basket is ready! Ring the bell.', 2300, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.55, viseme: 'viseme_aa' },
    { at: 1.2, viseme: 'viseme_ee' },
    { at: 1.75, viseme: 'viseme_mbp' },
    { at: 2.15, viseme: null },
  ]),
  bakery_done: line('bakery_done', 'Thank you! Enjoy your warm bread.', 2200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.65, viseme: 'viseme_mbp' },
    { at: 2.05, viseme: null },
  ]),
  bakery_that_bread: line('bakery_that_bread', "That's bread. Look at the crust!", 2200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_mbp' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.65, viseme: 'viseme_aa' },
    { at: 2.05, viseme: null },
  ]),
  bakery_that_butter: line('bakery_that_butter', "That's butter.", 1200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_mbp' },
    { at: 0.75, viseme: 'viseme_ee' },
    { at: 1.05, viseme: null },
  ]),
  bakery_that_croissant: line('bakery_that_croissant', "That's a croissant.", 1500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_oo' },
    { at: 1.0, viseme: 'viseme_aa' },
    { at: 1.35, viseme: null },
  ]),
  bakery_that_slice: line('bakery_that_slice', "That's a slice of cake.", 1650, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_aa' },
    { at: 0.95, viseme: 'viseme_fv' },
    { at: 1.2, viseme: 'viseme_ee' },
    { at: 1.5, viseme: null },
  ]),
};
