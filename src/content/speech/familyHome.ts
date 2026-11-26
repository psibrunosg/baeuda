import { line, type SpeechLine } from './line';

export type FamilyHomeSpeechKey =
  | 'family_wake'
  | 'family_cook'
  | 'family_to_afternoon'
  | 'family_clean'
  | 'family_study'
  | 'family_to_night'
  | 'family_sleep'
  | 'family_done'
  | 'family_that_bed'
  | 'family_that_stove'
  | 'family_that_washer'
  | 'family_that_desk'
  | 'family_time_morning'
  | 'family_time_afternoon'
  | 'family_time_night'
  | 'family_mother'
  | 'family_grandma'
  | 'family_brother'
  | 'family_tv'
  | 'family_swing'
  | 'family_grill'
  | 'family_cookie';

export const FAMILY_HOME_AUDIO_LINES: Record<FamilyHomeSpeechKey, SpeechLine> = {
  family_wake: line('family_wake', 'Good morning! We always wake up early. Time to wake up!', 4200, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.6, viseme: 'viseme_mbp' },
    { at: 1.5, viseme: 'viseme_oo' },
    { at: 2.2, viseme: 'viseme_aa' },
    { at: 3.1, viseme: 'viseme_oo' },
    { at: 3.65, viseme: 'viseme_mbp' },
    { at: 4.05, viseme: null },
  ]),
  family_cook: line('family_cook', 'I always cook in the morning. Help me cook!', 3200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.7, viseme: 'viseme_oo' },
    { at: 1.4, viseme: 'viseme_mbp' },
    { at: 2.2, viseme: 'viseme_ee' },
    { at: 2.65, viseme: 'viseme_oo' },
    { at: 3.05, viseme: null },
  ]),
  family_to_afternoon: line('family_to_afternoon', 'Breakfast is ready. Tap the clock.', 2700, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_ee' },
    { at: 0.95, viseme: 'viseme_fv' },
    { at: 1.75, viseme: 'viseme_mbp' },
    { at: 2.15, viseme: 'viseme_oo' },
    { at: 2.55, viseme: null },
  ]),
  family_clean: line('family_clean', 'Grandma usually cleans in the afternoon. Help her wash the clothes!', 4300, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_mbp' },
    { at: 0.85, viseme: 'viseme_oo' },
    { at: 1.4, viseme: 'viseme_ee' },
    { at: 1.95, viseme: 'viseme_oo' },
    { at: 2.5, viseme: 'viseme_aa' },
    { at: 2.95, viseme: 'viseme_ee' },
    { at: 3.25, viseme: null },
  ]),
  family_study: line('family_study', 'My son sometimes studies in the afternoon. Time to study!', 3800, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.45, viseme: 'viseme_aa' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.8, viseme: 'viseme_fv' },
    { at: 2.5, viseme: 'viseme_aa' },
    { at: 3.1, viseme: 'viseme_oo' },
    { at: 3.4, viseme: 'viseme_ee' },
    { at: 3.65, viseme: null },
  ]),
  family_to_night: line('family_to_night', 'It is getting dark. Tap the clock.', 2600, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.6, viseme: 'viseme_ee' },
    { at: 1.05, viseme: 'viseme_aa' },
    { at: 1.65, viseme: 'viseme_mbp' },
    { at: 2.05, viseme: 'viseme_oo' },
    { at: 2.45, viseme: null },
  ]),
  family_sleep: line('family_sleep', 'It is night. We never cook at night. Time to sleep!', 3800, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.5, viseme: 'viseme_aa' },
    { at: 1.2, viseme: 'viseme_fv' },
    { at: 1.75, viseme: 'viseme_oo' },
    { at: 2.45, viseme: 'viseme_aa' },
    { at: 2.95, viseme: 'viseme_ee' },
    { at: 3.25, viseme: 'viseme_mbp' },
    { at: 3.45, viseme: null },
  ]),
  family_done: line('family_done', 'Good night! You know our family day. Thank you!', 3400, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.45, viseme: 'viseme_aa' },
    { at: 1.15, viseme: 'viseme_oo' },
    { at: 1.75, viseme: 'viseme_fv' },
    { at: 2.25, viseme: 'viseme_ee' },
    { at: 2.75, viseme: 'viseme_aa' },
    { at: 3.05, viseme: 'viseme_oo' },
    { at: 3.25, viseme: null },
  ]),
  family_that_bed: line('family_that_bed', 'That is the bed in the bedroom. We sleep there.', 3200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.7, viseme: 'viseme_mbp' },
    { at: 1.4, viseme: 'viseme_ee' },
    { at: 2.1, viseme: 'viseme_oo' },
    { at: 2.65, viseme: 'viseme_aa' },
    { at: 3.05, viseme: null },
  ]),
  family_that_stove: line('family_that_stove', 'That is the stove in the kitchen. We cook there.', 3100, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.65, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_fv' },
    { at: 1.6, viseme: 'viseme_oo' },
    { at: 2.0, viseme: 'viseme_aa' },
    { at: 2.35, viseme: null },
  ]),
  family_that_washer: line(
    'family_that_washer',
    'That is the washing machine. We wash clothes there.',
    3400,
    [
      { at: 0.0, viseme: 'viseme_aa' },
      { at: 0.65, viseme: 'viseme_oo' },
      { at: 1.15, viseme: 'viseme_mbp' },
      { at: 1.55, viseme: 'viseme_ee' },
      { at: 2.3, viseme: 'viseme_oo' },
      { at: 2.85, viseme: 'viseme_aa' },
      { at: 3.25, viseme: null },
    ],
  ),
  family_that_desk: line('family_that_desk', 'That is the desk. We study there.', 2500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.65, viseme: 'viseme_ee' },
    { at: 1.2, viseme: 'viseme_oo' },
    { at: 1.65, viseme: 'viseme_aa' },
    { at: 1.95, viseme: 'viseme_ee' },
    { at: 2.35, viseme: null },
  ]),
  family_time_morning: line('family_time_morning', 'It is morning.', 1300, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.45, viseme: 'viseme_mbp' },
    { at: 0.7, viseme: 'viseme_oo' },
    { at: 1.15, viseme: null },
  ]),
  family_time_afternoon: line('family_time_afternoon', 'It is afternoon.', 1500, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.45, viseme: 'viseme_aa' },
    { at: 0.65, viseme: 'viseme_fv' },
    { at: 1.0, viseme: 'viseme_oo' },
    { at: 1.35, viseme: null },
  ]),
  family_time_night: line('family_time_night', 'It is night.', 1200, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.5, viseme: 'viseme_aa' },
    { at: 0.8, viseme: 'viseme_ee' },
    { at: 1.05, viseme: null },
  ]),
  family_mother: line('family_mother', "I am Leo's mother. Welcome to our home!", 2900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_ee' },
    { at: 0.9, viseme: 'viseme_mbp' },
    { at: 1.55, viseme: 'viseme_oo' },
    { at: 2.0, viseme: 'viseme_aa' },
    { at: 2.4, viseme: 'viseme_oo' },
    { at: 2.75, viseme: null },
  ]),
  family_grandma: line('family_grandma', "I am Leo's grandma. I usually clean in the afternoon.", 3600, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_ee' },
    { at: 1.0, viseme: 'viseme_aa' },
    { at: 1.8, viseme: 'viseme_oo' },
    { at: 2.4, viseme: 'viseme_ee' },
    { at: 2.95, viseme: 'viseme_fv' },
    { at: 3.45, viseme: null },
  ]),
  family_brother: line('family_brother', "I am Leo's brother. I never study in the kitchen!", 3500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_ee' },
    { at: 1.0, viseme: 'viseme_mbp' },
    { at: 1.75, viseme: 'viseme_fv' },
    { at: 2.3, viseme: 'viseme_aa' },
    { at: 2.9, viseme: 'viseme_ee' },
    { at: 3.35, viseme: null },
  ]),
  family_tv: line('family_tv', "Leo's father usually watches TV in the living room.", 3500, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.55, viseme: 'viseme_fv' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.7, viseme: 'viseme_aa' },
    { at: 2.15, viseme: 'viseme_ee' },
    { at: 2.7, viseme: 'viseme_fv' },
    { at: 3.1, viseme: 'viseme_oo' },
    { at: 3.35, viseme: null },
  ]),
  family_swing: line('family_swing', "Leo's sister sometimes plays in the backyard.", 3100, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.6, viseme: 'viseme_ee' },
    { at: 1.1, viseme: 'viseme_aa' },
    { at: 1.6, viseme: 'viseme_mbp' },
    { at: 2.3, viseme: 'viseme_mbp' },
    { at: 2.55, viseme: 'viseme_aa' },
    { at: 2.95, viseme: null },
  ]),
  family_grill: line('family_grill', 'The family sometimes eats in the backyard.', 2900, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.35, viseme: 'viseme_fv' },
    { at: 0.95, viseme: 'viseme_aa' },
    { at: 1.5, viseme: 'viseme_ee' },
    { at: 2.05, viseme: 'viseme_mbp' },
    { at: 2.35, viseme: 'viseme_aa' },
    { at: 2.75, viseme: null },
  ]),
  family_cookie: line('family_cookie', 'A sweet cookie from Grandma!', 2100, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.25, viseme: 'viseme_ee' },
    { at: 0.65, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_fv' },
    { at: 1.45, viseme: 'viseme_aa' },
    { at: 1.75, viseme: 'viseme_mbp' },
    { at: 1.95, viseme: null },
  ]),
};
