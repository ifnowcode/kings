// https://emojidb.org/crowns-emojis 👑♔♛🜲❀
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const BOARD_SIZE = 8;
const TILE_SIZE = canvas.width / BOARD_SIZE;
const PIECE_RADIUS = TILE_SIZE * 0.4;

const LIGHT_COLOR = '#b00'; // red tiles
const DARK_COLOR = '#111';

const RED_PIECE = '#f11';
const BLACK_PIECE = '#000';

let pieces = [];
let draggingPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;


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
    // emoji
    ctx.save();
    ctx.fillStyle = p.color === RED_PIECE ? "black" : "red";
    ctx.font = p.king ? "32px sans-serif" : "42px sans-serif";
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

function snapToGrid1(piece) {
  const col = Math.round((piece.x - TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.round((piece.y - TILE_SIZE / 2) / TILE_SIZE);

  const clampedCol = Math.max(0, Math.min(BOARD_SIZE - 1, col));
  const clampedRow = Math.max(0, Math.min(BOARD_SIZE - 1, row));

  piece.col = clampedCol;
  piece.row = clampedRow;
  piece.x = clampedCol * TILE_SIZE + TILE_SIZE / 2;
  piece.y = clampedRow * TILE_SIZE + TILE_SIZE / 2;
}

function snapToGrid(piece) {
  const col = Math.round((piece.x - TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.round((piece.y - TILE_SIZE / 2) / TILE_SIZE);

  const targetRow = Math.max(0, Math.min(BOARD_SIZE - 1, row));
  const targetCol = Math.max(0, Math.min(BOARD_SIZE - 1, col));

  const result = isValidMove(piece, targetRow, targetCol);

  if (!result) {
    // Revert to original (snap back)
    piece.x = piece.col * TILE_SIZE + TILE_SIZE / 2;
    piece.y = piece.row * TILE_SIZE + TILE_SIZE / 2;
    return;
  }

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
  if (draggingPiece) {
    snapToGrid(draggingPiece);
    draggingPiece = null;
    render();
  }
});

canvas.addEventListener('mouseleave', () => {
  if (draggingPiece) {
    snapToGrid(draggingPiece);
    draggingPiece = null;
    render();
  }
});

initPieces();
render();