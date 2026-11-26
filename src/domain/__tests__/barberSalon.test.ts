import { describe, expect, it } from 'vitest';
import { BARBER_AUDIO_LINES } from '../../content/speech/barber';
import {
  BARBER_ORDER,
  expectedTarget,
  INITIAL,
  isRepeatTap,
  promptKey,
  tap,
  type BarberStage,
} from '../barberSalon';

const STAGES: BarberStage[] = [...BARBER_ORDER, 'done'];

describe('barberSalon', () => {
  it('goes from the comb to done, one tap per step', () => {
    expect(BARBER_ORDER).toEqual(['comb', 'scissors', 'curly', 'straight', 'long', 'short', 'beard']);
    let state = INITIAL;
    expect(promptKey(state)).toBe('barber_welcome');
    BARBER_ORDER.forEach((item, i) => {
      expect(expectedTarget(state)).toBe(item);
      const result = tap(state, item);
      expect(result).toEqual({
        state: STAGES[i + 1],
        say: promptKey(STAGES[i + 1]),
        wrong: false,
        travel: false,
      });
      state = result.state;
    });
    expect(state).toBe('done');
    expect(promptKey(state)).toBe('barber_done');
    expect(expectedTarget(state)).toBeNull();
  });

  it('names a wrong thing without advancing', () => {
    for (const state of STAGES) {
      for (const item of BARBER_ORDER.filter((other) => other !== state)) {
        expect(tap(state, item)).toEqual({
          state,
          say: `barber_that_${item}`,
          wrong: state !== 'done',
          travel: false,
        });
      }
    }
  });

  it('repeats the request on the barber, and offers travel only when done', () => {
    for (const state of STAGES) {
      expect(tap(state, 'barber')).toEqual({
        state,
        say: promptKey(state),
        wrong: false,
        travel: state === 'done',
      });
    }
  });

  it('ignores a double tap, for longer after the last step', () => {
    const last = { target: 'beard' as const, at: 1000 };
    expect(isRepeatTap(null, 'beard', 'done', 1000)).toBe(false);
    expect(isRepeatTap(last, 'beard', 'beard', 1400)).toBe(true);
    expect(isRepeatTap(last, 'beard', 'beard', 1800)).toBe(false);
    expect(isRepeatTap(last, 'beard', 'done', 3000)).toBe(true);
    expect(isRepeatTap(last, 'beard', 'done', 3600)).toBe(false);
    expect(isRepeatTap(last, 'comb', 'beard', 1100)).toBe(false);
  });

  it('never drops a tap on the barber once done, so the dialogue can be reopened', () => {
    const last = { target: 'barber' as const, at: 1000 };
    expect(isRepeatTap(last, 'barber', 'done', 1100)).toBe(false);
    expect(isRepeatTap(last, 'barber', 'beard', 1100)).toBe(true);
  });

  it('speaks the barber vocabulary, including trim in the beard request and the praise', () => {
    const phrases = Object.values(BARBER_AUDIO_LINES)
      .map((line) => line.phrase)
      .join(' ');
    for (const word of ['short', 'long', 'trim', 'curly', 'straight', 'comb', 'scissors', 'beard']) {
      expect(phrases.toLowerCase()).toMatch(new RegExp(`\\b${word}\\b`));
    }
    expect(BARBER_AUDIO_LINES.barber_ask_beard.phrase).toMatch(/\btrim\b/);
    expect(BARBER_AUDIO_LINES.barber_done.phrase).toMatch(/\btrim\b/);
  });

  it('has well formed speech lines', () => {
    for (const [key, line] of Object.entries(BARBER_AUDIO_LINES)) {
      expect(line.src).toBe(`/audio/lesson1/${key}.mp3`);
      const times = line.cues.map((cue) => cue.at);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(times[times.length - 1] * 1000).toBeLessThan(line.fallbackDurationMs);
      expect(line.cues[line.cues.length - 1].viseme).toBeNull();
    }
  });
});
