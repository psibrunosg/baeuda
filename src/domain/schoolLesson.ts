import type { SpeechKey } from './types';

export type SchoolItem =
  | 'notebook'
  | 'pencil'
  | 'board'
  | 'globe'
  | 'science'
  | 'art'
  | 'homework'
  | 'backpack';
export type SchoolTarget = 'teacher' | SchoolItem;

/** `step` indexes LESSON_ORDER; past the end means the lesson is done. */
export interface SchoolState {
  step: number;
}

export interface SchoolTap {
  state: SchoolState;
  say: SpeechKey;
  wrong: boolean;
}

export const LESSON_ORDER: readonly SchoolItem[] = [
  'notebook',
  'pencil',
  'board',
  'globe',
  'science',
  'art',
  'homework',
  'backpack',
];

export const INITIAL: SchoolState = { step: 0 };

export function expectedTarget({ step }: SchoolState): SchoolItem | null {
  return LESSON_ORDER[step] ?? null;
}

export function promptKey(state: SchoolState): SpeechKey {
  const expected = expectedTarget(state);
  if (expected === null) return 'school_done';
  return expected === 'notebook' ? 'school_welcome' : `school_${expected}`;
}

export function reached({ step }: SchoolState, target: SchoolItem): boolean {
  return LESSON_ORDER.indexOf(target) < step;
}

export function tap(state: SchoolState, target: SchoolTarget): SchoolTap {
  const expected = expectedTarget(state);
  if (target === expected) {
    const next = { step: state.step + 1 };
    return { state: next, say: promptKey(next), wrong: false };
  }
  if (target === 'teacher') {
    const next = expected === null ? INITIAL : state;
    return { state: next, say: promptKey(next), wrong: false };
  }
  // O quadro fora da vez ensina os dias da semana, então não conta como erro.
  if (target === 'board') return { state, say: 'school_week', wrong: false };
  return { state, say: `school_that_${target}`, wrong: expected !== null };
}

/** A double tap must not count as a mistake, nor talk over the final "great job". */
export function isRepeatTap(
  last: { target: SchoolTarget; at: number } | null,
  target: SchoolTarget,
  done: boolean,
  now: number,
): boolean {
  return last?.target === target && now - last.at < (done ? 2500 : 700);
}
