import { line, type SpeechLine } from './line';

export type BarberSpeechKey =
  | 'barber_welcome'
  | 'barber_ask_scissors'
  | 'barber_ask_curly'
  | 'barber_ask_straight'
  | 'barber_ask_long'
  | 'barber_ask_short'
  | 'barber_ask_beard'
  | 'barber_done'
  | 'barber_that_comb'
  | 'barber_that_scissors'
  | 'barber_that_curly'
  | 'barber_that_straight'
  | 'barber_that_long'
  | 'barber_that_short'
  | 'barber_that_beard';

export const BARBER_AUDIO_LINES: Record<BarberSpeechKey, SpeechLine> = {
  barber_welcome: line('barber_welcome', 'Hello! The comb, please.', 1900, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.45, viseme: 'viseme_oo' },
    { at: 1.0, viseme: 'viseme_mbp' },
    { at: 1.45, viseme: 'viseme_ee' },
    { at: 1.75, viseme: null },
  ]),
  barber_ask_scissors: line('barber_ask_scissors', 'Now the scissors, please.', 1800, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_ee' },
    { at: 0.95, viseme: 'viseme_mbp' },
    { at: 1.35, viseme: 'viseme_ee' },
    { at: 1.65, viseme: null },
  ]),
  barber_ask_curly: line('barber_ask_curly', 'Find the curly hair.', 1600, [
    { at: 0.0, viseme: 'viseme_fv' },
    { at: 0.35, viseme: 'viseme_aa' },
    { at: 0.75, viseme: 'viseme_oo' },
    { at: 1.15, viseme: 'viseme_ee' },
    { at: 1.45, viseme: null },
  ]),
  barber_ask_straight: line('barber_ask_straight', 'Now the straight hair.', 1700, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_ee' },
    { at: 0.9, viseme: 'viseme_aa' },
    { at: 1.25, viseme: 'viseme_ee' },
    { at: 1.55, viseme: null },
  ]),
  barber_ask_long: line('barber_ask_long', 'Where is the long hair?', 1700, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.4, viseme: 'viseme_ee' },
    { at: 0.85, viseme: 'viseme_oo' },
    { at: 1.25, viseme: 'viseme_ee' },
    { at: 1.55, viseme: null },
  ]),
  barber_ask_short: line('barber_ask_short', 'And the short hair?', 1500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.35, viseme: 'viseme_ee' },
    { at: 0.65, viseme: 'viseme_oo' },
    { at: 1.05, viseme: 'viseme_ee' },
    { at: 1.35, viseme: null },
  ]),
  barber_ask_beard: line('barber_ask_beard', 'Now trim his beard, please.', 2000, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.4, viseme: 'viseme_mbp' },
    { at: 0.9, viseme: 'viseme_mbp' },
    { at: 1.45, viseme: 'viseme_ee' },
    { at: 1.85, viseme: null },
  ]),
  barber_done: line('barber_done', 'Nice trim! Thank you.', 1800, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 1.0, viseme: 'viseme_aa' },
    { at: 1.4, viseme: 'viseme_oo' },
    { at: 1.7, viseme: null },
  ]),
  barber_that_comb: line('barber_that_comb', 'That is the comb.', 1400, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_ee' },
    { at: 0.8, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_mbp' },
    { at: 1.3, viseme: null },
  ]),
  barber_that_scissors: line('barber_that_scissors', 'Those are the scissors.', 1700, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_aa' },
    { at: 0.9, viseme: 'viseme_ee' },
    { at: 1.3, viseme: 'viseme_aa' },
    { at: 1.55, viseme: null },
  ]),
  barber_that_curly: line('barber_that_curly', 'That is the curly hair.', 1700, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_oo' },
    { at: 0.95, viseme: 'viseme_ee' },
    { at: 1.3, viseme: 'viseme_aa' },
    { at: 1.55, viseme: null },
  ]),
  barber_that_straight: line('barber_that_straight', 'That is the straight hair.', 1800, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_ee' },
    { at: 0.95, viseme: 'viseme_aa' },
    { at: 1.4, viseme: 'viseme_ee' },
    { at: 1.65, viseme: null },
  ]),
  barber_that_long: line('barber_that_long', 'That is the long hair.', 1700, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_ee' },
    { at: 0.9, viseme: 'viseme_oo' },
    { at: 1.3, viseme: 'viseme_ee' },
    { at: 1.55, viseme: null },
  ]),
  barber_that_short: line('barber_that_short', 'That is the short hair.', 1700, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_ee' },
    { at: 0.9, viseme: 'viseme_oo' },
    { at: 1.3, viseme: 'viseme_ee' },
    { at: 1.55, viseme: null },
  ]),
  barber_that_beard: line('barber_that_beard', 'That is the beard.', 1500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_ee' },
    { at: 0.85, viseme: 'viseme_mbp' },
    { at: 1.1, viseme: 'viseme_ee' },
    { at: 1.35, viseme: null },
  ]),
};
