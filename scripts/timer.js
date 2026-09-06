/** Dual side clocks with Fischer increment and time presets. */

import { turn } from "./board-state.js";
import { game } from "./game-state.js";
import { endByTimeout } from "./game-over.js";

export const TIME_PRESETS = {
  "1+0": { base: 60, increment: 0, label: "1+0 Bullet" },
  "3+2": { base: 180, increment: 2, label: "3+2 Blitz" },
  "5+0": { base: 300, increment: 0, label: "5+0 Blitz" },
  "10+0": { base: 600, increment: 0, label: "10+0 Rapid" },
  "15+10": { base: 900, increment: 10, label: "15+10 Rapid" },
};

let whiteTimeLeft = 600;
let blackTimeLeft = 600;
let timerId = null;
let clockStarted = false;
/** Which side’s clock is ticking — set only on real moves, never by history review. */
let activeIsWhite = true;
let initialSeconds = 600;
let incrementSeconds = 0;
let selectedPreset = "10+0";

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function getEls() {
  return {
    panel: document.getElementById("clocksPanel"),
    white: document.getElementById("clockWhite"),
    black: document.getElementById("clockBlack"),
    whiteTime: document.getElementById("clockWhiteTime"),
    blackTime: document.getElementById("clockBlackTime"),
  };
}

export function getSelectedPreset() {
  return selectedPreset;
}

export function setTimePreset(key, { reset = true } = {}) {
  const preset = TIME_PRESETS[key] || TIME_PRESETS["10+0"];
  selectedPreset = TIME_PRESETS[key] ? key : "10+0";
  initialSeconds = preset.base;
  incrementSeconds = preset.increment;
  if (reset) resetClocks();
  syncPresetSelect();
}

function syncPresetSelect() {
  const el = document.getElementById("timePreset");
  if (el && el.value !== selectedPreset) el.value = selectedPreset;
}

export function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

export function resetClocks() {
  stopTimer();
  clockStarted = false;
  activeIsWhite = true;
  whiteTimeLeft = initialSeconds;
  blackTimeLeft = initialSeconds;
  updateClocksUI();
}

/** Begin or keep the clock running after a completed move. */
export function startTimer() {
  // Fischer: side that just moved receives the increment.
  if (incrementSeconds > 0) {
    if (turn.isWhite) blackTimeLeft += incrementSeconds;
    else whiteTimeLeft += incrementSeconds;
  }

  clockStarted = true;
  // Capture the live side to move; history viewing must not change this.
  activeIsWhite = turn.isWhite;

  clearInterval(timerId);
  updateClocksUI();

  timerId = setInterval(() => {
    if (activeIsWhite) whiteTimeLeft--;
    else blackTimeLeft--;

    updateClocksUI();

    if (game.gameOver) {
      stopTimer();
      return;
    }
    if (whiteTimeLeft <= 0 && activeIsWhite) {
      whiteTimeLeft = 0;
      updateClocksUI();
      endByTimeout(true);
    } else if (blackTimeLeft <= 0 && !activeIsWhite) {
      blackTimeLeft = 0;
      updateClocksUI();
      endByTimeout(false);
    }
  }, 1000);
}

export function updateClocksUI() {
  const { panel, white, black, whiteTime, blackTime } = getEls();
  if (!whiteTime || !blackTime) return;

  whiteTime.textContent = formatTime(whiteTimeLeft);
  blackTime.textContent = formatTime(blackTimeLeft);

  if (white) {
    white.classList.toggle("is-active", clockStarted && activeIsWhite);
    white.classList.toggle("is-low", whiteTimeLeft <= 20);
    white.classList.toggle("is-flagged", whiteTimeLeft <= 0);
  }
  if (black) {
    black.classList.toggle("is-active", clockStarted && !activeIsWhite);
    black.classList.toggle("is-low", blackTimeLeft <= 20);
    black.classList.toggle("is-flagged", blackTimeLeft <= 0);
  }
  if (panel) {
    // Opponent clock on top relative to the human's color.
    panel.classList.toggle("is-flipped", !game.humanIsWhite);
  }
}

/** @deprecated use updateClocksUI */
export function updateTimerText() {
  updateClocksUI();
}
