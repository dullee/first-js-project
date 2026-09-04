/** Legal move generation and terminal position checks. */

import {
  boards,
  bitScanForward,
  castling,
  getBlackPieces,
  getSquare,
  getWhitePieces,
  turn,
} from "./board-state.js";
import { isInCheck } from "./attacks.js";
import { isValidCastle, moveValidators } from "./validators.js";

export function getLegalMoves(fromIndex) {
  const piece = getSquare(fromIndex);
  if (!piece) return [];
  const isWhite = piece.board.startsWith("white");
  if (isWhite !== turn.isWhite) return [];

  const moves = [];
  const validator = moveValidators[piece.symbol];
  const savedCastling = { ...castling };

  for (let to = 0; to < 64; to++) {
    if (to === fromIndex) continue;

    let isValid = false;
    if (
      (piece.symbol === "K" || piece.symbol === "k") &&
      Math.abs(to - fromIndex) === 2
    ) {
      isValid = isValidCastle(fromIndex, to, isWhite);
    } else if (validator) {
      Object.assign(castling, savedCastling);
      isValid = validator(fromIndex, to, isWhite);
      Object.assign(castling, savedCastling);
    }
    if (!isValid) continue;

    const savedBoards = { ...boards };
    const target = getSquare(to);
    if (target) boards[target.board] &= ~(1n << BigInt(to));
    boards[piece.board] &= ~(1n << BigInt(fromIndex));
    boards[piece.board] |= 1n << BigInt(to);

    const leavesInCheck = isInCheck(isWhite);
    Object.assign(boards, savedBoards);
    if (!leavesInCheck) moves.push(to);
  }

  Object.assign(castling, savedCastling);
  return moves;
}

export function hasLegalMoves(isWhite) {
  const pieces = isWhite ? getWhitePieces() : getBlackPieces();
  let bb = pieces;
  while (bb) {
    const sq = bitScanForward(bb);
    const piece = getSquare(sq);
    const validator = moveValidators[piece.symbol];

    // try every possible destination square
    for (let to = 0; to < 64; to++) {
      if (to === sq) continue;
      if (validator && validator(sq, to, isWhite)) {
        // simulate the move
        const savedBoards = { ...boards };
        const target = getSquare(to);
        if (target) boards[target.board] &= ~(1n << BigInt(to));
        boards[piece.board] &= ~(1n << BigInt(sq));
        boards[piece.board] |= 1n << BigInt(to);

        const stillInCheck = isInCheck(isWhite);

        // undo the move
        Object.assign(boards, savedBoards);
        if (!stillInCheck) return true; // found at least one legal move
      }
    }
    bb &= bb - 1n;
  }

  return false; // no legal moves found
}

export function isCheckmate(isWhite) {
  return isInCheck(isWhite) && !hasLegalMoves(isWhite);
}

export function isStalemate(isWhite) {
  return !isInCheck(isWhite) && !hasLegalMoves(isWhite);
}
