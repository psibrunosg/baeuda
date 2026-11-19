import { afterEach, describe, expect, it, vi } from 'vitest';
import { startVoiceCapture } from '../voiceCapture';

interface MockAudioHandles {
  AudioContextCtor: new () => AudioContext;
  ctx: {
    state: AudioContextState;
    resume: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    createMediaStreamSource: ReturnType<typeof vi.fn>;
    createAnalyser: ReturnType<typeof vi.fn>;
  };
  source: {
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  analyser: {
    fftSize: number;
    getFloatTimeDomainData: ReturnType<typeof vi.fn>;
  };
  trackStop: ReturnType<typeof vi.fn>;
  stream: MediaStream;
}

function createAudioMocks(options?: {
  state?: AudioContextState;
  rms?: number;
  throwOnCreateSource?: boolean;
}): MockAudioHandles {
  const trackStop = vi.fn();
  const stream = {
    getTracks: () => [{ stop: trackStop }],
  } as unknown as MediaStream;

  const source = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const rms = options?.rms ?? 0;
  const analyser = {
    fftSize: 512,
    getFloatTimeDomainData: vi.fn((buffer: Float32Array) => {
      buffer.fill(rms);
    }),
  };

  const ctx = {
    state: options?.state ?? ('running' as AudioContextState),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    createMediaStreamSource: vi.fn(() => {
      if (options?.throwOnCreateSource) {
        throw new Error('Failed to create media source');
      }
      return source;
    }),
    createAnalyser: vi.fn(() => analyser),
  };

  const AudioContextCtor = vi.fn(() => ctx) as unknown as new () => AudioContext;

  return { AudioContextCtor, ctx, source, analyser, trackStop, stream };
}

function stubRafQueue() {
  let nextId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const cancelAnimationFrame = vi.fn((id: number) => {
    callbacks.delete(id);
  });
  const requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, cb);
    return id;
  });

  vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

  const flushNext = (timestamp: number) => {
    const first = callbacks.entries().next();
    if (first.done) return false;
    const [id, cb] = first.value;
    callbacks.delete(id);
    cb(timestamp);
    return true;
  };

  return { requestAnimationFrame, cancelAnimationFrame, flushNext, callbacks };
}

describe('voiceCapture', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls onUnavailable gracefully when navigator.mediaDevices is absent', async () => {
    vi.stubGlobal('navigator', {});
    const onLevel = vi.fn();
    const onDetected = vi.fn();
    const onUnavailable = vi.fn();
    const onTimeout = vi.fn();

    const handle = await startVoiceCapture({
      onLevel,
      onDetected,
      onUnavailable,
      onTimeout,
    });

    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(onDetected).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
    expect(() => handle.stop()).not.toThrow();
  });

  it('stops tracks, closes AudioContext, and fires onTimeout after MAX_LISTEN_MS without speech', async () => {
    const mocks = createAudioMocks({ rms: 0.001 });
    const raf = stubRafQueue();
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mocks.stream),
      },
    });
    vi.stubGlobal('window', {
      AudioContext: mocks.AudioContextCtor,
    });

    const onLevel = vi.fn();
    const onDetected = vi.fn();
    const onUnavailable = vi.fn();
    const onTimeout = vi.fn();

    await startVoiceCapture({
      onLevel,
      onDetected,
      onUnavailable,
      onTimeout,
    });

    expect(raf.flushNext(1100)).toBe(true);
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance past MAX_LISTEN_MS (6500ms from startedAt=1000 -> 7500)
    expect(raf.flushNext(7500)).toBe(true);

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(onDetected).not.toHaveBeenCalled();
    expect(onUnavailable).not.toHaveBeenCalled();
    expect(mocks.source.disconnect).toHaveBeenCalledTimes(1);
    expect(mocks.trackStop).toHaveBeenCalledTimes(1);
    expect(mocks.ctx.close).toHaveBeenCalledTimes(1);
    expect(onLevel).toHaveBeenLastCalledWith(0);
    expect(raf.callbacks.size).toBe(0);
  });

  it('resumes a suspended AudioContext and clamps negative frame delta', async () => {
    const mocks = createAudioMocks({ state: 'suspended', rms: 0.1 });
    const raf = stubRafQueue();
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mocks.stream),
      },
    });
    vi.stubGlobal('window', {
      AudioContext: mocks.AudioContextCtor,
    });

    const onDetected = vi.fn();
    const handle = await startVoiceCapture({
      onLevel: vi.fn(),
      onDetected,
      onUnavailable: vi.fn(),
      onTimeout: vi.fn(),
    });

    expect(mocks.ctx.resume).toHaveBeenCalledTimes(1);

    // Negative dt (900 < 1000) must clamp to 0 so voicedMs doesn't corrupt or turn NaN
    expect(raf.flushNext(900)).toBe(true);
    expect(onDetected).not.toHaveBeenCalled();

    // 3 frames of >=100ms (clamped to 100ms each) reach REQUIRED_VOICED_MS (240ms)
    expect(raf.flushNext(1000)).toBe(true);
    expect(raf.flushNext(1100)).toBe(true);
    expect(raf.flushNext(1200)).toBe(true);

    expect(onDetected).toHaveBeenCalledTimes(1);
    handle.stop();
  });

  it('closes AudioContext and stops tracks if setup throws after AudioContext creation', async () => {
    const mocks = createAudioMocks({ throwOnCreateSource: true });
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mocks.stream),
      },
    });
    vi.stubGlobal('window', {
      AudioContext: mocks.AudioContextCtor,
    });

    const onUnavailable = vi.fn();
    await startVoiceCapture({
      onLevel: vi.fn(),
      onDetected: vi.fn(),
      onUnavailable,
      onTimeout: vi.fn(),
    });

    expect(mocks.trackStop).toHaveBeenCalledTimes(1);
    expect(mocks.ctx.close).toHaveBeenCalledTimes(1);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });
});
