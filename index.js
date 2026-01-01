const peicesBlk = "pnbrqk ";
const peicesWht = "PNBRQK ";
const moves = {
  knight: [-2, -1, -2, 1, 2, 1, 2, -1, -1, 2, -1, -2, 1, -2, 1, 2],
};


const boardE = document.querySelector(".board");

// const board = Array.from({length: 64}, (_, i) => getSide(getPiecePos(i)[0])[getPiece(getPiecePos(i)[0], getPiecePos(i)[1])].trim())
const played = [];
const premove = false;
const premoves = [];

let enpassiantI = null;
let toMoves = [];
let undoI = -1;
// const peicesBlk = "♟♞♝♜♛♚ ";
// const peicesWht = "♙♘♗♖♕♔ ";
let promoting = false;
let turn = 0;
let gameOver = false;
const withComputer = false;
const whiteSide = true;
const gameInfo = {
  blk: {
    castleLeft: true,
    castleRight: true,
  },
  wht: {
    castleLeft: true,
    castleRight: true,
  },
};
let toMove = null;
for (let i = 0; i < 64; i++) {
  const r = Math.floor(i / 8);
  const c = i % 8;
  const tile = str2elt(
    `<div class="tile${(r + c) % 2 === 1 ? " dark" : ""} gr${r} gc${c}">
    <div class="layer selected"></div>
    <div class="layer move"></div>
    <div class="info"></div>
</div>`
  );
  board[i] = getSide(getPiecePos(i)[0])[getPiece(getPiecePos(i)[0], getPiecePos(i)[1])].trim()
  tile.addEventListener("click", () => {
    // if ((withComputer && turn % 2 === 0 )|| !withComputer) {

    // }
    if ((withComputer && turn % 2 === 0) || !withComputer) {
      if (toMove === null) {
        if (board[i].trim() !== "") {
          toMove = i;
          updateUiSquare(i);
          for (let j = 0; j < 64; j++) {
            if (isValidMove(toMove, j)) {
              toMoves.push(j);
              updateUiSquare(j);
            }
          }

          // console.log(toMove);
        }
      } else {
        if (toMove === i) {
          deselect();
        } else if (isValidMove(toMove, i)) {
          // tile.innerHTML = boardE.children[toMove].innerText
          // boardE.children[toMove].innerText = ''
          playMove(i);
          if (withComputer && !gameOver) {
            if (!promoting) {
              setTimeout(() => computerPlay(), 1000);
            }
          }
        } else if (board[i].trim() !== "") {
          deselect();
          tile.click();
        } else {
          deselect();
        }
      }
    } else if (premove && withComputer) {
      if (toMove === null) {
        if (board[i].trim() !== "") {
          toMove = i;
          updateUiSquare(i);
          for (let j = 0; j < 64; j++) {
            if (isValidMove(toMove, j)) {
              toMoves.push(j);
              updateUiSquare(j);
            }
          }

          // console.log(toMove);
        }
      }
    }
  });
  boardE.append(tile);
  updateUiSquare(i);
}

function playMove(i) {
  const r = Math.floor(i / 8);
  const c = i % 8;

  if (enpassiantable(toMove, i)) {
    enpassiantI = i;
  } else {
    if (isenpassiant(toMove, i) && enpassiantI !== null) {
      board[enpassiantI] = "";
      updateUiSquare(enpassiantI);
    }
    enpassiantI = null;
  }
  if (isCastle(toMove, i)) {
    if (c > 4) {
      board[i] = board[toMove];
      board[toMove] = "";
      board[getPieceI(r, c - 1)] = r > 4 ? peicesWht[3] : peicesBlk[3];
      board[getPieceI(r, c + 1)] = "";
      updateUiSquare(getPieceI(r, c - 1));
      updateUiSquare(getPieceI(r, c + 1));
    } else {
      board[i] = board[toMove];
      board[toMove] = "";
      board[getPieceI(r, c + 1)] = r > 4 ? peicesWht[3] : peicesBlk[3];
      board[getPieceI(r, 0)] = "";
      updateUiSquare(getPieceI(r, 0));
      updateUiSquare(getPieceI(r, c + 1));
      // console.log("castles");
    }
  } else {
    board[i] = board[toMove];
    board[toMove] = "";
  }
  turn += 1;
  undoI = -1;
  // console.log(toMove, "moved!");
  if (
    (gameInfo.wht.castleLeft || gameInfo.wht.castleRight) &&
    kingMove(i) &&
    peicesWht.includes(board[i])
  ) {
    gameInfo.wht.castleLeft = false;
    gameInfo.wht.castleRight = false;
    // console.log("moved2!");
  }
  if (
    (gameInfo.blk.castleLeft || gameInfo.blk.castleRight) &&
    kingMove(i) &&
    peicesBlk.includes(board[i])
  ) {
    gameInfo.blk.castleLeft = false;
    gameInfo.blk.castleRight = false;
    // console.log("moved2!");
    console.log("blk cant castle");
  }
  if (gameInfo.blk.castleLeft && board[i] === peicesBlk[3] && c > 4) {
    gameInfo.blk.castleLeft = false;
    console.log("blk cant castle");
  } else if (gameInfo.blk.castleRight && board[i] === peicesWht[3] && c < 4) {
    console.log("blk cant castle");
    gameInfo.blk.castleRight = false;
  }
  if (gameInfo.wht.castleLeft && board[i] === peicesWht[3] && c > 4) {
    gameInfo.wht.castleLeft = false;
  } else if (gameInfo.wht.castleRight && board[i] === peicesWht[3] && c < 4) {
    gameInfo.wht.castleRight = false;
  }
  if (r === 0 && board[i] === peicesWht[0]) {
    // promote!
    // const pE = document.body.querySelector(".promotion");
    // pE.classList.remove("hidden");
    promoteDialogue().then((v) => {
      board[i] = v;
      updateUiSquare(i);
      deselect();
      updateGameState();
    });
    promoting = true;
  }
  updateUiSquare(i);
  deselect();
  updateGameState();
  played.push(i);
}
function updateGameState() {
  gameOver = true;
  if (isCheckmate()) {
    setTimeout(
      () => alert(`Checkmate. ${["Black", "White"][turn % 2]} won.`),
      250
    );
  } else if (isStalemate()) {
    setTimeout(() => alert(`Stalemate.`), 250);
  } else if (isDraw()) {
    setTimeout(() => alert(`Its a draw!.`), 250);
  } else {
    gameOver = false;
  }
}
function playComputerMove(ltoMove, i) {
  toMove = ltoMove;
  playMove(i);
}

async function promoteDialogue() {
  const promoteE = document.getElementById("promote");
  const wrapper = str2elt(`<div class="wrapper">
      </div>
      <div class="backdrop"></div>`);
  console.log("promotion initiated");
  return new Promise((res, rej) => {
    [peicesWht[4], peicesWht[3], peicesWht[2], peicesWht[1]].forEach((p) => {
      const tile = str2elt(
        `<div class="tile"><div class="inner">${p}</div></div>`
      );
      tile.addEventListener("click", () => {
        if (promoting) {
          promoting = false;
          promoteE.innerHTML = "";
          res(p);
          setTimeout(() => computerPlay(), 1000);
        }
      });
      wrapper.append(tile);
    });
    promoteE.append(wrapper);
  });
}
// promoteDialogue();

function computerPlay() {
  const calculateMaterial = (lboard, s) => {
    let score = 0;
    lboard.forEach((p) => {
      if (p.trim() !== "" && [peicesWht, peicesBlk][s].includes(p)) {
        score += [1, 2.5, 3, 5, 10, 0][getPieceId(p)];
        // console.log('add', [1, 2.5, 3, 5, 10, 0][getPieceId(p)], p);
      }
    });
    // console.log('Calced mat '+score);
    return score;
  };
  const calculatePosition = (lboard, s) => {
    let score = 0;
    lboard.forEach((p, toMove) => {
      for (let i = 0; i < 64; i++) {
        if (isValidMove(toMove, i, { lboard: lboard, plturn: s })) {
          const element = array[i];
        }
      }
    });
    // console.log('Calced mat '+score);
    return score;
  };
  const scoreMove = (toMove, i) => {
    let score = 0;
    if (
      calculateMaterial(makeMove(board, toMove, i), 0) <
      calculateMaterial(board, 0)
    ) {
      // console.log(score);
      score += 1;
    }
    if (
      calculateMaterial(makeMove(board, toMove, i), 0) <
      calculateMaterial(board, 0)
    ) {
      // console.log(score);
      score += 1;
    }
    return score;
  };
  let valids = [];
  board.forEach((p, i) => {
    board.forEach((_, j) => {
      if (isValidMove(i, j)) {
        valids.push([i, j]);
      }
    });
  });
  let gs = [];
  let bs = 0;
  // let i = Math.floor(Math.random() * valids.length);
  for (let j = 0; j < valids.length; j++) {
    const ns = scoreMove(valids[j][0], valids[j][1]);
    console.log("scored move:", ns);
    if (ns > bs) {
      gs = [];
      bs = ns;
    }
    if (ns === bs) {
      gs.push(valids[j]);
    }
  }
  console.log(gs);
  let i = Math.floor(Math.random() * gs.length);

  // console.log(toChessNotation(valids[i][0]), toChessNotation(valids[i][1]));

  playComputerMove(gs[i][0], gs[i][1]);
}

function isStalemate() {
  return (
    !(isCheck(board, 0) || isCheck(board, 1)) &&
    !board.some((p, i) => {
      return board.some((_, j) => {
        return isValidMove(i, j);
      });
    })
  );
}

function isRearranged(arr1, arr2) {
  return (
    arr1.every((v) => arr2.includes(v)) && arr2.every((v) => arr1.includes(v))
  );
}

function isDraw() {
  const alive = board.filter((p) => p.trim() !== "");
  if (alive.length === 2) {
    return true;
  }
  const aliveExceptKing = alive.filter((p) => getPieceId(p) !== 5);
  if (
    isRearranged(aliveExceptKing, [peicesWht[2], peicesBlk[2]]) || // 2 opposing bishops
    isRearranged(aliveExceptKing, [peicesWht[1], peicesBlk[1]]) || // 2 opposing knights
    isRearranged(aliveExceptKing, [peicesWht[1], peicesBlk[2]]) || // black knight and white bishop
    isRearranged(aliveExceptKing, [peicesBlk[1], peicesWht[2]]) || // white knight and black bishop
    isRearranged(aliveExceptKing, [peicesBlk[2]]) || // a black bishop
    isRearranged(aliveExceptKing, [peicesWht[2]]) || // a white bishop
    isRearranged(aliveExceptKing, [peicesBlk[1]]) || // a black knight
    isRearranged(aliveExceptKing, [peicesWht[1]]) // a white knight
  ) {
    return true;
  }
  return false;
}

function isCheckmate() {
  return (
    (isCheck(board, 0) || isCheck(board, 1)) &&
    !board.some((p, i) => {
      return board.some((_, j) => {
        return isValidMove(i, j);
      });
    })
  );
}

function enpassiantable(toMove, i) {
  // console.log(getPieceId(board[i]) + "enpssiantable");
  return (
    getPieceId(board[i]) === 0 &&
    Math.abs(getPiecePos(toMove)[0] - getPiecePos(i)[0]) === 2
  );
}

function isenpassiant(toMove, i) {
  const [er, ec] = getPiecePos(enpassiantI);
  const [or, oc] = getPiecePos(toMove);
  const [nr, nc] = getPiecePos(i);
  return (
    getPieceId(board[i]) === 0 &&
    nc === ec &&
    Math.abs(nc - oc) === 1 &&
    or === er
  );
}

function isCheck(lboard = [], forSide, test = false) {
  const kingW = lboard.indexOf(peicesWht[5]);
  const kingB = lboard.indexOf(peicesBlk[5]);
  // console.log(toChessNotation(kingW), toChessNotation(kingB));
  return forSide === 1
    ? lboard.some((p, i) => {
        // console.log('Chekc!!');

        return (
          peicesWht.includes(p) &&
          p.trim() !== "" &&
          isValidMove(i, kingB, { checks: false, plturn: 0, test, lboard })
        );
      })
    : lboard.some((p, i) => {
        // console.log('Chekc!!');
        return (
          peicesBlk.includes(p) &&
          p.trim() !== "" &&
          isValidMove(i, kingW, {
            checks: false,
            plturn: 1,
            test,
            lboard,
          })
        );
      });
}

function makeMove(lboard, toMove, i) {
  const nb = [...lboard];
  nb[i] = nb[toMove];
  nb[toMove] = "";
  return nb;
}

function deselect() {
  if (toMove || toMove === 0) {
    let tm = toMove;
    toMove = null;
    updateUiSquare(tm);
  }
  toMoves.forEach((i) => {
    updateUiSquare(i);
  });
  toMoves = [];
}

function isValidMove(
  toMove,
  i,
  options = {
    checks: true,
    plturn: turn,
    test: true,
    lboard: board,
  }
) {
  const { checks = true, plturn = turn, test = true, lboard = board } = options;
  if (toMove === null) {
    return false;
  }
  if (lboard[toMove].trim() === "" && lboard[i].trim() === "") {
    return false;
  }
  const [or, oc] = getPiecePos(toMove);
  const [nr, nc] = getPiecePos(i);
  // console.log(lboard);
  // return true
  const val = (() => {
    if (
      lboard[i].trim() !== "" &&
      ((peicesWht.includes(lboard[toMove]) && peicesWht.includes(lboard[i])) ||
        (peicesBlk.includes(lboard[toMove]) && peicesBlk.includes(lboard[i])))
    ) {
      return false;
    }
    if (
      (whiteSide&&peicesWht.includes(lboard[toMove]) && plturn % 2 === 0) 
      // || (!whiteSide&&peicesBlk.includes(lboard[toMove])  && plturn % 2 === 1)
    ) {
      //white
      const p = getPieceId(lboard[toMove]);
      switch (p) {
        case 0:
          //pawn
          if (enpassiantI || enpassiantI === 0) {
            let [enr, enc] = getPiecePos(enpassiantI);
            if (enr - 1 === nr && enc === nc && or - 1 === nr) {
              return true;
            }
          }
          if (lboard[i].trim() !== "") {
            //capturing
            if (nr === or - 1 && (oc === nc - 1 || oc === nc + 1)) {
              return true;
            }
          } else if (
            (nr === or - 1 && oc === nc) ||
            (or === 6 &&
              nr === or - 2 &&
              oc === nc &&
              lboard[getPieceI(or - 1, oc)].trim() === "")
          ) {
            return true;
          }
          break;
        case 1:
          // knight
          for (let j = 0; j < moves.knight.length; j += 2) {
            const r = moves.knight[j];
            const c = moves.knight[j + 1];
            // console.log(r, c);
            if (nc === c + oc && nr === r + or) {
              return true;
            }
          }
          break;
        case 2:
          //bishop
          if (Math.abs(oc - nc) === Math.abs(or - nr)) {
            return isNotBlockedDiagonally(or, oc, nr, nc, lboard);
            // return true;
          }
          break;
        case 3:
          //rook
          // console.log(or,nr);
          if (oc === nc) {
            // return isNotBlockedDiagonally(or, oc, nr, nc);
            return isNotBlockedVertically(or, oc, nr, nc, lboard);
          } else if (or === nr) {
            return isNotBlockedHorizonally(or, oc, nr, nc, lboard);
          }
          break;
        case 4:
          // queen!!!
          if (Math.abs(oc - nc) === Math.abs(or - nr)) {
            return isNotBlockedDiagonally(or, oc, nr, nc, lboard);
            // return true;
          }
          if (oc === nc) {
            // return isNotBlockedDiagonally(or, oc, nr, nc);
            return isNotBlockedVertically(or, oc, nr, nc, lboard);
          } else if (or === nr) {
            return isNotBlockedHorizonally(or, oc, nr, nc, lboard);
          }
          break;
        case 5:
          // king!!!
          if (
            Math.abs(oc - nc) <= 1 &&
            Math.abs(or - nr) <= 1 &&
            !(oc === nc && or === nr)
          ) {
            return true;
          }
          if (
            gameInfo.wht.castleLeft &&
            oc - 2 === nc &&
            or === nr &&
            isNotBlockedHorizonally(or, oc, nr, nc, lboard) &&
            isValidMove(toMove, getPieceI(or, oc - 1), options) &&
            !isCheck(lboard, 0)
          ) {
            return true;
          }
          if (
            gameInfo.wht.castleRight &&
            oc + 2 === nc &&
            or === nr &&
            isNotBlockedHorizonally(or, oc, nr, nc, lboard) &&
            isValidMove(toMove, getPieceI(or, oc + 1), options) &&
            !isCheck(lboard, 0)
          ) {
            return true;
          }
          break;
      }
    }
    if (
      (whiteSide&&peicesBlk.includes(lboard[toMove]) && plturn % 2 === 1)
      // || (!whiteSide && peicesWht.includes(lboard[toMove]) && plturn % 2 === 0)
    ) {
      //black
      const p = getPieceId(lboard[toMove]);
      switch (p) {
        case 0:
          //pawn
          if (enpassiantI || enpassiantI === 0) {
            let [enr, enc] = getPiecePos(enpassiantI);
            if (enr + 1 === nr && enc === nc && or + 1 === nr) {
              return true;
            }
          }
          if (lboard[i].trim() !== "") {
            if (nr === or + 1 && (oc === nc + 1 || oc === nc - 1)) {
              return true;
            }
          } else if (
            (nr === or + 1 && oc === nc) ||
            (or === 1 &&
              nr === or + 2 &&
              oc === nc &&
              lboard[getPieceI(or + 1, oc)].trim() === "")
          ) {
            return true;
          }
          break;
        case 1:
          // knight
          for (let j = 0; j < moves.knight.length; j += 2) {
            const r = moves.knight[j];
            const c = moves.knight[j + 1];
            // console.log(r, c);
            if (nc === c + oc && nr === r + or) {
              return true;
            }
          }
          break;
        case 2:
          //bishop
          if (Math.abs(oc - nc) === Math.abs(or - nr)) {
            return isNotBlockedDiagonally(or, oc, nr, nc, lboard);
            // return true;
          }
          break;
        case 3:
          //rook
          // console.log(or,nr);
          if (oc === nc) {
            // return isNotBlockedDiagonally(or, oc, nr, nc);
            return isNotBlockedVertically(or, oc, nr, nc, lboard);
          } else if (or === nr) {
            return isNotBlockedHorizonally(or, oc, nr, nc, lboard);
          }
          break;
        case 4:
          // queen!!!
          if (Math.abs(oc - nc) === Math.abs(or - nr)) {
            return isNotBlockedDiagonally(or, oc, nr, nc, lboard);
            // return true;
          }
          if (oc === nc) {
            // return isNotBlockedDiagonally(or, oc, nr, nc);
            return isNotBlockedVertically(or, oc, nr, nc, lboard);
          } else if (or === nr) {
            return isNotBlockedHorizonally(or, oc, nr, nc, lboard);
          }
          break;
        case 5:
          // king!!!
          if (
            Math.abs(oc - nc) <= 1 &&
            Math.abs(or - nr) <= 1 &&
            !(oc === nc && or === nr)
          ) {
            return true;
          }
          if (
            gameInfo.blk.castleLeft &&
            oc - 2 === nc &&
            or === nr &&
            isNotBlockedHorizonally(or, oc, nr, nc, lboard) &&
            isValidMove(toMove, getPieceI(or, oc - 1), options) &&
            !isCheck(lboard, 1)
          ) {
            return true;
          }
          if (
            gameInfo.blk.castleRight &&
            oc + 2 === nc &&
            or === nr &&
            isNotBlockedHorizonally(or, oc, nr, nc, lboard) &&
            isValidMove(toMove, getPieceI(or, oc + 1), options) &&
            !isCheck(lboard, 1)
          ) {
            return true;
          }
          break;
      }
    }
    return false;
  })();
  // if (test && val) {
  //   console.log(toMove, i);

  //   return true;
  // }
  // return true
  if (val && checks) {
    if (
      isCheck(makeMove(lboard, toMove, i), 0) &&
      peicesWht.includes(lboard[toMove])
    ) {
      // console.log("will be check");
      return false;
    } else if (
      isCheck(makeMove(lboard, toMove, i), 1) &&
      peicesBlk.includes(lboard[toMove])
    ) {
      return false;
    } else {
      return true;
    }
    //  else {
    //   console.log("sorry, invalid", toChessNotation(i));
    //   return true;
    // }
  } else {
    return val;
  }
  // console.log(
  //   `Im not sure moving from ${toChessNotation(toMove)} to ${toChessNotation(
  //     i
  //   )} is valid`
  // );
}

function kingMove(toMove) {
  // console.log(board[toMove], getPieceId(board[toMove]));
  return getPieceId(board[toMove]) === 5;
}
function isCastle(toMove, i) {
  const [or, oc] = getPiecePos(toMove);
  const [nr, nc] = getPiecePos(i);
  if (Math.abs(nc - oc) === 2 && or === nr && kingMove(toMove)) {
    return true;
  }
}
function isNotBlockedDiagonally(r, c, nr, nc, lboard = board) {
  let nnr = nr;
  let nnc = nc;
  if (nr > r) {
    nnr -= 1;
  } else {
    nnr += 1;
  }
  if (nc > c) {
    nnc -= 1;
  } else {
    nnc += 1;
  }
  if (lboard[getPieceI(nnr, nnc)].trim() === "") {
    return isNotBlockedDiagonally(r, c, nnr, nnc, lboard);
  } else if (nnr === r && nnc === c) {
    return true;
  }
  return false;
}
function isNotBlockedVertically(r, c, nr, nc, lboard = board) {
  let nnr = nr;
  let nnc = nc;
  if (nr > r) {
    nnr -= 1;
  } else {
    nnr += 1;
  }
  // if (condition) {

  // }
  // console.log(nnr, nnc);
  if (lboard[getPieceI(nnr, nnc)].trim() === "") {
    return isNotBlockedVertically(r, c, nnr, nnc, lboard);
  } else if (nnr === r && nnc === c) {
    return true;
  }
  return false;
}
function isNotBlockedHorizonally(r, c, nr, nc, lboard = board) {
  let nnr = nr;
  let nnc = nc;
  if (nc > c) {
    nnc -= 1;
  } else {
    nnc += 1;
  }
  if (lboard[getPieceI(nnr, nnc)].trim() === "") {
    return isNotBlockedHorizonally(r, c, nnr, nnc, lboard);
  } else if (nnr === r && nnc === c) {
    return true;
  }
  return false;
}
function getPieceId(piece) {
  return peicesWht.indexOf(piece) === -1
    ? peicesBlk.indexOf(piece)
    : peicesWht.indexOf(piece);
}
function getPiecePos(i) {
  return [Math.floor(i / 8), i % 8];
}
function getPieceI(r, c) {
  return r * 8 + c;
}
function toChessNotation(i) {
  let r = Math.floor(i / 8);
  let c = i % 8;
  return "abcdefgh"[c] + (8 - r);
}
function updateUiSquare(i) {
  let elt = boardE.children[i];
  if (toMove === i) {
    elt.classList.add("selected");
  } else {
    elt.classList.remove("selected");
  }
  if (isValidMove(toMove, i)) {
    elt.classList.add("move");
  } else {
    elt.classList.remove("move");
  }
  let bi = board[i]
  // console.log('updating '+toChessNotation(i));
  if (
    !elt
      .querySelector(".info")
      .classList.contains(
        `${peicesBlk.includes(bi) ? "b" : "w"}${bi.toLowerCase()}`
      ) &&
      bi.trim() !== ""
  ) {
    // elt.querySelector(".info").innerHTML = board[i];
    clearTile(i);
    elt
      .querySelector(".info")
      .classList.add(
        `${peicesBlk.includes(bi) ? "b" : "w"}${bi.toLowerCase()}`
      );
  } else if (bi.trim() === "") {
    clearTile(i);
  }
}
function clearTile(i) {
  let elt = boardE.children[i].querySelector(".info");
  let c = [...elt.classList].find((c) => {
    // console.log(c[1]);
    if (c.startsWith("w") || c.startsWith("b")) {
      if ("pnbrqk".includes(c[1])) {
        return true;
      }
    }
  });
  if (c) {
    console.log(c);
    elt.classList.remove(c);
  }
}
function getSide(r) {
  return r > 4
    // ? whiteSide
      ? peicesWht
      // : peicesBlk
    // : whiteSide
    : peicesBlk
    // : peicesWht;
}
function getPiece(r, c) {
  if (r === 1 || r === 6) {
    return 0;
  }
  if (r === 0 || r === 7) {
    switch (c) {
      case 0:
      case 7:
        return 3;
        break;

      case 1:
      case 6:
        return 1;
        break;

      case 2:
      case 5:
        return 2;
        break;

      case 3:
        return 4;
        break;

      case 4:
        return 5;
        break;
    }
  }

  return 6;
}
function str2elt(str) {
  const e = document.createElement("div");
  e.innerHTML = str;
  return e.firstElementChild;
}
boardE.addEventListener("blur", () => {
  toMove = null;
});

addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") {
    if (withComputer) {
      if (undoI === -1) {
        undoI = played.length - 2;
      } else {
        undoI -= 2;
      }
    }
  }
});
