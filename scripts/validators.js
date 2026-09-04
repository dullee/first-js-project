/** Piece move validators and castling. */

import {
  boards,
  castling,
  getAllPieces,
  getBlackPieces,
  getWhitePieces,
} from "./board-state.js";
import { isSquareAttacked } from "./attacks.js";

export function isValidPawnMove(from, to, isWhite) {
  const diff = to - from;

  const oneStep = isWhite ? 8 : -8;
  const twoStep = isWhite ? 16 : -16;
  const startRank = isWhite ? 1 : 6;
  const fromRank = Math.floor(from / 8);

  const enemyPieces = isWhite ? getBlackPieces() : getWhitePieces();

  if (diff === oneStep) {
    return (getAllPieces() >> BigInt(to)) & 1n ? false : true;
  }
  if (fromRank === startRank && diff === twoStep) {
    const middle = from + oneStep;
    const middleEmpty = !((getAllPieces() >> BigInt(middle)) & 1n);
    const destEmpty = !((getAllPieces() >> BigInt(to)) & 1n);
    return middleEmpty && destEmpty;
  }
  const diagLeft = isWhite ? 7 : -7;
  const diagRight = isWhite ? 9 : -9;
  if (diff === diagLeft || diff === diagRight) {
    // reject a/h-file wraparounds (e.g. a4→h2)
    if (Math.abs((from % 8) - (to % 8)) !== 1) return false;
    return Boolean((enemyPieces >> BigInt(to)) & 1n);
  }

  return false;
}

export function isValidKnightMove(from, to, isWhite) {
  const diff = Math.abs(to - from);
  const validJumps = [17, 15, 10, 6];
  // check it didnt wrap around the board edge
  const fromFile = from % 8;
  const toFile = to % 8;
  const fileDiff = Math.abs(fromFile - toFile);

  // a knight always moves 1 or 2 files, never more
  if (fileDiff !== 1 && fileDiff !== 2) return false;

  if (!validJumps.includes(diff)) return false;
  const ownPieces = isWhite ? getWhitePieces() : getBlackPieces();
  if ((ownPieces >> BigInt(to)) & 1n) return false;
  return true;
}

export function isValidBishopMove(from, to, isWhite) {
  const fromFile = from % 8;
  const toFile = to % 8;
  const fromRank = Math.floor(from / 8);
  const toRank = Math.floor(to / 8);

  const fileDiff = Math.abs(fromFile - toFile);
  const rankDiff = Math.abs(fromRank - toRank);

  // must move equal ranks and files to be diagonal (and actually move)
  if (fileDiff === 0 || fileDiff !== rankDiff) return false;

  // figure out which direction we are stepping
  const fileStep = toFile > fromFile ? 1 : -1;
  const rankStep = toRank > fromRank ? 1 : -1;
  const step = rankStep * 8 + fileStep;

  // walk every square between from and to
  let current = from + step;
  while (current !== to) {
    if ((getAllPieces() >> BigInt(current)) & 1n) return false; // something is in the way
    current += step;
  }

  // destination cant be your own piece
  const ownPieces = isWhite ? getWhitePieces() : getBlackPieces();
  if ((ownPieces >> BigInt(to)) & 1n) return false;

  return true;
}

export function isValidRookMove(from, to, isWhite) {
  const fromFile = Math.floor(from % 8);
  const toFile = Math.floor(to % 8);
  const fromRank = Math.floor(from / 8);
  const toRank = Math.floor(to / 8);
  const sameFile = fromFile === toFile;
  const sameRank = fromRank === toRank;
  if (!sameFile && !sameRank) return false;

  const fileStep = toFile > fromFile ? 1 : toFile < fromFile ? -1 : 0;
  const rankStep = toRank > fromRank ? 1 : toRank < fromRank ? -1 : 0;
  const step = rankStep * 8 + fileStep;
  let current = from + step;
  while (current !== to) {
    if ((getAllPieces() >> BigInt(current)) & 1n) return false;
    current += step;
  }
  // cant land on your own piece
  const ownPieces = isWhite ? getWhitePieces() : getBlackPieces();
  if ((ownPieces >> BigInt(to)) & 1n) return false;
  const rookPositions = {
    0: "whiteQueenSide",
    7: "whiteKingSide",
    56: "blackQueenSide",
    63: "blackKingSide",
  };
  const side = rookPositions[from];

  if (castling[side]) {
    castling[side] = false;
  }
  return true;
}

export function isValidQueenMove(from, to, isWhite) {
  return (
    isValidBishopMove(from, to, isWhite) || isValidRookMove(from, to, isWhite)
  );
}

export function isValidKingMove(from, to, isWhite) {
  const fromFile = from % 8;
  const toFile = to % 8;
  const fromRank = Math.floor(from / 8);
  const toRank = Math.floor(to / 8);

  const fileDiff = Math.abs(fromFile - toFile);
  const rankDiff = Math.abs(fromRank - toRank);

  // can only move one square in any direction
  if (fileDiff > 1 || rankDiff > 1) return false;

  // cant stay in place
  if (fileDiff === 0 && rankDiff === 0) return false;

  // cant land on your own piece
  const ownPieces = isWhite ? getWhitePieces() : getBlackPieces();
  if ((ownPieces >> BigInt(to)) & 1n) return false;
  if (isWhite && (castling.whiteKingSide || castling.whiteQueenSide)) {
    castling.whiteKingSide = false;
    castling.whiteQueenSide = false;
  } else if (castling.blackKingSide || castling.blackQueenSide) {
    castling.blackKingSide = false;
    castling.blackQueenSide = false;
  }
  return true;
}

export function isValidCastle(from, to, isWhite) {
  const diff = to - from;
  const kingSide = diff === 2;
  const queenSide = diff === -2;
  if (!kingSide && !queenSide) return false;

  if (isWhite && kingSide && !castling.whiteKingSide) return false;
  if (isWhite && queenSide && !castling.whiteQueenSide) return false;
  if (!isWhite && kingSide && !castling.blackKingSide) return false;
  if (!isWhite && queenSide && !castling.blackQueenSide) return false;

  const between = kingSide
    ? [from + 1, from + 2]
    : [from - 1, from - 2, from - 3];

  for (const sq of between) {
    if ((getAllPieces() >> BigInt(sq)) & 1n) return false;
  }
  const passingThrough = kingSide ? from + 1 : from - 1;
  if (isSquareAttacked(from, !isWhite)) return false;
  if (isSquareAttacked(passingThrough, !isWhite)) return false;
  if (isSquareAttacked(to, !isWhite)) return false;

  return true;
}

export function performCastle(from, to, isWhite) {
  const kingSide = to > from;

  // move the king
  boards[isWhite ? "whiteKing" : "blackKing"] &= ~(1n << BigInt(from));
  boards[isWhite ? "whiteKing" : "blackKing"] |= 1n << BigInt(to);

  // move the rook
  if (isWhite) {
    if (kingSide) {
      boards.whiteRooks &= ~(1n << 7n); // remove from h1
      boards.whiteRooks |= 1n << 5n; // place on f1
    } else {
      boards.whiteRooks &= ~(1n << 0n); // remove from a1
      boards.whiteRooks |= 1n << 3n; // place on d1
    }
    castling.whiteKingSide = false;
    castling.whiteQueenSide = false;
  } else {
    if (kingSide) {
      boards.blackRooks &= ~(1n << 63n); // remove from h8
      boards.blackRooks |= 1n << 61n; // place on f8
    } else {
      boards.blackRooks &= ~(1n << 56n); // remove from a8
      boards.blackRooks |= 1n << 59n; // place on d8
    }
    castling.blackKingSide = false;
    castling.blackQueenSide = false;
  }
}

export const moveValidators = {
  P: isValidPawnMove,
  p: isValidPawnMove,
  N: isValidKnightMove,
  n: isValidKnightMove,
  b: isValidBishopMove,
  B: isValidBishopMove,
  r: isValidRookMove,
  R: isValidRookMove,
  q: isValidQueenMove,
  Q: isValidQueenMove,
  k: isValidKingMove,
  K: isValidKingMove,
};
