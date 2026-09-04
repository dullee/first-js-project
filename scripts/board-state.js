/** Bitboards, castling rights, turn, and board helpers. */

export const boards = {
  notMovedPieces: 0xffff00000000ffffn,
  whitePawns: 0x000000000000ff00n,
  whiteRooks: 0x0000000000000081n,
  whiteKnights: 0x0000000000000042n,
  whiteBishops: 0x0000000000000024n,
  whiteQueens: 0x0000000000000008n,
  whiteKing: 0x0000000000000010n,

  blackPawns: 0x00ff000000000000n,
  blackRooks: 0x8100000000000000n,
  blackKnights: 0x4200000000000000n,
  blackBishops: 0x2400000000000000n,
  blackQueens: 0x0800000000000000n,
  blackKing: 0x1000000000000000n,
};

export const defaultBoards = {
  notMovedPieces: 0xffff00000000ffffn,
  whitePawns: 0x000000000000ff00n,
  whiteRooks: 0x0000000000000081n,
  whiteKnights: 0x0000000000000042n,
  whiteBishops: 0x0000000000000024n,
  whiteQueens: 0x0000000000000008n,
  whiteKing: 0x0000000000000010n,

  blackPawns: 0x00ff000000000000n,
  blackRooks: 0x8100000000000000n,
  blackKnights: 0x4200000000000000n,
  blackBishops: 0x2400000000000000n,
  blackQueens: 0x0800000000000000n,
  blackKing: 0x1000000000000000n,
};

export const unicodePieces = {
  // use filled glyphs for both sides; white is colored via CSS
  K: "♚",
  Q: "♛",
  R: "♜",
  B: "♝",
  N: "♞",
  P: "♟",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

export const pieceMap = [
  { board: "whitePawns", symbol: "P" },
  { board: "whiteRooks", symbol: "R" },
  { board: "whiteKnights", symbol: "N" },
  { board: "whiteBishops", symbol: "B" },
  { board: "whiteQueens", symbol: "Q" },
  { board: "whiteKing", symbol: "K" },
  { board: "blackPawns", symbol: "p" },
  { board: "blackRooks", symbol: "r" },
  { board: "blackKnights", symbol: "n" },
  { board: "blackBishops", symbol: "b" },
  { board: "blackQueens", symbol: "q" },
  { board: "blackKing", symbol: "k" },
];

export const castling = {
  whiteKingSide: true,
  whiteQueenSide: true,
  blackKingSide: true,
  blackQueenSide: true,
};

export const defaultCastling = {
  whiteKingSide: true,
  whiteQueenSide: true,
  blackKingSide: true,
  blackQueenSide: true,
};

/** Mutable turn flag — read/write via `turn.isWhite`. */
export const turn = {
  isWhite: true,
};

export function getWhitePieces() {
  return (
    boards.whitePawns |
    boards.whiteRooks |
    boards.whiteKnights |
    boards.whiteBishops |
    boards.whiteQueens |
    boards.whiteKing
  );
}

export function getBlackPieces() {
  return (
    boards.blackPawns |
    boards.blackRooks |
    boards.blackKnights |
    boards.blackBishops |
    boards.blackQueens |
    boards.blackKing
  );
}

export function getAllPieces() {
  return getWhitePieces() | getBlackPieces();
}

export function getSquare(sq) {
  const bit = BigInt(sq);
  for (const piece of pieceMap) {
    if ((boards[piece.board] >> bit) & 1n) return piece;
  }
  return null;
}

export function indexToSquare(index) {
  const file = String.fromCharCode(97 + (index % 8)); // 0='a', 1='b' etc
  const rank = Math.floor(index / 8) + 1;
  return file + rank;
}

export function squareToIndex(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  return rank * 8 + file;
}

export function bitScanForward(bb) {
  // index of the least-significant set bit (0-63)
  let bit = bb & -bb;
  let index = 0;
  if (bit > 0xffffffffn) {
    bit >>= 32n;
    index += 32;
  }
  if (bit > 0xffffn) {
    bit >>= 16n;
    index += 16;
  }
  if (bit > 0xffn) {
    bit >>= 8n;
    index += 8;
  }
  if (bit > 0xfn) {
    bit >>= 4n;
    index += 4;
  }
  if (bit > 0x3n) {
    bit >>= 2n;
    index += 2;
  }
  if (bit > 0x1n) index += 1;
  return index;
}

export function snapshotBoard() {
  return {
    boards: { ...boards },
    castling: { ...castling },
    isWhiteTurn: turn.isWhite,
  };
}

export function restoreBoard(snap) {
  Object.assign(boards, snap.boards);
  Object.assign(castling, snap.castling);
  turn.isWhite = snap.isWhiteTurn;
}
