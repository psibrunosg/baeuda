import type { SpeechKey } from './types';

export type BookshopItem = 'book' | 'notebook' | 'pen' | 'storybook';
export type BookshopTarget = 'librarian' | BookshopItem | 'pencil' | 'globe';

/** `step` indexes VISIT_ORDER; past the end means the visit is done. */
export interface BookshopState {
  step: number;
}

export interface BookshopTap {
  state: BookshopState;
  say: SpeechKey;
  wrong: boolean;
}

export const VISIT_ORDER: readonly BookshopItem[] = ['book', 'notebook', 'pen', 'storybook'];

export const INITIAL: BookshopState = { step: 0 };

const PROMPTS: Record<BookshopItem, SpeechKey> = {
  book: 'bookshop_welcome',
  notebook: 'bookshop_ask_notebook',
  pen: 'bookshop_ask_pen',
  storybook: 'bookshop_ask_read',
};

export function expectedTarget({ step }: BookshopState): BookshopItem | null {
  return VISIT_ORDER[step] ?? null;
}

export function promptKey(state: BookshopState): SpeechKey {
  const expected = expectedTarget(state);
  return expected === null ? 'bookshop_done' : PROMPTS[expected];
}

export function reached({ step }: BookshopState, target: BookshopItem): boolean {
  return VISIT_ORDER.indexOf(target) < step;
}

export function tap(state: BookshopState, target: BookshopTarget): BookshopTap {
  const expected = expectedTarget(state);
  if (target === expected) {
    const next = { step: state.step + 1 };
    return { state: next, say: promptKey(next), wrong: false };
  }
  if (target === 'librarian') {
    const next = expected === null ? INITIAL : state;
    return { state: next, say: promptKey(next), wrong: false };
  }
  return { state, say: `bookshop_that_${target}`, wrong: expected !== null };
}

/** A double tap must not count as a mistake, nor talk over the final "great reading". */
export function isRepeatTap(
  last: { target: BookshopTarget; at: number } | null,
  target: BookshopTarget,
  done: boolean,
  now: number,
): boolean {
  return last?.target === target && now - last.at < (done ? 2500 : 700);
}
