// --- DOM Elements ---
const canvas = document.getElementById('game-board') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const nextCanvas = document.getElementById('next-piece') as HTMLCanvasElement;
const nextCtx = nextCanvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const rowsEl = document.getElementById('rows')!;
const levelEl = document.getElementById('level')!;
const highScoreEl = document.getElementById('high-score')!;
const gameOverlay = document.getElementById('game-overlay')!;
const startButton = document.getElementById('start-button')!;
const pauseButton = document.getElementById('pause-button')! as HTMLButtonElement;
const restartButton = document.getElementById('restart-button')! as HTMLButtonElement;
const gameArea = document.getElementById('game-area')!;
const gameBoardContainer = document.getElementById('game-board-container')!;
const sidePanel = document.getElementById('side-panel')!;
const nextPieceContainer = document.getElementById('next-piece-container')!;


// --- Game Constants ---
const boardWidth = 10;
const boardHeight = 20;
let blockSide = 30; // Will be calculated dynamically
const scorePoints = [40, 100, 300, 1200];

const tetrominoes = {
    'I': { shape: [[1, 1, 1, 1]], color: '#00f0f0', w: 4, h: 1 },
    'J': { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000f0', w: 3, h: 2 },
    'L': { shape: [[1, 0, 0], [1, 1, 1]], color: '#f0a000', w: 3, h: 2 },
    'O': { shape: [[1, 1], [1, 1]], color: '#f0f000', w: 2, h: 2 },
    'S': { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000', w: 3, h: 2 },
    'T': { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0', w: 3, h: 2 },
    'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000', w: 3, h: 2 }
};
const tetrominoNames = 'IJLOSTZ';


// --- Game State ---
let board = createBoard();
const player = { pos: { x: 0, y: 0 }, piece: getRandomPiece(), shape: [[]] };
let nextPiece = getRandomPiece();
let score = 0;
let rows = 0;
let level = 0;
let highScore = parseInt(localStorage.getItem('tetrisHighScore') || '0');
let isPaused = false;
let gameOver = true;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// --- Sizing and Drawing ---
function updateSizesAndRedraw() {
    // Game board sizing
    const containerWidth = gameBoardContainer.clientWidth;
    const containerHeight = gameBoardContainer.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) return;
    
    // Calculate block side based on width and height to maintain aspect ratio
    const blockSideByWidth = Math.floor(containerWidth / boardWidth);
    const blockSideByHeight = Math.floor(containerHeight / boardHeight);
    blockSide = Math.max(5, Math.min(blockSideByWidth, blockSideByHeight));


    canvas.width = boardWidth * blockSide;
    canvas.height = boardHeight * blockSide;

    // Next piece canvas sizing (robust to CSS changes)
    const containerStyle = window.getComputedStyle(nextPieceContainer);
    const paddingX = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
    const nextCanvasMaxWidth = nextPieceContainer.clientWidth - paddingX;
    
    // The next piece fits in a 4x4 grid.
    const nextPieceBlockSide = Math.floor(nextCanvasMaxWidth / 4);
    nextCanvas.width = 4 * nextPieceBlockSide;
    nextCanvas.height = 4 * nextPieceBlockSide;

    // Redraw current game state
    draw();
    if (isPaused || gameOver) {
        updateOverlay();
    }
}

// --- Initialization ---
function init() {
    updateStats();
    updateSizesAndRedraw();
}


// --- Game Board & Pieces ---
function createBoard() {
    return Array.from({ length: boardHeight }, () => new Array(boardWidth).fill(0));
}

function getRandomPiece() {
    return tetrominoNames[Math.floor(Math.random() * tetrominoNames.length)];
}

function resetPlayer() {
    player.piece = nextPiece;
    player.shape = tetrominoes[player.piece].shape;
    player.pos.x = Math.floor((boardWidth - player.shape[0].length) / 2);
    player.pos.y = 0;
    nextPiece = getRandomPiece();

    if (checkCollision()) {
        gameOver = true;
        updateOverlay();
    }
}

// --- Game Logic ---
function update(time = 0) {
    if (gameOver) return;

    if (!isPaused) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }
    draw();
    requestAnimationFrame(update);
}

function playerDrop() {
    if (isPaused || gameOver) return;
    player.pos.y++;
    if (checkCollision()) {
        player.pos.y--;
        placePiece();
    }
    dropCounter = 0;
}

function placePiece() {
    player.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = player.piece;
            }
        });
    });

    sweepRows();
}

function sweepRows() {
    const fullRows = [];
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        fullRows.push(y);
    }

    if (fullRows.length > 0) {
        isPaused = true; // Pause game for animation
        
        // Draw flash effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        fullRows.forEach(y => {
            ctx.fillRect(0, y * blockSide, canvas.width, blockSide);
        });

        setTimeout(() => {
            // Remove rows from board data
            fullRows.forEach(y => {
                board.splice(y, 1);
            });
            const newRows = Array.from({ length: fullRows.length }, () => new Array(boardWidth).fill(0));
            board.unshift(...newRows);

            // Update stats
            score += scorePoints[fullRows.length - 1] * (level + 1);
            rows += fullRows.length;
            level = Math.floor(rows / 10);
            dropInterval = Math.max(200, 1000 - level * 80);
            updateStats();
            
            isPaused = false; // Resume game
            lastTime = performance.now(); // Reset time to avoid jump
            resetPlayer();
        }, 300);
    } else {
        resetPlayer();
    }
}

function checkCollision() {
    for (let y = 0; y < player.shape.length; y++) {
        for (let x = 0; x < player.shape[y].length; x++) {
            if (
                player.shape[y][x] !== 0 &&
                (board[y + player.pos.y] && board[y + player.pos.y][x + player.pos.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

// --- Player Controls ---
function playerMove(dir: number) {
    if (isPaused || gameOver) return;
    player.pos.x += dir;
    if (checkCollision()) {
        player.pos.x -= dir;
    }
}

function playerRotate() {
    if (isPaused || gameOver) return;
    const originalShape = player.shape;
    const rotated = player.shape[0].map((_, colIndex) =>
        player.shape.map(row => row[colIndex]).reverse()
    );
    player.shape = rotated;
    
    // Wall kick logic
    let offset = 1;
    while (checkCollision()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.shape[0].length) {
            player.shape = originalShape; // Can't rotate, revert
            player.pos.x -= (offset-1); // Revert position
            return;
        }
    }
}

function hardDrop() {
    if (isPaused || gameOver) return;
    while (!checkCollision()) {
        player.pos.y++;
    }
    player.pos.y--;
    placePiece();
}

// --- Drawing ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    if (!gameOver) {
        drawPiece(player.shape, player.pos, player.piece, ctx, blockSide);
    }
    drawNextPiece();
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(x, y, value, ctx, blockSide);
            }
        });
    });
}

function drawPiece(shape, pos, piece, context, blockSize) {
    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(x + pos.x, y + pos.y, piece, context, blockSize);
            }
        });
    });
}

function drawBlock(x, y, piece, context, size) {
    context.fillStyle = tetrominoes[piece].color;
    context.fillRect(x * size, y * size, size, size);
    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 2;
    context.strokeRect(x * size, y * size, size, size);
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextCanvas.width === 0) return; // Don't draw if not visible
    const pieceData = tetrominoes[nextPiece];
    const shape = pieceData.shape;
    const nextBlockSize = nextCanvas.width / 4;
    const pos = {
        x: (4 - pieceData.w) / 2,
        y: (4 - pieceData.h) / 2
    };
    drawPiece(shape, pos, nextPiece, nextCtx, nextBlockSize);
}

// --- UI & Game State Management ---
function updateStats() {
    scoreEl.textContent = score.toString();
    rowsEl.textContent = rows.toString();
    levelEl.textContent = level.toString();
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore', highScore.toString());
    }
    highScoreEl.textContent = highScore.toString();
}

function updateOverlay() {
    if (gameOver) {
        gameOverlay.style.display = 'flex';
        // Initial start button is in HTML. After that, it's always "Play Again".
        const message = `<div class="text-center"><p class="text-4xl sm:text-5xl">GAME OVER</p><button id="play-again" class="px-6 py-3 mt-4 bg-sky-500 hover:bg-sky-600 rounded-lg text-xl">Play Again</button></div>`;
        gameOverlay.innerHTML = message;
        document.getElementById('play-again')!.addEventListener('click', startGame);

    } else if (isPaused) {
        gameOverlay.style.display = 'flex';
        gameOverlay.innerHTML = `<div class="text-center text-4xl sm:text-5xl">PAUSED</div>`;
    } else {
        gameOverlay.style.display = 'none';
    }
}

function startGame() {
    board = createBoard();
    score = 0;
    rows = 0;
    level = 0;
    dropInterval = 1000;
    gameOver = false;
    isPaused = false;
    pauseButton.textContent = '❚❚';
    pauseButton.setAttribute('aria-label', 'Pause Game');
    resetPlayer();
    updateStats();
    updateOverlay();
    [pauseButton, restartButton].forEach(btn => btn.disabled = false);
    update();
}

function pauseGame() {
    if (gameOver) return;
    isPaused = !isPaused;
    updateOverlay();
    pauseButton.textContent = isPaused ? '▶' : '❚❚';
    pauseButton.setAttribute('aria-label', isPaused ? 'Resume Game' : 'Pause Game');
    if (!isPaused) {
        lastTime = performance.now(); // Reset time to avoid jump
        update();
    }
}

function restartGame() {
    // Restarting should immediately start a new game.
    startGame();
}


// --- Event Listeners ---
document.addEventListener('keydown', event => {
    if (gameOver) return;
    if (event.key === 'ArrowLeft') playerMove(-1);
    else if (event.key === 'ArrowRight') playerMove(1);
    else if (event.key === 'ArrowDown') playerDrop();
    else if (event.key === 'ArrowUp' || event.key === 'x') playerRotate();
    else if (event.key === ' ') {
        event.preventDefault(); // prevent page scroll
        hardDrop();
    }
    else if (event.key === 'p') pauseGame();
});

// Mobile Controls
document.getElementById('left-button-mobile')?.addEventListener('click', () => playerMove(-1));
document.getElementById('right-button-mobile')?.addEventListener('click', () => playerMove(1));
document.getElementById('down-button-mobile')?.addEventListener('click', () => playerDrop());
document.getElementById('rotate-button-mobile')?.addEventListener('click', () => playerRotate());
document.getElementById('hard-drop-button-mobile')?.addEventListener('click', () => hardDrop());


startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
restartButton.addEventListener('click', restartGame);

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateSizesAndRedraw, 100);
});

// --- Initial call ---
init();