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
  osc.start(now);
  osc.stop(now + duration + 0.02);
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
