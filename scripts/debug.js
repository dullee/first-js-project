/** Debug overlays for bitboard inspection. */

import { boards, getSquare } from "./board-state.js";
import { buildAttackedBitboard } from "./attacks.js";
import { renderBoard } from "./render.js";

export const debug = {
  nonMoved: false,
  enPassant: false,
  attacked: false,
  checkmate: false,
  boardIndex: false,
};

export const debugBoards = {
  enPassant: 0n,
  attackedByWhite: 0n,
  attackedByBlack: 0n,
};

export function displayDebugMenu() {
  const container = document.getElementById("debugMenuContainer");
  container.classList.toggle("show");
}

export function updateDebugBoards() {
  // both sides' attack maps so threatened pieces can be shown together
  debugBoards.attackedByWhite = buildAttackedBitboard(true);
  debugBoards.attackedByBlack = buildAttackedBitboard(false);
}

export function applyDebugLayer() {
  const cells = document.querySelectorAll("td");

  cells.forEach((cell) => {
    cell.classList.remove("attacked-white-piece", "attacked-black-piece");
  });

  if (!Object.values(debug).some(Boolean)) return; // nothing enabled, skip

  cells.forEach((cell) => {
    const sq = parseInt(cell.dataset.sq);
    const bit = BigInt(sq);
    const rank = Math.floor(sq / 8);
    const file = sq % 8;
    if (debug.boardIndex) {
      const childEl = document.createElement("div");
      childEl.style.position = "absolute";
      childEl.style.bottom = "0";
      childEl.style.right = "0";
      childEl.style.fontSize = "12px";
      cell.style.position = "relative";
      cell.appendChild(childEl);
      childEl.textContent += sq;
    }

    if (debug.nonMoved && (boards.notMovedPieces >> bit) & 1n) {
      cell.style.backgroundColor =
        (rank + file) % 2 === 0 ? "rgb(59, 96, 127)" : "steelblue";
    }

    if (debug.enPassant && (debugBoards.enPassant >> bit) & 1n) {
      cell.style.backgroundColor = "mediumpurple";
    }

    if (debug.attacked) {
      const piece = getSquare(sq);
      if (piece) {
        const isWhitePiece = piece.board.startsWith("white");
        // white piece threatened by black
        if (isWhitePiece && (debugBoards.attackedByBlack >> bit) & 1n) {
          cell.classList.add("attacked-white-piece");
        }
        // black piece threatened by white
        if (!isWhitePiece && (debugBoards.attackedByWhite >> bit) & 1n) {
          cell.classList.add("attacked-black-piece");
        }
      }
    }
  });
}

export function toggleDebug(key) {
  debug[key] = !debug[key];
  renderBoard();
}
