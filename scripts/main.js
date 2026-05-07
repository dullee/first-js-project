const http = require("node:http");

const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello, World!\n");
});

// server.listen(port, hostname, () => {
//   console.log(`\nServer running at http://${hostname}:${port}/`);
// });

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

function getSquare(sq) {
  const bit = BigInt(sq);
  for (const piece of pieceMap) {
    if ((boards[piece.board] >> bit) & 1n) return piece;
  }
  return null;
}

function boardTerminal() {
  let out = "";

  for (let rank = 7; rank >= 0; rank--) {
    out += `${rank + 1} `;
    for (let file = 0; file < 8; file++) {
      const sq = rank * 8 + file;
      const piece = getSquare(sq);
      out += piece ? piece.symbol + " " : "- ";
    }

    out += `\n`;
    if (rank == 0) {
      out += "  a b c d e f g h";
    }
  }
  console.log(out);
}

function updateBoard() {
  console.clear();
  boardTerminal();
}
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const { log } = require("node:console");
async function getInputs() {
  const rl = readline.createInterface({ input, output });

  const answer = await rl.question("Enter Move: ");
  const [a, b] = answer.split(" ");

  console.clear();
  pawnPos = movePiece(a, b);
  updateBoard();
  console.log(`Move pawn to: ${a} ${b}`);

  rl.close();
}

function squareToIndex(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  return rank * 8 + file;
}

function movePiece(from, to) {
  const fromIndex = squareToIndex(from);
  const toIndex = squareToIndex(to);
  const piece = getSquare(fromIndex);
  if (piece) {
    boards[piece.board] &= ~(1n << BigInt(fromIndex));
    boards[piece.board] |= 1n << BigInt(toIndex);

    updateBoard();
    console.log("moved piece");
  } else {
    console.log("could not move piece");
  }
}

boardTerminal();
movePiece("a2", "a4");
