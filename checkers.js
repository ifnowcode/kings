// https://emojidb.org/crowns-emojis 👑♔♛🜲❀
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const difficultySelect = document.getElementById("difficultySelect");

const BOARD_SIZE = 8;
let TILE_SIZE = 0;
let PIECE_RADIUS = 0;

const LIGHT_COLOR = '#b00'; // red tiles
const DARK_COLOR = '#111';

const RED_PIECE = '#f11';
const BLACK_PIECE = '#000';

let currentPlayer = BLACK_PIECE;    // human
let aiPlayer = RED_PIECE;           // AI controlled

let pieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let smallFontSize = 32;
let largeFontSize = 42;


function initPieces() {
  pieces = [];

  // Helper to add a piece at board coordinates
  function addPiece(row, col, color) {
    pieces.push({
      row,
      col,
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
      color,
      king: false
    });
  }

  if (true) {
    // Standard checkers setup: 3 rows each side on dark tiles
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) {
          addPiece(row, col, RED_PIECE);
        }
      }
    }
    for (let row = BOARD_SIZE - 3; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) {
          addPiece(row, col, BLACK_PIECE);
        }
      }
    }
  } else { // test
    addPiece(2, 1, RED_PIECE);
    addPiece(4, 3, RED_PIECE);
    //addPiece(4, 1, BLACK_PIECE);
    addPiece(5, 4, BLACK_PIECE);
  }
}

function drawBoard() {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const isDark = (row + col) % 2 === 1;
      ctx.fillStyle = isDark ? DARK_COLOR : LIGHT_COLOR;
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawPieces() {
  for (const p of pieces) {
    // checker
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, PIECE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
    /*
    ctx.save();
    ctx.setLineDash([5, 1]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, PIECE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = p.color === RED_PIECE ? "red" : "black";;
    ctx.stroke();
    ctx.restore();
    */
    
    // emoji
    ctx.save();
    ctx.fillStyle = p.color === RED_PIECE ? "black" : "red";
    ctx.font = p.king ? smallFontSize + "px sans-serif" : largeFontSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.king ? "🜲" : "✰", p.x, p.y); //👑♛♔🜲 ✰⭐✮★
    ctx.restore();
    
    // dot
    /*
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.restore();
    */
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawPieces();
}

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function findPieceAt(x, y) {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    const dx = x - p.x;
    const dy = y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) <= PIECE_RADIUS) {
      return p;
    }
  }
  return null;
}

function pieceAt(row, col) {
  return pieces.find(p => p.row === row && p.col === col);
}

function removePiece(piece) {
  const i = pieces.indexOf(piece);
  if (i >= 0) pieces.splice(i, 1);
}

function isDarkSquare(row, col) {
  return (row + col) % 2 === 1;
}

function isValidMove(piece, targetRow, targetCol) {
  if (!isDarkSquare(targetRow, targetCol)) return false;
  if (pieceAt(targetRow, targetCol)) return false;

  const dir = piece.king ? 0 : (piece.color === RED_PIECE ? 1 : -1);

  const dRow = targetRow - piece.row;
  const dCol = targetCol - piece.col;

  // Simple move
  // Simple move
  if (!piece.king) {
    if (dRow === dir && Math.abs(dCol) === 1) return true;
  } else {
    if (Math.abs(dRow) === 1 && Math.abs(dCol) === 1) return true;
  }

  // Jump move
  if ((!piece.king && dRow === dir * 2 && Math.abs(dCol) === 2) ||
    (piece.king && Math.abs(dRow) === 2 && Math.abs(dCol) === 2)) {
    const jumpedRow = piece.row + (dRow > 0 ? 1 : -1);
    const jumpedCol = piece.col + (dCol > 0 ? 1 : -1);
    const jumpedPiece = pieceAt(jumpedRow, jumpedCol);
    if (jumpedPiece && jumpedPiece.color !== piece.color) {
      return { jumpedPiece };
    }
  }

  return false;
}

function snapToGrid(piece) {
  const col = Math.round((piece.x - TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.round((piece.y - TILE_SIZE / 2) / TILE_SIZE);

  const targetRow = Math.max(0, Math.min(BOARD_SIZE - 1, row));
  const targetCol = Math.max(0, Math.min(BOARD_SIZE - 1, col));

  const result = isValidMove(piece, targetRow, targetCol);

  if (!result) {
    // Revert to original (snap back)
    console.log("Snap back");
    piece.x = piece.col * TILE_SIZE + TILE_SIZE / 2;
    piece.y = piece.row * TILE_SIZE + TILE_SIZE / 2;
    return { moved: false, jumped: false, canContinue: false };
  }
  
  const wasJump = !!result.jumpedPiece;

  // Handle jump
  if (result.jumpedPiece) {
    removePiece(result.jumpedPiece);
  }

  // Commit move
  piece.row = targetRow;
  piece.col = targetCol;
  piece.x = targetCol * TILE_SIZE + TILE_SIZE / 2;
  piece.y = targetRow * TILE_SIZE + TILE_SIZE / 2;
  
  // Crown if reaching the far side
  if (!piece.king) {
    if (piece.color === RED_PIECE && piece.row === BOARD_SIZE - 1) piece.king = true;
    if (piece.color === BLACK_PIECE && piece.row === 0) piece.king = true;
  }
  
  // Only check for continuation if this move was a jump
  let canContinue = false;
  if (wasJump) {
    const moreJumps = getAvailableJumpsForPiece(piece);
    canContinue = moreJumps.length > 0;
  }

  return { moved: true, jumped: wasJump, canContinue };
}

function getAllLegalMoves(color) {
  const moves = [];
  const jumps = [];

  for (const p of pieces) {
    if (p.color !== color) continue;

    for (let dr of [-1, 1]) {
      for (let dc of [-1, 1]) {

        // SIMPLE MOVE TARGET
        const r = p.row + dr;
        const c = p.col + dc;

        // Must stay on board
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (isValidMove(p, r, c) === true) {
            moves.push({ piece: p, row: r, col: c });
          }
        }

        // JUMP TARGET
        const r2 = p.row + dr * 2;
        const c2 = p.col + dc * 2;

        // Must stay on board
        if (r2 >= 0 && r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE) {
          const jump = isValidMove(p, r2, c2);
          if (jump && jump.jumpedPiece) {
            jumps.push({ piece: p, row: r2, col: c2, jumped: jump.jumpedPiece });
          }
        }
      }
    }
  }

  return jumps.length > 0 ? jumps : moves;
}

function getAvailableJumpsForPiece(piece) {
  const jumps = [];

  // Correct direction logic:
  // RED moves downward (+1)
  // BLACK moves upward (-1)
  const dirs = piece.king ? [-1, 1] : (piece.color === RED_PIECE ? [1] : [-1]);

  for (let dr of dirs) {
    for (let dc of [-1, 1]) {
      const midR = piece.row + dr;
      const midC = piece.col + dc;
      const landR = piece.row + dr * 2;
      const landC = piece.col + dc * 2;

      // Must stay on board
      if (landR < 0 || landR >= BOARD_SIZE) continue;
      if (landC < 0 || landC >= BOARD_SIZE) continue;

      const midPiece = pieceAt(midR, midC);
      if (!midPiece || midPiece.color === piece.color) continue;

      // Landing square must be empty
      if (pieceAt(landR, landC)) continue;

      jumps.push({
        row: landR,
        col: landC,
        jumped: midPiece
      });
    }
  }

  return jumps;
}

function aiPerformJumpChain(piece) {
  while (true) {
    const jumps = getAvailableJumpsForPiece(piece);
    if (jumps.length === 0) break;

    const move = jumps[Math.floor(Math.random() * jumps.length)];

    removePiece(move.jumped);

    piece.row = move.row;
    piece.col = move.col;
    piece.x = piece.col * TILE_SIZE + TILE_SIZE / 2;
    piece.y = piece.row * TILE_SIZE + TILE_SIZE / 2;

    // Crown mid-chain if needed
    if (!piece.king) {
      if (piece.color === RED_PIECE && piece.row === BOARD_SIZE - 1) piece.king = true;
      if (piece.color === BLACK_PIECE && piece.row === 0) piece.king = true;
    }
  }
}

function aiTurn() {
  switch (difficultySelect.value) {
    case '0':
      aiTurn_00();
      break;
    case '1':
      aiTurn_01();
      break;
    case '2':
      aiTurn_02();
      break;
    case '3':
      aiTurn_03();
      break;
    default:
      aiTurn_01();
  }
}

function aiTurn_00() {
  console.log("AI Move 00");
  const moves = getAllLegalMoves(aiPlayer);
  if (moves.length === 0) return; // AI stuck

  const move = moves[Math.floor(Math.random() * moves.length)];
  const p = move.piece;

  // If jump, remove the jumped piece
  if (move.jumped) {
    removePiece(move.jumped);
  }

  // Commit move
  p.row = move.row;
  p.col = move.col;
  p.x = p.col * TILE_SIZE + TILE_SIZE / 2;
  p.y = p.row * TILE_SIZE + TILE_SIZE / 2;

  // Crown
  if (!p.king) {
    if (p.color === RED_PIECE && p.row === BOARD_SIZE - 1) p.king = true;
    if (p.color === BLACK_PIECE && p.row === 0) p.king = true;
  }

  currentPlayer = BLACK_PIECE;
  render();
}

function aiTurn_01() {
  console.log("AI TUrn 01");
  const moves = getAllLegalMoves(aiPlayer);
  if (moves.length === 0) return;

  const move = moves[Math.floor(Math.random() * moves.length)];
  const p = move.piece;

  // Jump?
  if (move.jumped) {
    removePiece(move.jumped);
    p.row = move.row;
    p.col = move.col;
    p.x = p.col * TILE_SIZE + TILE_SIZE / 2;
    p.y = p.row * TILE_SIZE + TILE_SIZE / 2;

    // Crown
    if (!p.king) {
      if (p.color === RED_PIECE && p.row === BOARD_SIZE - 1) p.king = true;
      if (p.color === BLACK_PIECE && p.row === 0) p.king = true;
    }

    // MULTI-JUMP CHAIN
    aiPerformJumpChain(p);
  }

  // Simple move
  else {
    p.row = move.row;
    p.col = move.col;
    p.x = p.col * TILE_SIZE + TILE_SIZE / 2;
    p.y = p.row * TILE_SIZE + TILE_SIZE / 2;

    // Crown
    if (!p.king) {
      if (p.color === RED_PIECE && p.row === BOARD_SIZE - 1) p.king = true;
      if (p.color === BLACK_PIECE && p.row === 0) p.king = true;
    }
  }

  currentPlayer = BLACK_PIECE;
  render();
}

function canThisMoveBeJumped(aiPiece, move) {
  // Temporarily apply the move
  const originalRow = aiPiece.row;
  const originalCol = aiPiece.col;

  aiPiece.row = move.row;
  aiPiece.col = move.col;

  let canBeJumped = false;

  // Check all human pieces
  for (const p of pieces) {
    if (p.color !== BLACK_PIECE) continue;

    const jumps = getAvailableJumpsForPiece(p);
    for (const j of jumps) {
      if (j.jumped === aiPiece) {
        canBeJumped = true;
        break;
      }
    }
    if (canBeJumped) break;
  }

  // Restore original position
  aiPiece.row = originalRow;
  aiPiece.col = originalCol;

  return canBeJumped;
}

function aiTurn_02() {
  console.log("AI Turn 02");

  const moves = getAllLegalMoves(aiPlayer);
  if (moves.length === 0) return;

  // 1. Separate jumps from simple moves
  const jumpMoves = moves.filter(m => m.jumped);
  const simpleMoves = moves.filter(m => !m.jumped);

  let chosenMove = null;

  // 2. If jumps exist, AI MUST take a jump (checkers rule)
  if (jumpMoves.length > 0) {
    // Prefer jump moves that cannot be jumped afterward
    const safeJumps = jumpMoves.filter(m => !canThisMoveBeJumped(m.piece, m));

    if (safeJumps.length > 0) {
      chosenMove = safeJumps[Math.floor(Math.random() * safeJumps.length)];
    } else {
      chosenMove = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
    }
  }

  // 3. No jumps → evaluate simple moves
  else {
    const safeMoves = simpleMoves.filter(m => !canThisMoveBeJumped(m.piece, m));

    if (safeMoves.length > 0) {
      chosenMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    } else {
      // All moves unsafe → pick any
      chosenMove = simpleMoves[Math.floor(Math.random() * simpleMoves.length)];
    }
  }

  const p = chosenMove.piece;

  // 4. Apply the chosen move
  if (chosenMove.jumped) {
    removePiece(chosenMove.jumped);
  }

  p.row = chosenMove.row;
  p.col = chosenMove.col;
  p.x = p.col * TILE_SIZE + TILE_SIZE / 2;
  p.y = p.row * TILE_SIZE + TILE_SIZE / 2;

  // 5. Crown if needed
  if (!p.king) {
    if (p.color === RED_PIECE && p.row === BOARD_SIZE - 1) p.king = true;
    if (p.color === BLACK_PIECE && p.row === 0) p.king = true;
  }

  // 6. Multi-jump chain
  if (chosenMove.jumped) {
    aiPerformJumpChain(p);
  }

  currentPlayer = BLACK_PIECE;
  render();
}

function kingAggressionScore(piece, move) {
  if (!piece.king) return 0; // only kings get aggression scoring

  let score = 0;

  // 1. Move closer to enemy pieces
  for (const enemy of pieces) {
    if (enemy.color === piece.color) continue;
    const distBefore = Math.abs(enemy.row - piece.row) + Math.abs(enemy.col - piece.col);
    const distAfter  = Math.abs(enemy.row - move.row) + Math.abs(enemy.col - move.col);
    if (distAfter < distBefore) score += 2;
  }

  // 2. Moves that threaten a jump next turn
  const dirs = [-1, 1];
  for (let dr of dirs) {
    for (let dc of dirs) {
      const midR = move.row + dr;
      const midC = move.col + dc;
      const landR = move.row + dr * 2;
      const landC = move.col + dc * 2;

      if (landR < 0 || landR >= BOARD_SIZE) continue;
      if (landC < 0 || landC >= BOARD_SIZE) continue;

      const midPiece = pieceAt(midR, midC);
      if (midPiece && midPiece.color !== piece.color && !pieceAt(landR, landC)) {
        score += 4; // threatening a jump is strong
      }
    }
  }

  // 3. Moves that enter the center (kings love center control)
  if (move.row >= 2 && move.row <= 5 && move.col >= 2 && move.col <= 5) {
    score += 3;
  }

  return score;
}

function aiTurn_03() {
  console.log("AI Turn 01");

  const moves = getAllLegalMoves(aiPlayer);
  if (moves.length === 0) return;

  // 1. Separate jumps from simple moves
  const jumpMoves = moves.filter(m => m.jumped);
  const simpleMoves = moves.filter(m => !m.jumped);

  let chosenMove = null;

  // 2. If jumps exist, AI MUST take a jump
  if (jumpMoves.length > 0) {
    // Prefer jump moves that cannot be jumped afterward
    const safeJumps = jumpMoves.filter(m => !canThisMoveBeJumped(m.piece, m));

    if (safeJumps.length > 0) {
      // Kings choose the most aggressive safe jump
      safeJumps.sort((a, b) =>
        kingAggressionScore(b.piece, b) - kingAggressionScore(a.piece, a)
      );
      chosenMove = safeJumps[0];
    } else {
      // No safe jumps → choose most aggressive jump
      jumpMoves.sort((a, b) =>
        kingAggressionScore(b.piece, b) - kingAggressionScore(a.piece, a)
      );
      chosenMove = jumpMoves[0];
    }
  }

  // 3. No jumps → evaluate simple moves
  else {
    const safeMoves = simpleMoves.filter(m => !canThisMoveBeJumped(m.piece, m));

    if (safeMoves.length > 0) {
      // Kings choose aggressive safe moves
      safeMoves.sort((a, b) =>
        kingAggressionScore(b.piece, b) - kingAggressionScore(a.piece, a)
      );
      chosenMove = safeMoves[0];
    } else {
      // All moves unsafe → choose most aggressive move anyway
      simpleMoves.sort((a, b) =>
        kingAggressionScore(b.piece, b) - kingAggressionScore(a.piece, a)
      );
      chosenMove = simpleMoves[0];
    }
  }

  const p = chosenMove.piece;

  // 4. Apply the chosen move
  if (chosenMove.jumped) {
    removePiece(chosenMove.jumped);
  }

  p.row = chosenMove.row;
  p.col = chosenMove.col;
  p.x = p.col * TILE_SIZE + TILE_SIZE / 2;
  p.y = p.row * TILE_SIZE + TILE_SIZE / 2;

  // 5. Crown if needed
  if (!p.king) {
    if (p.color === RED_PIECE && p.row === BOARD_SIZE - 1) p.king = true;
    if (p.color === BLACK_PIECE && p.row === 0) p.king = true;
  }

  // 6. Multi-jump chain
  if (chosenMove.jumped) {
    aiPerformJumpChain(p);
  }

  currentPlayer = BLACK_PIECE;
  render();
}

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = getMousePos(e);
  const p = findPieceAt(x, y);
  if (p) {
    draggingPiece = p;
    dragOffsetX = x - p.x;
    dragOffsetY = y - p.y;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!draggingPiece) return;
  const { x, y } = getMousePos(e);
  draggingPiece.x = x - dragOffsetX;
  draggingPiece.y = y - dragOffsetY;
  render();
});

canvas.addEventListener('mouseup', () => {
  if (!draggingPiece) return;

  const movedPiece = draggingPiece;
  draggingPiece = null;

  const res = snapToGrid(movedPiece);
  render();

  // Illegal move → snap back, keep player's turn
  if (!res.moved) return;

  // Jump with continuation available → force multi-jump, same piece, same turn
  if (res.jumped && res.canContinue) {
    draggingPiece = movedPiece;
    return;
  }

  // Otherwise, turn ends (simple move OR final jump)
  currentPlayer = RED_PIECE; // AI (red) to move
  setTimeout(aiTurn, 300);
});

canvas.addEventListener('mouseleave', () => {
  if (draggingPiece) {
    snapToGrid(draggingPiece);
    draggingPiece = null;
    render();
  }
});

function restartGame() {
  initPieces();
  currentPlayer = BLACK_PIECE; // human starts
  draggingPiece = null;
  render();
}

document.getElementById("restartBtn").addEventListener("click", restartGame);

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  const wrapper = document.getElementById("board-wrapper");
  const size = wrapper.clientWidth;

  canvas.width = size;
  canvas.height = size;

  TILE_SIZE = canvas.width / BOARD_SIZE;
  PIECE_RADIUS = TILE_SIZE * 0.4;

  // Recompute piece pixel positions
  for (const p of pieces) {
    p.x = p.col * TILE_SIZE + TILE_SIZE / 2;
    p.y = p.row * TILE_SIZE + TILE_SIZE / 2;
  }
  
  smallFontSize = TILE_SIZE * 0.55;
  largeFontSize = TILE_SIZE * 0.70;

  render();
}


restartGame();
resizeCanvas();