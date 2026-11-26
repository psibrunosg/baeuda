import { describe, expect, it } from 'vitest';
import { AUDIO_MANIFEST } from '../../content/audioManifest';
import {
  baked,
  BASKET_ORDER,
  expectedTarget,
  INITIAL,
  isRepeatTap,
  promptKey,
  tap,
  type BakeryState,
  type BakeryTarget,
} from '../bakeryBasket';

const BAKING: BakeryState = { stage: 'baking', packed: 0 };
const READY: BakeryState = { stage: 'ready', packed: 0 };
const BASKET: BakeryState = { stage: 'basket', packed: 0 };
const RING: BakeryState = { stage: 'ring', packed: 4 };
const DONE: BakeryState = { stage: 'done', packed: 4 };
const ALL_TARGETS: BakeryTarget[] = ['dough', 'oven', 'bell', 'baker', ...BASKET_ORDER];

describe('bakeryBasket', () => {
  it('goes from dough to done and restarts with the bell', () => {
    let state = INITIAL;
    const play = (target: BakeryTarget) => {
      expect(expectedTarget(state)).toBe(target);
      const result = tap(state, target);
      expect(result.wrong).toBe(false);
      state = result.state;
      return result.say;
    };

    expect(play('dough')).toBe('bakery_baking');
    expect(expectedTarget(state)).toBeNull();
    const oven = baked(state);
    expect(oven.say).toBe('bakery_ready');
    state = oven.state;
    expect(play('oven')).toBe('bakery_ask_bread');
    expect(play('bread')).toBe('bakery_ask_butter');
    expect(play('butter')).toBe('bakery_ask_croissant');
    expect(play('croissant')).toBe('bakery_ask_slice');
    expect(play('slice')).toBe('bakery_ring');
    expect(play('bell')).toBe('bakery_done');
    expect(state.stage).toBe('done');
    expect(expectedTarget(state)).toBeNull();

    expect(tap(state, 'bell')).toEqual({ state: INITIAL, say: 'bakery_welcome', wrong: false });
  });

  it('names a wrong item without advancing', () => {
    expect(tap(BASKET, 'croissant')).toEqual({
      state: BASKET,
      say: 'bakery_that_croissant',
      wrong: true,
    });
    for (const state of [INITIAL, READY, RING]) {
      expect(tap(state, 'butter')).toEqual({ state, say: 'bakery_that_butter', wrong: true });
    }
    expect(tap(DONE, 'slice')).toEqual({ state: DONE, say: 'bakery_that_slice', wrong: false });
  });

  it('only leaves the oven by time', () => {
    for (const target of ALL_TARGETS) {
      expect(tap(BAKING, target)).toEqual({ state: BAKING, say: 'bakery_baking', wrong: false });
    }
    expect(baked(BAKING).state).toEqual(READY);
    for (const state of [INITIAL, READY, BASKET, RING, DONE]) {
      expect(baked(state)).toEqual({ state, say: null });
    }
  });

  it('repeats the current request for the baker and out of turn taps', () => {
    for (const state of [INITIAL, BAKING, READY, BASKET, RING, DONE]) {
      expect(tap(state, 'baker')).toEqual({ state, say: promptKey(state), wrong: false });
    }
    expect(tap(BASKET, 'oven')).toEqual({ state: BASKET, say: 'bakery_ask_bread', wrong: false });
    expect(tap(READY, 'dough')).toEqual({ state: READY, say: 'bakery_ready', wrong: false });
    expect(tap(BASKET, 'bell')).toEqual({ state: BASKET, say: 'bakery_ask_bread', wrong: false });
  });

  it('ignores a double tap, for longer on the bell that ended the round', () => {
    const last = { target: 'bell' as const, at: 1000 };
    expect(isRepeatTap(null, 'bell', 'done', 1000)).toBe(false);
    expect(isRepeatTap(last, 'bell', 'basket', 1400)).toBe(true);
    expect(isRepeatTap(last, 'bell', 'basket', 1800)).toBe(false);
    expect(isRepeatTap(last, 'bell', 'done', 3000)).toBe(true);
    expect(isRepeatTap(last, 'bell', 'done', 3600)).toBe(false);
    expect(isRepeatTap(last, 'butter', 'basket', 1100)).toBe(false);
  });

  it('speaks the bakery vocabulary', () => {
    const phrases = Object.entries(AUDIO_MANIFEST)
      .filter(([key]) => key.startsWith('bakery_'))
      .map(([, line]) => line.phrase)
      .join(' ')
      .toLowerCase();
    for (const word of ['bread', 'warm', 'fresh', 'crust', 'sweet', 'butter', 'slice', 'bake']) {
      expect(phrases).toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});
