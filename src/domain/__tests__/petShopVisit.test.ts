import { describe, expect, it } from 'vitest';
import { PET_SHOP_AUDIO_LINES } from '../../content/speech/petShop';
import { expectedTarget, INITIAL, isRepeatTap, promptKey, reached, tap, VISIT_ORDER } from '../petShopVisit';

const DONE = { step: VISIT_ORDER.length };

describe('petShopVisit', () => {
  it('goes through the six steps in order', () => {
    let state = INITIAL;
    expect(promptKey(state)).toBe('petshop_welcome');
    const said = VISIT_ORDER.map((target) => {
      expect(expectedTarget(state)).toBe(target);
      expect(reached(state, target)).toBe(false);
      const result = tap(state, target);
      expect(result.wrong).toBe(false);
      state = result.state;
      expect(reached(state, target)).toBe(true);
      return result.say;
    });

    expect(said).toEqual([
      'petshop_ask_feed',
      'petshop_ask_wash',
      'petshop_ask_cat',
      'petshop_ask_brush',
      'petshop_ask_play',
      'pet_shop_done',
    ]);
    expect(state).toEqual(DONE);
    expect(expectedTarget(state)).toBeNull();
  });

  it('names a wrong object without advancing, and only counts it during the visit', () => {
    // At the cat step nothing but the cat is named in the request.
    const state = { step: VISIT_ORDER.indexOf('cat') };
    for (const target of [...VISIT_ORDER, 'collar', 'stethoscope'] as const) {
      const say = `petshop_that_${target}`;
      if (target !== 'cat') expect(tap(state, target)).toEqual({ state, say, wrong: true });
      expect(tap(DONE, target)).toEqual({ state: DONE, say, wrong: false });
    }
    expect(tap(INITIAL, 'cat')).toEqual({ state: INITIAL, say: 'petshop_that_cat', wrong: true });
  });

  it('repeats the request, without a mistake, when the animal it names is tapped', () => {
    for (const [item, animal] of [['bowl', 'dog'], ['tub', 'dog'], ['brush', 'cat'], ['ball', 'dog']] as const) {
      const state = { step: VISIT_ORDER.indexOf(item) };
      expect(tap(state, animal)).toEqual({ state, say: promptKey(state), wrong: false });
    }
  });

  it('repeats the request for the vet and restarts when done', () => {
    for (let step = 0; step < VISIT_ORDER.length; step++) {
      const state = { step };
      expect(tap(state, 'vet')).toEqual({ state, say: promptKey(state), wrong: false });
    }
    expect(tap(DONE, 'vet')).toEqual({ state: INITIAL, say: 'petshop_welcome', wrong: false });
  });

  it('ignores a double tap, for longer when the visit is done', () => {
    const last = { target: 'ball' as const, at: 1000 };
    expect(isRepeatTap(null, 'ball', true, 1000)).toBe(false);
    expect(isRepeatTap(last, 'ball', false, 1699)).toBe(true);
    expect(isRepeatTap(last, 'ball', false, 1700)).toBe(false);
    expect(isRepeatTap(last, 'ball', true, 3499)).toBe(true);
    expect(isRepeatTap(last, 'ball', true, 3500)).toBe(false);
    expect(isRepeatTap(last, 'vet', false, 1100)).toBe(false);
  });

  it('speaks the pet shop vocabulary without feeding the street badge', () => {
    const phrases = Object.values(PET_SHOP_AUDIO_LINES)
      .map((line) => line.phrase)
      .join(' ')
      .toLowerCase();
    for (const word of ['dog', 'cat', 'feed', 'wash', 'brush', 'play', 'happy', 'gentle']) {
      expect(phrases).toMatch(new RegExp(`\\b${word}\\b`));
    }
    for (const key of Object.keys(PET_SHOP_AUDIO_LINES)) expect(key.startsWith('world_')).toBe(false);
  });
});
