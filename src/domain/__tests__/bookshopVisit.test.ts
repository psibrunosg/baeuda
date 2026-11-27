import { describe, expect, it } from 'vitest';
import { BOOKSHOP_AUDIO_LINES } from '../../content/speech/bookshop';
import { expectedTarget, INITIAL, isRepeatTap, promptKey, reached, tap, VISIT_ORDER } from '../bookshopVisit';

const DONE = { step: VISIT_ORDER.length };

describe('bookshopVisit', () => {
  it('goes through the four steps in order', () => {
    let state = INITIAL;
    expect(promptKey(state)).toBe('bookshop_welcome');
    const said = VISIT_ORDER.map((target) => {
      expect(expectedTarget(state)).toBe(target);
      expect(reached(state, target)).toBe(false);
      const result = tap(state, target);
      expect(result.wrong).toBe(false);
      state = result.state;
      expect(reached(state, target)).toBe(true);
      return result.say;
    });

    expect(said).toEqual(['bookshop_ask_notebook', 'bookshop_ask_pen', 'bookshop_ask_read', 'bookshop_done']);
    expect(state).toEqual(DONE);
    expect(expectedTarget(state)).toBeNull();
  });

  it('names a wrong object without advancing, and only counts it during the visit', () => {
    for (const target of [...VISIT_ORDER, 'pencil', 'globe'] as const) {
      const say = `bookshop_that_${target}`;
      // O passo seguinte ao alvo garante que ele está fora da vez; distratores nunca são a vez.
      const state = { step: (VISIT_ORDER.indexOf(target as never) + 1) % VISIT_ORDER.length };
      expect(tap(state, target)).toEqual({ state, say, wrong: true });
      expect(tap(DONE, target)).toEqual({ state: DONE, say, wrong: false });
    }
  });

  it('repeats the request for the librarian and restarts when done', () => {
    for (let step = 0; step < VISIT_ORDER.length; step++) {
      const state = { step };
      expect(tap(state, 'librarian')).toEqual({ state, say: promptKey(state), wrong: false });
    }
    expect(tap(DONE, 'librarian')).toEqual({ state: INITIAL, say: 'bookshop_welcome', wrong: false });
  });

  it('ignores a double tap, for longer when the visit is done', () => {
    const last = { target: 'storybook' as const, at: 1000 };
    expect(isRepeatTap(null, 'storybook', true, 1000)).toBe(false);
    expect(isRepeatTap(last, 'storybook', false, 1699)).toBe(true);
    expect(isRepeatTap(last, 'storybook', false, 1700)).toBe(false);
    expect(isRepeatTap(last, 'storybook', true, 3499)).toBe(true);
    expect(isRepeatTap(last, 'storybook', true, 3500)).toBe(false);
    expect(isRepeatTap(last, 'librarian', false, 1100)).toBe(false);
  });

  it('speaks the bookshop vocabulary', () => {
    const phrases = Object.values(BOOKSHOP_AUDIO_LINES)
      .map((line) => line.phrase)
      .join(' ')
      .toLowerCase();
    for (const word of ['book', 'notebook', 'pen', 'read', 'write', 'story', 'page', 'chapter']) {
      expect(phrases).toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});
