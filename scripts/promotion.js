/** Pawn promotion — UI for humans, auto-queen for bots/search. */

import { boards, unicodePieces } from "./board-state.js";
import { game } from "./game-state.js";

export const PROMOTION_CHOICES = ["queen", "rook", "bishop", "knight"];

const PIECE_BOARD = {
  white: {
    queen: "whiteQueens",
    rook: "whiteRooks",
    bishop: "whiteBishops",
    knight: "whiteKnights",
    pawn: "whitePawns",
  },
  black: {
    queen: "blackQueens",
    rook: "blackRooks",
    bishop: "blackBishops",
    knight: "blackKnights",
    pawn: "blackPawns",
  },
};

const CHOICE_SYMBOL = {
  white: { queen: "Q", rook: "R", bishop: "B", knight: "N" },
  black: { queen: "q", rook: "r", bishop: "b", knight: "n" },
};

export function isPromotionSquare(toIndex, isWhite) {
  const rank = Math.floor(toIndex / 8);
  return isWhite ? rank === 7 : rank === 0;
}

export function isPawnPromotionMove(piece, toIndex) {
  if (!piece) return false;
  if (piece.symbol === "P") return isPromotionSquare(toIndex, true);
  if (piece.symbol === "p") return isPromotionSquare(toIndex, false);
  return false;
}

/** Replace a pawn on `sq` with the chosen piece. */
export function promotePawnOnSquare(sq, isWhite, choice = "queen") {
  const side = isWhite ? "white" : "black";
  const boardsForSide = PIECE_BOARD[side];
  const targetBoard = boardsForSide[choice] || boardsForSide.queen;
  const bit = 1n << BigInt(sq);
  boards[boardsForSide.pawn] &= ~bit;
  boards[targetBoard] |= bit;
}

export function hidePromotionUI() {
  const overlay = document.getElementById("promotionOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-visible");
  overlay.hidden = true;
}

export function showPromotionUI(isWhite, onChoose) {
  const overlay = document.getElementById("promotionOverlay");
  if (!overlay) {
    onChoose("queen");
    return;
  }

  const choicesEl = document.getElementById("promotionChoices");
  const side = isWhite ? "white" : "black";
  choicesEl.innerHTML = "";

  for (const choice of PROMOTION_CHOICES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "promotion-choice " + (isWhite ? "piece-white" : "piece-black");
    btn.dataset.choice = choice;
    btn.setAttribute("aria-label", `Promote to ${choice}`);
    btn.textContent = unicodePieces[CHOICE_SYMBOL[side][choice]];
    btn.addEventListener("click", () => {
      hidePromotionUI();
      onChoose(choice);
    });
    choicesEl.appendChild(btn);
  }

  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
}

export function clearPendingPromotion() {
  game.pendingPromotion = null;
  hidePromotionUI();
}
