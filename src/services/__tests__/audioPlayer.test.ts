import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_MANIFEST } from '../../content/audioManifest';
import { createAudioPlayer, resolveActiveViseme, type AudioStatus } from '../audioPlayer';

describe('resolveActiveViseme', () => {
  it('returns the active viseme for a given playback timestamp', () => {
    const cues = AUDIO_MANIFEST.ask_cup.cues;
    expect(resolveActiveViseme(cues, 0.0)).toBe('viseme_aa');
    expect(resolveActiveViseme(cues, 0.3)).toBe('viseme_mbp');
    expect(resolveActiveViseme(cues, 0.7)).toBe('viseme_ee');
    expect(resolveActiveViseme(cues, 1.2)).toBeNull();
  });
});

describe('createAudioPlayer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('falls back to a timed virtual clock when Audio fails to load/play and fires onEnded', () => {
    vi.useFakeTimers();
    const statuses: AudioStatus[] = [];
    const onEnded = vi.fn();

    const player = createAudioPlayer({
      createAudioElement: () => null,
      onStatusChange: (status) => statuses.push(status),
    });

    player.play('demo_cup', { playbackRate: 1, onEnded });

    expect(player.speechRef.isPlaying()).toBe(true);
    expect(statuses[statuses.length - 1]).toMatchObject({
      mode: 'fallback',
      key: 'demo_cup',
      src: '/audio/lesson1/demo_cup.mp3',
      phrase: 'Cup.',
      isPlaying: true,
    });

    vi.advanceTimersByTime(AUDIO_MANIFEST.demo_cup.fallbackDurationMs + 50);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(player.speechRef.isPlaying()).toBe(false);
    player.dispose();
  });

  it('clears pending fallback timers on dispose without firing onEnded', () => {
    vi.useFakeTimers();
    const onEnded = vi.fn();
    const player = createAudioPlayer({
      createAudioElement: () => null,
    });

    player.play('demo_coffee', { playbackRate: 1, onEnded });
    player.dispose();
    vi.advanceTimersByTime(5000);

    expect(onEnded).not.toHaveBeenCalled();
  });

  it('chains followUpKey after the primary clip finishes and fires onEnded once at the end', () => {
    vi.useFakeTimers();
    const statuses: AudioStatus[] = [];
    const onEnded = vi.fn();

    const player = createAudioPlayer({
      createAudioElement: () => null,
      onStatusChange: (status) => statuses.push(status),
    });

    player.play('demo_cup', {
      playbackRate: 1,
      followUpKey: 'demo_coffee',
      onEnded,
    });

    vi.advanceTimersByTime(AUDIO_MANIFEST.demo_cup.fallbackDurationMs + 10);
    expect(onEnded).not.toHaveBeenCalled();
    expect(player.speechRef.isPlaying()).toBe(true);
    expect(statuses[statuses.length - 1]).toMatchObject({
      key: 'demo_coffee',
      isPlaying: true,
    });

    vi.advanceTimersByTime(AUDIO_MANIFEST.demo_coffee.fallbackDurationMs + 10);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(player.speechRef.isPlaying()).toBe(false);
    player.dispose();
  });
});
