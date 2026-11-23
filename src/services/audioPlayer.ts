import { AUDIO_MANIFEST, type SpeechKey } from '../content/audioManifest';
import type { VisemeCue, VisemeId } from '../domain/types';

export interface SpeechClockRef {
  getCurrentTime: () => number;
  isPlaying: () => boolean;
  cues: readonly VisemeCue[];
}

export interface AudioStatus {
  mode: 'idle' | 'audio' | 'fallback';
  key: SpeechKey | null;
  src: string | null;
  phrase: string | null;
  isPlaying: boolean;
}

export interface PlayOptions {
  playbackRate?: number;
  followUpKey?: SpeechKey;
  onEnded?: () => void;
}

export interface AudioPlayer {
  speechRef: SpeechClockRef;
  play: (key: SpeechKey, options?: PlayOptions) => void;
  stop: () => void;
  dispose: () => void;
}

interface CreateAudioPlayerOptions {
  createAudioElement?: (src: string) => HTMLAudioElement | null;
  onStatusChange?: (status: AudioStatus) => void;
}

export function resolveActiveViseme(
  cues: readonly VisemeCue[],
  timeSec: number,
): VisemeId | null {
  for (let i = cues.length - 1; i >= 0; i--) {
    if (timeSec >= cues[i].at) {
      return cues[i].viseme;
    }
  }
  return null;
}

export function createAudioPlayer(options: CreateAudioPlayerOptions = {}): AudioPlayer {
  const createEl =
    options.createAudioElement ??
    ((src: string) => (typeof Audio !== 'undefined' ? new Audio(src) : null));

  let activeAudio: HTMLAudioElement | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let fallbackStartMs = 0;
  let fallbackRate = 1;
  let fallbackActive = false;
  let playToken = 0;

  const speechRef: SpeechClockRef = {
    cues: [],
    isPlaying: () => {
      if (fallbackActive) return true;
      return Boolean(activeAudio && !activeAudio.paused && !activeAudio.ended);
    },
    getCurrentTime: () => {
      if (fallbackActive) {
        return ((Date.now() - fallbackStartMs) / 1000) * fallbackRate;
      }
      return activeAudio ? activeAudio.currentTime : 0;
    },
  };

  const emitStatus = (status: AudioStatus) => {
    options.onStatusChange?.(status);
  };

  const clearCurrent = () => {
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    fallbackActive = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speechSynthesis cancel errors in restricted sandboxes
      }
    }
    if (activeAudio) {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio = null;
    }
  };

  const startFallback = (
    token: number,
    key: SpeechKey,
    rate: number,
    finish: () => void,
  ) => {
    if (token !== playToken) return;
    const entry = AUDIO_MANIFEST[key];
    clearCurrent();
    speechRef.cues = entry.cues;
    fallbackStartMs = Date.now();
    fallbackRate = rate;
    fallbackActive = true;

    const completeFallback = () => {
      if (token !== playToken || !fallbackActive) return;
      fallbackActive = false;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      emitStatus({
        mode: 'fallback',
        key,
        src: entry.src,
        phrase: entry.phrase,
        isPlaying: false,
      });
      finish();
    };

    let hasSpeechSynthesis = false;
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    ) {
      try {
        const utter = new SpeechSynthesisUtterance(entry.phrase);
        utter.lang = 'en-US';
        utter.rate = Math.max(0.6, Math.min(1.4, rate));
        utter.onend = completeFallback;
        utter.onerror = completeFallback;
        window.speechSynthesis.speak(utter);
        hasSpeechSynthesis = true;
      } catch {
        // Fallback timer still drives visemes and completion
      }
    }

    emitStatus({
      mode: 'fallback',
      key,
      src: entry.src,
      phrase: entry.phrase,
      isPlaying: true,
    });

    const baseDurationMs = Math.max(350, Math.round(entry.fallbackDurationMs / rate));
    // When speechSynthesis is active, utter.onend drives completion and the timer acts as a safety net
    const safetyDurationMs = hasSpeechSynthesis ? Math.max(baseDurationMs + 1200, 2200) : baseDurationMs;
    fallbackTimer = setTimeout(completeFallback, safetyDurationMs);
  };

  const playSingle = (
    token: number,
    key: SpeechKey,
    rate: number,
    finish: () => void,
  ) => {
    if (token !== playToken) return;
    const entry = AUDIO_MANIFEST[key];
    clearCurrent();
    speechRef.cues = entry.cues;

    const audio = createEl(entry.src);
    if (!audio) {
      startFallback(token, key, rate, finish);
      return;
    }

    activeAudio = audio;
    audio.playbackRate = rate;

    audio.onended = () => {
      if (token !== playToken || activeAudio !== audio) return;
      activeAudio = null;
      emitStatus({
        mode: 'audio',
        key,
        src: entry.src,
        phrase: entry.phrase,
        isPlaying: false,
      });
      finish();
    };

    audio.onerror = () => {
      if (token !== playToken || activeAudio !== audio) return;
      startFallback(token, key, rate, finish);
    };

    emitStatus({
      mode: 'audio',
      key,
      src: entry.src,
      phrase: entry.phrase,
      isPlaying: true,
    });

    const playResult = audio.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        if (token !== playToken || activeAudio !== audio) return;
        startFallback(token, key, rate, finish);
      });
    }
  };

  const play = (key: SpeechKey, playOptions: PlayOptions = {}) => {
    playToken += 1;
    const token = playToken;
    const rate = playOptions.playbackRate ?? 1;

    const finishPrimary = () => {
      if (token !== playToken) return;
      if (playOptions.followUpKey) {
        playSingle(token, playOptions.followUpKey, rate, () => {
          if (token !== playToken) return;
          playOptions.onEnded?.();
        });
      } else {
        playOptions.onEnded?.();
      }
    };

    playSingle(token, key, rate, finishPrimary);
  };

  const stop = () => {
    playToken += 1;
    clearCurrent();
    emitStatus({
      mode: 'idle',
      key: null,
      src: null,
      phrase: null,
      isPlaying: false,
    });
  };

  const dispose = () => {
    playToken += 1;
    clearCurrent();
  };

  return { speechRef, play, stop, dispose };
}
