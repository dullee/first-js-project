/** Check banner, king highlight, and alert sound. */

import { boards, bitScanForward } from "./board-state.js";
import { game } from "./game-state.js";
import { isInCheck } from "./attacks.js";
import { playCheckSound } from "./sounds.js";

export { playCheckSound };

export function hideCheckBanner() {
  const banner = document.getElementById("checkBanner");
  if (!banner) return;
  banner.classList.remove("is-visible");
  banner.hidden = true;
}

export function showCheckBanner(isWhiteInCheck) {
  const banner = document.getElementById("checkBanner");
  if (!banner) return;
  banner.textContent = isWhiteInCheck ? "White in check!" : "Black in check!";
  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add("is-visible"));
}

export function applyCheckHighlight() {
  const boardEl = document.getElementById("board");
  if (!boardEl || game.gameOver) {
    hideCheckBanner();
    return;
  }

  const whiteInCheck = isInCheck(true);
  const blackInCheck = isInCheck(false);
  if (!whiteInCheck && !blackInCheck) {
    hideCheckBanner();
    return;
  }

  const kingBb = whiteInCheck ? boards.whiteKing : boards.blackKing;
  if (!kingBb) return;
  const kingSq = bitScanForward(kingBb);
  const cell = boardEl.querySelector(`td[data-sq="${kingSq}"]`);
  if (cell) cell.classList.add("in-check");
}

export function announceCheck(isWhiteInCheck) {
  showCheckBanner(isWhiteInCheck);
  playCheckSound();

  const boardEl = document.getElementById("board");
  if (boardEl) {
    boardEl.classList.remove("board-check-flash");
    // restart animation
    void boardEl.offsetWidth;
    boardEl.classList.add("board-check-flash");
  }
}

export function clearCheckAlert() {
  hideCheckBanner();
  const boardEl = document.getElementById("board");
  if (boardEl) boardEl.classList.remove("board-check-flash");
}
