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

// let name = "Dulguun";
// let age = "20";
// let adress = "UB";

// console.log("Name: " + name + "\nAgeÍÍ:" + age, "\nAdress:", adress);
// const canvas = document.getElementById("canvas");
// canvas.setAttribute("height", "1000px");
// canvas.setAttribute("width", "1000px");
// const ctx = canvas.getContext("2d");
// ctx.fillStyle = "rgb(233, 250, 172)";
// ctx.fillRect(0, 0, 800, 800);
// function draw() {
//   let posX = 0;
//   let posY = 0;
//   let skipTile = true;

//   for (let y = 0; y < 8; y++) {
//     for (let x = 0; x < 8; x++) {
//       if (!skipTile) {
//         ctx.fillStyle = "green";
//         ctx.fillRect(posX, posY, 100, 100);
//         posX += 100;
//         skipTile = !skipTile;
//       } else {
//         posX += 100;
//         skipTile = !skipTile;
//       }
//     }
//     posY += 100;
//     posX = 0;
//     skipTile = !skipTile;
//   }
// }

// function placePieces() {
//   const pawnImg = new Image();
//   pawnImg.src = "images/pawn.png";
//   let posX = 0;
//   let posY = 100;
//   pawnImg.onload = () => {
//     for (let y = 0; y < 2; y++) {
//       for (let x = 0; x < 8; x++) {
//         ctx.drawImage(pawnImg, posX, posY, 100, 100);
//         posX += 100;
//       }
//       posX = 0;
//       posY = 600;
//       ctx.filter = "invert(100%)";
//     }
//   };
// }
var whitePawns = 0x000000000000ff00n;
var whiteRooks = 0x0000000000000081n;
var whiteKnights = 0x0000000000000042n;
var whiteBishops = 0x0000000000000024n;
var whiteQueens = 0x0000000000000008n;
var whiteKing = 0x0000000000000010n;

var blackPawns = 0x00ff000000000000n;
var blackRooks = 0x8100000000000000n;
var blackKnights = 0x4200000000000000n;
var blackBishops = 0x2400000000000000n;
var blackQueens = 0x0800000000000000n;
var blackKing = 0x1000000000000000n;

function getSymbol(sq) {
  const bit = BigInt(sq);
  if ((whitePawns >> bit) & 1n) return "P";
  if ((whiteRooks >> bit) & 1n) return "R";
  if ((whiteKnights >> bit) & 1n) return "N";
  if ((whiteBishops >> bit) & 1n) return "B";
  if ((whiteQueens >> bit) & 1n) return "Q";
  if ((whiteKing >> bit) & 1n) return "K";
  if ((blackPawns >> bit) & 1n) return "p";
  if ((blackRooks >> bit) & 1n) return "r";
  if ((blackKnights >> bit) & 1n) return "n";
  if ((blackBishops >> bit) & 1n) return "b";
  if ((blackQueens >> bit) & 1n) return "q";
  if ((blackKing >> bit) & 1n) return "k";
  return "-";
}

function boardTerminal() {
  let out = "";

  for (let rank = 7; rank >= 0; rank--) {
    out += `${rank + 1} `;
    for (let file = 0; file < 8; file++) {
      const sq = rank * 8 + file;
      out += getSymbol(sq) + " ";
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
  if (getSymbol(fromIndex) != "-") {
    getSymbol(fromIndex) &= ~(1n << BigInt(fromIndex));
    getSymbol(toIndex) |= 1n << BigInt(toIndex); //

    updateBoard();
    console.log("moved piece");
  } else {
    console.log("could not move piece");
  }
}

boardTerminal();
// movePiece("a2", "a4");

// draw();
// placePieces();

// const header = document.querySelector("h1");

// ((header.textContent = "Name: " + name + " Age: " + age), " Adress: ", adress);

// const myImage = document.querySelector("img");
// let myButton = document.querySelector("button");
// let myHeading = document.querySelector("h1"); // Comments

// myHeading.textContent = "";

// myImage.addEventListener("click", () => {
//   const mySrc = myImage.getAttribute("src");
//   if (mySrc === "images/firefox-icon.png") {
//     myImage.setAttribute("src", "images/firefox2.png");
//   } else {
//     myImage.setAttribute("src", "images/firefox-icon.png");
//   }
// });

// myButton.addEventListener("click", () => {
//   setUserName();
// });

// function setUserName() {
//   const myName = prompt("Please enter your name.");
//   if (myName === null || myName === "") {
//     localStorage.setItem("name", "user");
//   } else {
//     localStorage.setItem("name", myName);
//     myHeading.textContent = `Mozilla is cool, ${myName}`;
//   }
// }
// if (!localStorage.getItem("name")) {
//   setUserName();
// } else {
//   const storedName = localStorage.getItem("name");
//   myHeading.textContent = `Mozilla is cool, ${storedName}`;
// }
// console.log("hello console");
