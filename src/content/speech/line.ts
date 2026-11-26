import type { SpeechKey, VisemeCue } from '../../domain/types';

export interface SpeechLine {
  src: string;
  phrase: string;
  fallbackDurationMs: number;
  cues: readonly VisemeCue[];
}

export const line = (
  key: SpeechKey,
  phrase: string,
  fallbackDurationMs: number,
  cues: readonly VisemeCue[],
): SpeechLine => ({
  src: `/audio/lesson1/${key}.mp3`,
  phrase,
  fallbackDurationMs,
  cues,
});
