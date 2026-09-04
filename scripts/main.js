// const http = require("node:http");

// const hostname = "127.0.0.1";
// const port = 3000;

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader("Content-Type", "text/plain");
//   res.end("Hello, World!\n");
// });

// server.listen(port, hostname, () => {
//   console.log(`\nServer running at http://${hostname}:${port}/`);
// });
// const readline = require("node:readline/promises");
// const { stdin: input, stdout: output } = require("node:process");
// const { log } = require("node:console");
// async function getInputs() {
//   const rl = readline.createInterface({ input, output });

//   const answer = await rl.question("Enter Move: ");
//   const [a, b] = answer.split(" ");

//   console.clear();
//   pawnPos = movePiece(a, b);
//   updateBoard();
//   console.log(`Move pawn to: ${a} ${b}`);

//   rl.close();
// }
var boards = {
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
const defaultBoards = {
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
const unicodePieces = {
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
const pieceMap = [
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
const moveValidators = {
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
var castling = {
  whiteKingSide: true,
  whiteQueenSide: true,
  blackKingSide: true,
  blackQueenSide: true,
};
const defaultCastling = {
  whiteKingSide: true,
  whiteQueenSide: true,
  blackKingSide: true,
  blackQueenSide: true,
};
let isWhiteTurn = true;

// bot / game mode
let gameMode = "human"; // human | easy | medium | expert
let humanIsWhite = true;
let botThinking = false;
let botTimerId = null;
let gameOver = false;
let checkAudioCtx = null;
let searchNodes = 0;
const SEARCH_NODE_LIMIT = 12000;

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


function getWhitePieces() {
  return (
    boards.whitePawns |
    boards.whiteRooks |
    boards.whiteKnights |
    boards.whiteBishops |
    boards.whiteQueens |
    boards.whiteKing
  );
}

function getBlackPieces() {
  return (
    boards.blackPawns |
    boards.blackRooks |
    boards.blackKnights |
    boards.blackBishops |
    boards.blackQueens |
    boards.blackKing
  );
}

function getAllPieces() {
  return getWhitePieces() | getBlackPieces();
}

function getSquare(sq) {
  const bit = BigInt(sq);
  for (const piece of pieceMap) {
    if ((boards[piece.board] >> bit) & 1n) return piece;
  }
  return null;
}

function getLegalMoves(fromIndex) {
  const piece = getSquare(fromIndex);
  if (!piece) return [];
  const isWhite = piece.board.startsWith("white");
  if (isWhite !== isWhiteTurn) return [];

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

function clearMoveHints() {
  document
    .querySelectorAll("td.origin-hint, td.move-hint, td.capture-hint")
    .forEach((cell) => {
      cell.classList.remove("origin-hint", "move-hint", "capture-hint");
    });
}

function showMoveHints(fromIndex) {
  clearMoveHints();
  const origin = document.querySelector(`td[data-sq="${fromIndex}"]`);
  if (origin) origin.classList.add("origin-hint");

  for (const to of getLegalMoves(fromIndex)) {
    const cell = document.querySelector(`td[data-sq="${to}"]`);
    if (!cell) continue;
    cell.classList.add(getSquare(to) ? "capture-hint" : "move-hint");
  }
}

function setPieceDragImage(e, symbol) {
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

function renderBoard() {
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
        !gameOver &&
        !botThinking &&
        (gameMode === "human" ||
          piece.board.startsWith("white") === humanIsWhite);
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
        if (gameOver || botThinking) return;
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

function getCheckAudioCtx() {
  if (!checkAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    checkAudioCtx = new AudioCtx();
  }
  return checkAudioCtx;
}

function playCheckSound() {
  const ctx = getCheckAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  master.connect(ctx.destination);

  const beep = (freq, start, dur) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(1, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.02);
  };

  beep(880, 0, 0.12);
  beep(1175, 0.14, 0.16);
}

function hideCheckBanner() {
  const banner = document.getElementById("checkBanner");
  if (!banner) return;
  banner.classList.remove("is-visible");
  banner.hidden = true;
}

function showCheckBanner(isWhiteInCheck) {
  const banner = document.getElementById("checkBanner");
  if (!banner) return;
  banner.textContent = isWhiteInCheck ? "White in check!" : "Black in check!";
  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add("is-visible"));
}

function applyCheckHighlight() {
  const boardEl = document.getElementById("board");
  if (!boardEl || gameOver) {
    hideCheckBanner();
    return;
  }

  const whiteInCheck = isInCheck(true);
  const blackInCheck = isInCheck(false);
  if (!whiteInCheck && !blackInCheck) {
    hideCheckBanner();
    return;
  }

  const kingBb = whiteInCheck ? boards.whiteKing : boards.blackKing;
  if (!kingBb) return;
  const kingSq = bitScanForward(kingBb);
  const cell = boardEl.querySelector(`td[data-sq="${kingSq}"]`);
  if (cell) cell.classList.add("in-check");
}

function announceCheck(isWhiteInCheck) {
  showCheckBanner(isWhiteInCheck);
  playCheckSound();

  const boardEl = document.getElementById("board");
  if (boardEl) {
    boardEl.classList.remove("board-check-flash");
    // restart animation
    void boardEl.offsetWidth;
    boardEl.classList.add("board-check-flash");
  }
}

function clearCheckAlert() {
  hideCheckBanner();
  const boardEl = document.getElementById("board");
  if (boardEl) boardEl.classList.remove("board-check-flash");
}

function hideGameOver() {
  const overlay = document.getElementById("gameOverOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-visible");
  overlay.hidden = true;
  const card = overlay.querySelector(".game-over-card");
  if (card) card.classList.remove("is-draw");
}

function showGameOver({ title, subtitle, eyebrow = "", isDraw = false }) {
  gameOver = true;
  clearInterval(timerId);
  clearTimeout(botTimerId);
  botThinking = false;
  clearCheckAlert();

  const overlay = document.getElementById("gameOverOverlay");
  if (!overlay) return;
  const card = overlay.querySelector(".game-over-card");
  document.getElementById("gameOverEyebrow").textContent = eyebrow;
  document.getElementById("gameOverTitle").textContent = title;
  document.getElementById("gameOverSubtitle").textContent = subtitle;
  card.classList.toggle("is-draw", isDraw);

  overlay.hidden = false;
  // next frame so the CSS transition runs
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  renderBoard();
}

function endByCheckmate(winnerIsWhite) {
  const winner = winnerIsWhite ? "White" : "Black";
  showGameOver({
    eyebrow: "Checkmate",
    title: `${winner} wins`,
    subtitle: `${winnerIsWhite ? "Black" : "White"} has no legal moves.`,
  });
}

function endByStalemate() {
  showGameOver({
    eyebrow: "Draw",
    title: "Stalemate",
    subtitle: "No legal moves, and the king is not in check.",
    isDraw: true,
  });
}

function endByTimeout(loserIsWhite) {
  const winner = loserIsWhite ? "Black" : "White";
  showGameOver({
    eyebrow: "Time",
    title: `${winner} wins`,
    subtitle: `${loserIsWhite ? "White" : "Black"} ran out of time.`,
  });
}

function resetBoard() {
  clearTimeout(botTimerId);
  botThinking = false;
  gameOver = false;
  clearCheckAlert();
  hideGameOver();
  isWhiteTurn = true;
  Object.assign(boards, defaultBoards);
  Object.assign(castling, defaultCastling);
  score = 0;
  whiteTimeLeft = 600;
  blackTimeLeft = 600;
  updateTimerText(whiteTimeLeft);
  startTimer();
  renderBoard();
  console.log("reset board");
  maybeScheduleBotMove();
}

function updateBoard() {
  renderBoard();
}

function indexToSquare(index) {
  const file = String.fromCharCode(97 + (index % 8)); // 0='a', 1='b' etc
  const rank = Math.floor(index / 8) + 1;
  return file + rank;
}

function squareToIndex(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  return rank * 8 + file;
}

function isValidPawnMove(from, to, isWhite) {
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
  if (diff === diagLeft) {
    return (enemyPieces >> BigInt(to)) & 1n ? true : false;
  } else if (diff === diagRight) {
    return (enemyPieces >> BigInt(to)) & 1n ? true : false;
  }

  return false;
}

function isValidKnightMove(from, to, isWhite) {
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
function isValidBishopMove(from, to, isWhite) {
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
function isValidRookMove(from, to, isWhite) {
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
function isValidQueenMove(from, to, isWhite) {
  return (
    isValidBishopMove(from, to, isWhite) || isValidRookMove(from, to, isWhite)
  );
}
function isValidKingMove(from, to, isWhite) {
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
function isValidCastle(from, to, isWhite) {
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
function performCastle(from, to, isWhite) {
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
function bitScanForward(bb) {
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

function pieceAttackBitboard(from, symbol, isWhite, occupied) {
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

function buildAttackedBitboard(byWhite) {
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

function isSquareAttacked(index, byWhite) {
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

function isInCheck(isWhite) {
  const kingBoard = isWhite ? boards.whiteKing : boards.blackKing;
  if (!kingBoard) return false;
  const kingIndex = bitScanForward(kingBoard);
  return isSquareAttacked(kingIndex, !isWhite);
}

function hasLegalMoves(isWhite) {
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
function isCheckmate(isWhite) {
  return isInCheck(isWhite) && !hasLegalMoves(isWhite);
}

function isStalemate(isWhite) {
  return !isInCheck(isWhite) && !hasLegalMoves(isWhite);
}
let whiteTimeLeft = 601;
let blackTimeLeft = 601;
let timerId;
const timerText = document.getElementById("timerText");
timerText.textContent = "Time: 10:00";
const timerCon = document.getElementById("timerContainer");

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (isWhiteTurn) {
      whiteTimeLeft--;
      updateTimerText(whiteTimeLeft);
    } else {
      blackTimeLeft--;
      updateTimerText(blackTimeLeft);
    }

    if (gameOver) {
      clearInterval(timerId);
      return;
    }
    if (whiteTimeLeft === 0 && isWhiteTurn) {
      endByTimeout(true);
    } else if (blackTimeLeft === 0 && !isWhiteTurn) {
      endByTimeout(false);
    }
  }, 1000);
}
function updateTimerText(timeLeft) {
  const timerMinute = Math.floor(timeLeft / 60);
  const timerSeconds = timeLeft % 60;
  timerText.textContent =
    "Time: " +
    timerMinute +
    ":" +
    (timerSeconds < 10 ? "0" : "") +
    timerSeconds;
  timerText.style.color = isWhiteTurn ? "black" : "white";
  timerCon.style.backgroundColor = isWhiteTurn ? "white" : "black";
}

function movePiece(from, to) {
  if (gameOver) return;
  const fromIndex = squareToIndex(from);
  const toIndex = squareToIndex(to);
  const piece = getSquare(fromIndex);
  if (!piece) {
    console.log("there is not piece at:", from);
  }
  const isWhite = piece.board.startsWith("white");
  if (isWhite !== isWhiteTurn) return console.log("Not your turn!");

  if (
    (piece.symbol === "K" || piece.symbol === "k") &&
    Math.abs(toIndex - fromIndex) === 2
  ) {
    if (!isValidCastle(fromIndex, toIndex, isWhite))
      return console.log("invalid castle");
    performCastle(fromIndex, toIndex, isWhite);
    isWhiteTurn = !isWhiteTurn;
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
    maybeScheduleBotMove();
    return;
  }

  const moveValid = moveValidators[piece.symbol];
  let target = getSquare(toIndex);
  if (moveValid && !moveValid(fromIndex, toIndex, isWhite)) {
    return console.log("Not a valid", piece.board, "move.");
  }
  const fromRank = Math.floor(fromIndex / 8);
  const correctRank = isWhite ? fromRank === 4 : fromRank === 3;
  if (piece.symbol === "P" || (piece.symbol === "p" && correctRank)) {
    const diff = toIndex - fromIndex;

    const adjacentSquare =
      diff === (isWhite ? 9 : -9) ? fromIndex + 1 : fromIndex - 1;
    const enemyPawns = isWhite ? boards.blackPawns : boards.whitePawns;

    if ((enemyPawns >> BigInt(adjacentSquare)) & 1n) {
      boards[isWhite ? "blackPawns" : "whitePawns"] &= ~(
        1n << BigInt(adjacentSquare)
      );
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
    boards[target.board] |= 1n << BigInt(toIndex);
    return console.log("move leaves king in check");
  }
  isWhiteTurn = !isWhiteTurn;
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

function displayDebugMenu() {
  const container = document.getElementById("debugMenuContainer");
  container.classList.toggle("show");
}
const debug = {
  nonMoved: false,
  enPassant: false,
  attacked: false,
  checkmate: false,
  boardIndex: false,
};
const debugBoards = {
  enPassant: 0n,
  attackedByWhite: 0n,
  attackedByBlack: 0n,
};
function applyDebugLayer() {
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
let score = 0;
function updateScore(piece) {
  if (piece.includes("Pawns")) score += 1;
  console.log("Score updated:", score);
}

function updateDebugBoards() {
  // both sides' attack maps so threatened pieces can be shown together
  debugBoards.attackedByWhite = buildAttackedBitboard(true);
  debugBoards.attackedByBlack = buildAttackedBitboard(false);
}

function toggleDebug(key) {
  debug[key] = !debug[key];
  renderBoard();
}

function botIsWhite() {
  return !humanIsWhite;
}

function isBotTurn() {
  return gameMode !== "human" && isWhiteTurn === botIsWhite();
}

function botDelayMs() {
  if (gameMode === "easy") return 500;
  if (gameMode === "medium") return 600;
  return 700;
}

function snapshotGame() {
  return {
    boards: { ...boards },
    castling: { ...castling },
    isWhiteTurn,
  };
}

function restoreGame(snap) {
  Object.assign(boards, snap.boards);
  Object.assign(castling, snap.castling);
  isWhiteTurn = snap.isWhiteTurn;
}

function generateAllLegalMoves(isWhite) {
  const savedTurn = isWhiteTurn;
  isWhiteTurn = isWhite;
  const moves = [];
  let bb = isWhite ? getWhitePieces() : getBlackPieces();
  while (bb) {
    const from = bitScanForward(bb);
    for (const to of getLegalMoves(from)) {
      moves.push({ from, to });
    }
    bb &= bb - 1n;
  }
  isWhiteTurn = savedTurn;
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
    isWhiteTurn = !isWhiteTurn;
    return;
  }

  const target = getSquare(to);
  if (target) boards[target.board] &= ~(1n << BigInt(to));
  boards[piece.board] &= ~(1n << BigInt(from));
  boards[piece.board] |= 1n << BigInt(to);

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

  isWhiteTurn = !isWhiteTurn;
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
    return isWhiteTurn ? evalScore : -evalScore;
  }

  const moves = orderMoves(generateAllLegalMoves(isWhiteTurn));
  if (moves.length === 0) {
    if (isInCheck(isWhiteTurn)) return -100000 + searchNodes;
    return 0;
  }

  let best = -Infinity;
  for (const move of moves) {
    const snap = snapshotGame();
    applyMoveForSearch(move.from, move.to);
    const score = -negamax(depth - 1, -beta, -alpha);
    restoreGame(snap);
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
    const snap = snapshotGame();
    applyMoveForSearch(m.from, m.to);
    const givesCheck = isInCheck(!botWhite);
    restoreGame(snap);
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
    const snap = snapshotGame();
    applyMoveForSearch(move.from, move.to);
    let score = evaluatePosition();
    if (!botWhite) score = -score;
    score += (Math.random() - 0.5) * 8; // tiny jitter
    restoreGame(snap);
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
    const snap = snapshotGame();
    applyMoveForSearch(move.from, move.to);
    // root move + depth 2 = 3 ply look-ahead
    const score = -negamax(2, -Infinity, Infinity);
    restoreGame(snap);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function pickBotMove() {
  const botWhite = botIsWhite();
  if (gameMode === "easy") return pickEasyMove(botWhite);
  if (gameMode === "medium") return pickMediumMove(botWhite);
  return pickExpertMove(botWhite);
}

function playBotMove() {
  if (gameOver) return;
  if (gameMode === "human") return;
  if (!isBotTurn()) return;
  if (isCheckmate(isWhiteTurn) || isStalemate(isWhiteTurn)) return;

  const move = pickBotMove();
  if (!move) return;

  botThinking = true;
  renderBoard(); // lock human drag while animating
  const fromSq = indexToSquare(move.from);
  const toSq = indexToSquare(move.to);
  movePiece(fromSq, toSq);
  botThinking = false;
  renderBoard();
}

function maybeScheduleBotMove() {
  clearTimeout(botTimerId);
  if (gameOver) return;
  if (gameMode === "human") return;
  if (!isBotTurn()) return;
  if (isCheckmate(isWhiteTurn) || isStalemate(isWhiteTurn)) return;

  botThinking = true;
  renderBoard();
  botTimerId = setTimeout(() => {
    botThinking = false;
    playBotMove();
  }, botDelayMs());
}

function onGameSettingsChange() {
  const modeEl = document.getElementById("gameMode");
  const playAsEl = document.getElementById("playAs");
  gameMode = modeEl.value;
  humanIsWhite = playAsEl.value === "white";
  playAsEl.disabled = gameMode === "human";
  resetBoard();
}

renderBoard();
startTimer();
const playAsEl = document.getElementById("playAs");
if (playAsEl) playAsEl.disabled = gameMode === "human";
