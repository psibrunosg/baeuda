import type { SpeechKey } from './types';

export type BakeryItem = 'bread' | 'butter' | 'croissant' | 'slice';
export type BakeryTarget = 'dough' | 'oven' | 'bell' | 'baker' | BakeryItem;
export type BakeryStage = 'dough' | 'baking' | 'ready' | 'basket' | 'ring' | 'done';

export interface BakeryState {
  stage: BakeryStage;
  packed: number;
}

export interface BakeryTap {
  state: BakeryState;
  say: SpeechKey;
  wrong: boolean;
}

export const BASKET_ORDER: readonly BakeryItem[] = ['bread', 'butter', 'croissant', 'slice'];

export const INITIAL: BakeryState = { stage: 'dough', packed: 0 };

export function expectedTarget({ stage, packed }: BakeryState): BakeryTarget | null {
  switch (stage) {
    case 'dough':
      return 'dough';
    case 'ready':
      return 'oven';
    case 'basket':
      return BASKET_ORDER[packed];
    case 'ring':
      return 'bell';
    default:
      return null;
  }
}

export function promptKey({ stage, packed }: BakeryState): SpeechKey {
  if (stage === 'dough') return 'bakery_welcome';
  if (stage === 'basket') return `bakery_ask_${BASKET_ORDER[packed]}`;
  return `bakery_${stage}`;
}

function advance({ stage, packed }: BakeryState): BakeryState {
  switch (stage) {
    case 'dough':
      return { stage: 'baking', packed };
    case 'ready':
      return { stage: 'basket', packed };
    case 'basket':
      return { stage: packed + 1 < BASKET_ORDER.length ? 'basket' : 'ring', packed: packed + 1 };
    case 'ring':
      return { stage: 'done', packed };
    default:
      return INITIAL;
  }
}

export function tap(state: BakeryState, target: BakeryTarget): BakeryTap {
  const stay = (say: SpeechKey, wrong = false): BakeryTap => ({ state, say, wrong });
  // O forno só avança por tempo (baked), então qualquer toque repete o pedido.
  if (target === 'baker' || state.stage === 'baking') return stay(promptKey(state));

  const expected = expectedTarget(state);
  if (target === expected || (state.stage === 'done' && target === 'bell')) {
    const next = advance(state);
    return { state: next, say: promptKey(next), wrong: false };
  }
  if (target === 'dough' || target === 'oven' || target === 'bell') return stay(promptKey(state));
  return stay(`bakery_that_${target}`, expected !== null);
}

/** A double tap must not count as a mistake, nor restart the round over the final "thank you". */
export function isRepeatTap(
  last: { target: BakeryTarget; at: number } | null,
  target: BakeryTarget,
  stage: BakeryStage,
  now: number,
): boolean {
  return last?.target === target && now - last.at < (stage === 'done' ? 2500 : 700);
}

export function baked(state: BakeryState): { state: BakeryState; say: SpeechKey | null } {
  if (state.stage !== 'baking') return { state, say: null };
  return { state: { ...state, stage: 'ready' }, say: 'bakery_ready' };
}
