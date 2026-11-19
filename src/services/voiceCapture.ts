export interface VoiceCaptureCallbacks {
  onLevel: (normalizedLevel: number) => void;
  onDetected: () => void;
  onUnavailable: () => void;
}

export interface VoiceCaptureHandle {
  stop: () => void;
}

const SPEECH_RMS_THRESHOLD = 0.035;
const REQUIRED_VOICED_MS = 240;
const MAX_LISTEN_MS = 6500;

export async function startVoiceCapture(
  callbacks: VoiceCaptureCallbacks,
): Promise<VoiceCaptureHandle> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    callbacks.onUnavailable();
    return { stop: () => {} };
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    callbacks.onUnavailable();
    return { stop: () => {} };
  }

  const AudioCtx =
    typeof window !== 'undefined'
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!AudioCtx) {
    stream.getTracks().forEach((t) => t.stop());
    callbacks.onUnavailable();
    return { stop: () => {} };
  }

  let ctx: AudioContext;
  let source: MediaStreamAudioSourceNode;
  let analyser: AnalyserNode;
  try {
    ctx = new AudioCtx();
    source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    callbacks.onUnavailable();
    return { stop: () => {} };
  }

  const buffer = new Float32Array(analyser.fftSize);
  let rafId = 0;
  let stopped = false;
  let voicedMs = 0;
  let lastTick = performance.now();
  const startedAt = lastTick;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
    callbacks.onLevel(0);
  };

  const tick = (now: number) => {
    if (stopped) return;
    const dt = Math.min(now - lastTick, 100);
    lastTick = now;

    analyser.getFloatTimeDomainData(buffer);
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSq += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSq / buffer.length);
    const level = Math.min(1, rms / 0.14);
    callbacks.onLevel(level);

    if (rms >= SPEECH_RMS_THRESHOLD) {
      voicedMs += dt;
      if (voicedMs >= REQUIRED_VOICED_MS) {
        stop();
        callbacks.onDetected();
        return;
      }
    }

    if (now - startedAt >= MAX_LISTEN_MS) {
      stop();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return { stop };
}
