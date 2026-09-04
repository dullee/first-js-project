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
import {
  applyLastMoveHighlight,
  applyReviewModeUI,
  isViewingHistory,
} from "./move-history.js";
import { initMovePlan } from "./move-plan.js";

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
  const reviewing = isViewingHistory();
  // Black at bottom when the human plays black; bitboard indices stay the same.
  const flipped = !game.humanIsWhite;
  const ranks = flipped
    ? [0, 1, 2, 3, 4, 5, 6, 7]
    : [7, 6, 5, 4, 3, 2, 1, 0];
  const files = flipped
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];

  for (const rank of ranks) {
    const row = document.createElement("tr");

    for (const file of files) {
      const sq = rank * 8 + file;
      const piece = getSquare(sq);
      const cell = document.createElement("td");
      const isDark = (rank + file) % 2 === 0;

      cell.style.cursor = "default";
      cell.style.background = isDark ? "#b58863" : "#f0d9b5";
      cell.dataset.sq = sq; // store the index on the cell
      cell.classList.add(isDark ? "sq-dark" : "sq-light");

      // Rank labels on the visual left edge; file labels on the visual bottom edge
      const onLeftEdge = flipped ? file === 7 : file === 0;
      const onBottomEdge = flipped ? rank === 7 : rank === 0;
      if (onLeftEdge) {
        const rankLabel = document.createElement("span");
        rankLabel.className = "coord coord-rank";
        rankLabel.textContent = String(rank + 1);
        cell.appendChild(rankLabel);
      }
      if (onBottomEdge) {
        const fileLabel = document.createElement("span");
        fileLabel.className = "coord coord-file";
        fileLabel.textContent = String.fromCharCode(97 + file);
        cell.appendChild(fileLabel);
      }

      if (piece) {
        cell.classList.add(
          piece.board.startsWith("white") ? "piece-white" : "piece-black",
        );
        const glyph = document.createElement("span");
        glyph.className = "piece-glyph";
        glyph.textContent = unicodePieces[piece.symbol];
        cell.appendChild(glyph);
      }

      // drag events — only human-side pieces in bot modes
      const canDrag =
        piece &&
        !game.gameOver &&
        !game.pendingPromotion &&
        !game.botThinking &&
        !reviewing &&
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
        if (
          game.gameOver ||
          game.botThinking ||
          game.pendingPromotion ||
          isViewingHistory()
        ) {
          return;
        }
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

  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  boardEl.appendChild(table);
  boardEl.classList.toggle("is-reviewing", reviewing);
  boardEl.classList.toggle("is-flipped", flipped);

  const wrap = document.getElementById("boardWrap");
  if (wrap) {
    wrap.classList.toggle("is-reviewing", reviewing);
    wrap.classList.toggle("is-flipped", flipped);
  }

  applyLastMoveHighlight();
  applyReviewModeUI();
  applyCheckHighlight();
  if (debug.attacked) updateDebugBoards();
  applyDebugLayer();
  initMovePlan();
}

export function updateBoard() {
  renderBoard();
}
