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
  notMovedPieces:
    1111111111111111000000000000000000000000000000001111111111111111n,
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
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
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
let isWhiteTurn = true;

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

function renderBoard() {
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";

  for (let rank = 7; rank >= 0; rank--) {
    const row = document.createElement("tr");

    for (let file = 0; file < 8; file++) {
      const sq = rank * 8 + file;
      const piece = getSquare(sq);
      const cell = document.createElement("td");

      cell.style.width = "68px";
      cell.style.height = "68px";
      cell.style.textAlign = "center";
      cell.style.fontSize = "48px";
      cell.style.cursor = piece ? "grab" : "default";
      cell.style.background = (rank + file) % 2 === 0 ? "#b58863" : "#f0d9b5";
      cell.dataset.sq = sq; // store the index on the cell

      cell.textContent = piece ? unicodePieces[piece.symbol] : "";

      // drag events
      if (piece) {
        cell.draggable = true;
        cell.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("from", sq); // store where we dragged from
        });
      }

      cell.addEventListener("dragover", (e) => {
        e.preventDefault(); // required to allow dropping
      });

      cell.addEventListener("drop", (e) => {
        e.preventDefault();
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
}

document
  .getElementById("boardResetButton")
  .addEventListener("click", function () {
    Object.assign(boards, defaultBoards);
    resetBoard();
  });
function resetBoard() {
  const button = document.getElementById("boardResetButton");
  button.addEventListener("click", function () {
    isWhiteTurn = true;
    Object.assign(boards, defaultBoards);
    renderBoard();

    console.log("reset board");
  });
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
    return (enemyPieces >> BigInt(from - 1)) & 1n ? true : false;
  } else if (diff === diagRight) {
    return (enemyPieces >> BigInt(from + 1)) & 1n ? true : false;
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

  // must move equal ranks and files to be diagonal
  if (fileDiff !== rankDiff) return false;

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
function isSquareAttacked(index, byWhite) {
  // check if any enemy piece can move to this square
  const enemyPieces = byWhite ? getWhitePieces() : getBlackPieces();
  let bb = enemyPieces;
  while (bb) {
    const sq = Number(BigInt.asUintN(64, bb & -bb).toString(2).length) - 1;
    const attacker = getSquare(sq);
    if (attacker) {
      const validator = moveValidators[attacker.symbol];
      if (validator && validator(sq, index, byWhite)) return true;
    }
    bb &= bb - 1n;
  }
  return false;
}

function movePiece(from, to) {
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
    updateBoard();
    return;
  }

  const moveValid = moveValidators[piece.symbol];
  let target = getSquare(toIndex);
  if (target) {
    boards[target.board] &= ~(1n << BigInt(toIndex));
    console.log("taking:", boards[target.board]);
  }
  if (piece.symbol === "p") {
    console.log("black pawn");

    if (toIndex - fromIndex === -7) {
      target = getSquare(fromIndex + 1);
      boards[target.board] &= ~(1n << BigInt(fromIndex + 1));
    } else if (toIndex - fromIndex === -9) {
      target = getSquare(fromIndex - 1);
      boards[target.board] &= ~(1n << BigInt(fromIndex - 1));
    }
  } else if (piece.symbol === "P") {
    console.log("white pawn");

    if (toIndex - fromIndex === 7) {
      target = getSquare(fromIndex - 1);
      boards[target.board] &= ~(1n << BigInt(fromIndex - 1));
    } else if (toIndex - fromIndex === 9) {
      target = getSquare(fromIndex + 1);
      boards[target.board] &= ~(1n << BigInt(fromIndex + 1));

      console.log("target:", target.board);
    }
  }
  if (moveValid && !moveValid(fromIndex, toIndex, isWhite)) {
    return console.log("Not a valid", piece.board, "move.");
  }
  if (enPassant) {
  }

  boards[piece.board] &= ~(1n << BigInt(fromIndex));
  boards[piece.board] |= 1n << BigInt(toIndex);
  isWhiteTurn = !isWhiteTurn;
  updateBoard();
  console.log("moved piece");
}

renderBoard();
