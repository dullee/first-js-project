/** Side clocks — idle until White’s first move starts them. */

import { turn } from "./board-state.js";
import { game } from "./game-state.js";
import { endByTimeout } from "./game-over.js";

let whiteTimeLeft = 600;
let blackTimeLeft = 600;
let timerId = null;
let clockStarted = false;
/** Which side’s clock is ticking — set only on real moves, never by history review. */
let activeIsWhite = true;

const timerText = document.getElementById("timerText");
const timerCon = document.getElementById("timerContainer");
if (timerText) timerText.textContent = "Time: 10:00";

export function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

export function resetClocks(seconds = 600) {
  stopTimer();
  clockStarted = false;
  activeIsWhite = true;
  whiteTimeLeft = seconds;
  blackTimeLeft = seconds;
  updateTimerText(whiteTimeLeft);
}

/** Begin or keep the clock running after a completed move. */
export function startTimer() {
  if (!clockStarted) {
    // First successful move is always White; clocks begin afterward.
    clockStarted = true;
  }

  // Capture the live side to move; history viewing must not change this.
  activeIsWhite = turn.isWhite;

  clearInterval(timerId);
  timerId = setInterval(() => {
    if (activeIsWhite) {
      whiteTimeLeft--;
      updateTimerText(whiteTimeLeft);
    } else {
      blackTimeLeft--;
      updateTimerText(blackTimeLeft);
    }

    if (game.gameOver) {
      stopTimer();
      return;
    }
    if (whiteTimeLeft === 0 && activeIsWhite) {
      endByTimeout(true);
    } else if (blackTimeLeft === 0 && !activeIsWhite) {
      endByTimeout(false);
    }
  }, 1000);
}

export function updateTimerText(timeLeft) {
  if (!timerText || !timerCon) return;
  const timerMinute = Math.floor(timeLeft / 60);
  const timerSeconds = timeLeft % 60;
  timerText.textContent =
    "Time: " +
    timerMinute +
    ":" +
    (timerSeconds < 10 ? "0" : "") +
    timerSeconds;
  timerText.style.color = activeIsWhite ? "black" : "white";
  timerCon.style.backgroundColor = activeIsWhite ? "white" : "black";
}
