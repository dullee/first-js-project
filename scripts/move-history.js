/** Move log with board snapshots for reviewing past positions. */

import {
  indexToSquare,
  restoreBoard,
  snapshotBoard,
  unicodePieces,
} from "./board-state.js";

/** @type {{ boards: object, castling: object, isWhiteTurn: boolean } | null} */
let initialSnap = null;

/** Called after restoring a historical (or live) position so the board can re-render. */
let onHistoryView = () => {};

export function setOnHistoryView(fn) {
  onHistoryView = fn;
}

/**
 * @typedef {{
 *   fromIndex: number,
 *   toIndex: number,
 *   from: string,
 *   to: string,
 *   isWhite: boolean,
 *   symbol: string,
 *   notation: string,
 *   afterSnap: { boards: object, castling: object, isWhiteTurn: boolean },
 * }} HistoryMove
 */

/** @type {HistoryMove[]} */
export const moveHistory = [];

/** null = live game; number = viewing that move's resulting position */
export let viewIndex = null;

export function isViewingHistory() {
  return viewIndex !== null;
}

export function getViewedMove() {
  if (viewIndex === null) {
    return moveHistory.length ? moveHistory[moveHistory.length - 1] : null;
  }
  return moveHistory[viewIndex] ?? null;
}

function formatNotation(symbol, from, to) {
  const glyph = unicodePieces[symbol] || "";
  const isPawn = symbol === "P" || symbol === "p";
  return isPawn ? `${from}–${to}` : `${glyph}${from}–${to}`;
}

export function resetMoveHistory() {
  moveHistory.length = 0;
  viewIndex = null;
  initialSnap = snapshotBoard();
  renderMoveHistoryList();
}

export function recordMove(fromIndex, toIndex, symbol, isWhite) {
  const from = indexToSquare(fromIndex);
  const to = indexToSquare(toIndex);
  moveHistory.push({
    fromIndex,
    toIndex,
    from,
    to,
    isWhite,
    symbol,
    notation: formatNotation(symbol, from, to),
    afterSnap: snapshotBoard(),
  });
  viewIndex = null;
  renderMoveHistoryList();
}

function restoreLivePosition() {
  // Keep the live turn — history review must not change whose clock / move it is.
  if (moveHistory.length) {
    restoreBoard(moveHistory[moveHistory.length - 1].afterSnap, {
      restoreTurn: false,
    });
  } else if (initialSnap) {
    restoreBoard(initialSnap, { restoreTurn: false });
  }
  viewIndex = null;
}

export function viewHistoryMove(index) {
  if (index === null || index === "live" || index >= moveHistory.length) {
    restoreLivePosition();
  } else {
    const move = moveHistory[index];
    if (!move) return;
    restoreBoard(move.afterSnap, { restoreTurn: false });
    // Viewing the latest move is equivalent to live play
    viewIndex = index === moveHistory.length - 1 ? null : index;
  }
  renderMoveHistoryList();
  onHistoryView();
}

export function applyLastMoveHighlight() {
  document
    .querySelectorAll("td.last-move-from, td.last-move-to")
    .forEach((cell) => {
      cell.classList.remove("last-move-from", "last-move-to", "is-review-move");
    });

  const move = getViewedMove();
  if (!move) return;

  const fromCell = document.querySelector(`td[data-sq="${move.fromIndex}"]`);
  const toCell = document.querySelector(`td[data-sq="${move.toIndex}"]`);
  const reviewing = isViewingHistory();
  if (fromCell) {
    fromCell.classList.add("last-move-from");
    if (reviewing) fromCell.classList.add("is-review-move");
  }
  if (toCell) {
    toCell.classList.add("last-move-to");
    if (reviewing) toCell.classList.add("is-review-move");
  }
}

export function applyReviewModeUI() {
  const reviewing = isViewingHistory();
  const move = reviewing ? getViewedMove() : null;

  const banner = document.getElementById("reviewBanner");
  const moveEl = document.getElementById("reviewBannerMove");
  if (banner) {
    if (reviewing && move) {
      banner.hidden = false;
      if (moveEl) {
        const ply = Math.floor(viewIndex / 2) + 1;
        const side = move.isWhite ? "" : "...";
        moveEl.textContent = `${ply}.${side} ${move.notation}`;
      }
      requestAnimationFrame(() => banner.classList.add("is-visible"));
    } else {
      banner.classList.remove("is-visible");
      banner.hidden = true;
      if (moveEl) moveEl.textContent = "";
    }
  }

  const hint = document.getElementById("moveHistoryHint");
  if (hint) {
    hint.textContent = reviewing
      ? "Reviewing a past position — play is paused"
      : "Click a move to see the board and from/to squares";
    hint.classList.toggle("is-reviewing", reviewing);
  }

  const panel = document.getElementById("moveHistory");
  if (panel) panel.classList.toggle("is-reviewing", reviewing);

  const liveBtn = document.getElementById("moveHistoryLive");
  if (liveBtn) {
    liveBtn.disabled = !reviewing;
    liveBtn.classList.toggle("is-active", !reviewing);
    liveBtn.classList.toggle("needs-attention", reviewing);
  }

  const wrap = document.getElementById("boardWrap");
  if (wrap) wrap.classList.toggle("is-reviewing", reviewing);

  const boardEl = document.getElementById("board");
  if (boardEl) boardEl.classList.toggle("is-reviewing", reviewing);
}

export function renderMoveHistoryList() {
  const list = document.getElementById("moveHistoryList");
  const liveBtn = document.getElementById("moveHistoryLive");
  if (!list) return;

  list.innerHTML = "";

  if (!moveHistory.length) {
    const empty = document.createElement("li");
    empty.className = "move-history-empty";
    empty.textContent = "No moves yet";
    list.appendChild(empty);
  } else {
    for (let i = 0; i < moveHistory.length; i += 2) {
      const ply = Math.floor(i / 2) + 1;
      const row = document.createElement("li");
      row.className = "move-history-row";

      const num = document.createElement("span");
      num.className = "move-history-num";
      num.textContent = `${ply}.`;
      row.appendChild(num);

      const white = moveHistory[i];
      const whiteBtn = document.createElement("button");
      whiteBtn.type = "button";
      whiteBtn.className = "move-history-move";
      whiteBtn.textContent = white.notation;
      if (
        viewIndex === i ||
        (viewIndex === null && i === moveHistory.length - 1)
      ) {
        whiteBtn.classList.add("is-active");
      }
      whiteBtn.addEventListener("click", () => viewHistoryMove(i));
      row.appendChild(whiteBtn);

      const black = moveHistory[i + 1];
      if (black) {
        const blackBtn = document.createElement("button");
        blackBtn.type = "button";
        blackBtn.className = "move-history-move";
        blackBtn.textContent = black.notation;
        if (
          viewIndex === i + 1 ||
          (viewIndex === null && i + 1 === moveHistory.length - 1)
        ) {
          blackBtn.classList.add("is-active");
        }
        blackBtn.addEventListener("click", () => viewHistoryMove(i + 1));
        row.appendChild(blackBtn);
      }

      list.appendChild(row);
    }
  }

  if (liveBtn) {
    const atLive = viewIndex === null;
    liveBtn.disabled = atLive;
    liveBtn.classList.toggle("is-active", atLive);
    liveBtn.classList.toggle("needs-attention", !atLive);
  }

  applyReviewModeUI();

  const active = list.querySelector(".move-history-move.is-active");
  if (active) {
    active.scrollIntoView({ block: "nearest" });
  }
}

export function returnToLiveGame() {
  if (!isViewingHistory()) return;
  viewHistoryMove(null);
}

// HTML onclick
window.returnToLiveGame = returnToLiveGame;
window.viewHistoryMove = viewHistoryMove;
