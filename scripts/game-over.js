/** Win / draw overlay. */

import { game } from "./game-state.js";
import { clearCheckAlert } from "./check-ui.js";
import { clearPendingPromotion } from "./promotion.js";
import { renderBoard } from "./render.js";
import { stopTimer } from "./timer.js";

export function hideGameOver() {
  const overlay = document.getElementById("gameOverOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-visible");
  overlay.hidden = true;
  const card = overlay.querySelector(".game-over-card");
  if (card) card.classList.remove("is-draw");
}

export function showGameOver({ title, subtitle, eyebrow = "", isDraw = false }) {
  game.gameOver = true;
  stopTimer();
  clearTimeout(game.botTimerId);
  game.botThinking = false;
  clearPendingPromotion();
  clearCheckAlert();

  const overlay = document.getElementById("gameOverOverlay");
  if (!overlay) return;
  const card = overlay.querySelector(".game-over-card");
  document.getElementById("gameOverEyebrow").textContent = eyebrow;
  document.getElementById("gameOverTitle").textContent = title;
  document.getElementById("gameOverSubtitle").textContent = subtitle;
  card.classList.toggle("is-draw", isDraw);

  overlay.hidden = false;
  // next frame so the CSS transition runs
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  renderBoard();
}

export function endByCheckmate(winnerIsWhite) {
  const winner = winnerIsWhite ? "White" : "Black";
  showGameOver({
    eyebrow: "Checkmate",
    title: `${winner} wins`,
    subtitle: `${winnerIsWhite ? "Black" : "White"} has no legal moves.`,
  });
}

export function endByStalemate() {
  showGameOver({
    eyebrow: "Draw",
    title: "Stalemate",
    subtitle: "No legal moves, and the king is not in check.",
    isDraw: true,
  });
}

export function endByTimeout(loserIsWhite) {
  const winner = loserIsWhite ? "Black" : "White";
  showGameOver({
    eyebrow: "Time",
    title: `${winner} wins`,
    subtitle: `${loserIsWhite ? "White" : "Black"} ran out of time.`,
  });
}
