/** App entry — wires modules and exposes HTML handlers. */

import {
  boards,
  castling,
  defaultBoards,
  defaultCastling,
  turn,
} from "./board-state.js";
import { game } from "./game-state.js";
import { clearCheckAlert } from "./check-ui.js";
import { hideGameOver } from "./game-over.js";
import { renderBoard } from "./render.js";
import { resetClocks, setTimePreset, updateClocksUI } from "./timer.js";
import { displayDebugMenu, toggleDebug } from "./debug.js";
import { maybeScheduleBotMove } from "./bot.js";
import { clearPendingPromotion } from "./promotion.js";
import {
  isViewingHistory,
  resetMoveHistory,
  setOnHistoryView,
} from "./move-history.js";
import { clearPlanArrows } from "./move-plan.js";

setOnHistoryView(() => {
  if (isViewingHistory()) {
    clearTimeout(game.botTimerId);
    game.botThinking = false;
  }
  renderBoard();
  if (!isViewingHistory()) maybeScheduleBotMove();
});

export function resetBoard() {
  clearTimeout(game.botTimerId);
  game.botThinking = false;
  game.gameOver = false;
  game.score = 0;
  clearPendingPromotion();
  clearCheckAlert();
  hideGameOver();
  turn.isWhite = true;
  Object.assign(boards, defaultBoards);
  Object.assign(castling, defaultCastling);
  resetClocks();
  resetMoveHistory();
  clearPlanArrows();

  renderBoard();
  console.log("reset board");
  maybeScheduleBotMove();
}

export function onGameSettingsChange() {
  const modeEl = document.getElementById("gameMode");
  const playAsEl = document.getElementById("playAs");
  const timeEl = document.getElementById("timePreset");
  game.mode = modeEl.value;
  game.humanIsWhite = playAsEl.value === "white";
  playAsEl.disabled = game.mode === "human";
  if (timeEl) setTimePreset(timeEl.value, { reset: false });
  resetBoard();
}

// HTML onclick handlers need globals
window.resetBoard = resetBoard;
window.onGameSettingsChange = onGameSettingsChange;
window.displayDebugMenu = displayDebugMenu;
window.toggleDebug = toggleDebug;

resetMoveHistory();
renderBoard();
updateClocksUI();

const playAsEl = document.getElementById("playAs");
if (playAsEl) playAsEl.disabled = game.mode === "human";
