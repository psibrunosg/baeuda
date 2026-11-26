import { line, type SpeechLine } from './line';

export type SchoolSpeechKey =
  | 'school_welcome'
  | 'school_pencil'
  | 'school_board'
  | 'school_globe'
  | 'school_science'
  | 'school_art'
  | 'school_homework'
  | 'school_backpack'
  | 'school_done'
  | 'school_week'
  | 'school_that_notebook'
  | 'school_that_pencil'
  | 'school_that_globe'
  | 'school_that_science'
  | 'school_that_art'
  | 'school_that_homework'
  | 'school_that_backpack';

export const SCHOOL_AUDIO_LINES: Record<SchoolSpeechKey, SpeechLine> = {
  school_welcome: line('school_welcome', 'Good morning! Today is Monday. Open the notebook on your desk.', 4200, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 1.3, viseme: 'viseme_ee' },
    { at: 2.1, viseme: 'viseme_aa' },
    { at: 2.8, viseme: 'viseme_oo' },
    { at: 3.5, viseme: 'viseme_ee' },
    { at: 4.05, viseme: null },
  ]),
  school_pencil: line('school_pencil', 'Now take your pencil.', 1700, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.4, viseme: 'viseme_ee' },
    { at: 0.8, viseme: 'viseme_oo' },
    { at: 1.1, viseme: 'viseme_mbp' },
    { at: 1.55, viseme: null },
  ]),
  school_board: line('school_board', 'Write Monday on the board.', 2100, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 1.0, viseme: 'viseme_ee' },
    { at: 1.5, viseme: 'viseme_mbp' },
    { at: 1.7, viseme: 'viseme_oo' },
    { at: 1.95, viseme: null },
  ]),
  school_globe: line('school_globe', 'Listen and repeat: globe.', 2200, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.5, viseme: 'viseme_aa' },
    { at: 0.9, viseme: 'viseme_mbp' },
    { at: 1.25, viseme: 'viseme_ee' },
    { at: 1.65, viseme: 'viseme_oo' },
    { at: 2.05, viseme: null },
  ]),
  school_science: line('school_science', 'Science time! Look at the microscope.', 2800, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.7, viseme: 'viseme_mbp' },
    { at: 1.2, viseme: 'viseme_oo' },
    { at: 1.8, viseme: 'viseme_mbp' },
    { at: 2.2, viseme: 'viseme_oo' },
    { at: 2.65, viseme: null },
  ]),
  school_art: line('school_art', 'Art time! Take the paint.', 2100, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_mbp' },
    { at: 1.05, viseme: 'viseme_ee' },
    { at: 1.55, viseme: 'viseme_mbp' },
    { at: 1.95, viseme: null },
  ]),
  school_homework: line('school_homework', 'Here is your homework. Take it.', 2300, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.55, viseme: 'viseme_oo' },
    { at: 1.0, viseme: 'viseme_mbp' },
    { at: 1.6, viseme: 'viseme_ee' },
    { at: 2.15, viseme: null },
  ]),
  school_backpack: line('school_backpack', 'Put your homework in your backpack.', 2500, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.4, viseme: 'viseme_oo' },
    { at: 1.0, viseme: 'viseme_mbp' },
    { at: 1.5, viseme: 'viseme_oo' },
    { at: 1.85, viseme: 'viseme_mbp' },
    { at: 2.1, viseme: 'viseme_aa' },
    { at: 2.35, viseme: null },
  ]),
  school_done: line('school_done', 'Great job! See you on Tuesday.', 2300, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.5, viseme: 'viseme_aa' },
    { at: 1.0, viseme: 'viseme_ee' },
    { at: 1.4, viseme: 'viseme_oo' },
    { at: 2.15, viseme: null },
  ]),
  school_week: line('school_week', 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.', 5600, [
    { at: 0.0, viseme: 'viseme_mbp' },
    { at: 0.75, viseme: 'viseme_oo' },
    { at: 1.55, viseme: 'viseme_ee' },
    { at: 2.35, viseme: 'viseme_oo' },
    { at: 3.15, viseme: 'viseme_fv' },
    { at: 3.95, viseme: 'viseme_aa' },
    { at: 4.75, viseme: 'viseme_aa' },
    { at: 5.45, viseme: null },
  ]),
  school_that_notebook: line('school_that_notebook', "That's your notebook.", 1600, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_oo' },
    { at: 0.9, viseme: 'viseme_mbp' },
    { at: 1.15, viseme: 'viseme_oo' },
    { at: 1.45, viseme: null },
  ]),
  school_that_pencil: line('school_that_pencil', "That's a pencil.", 1350, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 0.75, viseme: 'viseme_ee' },
    { at: 1.2, viseme: null },
  ]),
  school_that_globe: line('school_that_globe', "That's a globe.", 1300, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_oo' },
    { at: 0.95, viseme: 'viseme_mbp' },
    { at: 1.15, viseme: null },
  ]),
  school_that_science: line('school_that_science', "That's a microscope. It's for science.", 2900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 0.8, viseme: 'viseme_aa' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.7, viseme: 'viseme_ee' },
    { at: 2.0, viseme: 'viseme_fv' },
    { at: 2.3, viseme: 'viseme_aa' },
    { at: 2.75, viseme: null },
  ]),
  school_that_art: line('school_that_art', "That's paint. It's for art.", 2200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.4, viseme: 'viseme_mbp' },
    { at: 0.65, viseme: 'viseme_ee' },
    { at: 1.2, viseme: 'viseme_ee' },
    { at: 1.5, viseme: 'viseme_fv' },
    { at: 1.75, viseme: 'viseme_aa' },
    { at: 2.05, viseme: null },
  ]),
  school_that_homework: line('school_that_homework', "That's your homework.", 1550, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_oo' },
    { at: 0.85, viseme: 'viseme_mbp' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.4, viseme: null },
  ]),
  school_that_backpack: line('school_that_backpack', "That's your backpack.", 1550, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_oo' },
    { at: 0.8, viseme: 'viseme_mbp' },
    { at: 1.1, viseme: 'viseme_aa' },
    { at: 1.4, viseme: null },
  ]),
};
