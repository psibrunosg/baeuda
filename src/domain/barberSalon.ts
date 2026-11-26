import type { BarberSpeechKey } from '../content/speech/barber';
import { isRepeatTap as isBakeryRepeatTap } from './bakeryBasket';

export type BarberItem = 'comb' | 'scissors' | 'curly' | 'straight' | 'long' | 'short' | 'beard';
export type BarberTarget = BarberItem | 'barber' | 'mirror';
/** Each stage is named after the one thing to tap, so the stage is the whole state. */
export type BarberStage = BarberItem | 'done';

export interface BarberTap {
  state: BarberStage;
  say: BarberSpeechKey;
  wrong: boolean;
  /** The job is over and the barber was tapped: open the barber travel dialogue. */
  travel: boolean;
}

export const BARBER_ORDER: readonly BarberItem[] = [
  'comb',
  'scissors',
  'curly',
  'straight',
  'long',
  'short',
  'beard',
];

export const INITIAL: BarberStage = 'comb';

export function expectedTarget(state: BarberStage): BarberItem | null {
  return state === 'done' ? null : state;
}

export function promptKey(state: BarberStage): BarberSpeechKey {
  if (state === 'comb') return 'barber_welcome';
  if (state === 'done') return 'barber_done';
  return `barber_ask_${state}`;
}

/** The mirror opens the wardrobe and is not part of the task, so it never reaches the machine. */
export function tap(state: BarberStage, target: Exclude<BarberTarget, 'mirror'>): BarberTap {
  if (target === 'barber') {
    return { state, say: promptKey(state), wrong: false, travel: state === 'done' };
  }
  if (target === state) {
    const next = BARBER_ORDER[BARBER_ORDER.indexOf(target) + 1] ?? 'done';
    return { state: next, say: promptKey(next), wrong: false, travel: false };
  }
  return { state, say: `barber_that_${target}`, wrong: state !== 'done', travel: false };
}

/** Same double tap rule as the bakery, whose function only compares the values it receives. */
const isSharedRepeatTap = isBakeryRepeatTap as unknown as (
  last: { target: BarberTarget; at: number } | null,
  target: BarberTarget,
  stage: BarberStage,
  now: number,
) => boolean;

/** Once done the barber only opens the dialogue, so a quick tap after closing it must count. */
export const isRepeatTap: typeof isSharedRepeatTap = (last, target, stage, now) =>
  !(target === 'barber' && stage === 'done') && isSharedRepeatTap(last, target, stage, now);
