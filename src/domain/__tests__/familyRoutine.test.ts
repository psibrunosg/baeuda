import { describe, expect, it } from 'vitest';
import { FAMILY_HOME_AUDIO_LINES } from '../../content/speech/familyHome';
import {
  expectedTarget,
  finish,
  initialState,
  isActive,
  isRepeatTap,
  ROUTINE,
  tapPerson,
  tapTarget,
  type FamilyPerson,
  type FamilyState,
  type FamilyTarget,
  type FamilyTime,
} from '../familyRoutine';

const TARGETS: FamilyTarget[] = ['bed', 'stove', 'washer', 'desk', 'clock'];
const PEOPLE: FamilyPerson[] = ['mother', 'grandma', 'brother'];
const TIMES: FamilyTime[] = ['morning', 'afternoon', 'night'];
const ACTIVE: FamilyState[] = ROUTINE.map(({ time }, step) => ({ step, time }));
const DONE: FamilyState = { step: ROUTINE.length, time: 'night' };

describe('familyRoutine', () => {
  it('starts free, following the time of day', () => {
    expect(initialState('day')).toEqual({ step: null, time: 'morning' });
    expect(initialState('night')).toEqual({ step: null, time: 'night' });
    expect(expectedTarget(initialState('day'))).toBeNull();
    expect(isActive(initialState('day'))).toBe(false);
  });

  it('goes from the mother to the end of the day, then finishes', () => {
    const start = tapPerson(initialState('night'), 'mother');
    expect(start).toEqual({ state: { step: 0, time: 'morning' }, say: 'family_wake', wrong: false });
    let state = start.state;
    const play = (target: FamilyTarget) => {
      expect(isActive(state)).toBe(true);
      expect(expectedTarget(state)).toBe(target);
      const result = tapTarget(state, target);
      expect(result.wrong).toBe(false);
      state = result.state;
      return [result.say, state.time];
    };

    expect(play('bed')).toEqual(['family_cook', 'morning']);
    expect(play('stove')).toEqual(['family_to_afternoon', 'morning']);
    expect(play('clock')).toEqual(['family_clean', 'afternoon']);
    expect(play('washer')).toEqual(['family_study', 'afternoon']);
    expect(play('desk')).toEqual(['family_to_night', 'afternoon']);
    expect(play('clock')).toEqual(['family_sleep', 'night']);
    expect(play('bed')).toEqual(['family_done', 'night']);

    expect(state).toEqual(DONE);
    expect(isActive(state)).toBe(false);
    expect(expectedTarget(state)).toBeNull();
    expect(finish(state)).toEqual({ step: null, time: 'night' });
  });

  it('only finishes a completed routine', () => {
    for (const state of [initialState('day'), ...ACTIVE]) {
      expect(finish(state)).toBe(state);
    }
  });

  it('recasts a wrong target without advancing', () => {
    for (const state of ACTIVE) {
      for (const target of TARGETS.filter((t) => t !== expectedTarget(state))) {
        const result = tapTarget(state, target);
        expect(result.state).toBe(state);
        expect(result.wrong).toBe(true);
        expect(result.say).toBe(
          target === 'clock' ? `family_time_${state.time}` : `family_that_${target}`,
        );
      }
    }
  });

  it('cycles the clock in free play and keeps a finished routine finished', () => {
    for (const step of [null, ROUTINE.length]) {
      let state: FamilyState = { step, time: 'morning' };
      for (const time of ['afternoon', 'night', 'morning'] as const) {
        const result = tapTarget(state, 'clock');
        expect(result).toEqual({ state: { step, time }, say: `family_time_${time}`, wrong: false });
        state = result.state;
      }
      expect(tapTarget(state, 'desk')).toEqual({ state, say: 'family_that_desk', wrong: false });
    }
  });

  it('lets the mother restart and repeat the current request', () => {
    for (const state of [initialState('day'), DONE]) {
      expect(tapPerson(state, 'mother')).toEqual({
        state: { step: 0, time: 'morning' },
        say: 'family_wake',
        wrong: false,
      });
    }
    for (const state of ACTIVE) {
      const result = tapPerson(state, 'mother');
      expect(result.state).toBe(state);
      expect(result.say).toBe(ROUTINE[state.step as number].say);
    }
  });

  it('lets grandma and brother talk without changing anything', () => {
    for (const state of [initialState('day'), ...ACTIVE, DONE]) {
      for (const person of ['grandma', 'brother'] as const) {
        const result = tapPerson(state, person);
        expect(result.state).toBe(state);
        expect(result.say).toBe(`family_${person}`);
        expect(result.wrong).toBe(false);
      }
    }
  });

  it('ignores a double tap on the same target', () => {
    const last = { target: 'bed', at: 1000 };
    expect(isRepeatTap(null, 'bed', 1000)).toBe(false);
    expect(isRepeatTap(last, 'bed', 1699)).toBe(true);
    expect(isRepeatTap(last, 'bed', 1700)).toBe(false);
    expect(isRepeatTap(last, 'stove', 1100)).toBe(false);
  });

  it('only says lines that exist', () => {
    const states = [
      ...TIMES.flatMap((time) => [{ step: null, time }, { step: ROUTINE.length, time }]),
      ...ROUTINE.flatMap((_, step) => TIMES.map((time) => ({ step, time }))),
    ];
    const said = states.flatMap((state) => [
      ...TARGETS.map((target) => tapTarget(state, target).say),
      ...PEOPLE.map((person) => tapPerson(state, person).say),
    ]);
    for (const key of [...said, ...ROUTINE.map((step) => step.say)]) {
      expect(FAMILY_HOME_AUDIO_LINES).toHaveProperty(key);
    }
  });
});
