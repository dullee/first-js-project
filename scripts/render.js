/** Board DOM rendering and drag/drop UI. */

import {
  getSquare,
  indexToSquare,
  unicodePieces,
} from "./board-state.js";
import { game } from "./game-state.js";
import { getLegalMoves } from "./legal-moves.js";
import { applyCheckHighlight } from "./check-ui.js";
import { applyDebugLayer, debug, updateDebugBoards } from "./debug.js";
import { movePiece } from "./move-piece.js";

export function clearMoveHints() {
  document
    .querySelectorAll("td.origin-hint, td.move-hint, td.capture-hint")
    .forEach((cell) => {
      cell.classList.remove("origin-hint", "move-hint", "capture-hint");
    });
}

export function showMoveHints(fromIndex) {
  clearMoveHints();
  const origin = document.querySelector(`td[data-sq="${fromIndex}"]`);
  if (origin) origin.classList.add("origin-hint");

  for (const to of getLegalMoves(fromIndex)) {
    const cell = document.querySelector(`td[data-sq="${to}"]`);
    if (!cell) continue;
    cell.classList.add(getSquare(to) ? "capture-hint" : "move-hint");
  }
}

export function setPieceDragImage(e, symbol) {
  const isWhite = symbol === symbol.toUpperCase();
  const ghost = document.createElement("div");
  ghost.className =
    "drag-ghost " + (isWhite ? "piece-white" : "piece-black");
  ghost.textContent = unicodePieces[symbol];
  document.body.appendChild(ghost);
  // snapshot after layout so the glyph paints with the correct font fallback
  e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
  requestAnimationFrame(() => ghost.remove());
}

export function renderBoard() {
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";

  for (let rank = 7; rank >= 0; rank--) {
    const row = document.createElement("tr");

    for (let file = 0; file < 8; file++) {
      const sq = rank * 8 + file;
      const piece = getSquare(sq);
      const cell = document.createElement("td");

      cell.style.cursor = "default";
      cell.style.background = (rank + file) % 2 === 0 ? "#b58863" : "#f0d9b5";
      cell.dataset.sq = sq; // store the index on the cell
      if (piece) {
        cell.classList.add(
          piece.board.startsWith("white") ? "piece-white" : "piece-black",
        );
        cell.textContent = unicodePieces[piece.symbol];
      }

      // drag events — only human-side pieces in bot modes
      const canDrag =
        piece &&
        !game.gameOver &&
        !game.pendingPromotion &&
        !game.botThinking &&
        (game.mode === "human" ||
          piece.board.startsWith("white") === game.humanIsWhite);
      if (canDrag) {
        cell.draggable = true;
        cell.style.cursor = "grab";
        cell.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("from", sq); // store where we dragged from
          e.dataTransfer.effectAllowed = "move";
          setPieceDragImage(e, piece.symbol);
          cell.classList.add("dragging-piece");
          showMoveHints(sq);
        });
        cell.addEventListener("dragend", () => {
          cell.classList.remove("dragging-piece");
          clearMoveHints();
        });
      } else if (piece) {
        cell.style.cursor = "default";
      }

      cell.addEventListener("dragover", (e) => {
        e.preventDefault(); // required to allow dropping
        e.dataTransfer.dropEffect = "move";
      });

      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        if (game.gameOver || game.botThinking || game.pendingPromotion) return;
        clearMoveHints();
        const fromIndex = parseInt(e.dataTransfer.getData("from"));
        const toIndex = parseInt(cell.dataset.sq);
        const fromSq = indexToSquare(fromIndex);
        const toSq = indexToSquare(toIndex);
        movePiece(fromSq, toSq);
        renderBoard();
      });

      row.appendChild(cell);
    }

    table.appendChild(row);
  }

  document.getElementById("board").innerHTML = "";
  document.getElementById("board").appendChild(table);
  applyCheckHighlight();
  if (debug.attacked) updateDebugBoards();
  applyDebugLayer();
}

export function updateBoard() {
  renderBoard();
}
