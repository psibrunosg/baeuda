import type { SpeechKey } from './types';

export type FamilyTime = 'morning' | 'afternoon' | 'night';
export type FamilyTarget = 'bed' | 'stove' | 'washer' | 'desk' | 'clock';
export type FamilyPerson = 'mother' | 'grandma' | 'brother';

export interface FamilyState {
  /** null: free play; ROUTINE.length: routine finished. */
  step: number | null;
  time: FamilyTime;
}

export interface FamilyTap {
  state: FamilyState;
  say: SpeechKey;
  wrong: boolean;
}

export const ROUTINE: readonly { target: FamilyTarget; time: FamilyTime; say: SpeechKey }[] = [
  { target: 'bed', time: 'morning', say: 'family_wake' },
  { target: 'stove', time: 'morning', say: 'family_cook' },
  { target: 'clock', time: 'morning', say: 'family_to_afternoon' },
  { target: 'washer', time: 'afternoon', say: 'family_clean' },
  { target: 'desk', time: 'afternoon', say: 'family_study' },
  { target: 'clock', time: 'afternoon', say: 'family_to_night' },
  { target: 'bed', time: 'night', say: 'family_sleep' },
];

const NEXT_TIME: Record<FamilyTime, FamilyTime> = {
  morning: 'afternoon',
  afternoon: 'night',
  night: 'morning',
};

export function initialState(timeOfDay: 'day' | 'night'): FamilyState {
  return { step: null, time: timeOfDay === 'night' ? 'night' : 'morning' };
}

export function isActive(state: FamilyState): state is FamilyState & { step: number } {
  return state.step !== null && state.step < ROUTINE.length;
}

export function expectedTarget(state: FamilyState): FamilyTarget | null {
  return isActive(state) ? ROUTINE[state.step].target : null;
}

export function tapPerson(state: FamilyState, person: FamilyPerson): FamilyTap {
  if (person !== 'mother') return { state, say: `family_${person}`, wrong: false };
  if (isActive(state)) return { state, say: ROUTINE[state.step].say, wrong: false };
  return { state: { step: 0, time: 'morning' }, say: ROUTINE[0].say, wrong: false };
}

const nameOf = (target: FamilyTarget, time: FamilyTime): SpeechKey =>
  target === 'clock' ? `family_time_${time}` : `family_that_${target}`;

export function tapTarget(state: FamilyState, target: FamilyTarget): FamilyTap {
  if (!isActive(state)) {
    const next = target === 'clock' ? { ...state, time: NEXT_TIME[state.time] } : state;
    return { state: next, say: nameOf(target, next.time), wrong: false };
  }
  if (target !== ROUTINE[state.step].target) {
    return { state, say: nameOf(target, state.time), wrong: true };
  }
  const step = state.step + 1;
  if (step === ROUTINE.length) {
    return { state: { ...state, step }, say: 'family_done', wrong: false };
  }
  const { time, say } = ROUTINE[step];
  return { state: { step, time }, say, wrong: false };
}

export function finish(state: FamilyState): FamilyState {
  return state.step === ROUTINE.length ? { ...state, step: null } : state;
}

/** A double tap must not count as a mistake. */
export function isRepeatTap(
  last: { target: string; at: number } | null,
  target: string,
  now: number,
): boolean {
  return last?.target === target && now - last.at < 700;
}
