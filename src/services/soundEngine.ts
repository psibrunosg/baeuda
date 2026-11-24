let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType, gainPeak: number, delay = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Ignore disconnect errors if context already closed.
      }
    };
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    // Ignore WebAudio scheduling errors on suspended/blocked contexts.
  }
}

export function playPopSfx() {
  playTone(440, 0.07, 'sine', 0.1, 0);
}

export function playSuccessChime() {
  playTone(587.33, 0.14, 'triangle', 0.12, 0);
  playTone(880, 0.22, 'triangle', 0.14, 0.09);
}

export function playRewardFanfare() {
  playTone(523.25, 0.12, 'triangle', 0.12, 0);
  playTone(659.25, 0.12, 'triangle', 0.12, 0.08);
  playTone(783.99, 0.16, 'triangle', 0.14, 0.16);
  playTone(1046.5, 0.28, 'triangle', 0.14, 0.24);
}

export function playSoftErrorTone() {
  playTone(260, 0.16, 'sine', 0.09, 0);
}

/**
 * Tactile rising-pitch liquid drop cue called periodically during hold-to-pour (`0..1`).
 */
export function playPourTick(progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  const freq = 320 + clamped * 380;
  playTone(freq, 0.075, 'sine', 0.065, 0);
}

/**
 * Warm brass shop-door bell chime when entering a neighborhood interior.
 */
export function playShopBell() {
  playTone(1174.66, 0.16, 'sine', 0.075, 0);
  playTone(1567.98, 0.24, 'sine', 0.065, 0.07);
}
