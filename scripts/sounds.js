/** Shared game sound effects (Web Audio — no asset files). */

import { game } from "./game-state.js";

function getAudioCtx() {
  if (!game.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    game.audioCtx = new AudioCtx();
  }
  return game.audioCtx;
}

function resumeCtx(ctx) {
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

function playTone({
  type = "sine",
  freq = 440,
  start = 0,
  dur = 0.08,
  peak = 0.2,
  freqEnd = null,
}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  resumeCtx(ctx);

  const now = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + dur);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/** Soft wood-click for a quiet move. */
export function playMoveSound() {
  playTone({ type: "triangle", freq: 520, dur: 0.05, peak: 0.14 });
  playTone({ type: "sine", freq: 280, start: 0.015, dur: 0.06, peak: 0.08 });
}

/** Slightly sharper thud for captures. */
export function playCaptureSound() {
  playTone({
    type: "square",
    freq: 180,
    dur: 0.07,
    peak: 0.12,
    freqEnd: 90,
  });
  playTone({ type: "triangle", freq: 420, start: 0.02, dur: 0.05, peak: 0.1 });
}

/** Alert used when giving check. */
export function playCheckSound() {
  playTone({ type: "square", freq: 880, dur: 0.12, peak: 0.18 });
  playTone({ type: "square", freq: 1175, start: 0.14, dur: 0.16, peak: 0.18 });
}
