/** Bot search and move scheduling. */

import {
  boards,
  bitScanForward,
  castling,
  getBlackPieces,
  getSquare,
  getWhitePieces,
  indexToSquare,
  restoreBoard,
  snapshotBoard,
  turn,
} from "./board-state.js";
import { game } from "./game-state.js";
import { isInCheck } from "./attacks.js";
import { performCastle } from "./validators.js";
import {
  getLegalMoves,
  isCheckmate,
  isStalemate,
} from "./legal-moves.js";
import { renderBoard } from "./render.js";
import { movePiece } from "./move-piece.js";
import {
  isPawnPromotionMove,
  promotePawnOnSquare,
} from "./promotion.js";
import { isViewingHistory } from "./move-history.js";

const SEARCH_NODE_LIMIT = 12000;
let searchNodes = 0;

const PIECE_VALUES = {
  P: 100,
  N: 320,
  B: 320,
  R: 500,
  Q: 900,
  K: 20000,
  p: 100,
  n: 320,
  b: 320,
  r: 500,
  q: 900,
  k: 20000,
};

// small center / development bonuses (a1=0 … h8=63), white perspective
const PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 20, 15, 10, 5,
  5, 10, 20, 25, 25, 20, 10, 5, 5, 10, 20, 25, 25, 20, 10, 5, 5, 10, 15, 20, 20,
  15, 10, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

function botIsWhite() {
  return !game.humanIsWhite;
}

function isBotTurn() {
  return game.mode !== "human" && turn.isWhite === botIsWhite();
}

function botDelayMs() {
  if (game.mode === "easy") return 500;
  if (game.mode === "medium") return 600;
  return 700;
}

function generateAllLegalMoves(isWhite) {
  const savedTurn = turn.isWhite;
  turn.isWhite = isWhite;
  const moves = [];
  let bb = isWhite ? getWhitePieces() : getBlackPieces();
  while (bb) {
    const from = bitScanForward(bb);
    for (const to of getLegalMoves(from)) {
      moves.push({ from, to });
    }
    bb &= bb - 1n;
  }
  turn.isWhite = savedTurn;
  return moves;
}

function applyMoveForSearch(from, to) {
  const piece = getSquare(from);
  if (!piece) return;
  const isWhite = piece.board.startsWith("white");

  if (
    (piece.symbol === "K" || piece.symbol === "k") &&
    Math.abs(to - from) === 2
  ) {
    performCastle(from, to, isWhite);
    turn.isWhite = !turn.isWhite;
    return;
  }

  const target = getSquare(to);
  if (target) boards[target.board] &= ~(1n << BigInt(to));
  boards[piece.board] &= ~(1n << BigInt(from));
  boards[piece.board] |= 1n << BigInt(to);

  if (isPawnPromotionMove(piece, to)) {
    promotePawnOnSquare(to, isWhite, "queen");
  }

  if (piece.symbol === "K") {
    castling.whiteKingSide = false;
    castling.whiteQueenSide = false;
  } else if (piece.symbol === "k") {
    castling.blackKingSide = false;
    castling.blackQueenSide = false;
  } else if (piece.symbol === "R") {
    if (from === 0) castling.whiteQueenSide = false;
    if (from === 7) castling.whiteKingSide = false;
  } else if (piece.symbol === "r") {
    if (from === 56) castling.blackQueenSide = false;
    if (from === 63) castling.blackKingSide = false;
  }

  turn.isWhite = !turn.isWhite;
}

function scoreBitboard(bb, value, isWhitePiece) {
  let total = 0;
  let bits = bb;
  while (bits) {
    const sq = bitScanForward(bits);
    const pstIndex = isWhitePiece ? sq : 63 - sq;
    total += value + PST[pstIndex];
    bits &= bits - 1n;
  }
  return total;
}

function evaluatePosition() {
  // positive = good for White
  let score =
    scoreBitboard(boards.whitePawns, PIECE_VALUES.P, true) -
    scoreBitboard(boards.blackPawns, PIECE_VALUES.p, false) +
    scoreBitboard(boards.whiteKnights, PIECE_VALUES.N, true) -
    scoreBitboard(boards.blackKnights, PIECE_VALUES.n, false) +
    scoreBitboard(boards.whiteBishops, PIECE_VALUES.B, true) -
    scoreBitboard(boards.blackBishops, PIECE_VALUES.b, false) +
    scoreBitboard(boards.whiteRooks, PIECE_VALUES.R, true) -
    scoreBitboard(boards.blackRooks, PIECE_VALUES.r, false) +
    scoreBitboard(boards.whiteQueens, PIECE_VALUES.Q, true) -
    scoreBitboard(boards.blackQueens, PIECE_VALUES.q, false);

  if (!boards.whiteKing) score -= PIECE_VALUES.K;
  if (!boards.blackKing) score += PIECE_VALUES.K;
  return score;
}

function orderMoves(moves) {
  return moves.slice().sort((a, b) => {
    const capA = getSquare(a.to) ? PIECE_VALUES[getSquare(a.to).symbol] || 0 : 0;
    const capB = getSquare(b.to) ? PIECE_VALUES[getSquare(b.to).symbol] || 0 : 0;
    return capB - capA;
  });
}

function negamax(depth, alpha, beta) {
  searchNodes++;
  if (searchNodes > SEARCH_NODE_LIMIT || depth === 0) {
    const evalScore = evaluatePosition();
    return turn.isWhite ? evalScore : -evalScore;
  }

  const moves = orderMoves(generateAllLegalMoves(turn.isWhite));
  if (moves.length === 0) {
    if (isInCheck(turn.isWhite)) return -100000 + searchNodes;
    return 0;
  }

  let best = -Infinity;
  for (const move of moves) {
    const snap = snapshotBoard();
    applyMoveForSearch(move.from, move.to);
    const score = -negamax(depth - 1, -beta, -alpha);
    restoreBoard(snap);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function pickEasyMove(botWhite) {
  const moves = generateAllLegalMoves(botWhite);
  if (!moves.length) return null;

  const interesting = moves.filter((m) => {
    if (getSquare(m.to)) return true;
    const snap = snapshotBoard();
    applyMoveForSearch(m.from, m.to);
    const givesCheck = isInCheck(!botWhite);
    restoreBoard(snap);
    return givesCheck;
  });

  if (interesting.length && Math.random() < 0.15) {
    return interesting[Math.floor(Math.random() * interesting.length)];
  }
  return moves[Math.floor(Math.random() * moves.length)];
}

function pickMediumMove(botWhite) {
  const moves = generateAllLegalMoves(botWhite);
  if (!moves.length) return null;

  let bestScore = -Infinity;
  let bestMoves = [];
  for (const move of moves) {
    const snap = snapshotBoard();
    applyMoveForSearch(move.from, move.to);
    let score = evaluatePosition();
    if (!botWhite) score = -score;
    score += (Math.random() - 0.5) * 8; // tiny jitter
    restoreBoard(snap);
    if (score > bestScore + 5) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) <= 5) {
      bestMoves.push(move);
      if (score > bestScore) bestScore = score;
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function pickExpertMove(botWhite) {
  const moves = orderMoves(generateAllLegalMoves(botWhite));
  if (!moves.length) return null;

  searchNodes = 0;
  let bestScore = -Infinity;
  let bestMove = moves[0];
  for (const move of moves) {
    const snap = snapshotBoard();
    applyMoveForSearch(move.from, move.to);
    // root move + depth 2 = 3 ply look-ahead
    const score = -negamax(2, -Infinity, Infinity);
    restoreBoard(snap);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function pickBotMove() {
  const botWhite = botIsWhite();
  if (game.mode === "easy") return pickEasyMove(botWhite);
  if (game.mode === "medium") return pickMediumMove(botWhite);
  return pickExpertMove(botWhite);
}

export function playBotMove() {
  if (game.gameOver) return;
  if (game.mode === "human") return;
  if (!isBotTurn()) return;
  if (isViewingHistory()) return;
  if (isCheckmate(turn.isWhite) || isStalemate(turn.isWhite)) return;

  const move = pickBotMove();
  if (!move) return;

  game.botThinking = true;
  renderBoard(); // lock human drag while animating
  const fromSq = indexToSquare(move.from);
  const toSq = indexToSquare(move.to);
  movePiece(fromSq, toSq);
  game.botThinking = false;
  renderBoard();
}

export function maybeScheduleBotMove() {
  clearTimeout(game.botTimerId);
  if (game.gameOver) return;
  if (game.mode === "human") return;
  if (isViewingHistory()) return;
  if (!isBotTurn()) return;
  if (isCheckmate(turn.isWhite) || isStalemate(turn.isWhite)) return;

  game.botThinking = true;
  renderBoard();
  game.botTimerId = setTimeout(() => {
    game.botThinking = false;
    playBotMove();
  }, botDelayMs());
}
