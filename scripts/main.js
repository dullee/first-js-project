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
var pawnPos =
  0b0000000011111111000000000000000000000000000000001111111100000000n;
function boardTerminal() {
  let out = "";
  for (let column = 7; column >= 0; column--) {
    for (let row = 0; row < 8; row++) {
      const sq = column * 8 + row;
      const bit = (pawnPos >> BigInt(sq)) & 1n;
      out += bit ? "p " : "- ";
    }
    out += `\n`;
  }
  console.log(out);
}

function movePawn(bitboard, fromSq, toSq) {
  const fromMask = 1n << BigInt(fromSq);
  const toMask = 1n << BigInt(toSq);

  return bitboard ^ (fromMask | toMask);
}

function updateBoard(pawnPos) {
  let out = "";
  for (let column = 7; column >= 0; column--) {
    for (let row = 0; row < 8; row++) {
      const sq = column * 8 + row;
      const bit = (pawnPos >> BigInt(sq)) & 1n;
      out += bit ? "p " : "- ";
    }
    out += `\n`;
  }
  console.clear();
  console.log(out);
}

const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
async function getInputs() {
  const rl = readline.createInterface({ input, output });

  const answer = await rl.question("Enter Move: ");
  const [a, b] = answer.split(" ");

  console.clear();
  console.log(`Move pawn to: ${a} ${b}`);
  pawnPos = movePawn(pawnPos, parseInt(a), parseInt(b));
  updateBoard(pawnPos);
  rl.close();
}
boardTerminal();
getInputs();
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
