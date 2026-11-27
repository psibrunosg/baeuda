import type { SpeechKey } from './types';

export type PetShopItem = 'dog' | 'bowl' | 'tub' | 'cat' | 'brush' | 'ball';
export type PetShopTarget = 'vet' | PetShopItem | 'collar' | 'stethoscope';

/** `step` indexes VISIT_ORDER; past the end means the visit is done. */
export interface PetShopState {
  step: number;
}

export interface PetShopTap {
  state: PetShopState;
  say: SpeechKey;
  wrong: boolean;
}

export const VISIT_ORDER: readonly PetShopItem[] = ['dog', 'bowl', 'tub', 'cat', 'brush', 'ball'];

export const INITIAL: PetShopState = { step: 0 };

const PROMPTS: Record<PetShopItem, SpeechKey> = {
  dog: 'petshop_welcome',
  bowl: 'petshop_ask_feed',
  tub: 'petshop_ask_wash',
  cat: 'petshop_ask_cat',
  brush: 'petshop_ask_brush',
  ball: 'petshop_ask_play',
};

/** The animal each action request names: tapping it shows the learner knew the word, so it is no mistake. */
const NAMED: Partial<Record<PetShopItem, PetShopItem>> = {
  bowl: 'dog',
  tub: 'dog',
  brush: 'cat',
  ball: 'dog',
};

export function expectedTarget({ step }: PetShopState): PetShopItem | null {
  return VISIT_ORDER[step] ?? null;
}

export function promptKey(state: PetShopState): SpeechKey {
  const expected = expectedTarget(state);
  return expected === null ? 'pet_shop_done' : PROMPTS[expected];
}

export function reached({ step }: PetShopState, target: PetShopItem): boolean {
  return VISIT_ORDER.indexOf(target) < step;
}

export function tap(state: PetShopState, target: PetShopTarget): PetShopTap {
  const expected = expectedTarget(state);
  if (target === expected) {
    const next = { step: state.step + 1 };
    return { state: next, say: promptKey(next), wrong: false };
  }
  if (target === 'vet') {
    const next = expected === null ? INITIAL : state;
    return { state: next, say: promptKey(next), wrong: false };
  }
  if (expected && NAMED[expected] === target) {
    return { state, say: promptKey(state), wrong: false };
  }
  return { state, say: `petshop_that_${target}`, wrong: expected !== null };
}

/** A double tap must not count as a mistake, nor talk over the final "great job". */
export function isRepeatTap(
  last: { target: PetShopTarget; at: number } | null,
  target: PetShopTarget,
  done: boolean,
  now: number,
): boolean {
  return last?.target === target && now - last.at < (done ? 2500 : 700);
}
