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
};
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
    renderBoard();
  });
function resetBoard() {
  const button = document.getElementById("boardResetButton");
  button.addEventListener("click", function () {
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
  if (diff === diagLeft || diff === diagRight) {
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

  return true;
}
function isValidQueenMove(from, to, isWhite) {
  return (
    isValidBishopMove(from, to, isWhite) || isValidRookMove(from, to, isWhite)
  );
}
function isValidKingMove(from, to, isWhite) {}

function movePiece(from, to) {
  const fromIndex = squareToIndex(from);
  const toIndex = squareToIndex(to);
  const piece = getSquare(fromIndex);
  if (!piece) {
    console.log("there is not piece at:", from);
  }
  const isWhite = piece.board.startsWith("white");
  const moveValid = moveValidators[piece.symbol];

  if (moveValid && !moveValid(fromIndex, toIndex, isWhite)) {
    return console.log("Not a valid", piece.board, "move.");
  }
  const target = getSquare(toIndex);
  if (target) boards[target.board] &= ~(1n << BigInt(toIndex));

  boards[piece.board] &= ~(1n << BigInt(fromIndex));
  boards[piece.board] |= 1n << BigInt(toIndex);

  updateBoard();
  console.log("moved piece");
}

renderBoard();
