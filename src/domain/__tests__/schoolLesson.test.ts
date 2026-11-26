import { describe, expect, it } from 'vitest';
import { SCHOOL_AUDIO_LINES } from '../../content/speech/school';
import {
  expectedTarget,
  INITIAL,
  isRepeatTap,
  LESSON_ORDER,
  promptKey,
  reached,
  tap,
} from '../schoolLesson';

const DONE = { step: LESSON_ORDER.length };

describe('schoolLesson', () => {
  it('goes through the whole lesson in order', () => {
    let state = INITIAL;
    expect(promptKey(state)).toBe('school_welcome');
    const said = LESSON_ORDER.map((target) => {
      expect(expectedTarget(state)).toBe(target);
      expect(reached(state, target)).toBe(false);
      const result = tap(state, target);
      expect(result.wrong).toBe(false);
      state = result.state;
      expect(reached(state, target)).toBe(true);
      return result.say;
    });

    expect(said).toEqual([
      'school_pencil',
      'school_board',
      'school_globe',
      'school_science',
      'school_art',
      'school_homework',
      'school_backpack',
      'school_done',
    ]);
    expect(state).toEqual(DONE);
    expect(expectedTarget(state)).toBeNull();
  });

  it('names a wrong object without advancing, and only counts it during the lesson', () => {
    for (const target of LESSON_ORDER) {
      if (target === 'board') continue;
      const say = `school_that_${target}`;
      // O passo seguinte ao alvo garante que ele está fora da vez.
      const state = { step: (LESSON_ORDER.indexOf(target) + 1) % LESSON_ORDER.length };
      expect(tap(state, target)).toEqual({ state, say, wrong: true });
      expect(tap(DONE, target)).toEqual({ state: DONE, say, wrong: false });
    }
  });

  it('says the week for the board out of turn, never as a mistake', () => {
    for (const state of [INITIAL, { step: 5 }, DONE]) {
      expect(tap(state, 'board')).toEqual({ state, say: 'school_week', wrong: false });
    }
  });

  it('repeats the request for the teacher and restarts when done', () => {
    for (let step = 0; step < LESSON_ORDER.length; step++) {
      const state = { step };
      expect(tap(state, 'teacher')).toEqual({ state, say: promptKey(state), wrong: false });
    }
    expect(tap(DONE, 'teacher')).toEqual({ state: INITIAL, say: 'school_welcome', wrong: false });
  });

  it('ignores a double tap, for longer when the lesson is done', () => {
    const last = { target: 'backpack' as const, at: 1000 };
    expect(isRepeatTap(null, 'backpack', true, 1000)).toBe(false);
    expect(isRepeatTap(last, 'backpack', false, 1699)).toBe(true);
    expect(isRepeatTap(last, 'backpack', false, 1700)).toBe(false);
    expect(isRepeatTap(last, 'backpack', true, 3499)).toBe(true);
    expect(isRepeatTap(last, 'backpack', true, 3500)).toBe(false);
    expect(isRepeatTap(last, 'teacher', false, 1100)).toBe(false);
  });

  it('speaks the school vocabulary', () => {
    const phrases = Object.values(SCHOOL_AUDIO_LINES)
      .map((line) => line.phrase)
      .join(' ')
      .toLowerCase();
    const words = [
      'desk', 'board', 'notebook', 'pencil', 'globe', 'science', 'art', 'homework',
      'open', 'write', 'listen', 'repeat',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ];
    for (const word of words) {
      expect(phrases).toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});
