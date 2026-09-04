/** Apply player moves to the board and resolve game outcomes. */

import {
  boards,
  getSquare,
  squareToIndex,
  turn,
} from "./board-state.js";
import { game } from "./game-state.js";
import { isInCheck } from "./attacks.js";
import {
  isValidCastle,
  moveValidators,
  performCastle,
} from "./validators.js";
import { isCheckmate, isStalemate } from "./legal-moves.js";
import { announceCheck, clearCheckAlert } from "./check-ui.js";
import {
  endByCheckmate,
  endByStalemate,
} from "./game-over.js";
import { startTimer } from "./timer.js";
import { updateBoard } from "./render.js";
import { maybeScheduleBotMove } from "./bot.js";
import { playCaptureSound, playMoveSound } from "./sounds.js";
import {
  clearPendingPromotion,
  isPawnPromotionMove,
  promotePawnOnSquare,
  showPromotionUI,
} from "./promotion.js";

function updateScore(piece) {
  if (piece.includes("Pawns")) game.score += 1;
  console.log("Score updated:", game.score);
}

function playMoveFx(didCapture) {
  if (didCapture) playCaptureSound();
  else playMoveSound();
}

function finishSuccessfulMove(isWhite, didCapture) {
  turn.isWhite = !turn.isWhite;
  playMoveFx(didCapture);
  startTimer();
  if (isCheckmate(!isWhite)) {
    endByCheckmate(isWhite);
    return;
  }
  if (isStalemate(!isWhite)) {
    endByStalemate();
    return;
  }
  if (isInCheck(!isWhite)) {
    announceCheck(!isWhite);
  } else {
    clearCheckAlert();
  }
  updateBoard();
  console.log("moved piece");
  maybeScheduleBotMove();
}

function beginPromotion(toIndex, isWhite, didCapture) {
  const autoQueen = game.botThinking;
  if (autoQueen) {
    promotePawnOnSquare(toIndex, isWhite, "queen");
    finishSuccessfulMove(isWhite, didCapture);
    return;
  }

  game.pendingPromotion = { toIndex, isWhite, didCapture };
  playMoveFx(didCapture);
  updateBoard();
  showPromotionUI(isWhite, (choice) => {
    if (!game.pendingPromotion) return;
    promotePawnOnSquare(toIndex, isWhite, choice);
    game.pendingPromotion = null;
    finishSuccessfulMove(isWhite, didCapture);
  });
}

export function movePiece(from, to) {
  if (game.gameOver) return;
  if (game.pendingPromotion) return;
  const fromIndex = squareToIndex(from);
  const toIndex = squareToIndex(to);
  const piece = getSquare(fromIndex);
  if (!piece) {
    console.log("there is not piece at:", from);
  }
  const isWhite = piece.board.startsWith("white");
  if (isWhite !== turn.isWhite) return console.log("Not your turn!");

  if (
    (piece.symbol === "K" || piece.symbol === "k") &&
    Math.abs(toIndex - fromIndex) === 2
  ) {
    if (!isValidCastle(fromIndex, toIndex, isWhite))
      return console.log("invalid castle");
    performCastle(fromIndex, toIndex, isWhite);
    finishSuccessfulMove(isWhite, false);
    return;
  }

  const moveValid = moveValidators[piece.symbol];
  let target = getSquare(toIndex);
  if (moveValid && !moveValid(fromIndex, toIndex, isWhite)) {
    return console.log("Not a valid", piece.board, "move.");
  }
  const fromRank = Math.floor(fromIndex / 8);
  const correctRank = isWhite ? fromRank === 4 : fromRank === 3;
  let didCapture = Boolean(target);
  if (piece.symbol === "P" || (piece.symbol === "p" && correctRank)) {
    const diff = toIndex - fromIndex;

    const adjacentSquare =
      diff === (isWhite ? 9 : -9) ? fromIndex + 1 : fromIndex - 1;
    const enemyPawns = isWhite ? boards.blackPawns : boards.whitePawns;

    if ((enemyPawns >> BigInt(adjacentSquare)) & 1n) {
      boards[isWhite ? "blackPawns" : "whitePawns"] &= ~(
        1n << BigInt(adjacentSquare)
      );
      didCapture = true;
    }
  }

  if (target) {
    if ((boards.notMovedPieces >> BigInt(toIndex)) & 1n) {
      boards.notMovedPieces &= ~(1n << BigInt(toIndex));
    }
    boards[target.board] &= ~(1n << BigInt(toIndex));
    console.log("taking:", target.board);
    updateScore(target.board);
  }
  const savedBoards = { ...boards };
  boards[piece.board] &= ~(1n << BigInt(fromIndex));
  boards[piece.board] |= 1n << BigInt(toIndex);
  boards.notMovedPieces &= ~(1n << BigInt(fromIndex));
  if (isInCheck(isWhite)) {
    Object.assign(boards, savedBoards); // undo
    if (target) boards[target.board] |= 1n << BigInt(toIndex);
    return console.log("move leaves king in check");
  }

  if (isPawnPromotionMove(piece, toIndex)) {
    beginPromotion(toIndex, isWhite, didCapture);
    return;
  }

  finishSuccessfulMove(isWhite, didCapture);
}

export { clearPendingPromotion };
