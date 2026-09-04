/** Attack maps and check detection. */

import {
  boards,
  bitScanForward,
  getAllPieces,
  getBlackPieces,
  getSquare,
  getWhitePieces,
} from "./board-state.js";

function isOnBoardStep(from, to) {
  if (to < 0 || to > 63) return false;
  // reject wrapping across files when stepping by ±1/±7/±9
  const fileDiff = Math.abs((to % 8) - (from % 8));
  return fileDiff <= 1;
}

function rayAttacks(from, directions, occupied) {
  let attacks = 0n;
  for (const step of directions) {
    let prev = from;
    let sq = from + step;
    while (isOnBoardStep(prev, sq)) {
      attacks |= 1n << BigInt(sq);
      if ((occupied >> BigInt(sq)) & 1n) break;
      prev = sq;
      sq += step;
    }
  }
  return attacks;
}

export function pieceAttackBitboard(from, symbol, isWhite, occupied) {
  const fromFile = from % 8;
  let attacks = 0n;

  switch (symbol) {
    case "P":
    case "p": {
      const rankStep = isWhite ? 8 : -8;
      for (const fileStep of [-1, 1]) {
        const toFile = fromFile + fileStep;
        if (toFile < 0 || toFile > 7) continue;
        const to = from + rankStep + fileStep;
        if (to >= 0 && to <= 63) attacks |= 1n << BigInt(to);
      }
      break;
    }
    case "N":
    case "n": {
      for (const [rankStep, fileStep] of [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ]) {
        const toFile = fromFile + fileStep;
        const to = from + rankStep * 8 + fileStep;
        if (toFile < 0 || toFile > 7 || to < 0 || to > 63) continue;
        attacks |= 1n << BigInt(to);
      }
      break;
    }
    case "B":
    case "b":
      attacks = rayAttacks(from, [9, 7, -9, -7], occupied);
      break;
    case "R":
    case "r":
      attacks = rayAttacks(from, [8, -8, 1, -1], occupied);
      break;
    case "Q":
    case "q":
      attacks = rayAttacks(from, [9, 7, -9, -7, 8, -8, 1, -1], occupied);
      break;
    case "K":
    case "k": {
      for (const [rankStep, fileStep] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const toFile = fromFile + fileStep;
        const to = from + rankStep * 8 + fileStep;
        if (toFile < 0 || toFile > 7 || to < 0 || to > 63) continue;
        attacks |= 1n << BigInt(to);
      }
      break;
    }
  }
  return attacks;
}

export function buildAttackedBitboard(byWhite) {
  const attackers = byWhite ? getWhitePieces() : getBlackPieces();
  const occupied = getAllPieces();
  let attacked = 0n;
  let bb = attackers;
  while (bb) {
    const from = bitScanForward(bb);
    const piece = getSquare(from);
    if (piece) {
      attacked |= pieceAttackBitboard(from, piece.symbol, byWhite, occupied);
    }
    bb &= bb - 1n;
  }
  return attacked;
}

export function isSquareAttacked(index, byWhite) {
  // pure attack geometry — no move-validator side effects or logging
  const attackers = byWhite ? getWhitePieces() : getBlackPieces();
  const occupied = getAllPieces();
  const targetBit = 1n << BigInt(index);
  let bb = attackers;
  while (bb) {
    const from = bitScanForward(bb);
    const piece = getSquare(from);
    if (
      piece &&
      pieceAttackBitboard(from, piece.symbol, byWhite, occupied) & targetBit
    ) {
      return true;
    }
    bb &= bb - 1n;
  }
  return false;
}

export function isInCheck(isWhite) {
  const kingBoard = isWhite ? boards.whiteKing : boards.blackKing;
  if (!kingBoard) return false;
  const kingIndex = bitScanForward(kingBoard);
  return isSquareAttacked(kingIndex, !isWhite);
}
