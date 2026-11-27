import { line, type SpeechLine } from './line';

export type BookshopSpeechKey =
  | 'bookshop_welcome'
  | 'bookshop_ask_notebook'
  | 'bookshop_ask_pen'
  | 'bookshop_ask_read'
  | 'bookshop_done'
  | 'bookshop_that_book'
  | 'bookshop_that_notebook'
  | 'bookshop_that_pen'
  | 'bookshop_that_storybook'
  | 'bookshop_that_pencil'
  | 'bookshop_that_globe'
  | 'bookshop_word_read'
  | 'bookshop_word_write'
  | 'bookshop_word_story'
  | 'bookshop_word_page'
  | 'bookshop_word_chapter';

export const BOOKSHOP_AUDIO_LINES: Record<BookshopSpeechKey, SpeechLine> = {
  bookshop_welcome: line('bookshop_welcome', 'Hello! Please take the red book from the shelf.', 2700, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.65, viseme: 'viseme_ee' },
    { at: 1.3, viseme: 'viseme_mbp' },
    { at: 1.95, viseme: 'viseme_fv' },
    { at: 2.55, viseme: null },
  ]),
  bookshop_ask_notebook: line('bookshop_ask_notebook', 'Now take a notebook.', 1600, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_ee' },
    { at: 0.95, viseme: 'viseme_oo' },
    { at: 1.45, viseme: null },
  ]),
  bookshop_ask_pen: line('bookshop_ask_pen', 'Take a pen. You can write with it.', 2500, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.55, viseme: 'viseme_mbp' },
    { at: 1.1, viseme: 'viseme_oo' },
    { at: 1.75, viseme: 'viseme_aa' },
    { at: 2.35, viseme: null },
  ]),
  bookshop_ask_read: line('bookshop_ask_read', 'Read chapter one. Turn the page of the story.', 3200, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.6, viseme: 'viseme_aa' },
    { at: 1.4, viseme: 'viseme_oo' },
    { at: 1.95, viseme: 'viseme_mbp' },
    { at: 2.5, viseme: 'viseme_oo' },
    { at: 3.05, viseme: null },
  ]),
  bookshop_done: line('bookshop_done', 'Great reading! Enjoy your new book.', 2500, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.65, viseme: 'viseme_ee' },
    { at: 1.2, viseme: 'viseme_oo' },
    { at: 1.85, viseme: 'viseme_mbp' },
    { at: 2.35, viseme: null },
  ]),
  bookshop_that_book: line('bookshop_that_book', "That's a book.", 1250, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 0.75, viseme: 'viseme_oo' },
    { at: 1.15, viseme: null },
  ]),
  bookshop_that_notebook: line('bookshop_that_notebook', "That's a notebook.", 1500, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_oo' },
    { at: 1.0, viseme: 'viseme_mbp' },
    { at: 1.35, viseme: null },
  ]),
  bookshop_that_pen: line('bookshop_that_pen', "That's a pen.", 1200, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.45, viseme: 'viseme_mbp' },
    { at: 0.7, viseme: 'viseme_ee' },
    { at: 1.1, viseme: null },
  ]),
  bookshop_that_storybook: line('bookshop_that_storybook', "That's a storybook.", 1650, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.55, viseme: 'viseme_oo' },
    { at: 0.95, viseme: 'viseme_ee' },
    { at: 1.25, viseme: 'viseme_mbp' },
    { at: 1.5, viseme: null },
  ]),
  bookshop_that_pencil: line('bookshop_that_pencil', "That's a pencil.", 1400, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 0.85, viseme: 'viseme_ee' },
    { at: 1.25, viseme: null },
  ]),
  bookshop_that_globe: line('bookshop_that_globe', "That's a globe.", 1350, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_oo' },
    { at: 0.95, viseme: 'viseme_mbp' },
    { at: 1.2, viseme: null },
  ]),
  bookshop_word_read: line('bookshop_word_read', 'Read.', 800, [
    { at: 0.0, viseme: 'viseme_ee' },
    { at: 0.7, viseme: null },
  ]),
  bookshop_word_write: line('bookshop_word_write', 'Write.', 800, [
    { at: 0.0, viseme: 'viseme_oo' },
    { at: 0.3, viseme: 'viseme_aa' },
    { at: 0.7, viseme: null },
  ]),
  bookshop_word_story: line('bookshop_word_story', 'A story.', 1000, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.3, viseme: 'viseme_oo' },
    { at: 0.65, viseme: 'viseme_ee' },
    { at: 0.9, viseme: null },
  ]),
  bookshop_word_page: line('bookshop_word_page', 'A page.', 900, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.25, viseme: 'viseme_mbp' },
    { at: 0.45, viseme: 'viseme_ee' },
    { at: 0.8, viseme: null },
  ]),
  bookshop_word_chapter: line('bookshop_word_chapter', 'A chapter.', 1100, [
    { at: 0.0, viseme: 'viseme_aa' },
    { at: 0.5, viseme: 'viseme_mbp' },
    { at: 0.75, viseme: 'viseme_ee' },
    { at: 1.0, viseme: null },
  ]),
};
