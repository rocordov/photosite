/**
 * Tetris Game Implementation
 * 
 * This file contains the game logic for a Tetris game, including:
 * - Game board initialization and rendering
 * - Piece management (creation, movement, rotation)
 * - Collision detection
 * - Row clearing and scoring
 * - Game control and state management
 */

// Game constants
const COLS = 10;        // Board width
const ROWS = 20;        // Board height
const BLOCK_SIZE = 30;  // Size of each block in pixels
const EMPTY = 0;        // Empty cell value

// Game speeds in milliseconds (level-based)
const GAME_SPEEDS = [
    800, 720, 630, 550, 470, 
    380, 300, 220, 130, 100, 
    80, 80, 70, 70, 60, 
    60, 50, 50, 30, 30
];

// Tetromino shapes definition using coordinates
const SHAPES = {
    I: {
        blocks: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        className: 'i-piece'
    },
    J: {
        blocks: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        className: 'j-piece'
    },
    L: {
        blocks: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        className: 'l-piece'
    },
    O: {
        blocks: [
            [1, 1],
            [1, 1]
        ],
        className: 'o-piece'
    },
    S: {
        blocks: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        className: 's-piece'
    },
    T: {
        blocks: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        className: 't-piece'
    },
    Z: {
        blocks: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        className: 'z-piece'
    }
};

// Tetris game class
class TetrisGame {
    constructor(containerId, nextPieceId) {
        // Get the container elements
        this.container = document.getElementById(containerId);
        this.nextPieceContainer = document.getElementById(nextPieceId);
        
        // Game state
        this.grid = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.dropInterval = null;
        this.gameSpeed = GAME_SPEEDS[0];
        
        // UI elements
        this.scoreDisplay = document.getElementById('score');
        this.levelDisplay = document.getElementById('level');
        this.linesDisplay = document.getElementById('lines');
        
        // Initialize the game
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        // Create the game grid
        this.createGrid();
        
        // Create the next piece display
        this.createNextPieceDisplay();
        
        // Create the first piece
        this.createNewPiece();
        
        // Set up event listeners
        this.setupControls();
    }
    
    /**
     * Create the game grid
     */
    createGrid() {
        // Clear the container first
        this.container.innerHTML = '';
        
        // Initialize the grid data structure
        this.grid = Array.from({ length: ROWS }, () => 
            Array.from({ length: COLS }, () => EMPTY)
        );
        
        // Create the visual grid cells
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                this.container.appendChild(cell);
            }
        }
    }
    
    /**
     * Create the next piece display grid
     */
    createNextPieceDisplay() {
        this.nextPieceContainer.innerHTML = '';
        
        // Create a 4x4 grid for the next piece preview
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                this.nextPieceContainer.appendChild(cell);
            }
        }
    }
    
    /**
     * Set up keyboard controls
     */
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
            }
        });
        
        // Button controls
        document.getElementById('startButton').addEventListener('click', () => {
            if (this.gameOver) {
                this.resetGame();
            }
            this.startGame();
        });
        
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    /**
     * Create a new tetromino piece
     */
    createNewPiece() {
        // If there's a next piece, make it the current piece
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            // Create the first current piece
            const pieces = Object.keys(SHAPES);
            const randomType = pieces[Math.floor(Math.random() * pieces.length)];
            this.currentPiece = {
                type: randomType,
                shape: SHAPES[randomType].blocks,
                className: SHAPES[randomType].className,
                x: Math.floor(COLS / 2) - Math.floor(SHAPES[randomType].blocks[0].length / 2),
                y: 0
            };
        }
        
        // Create the new next piece
        const pieces = Object.keys(SHAPES);
        const randomType = pieces[Math.floor(Math.random() * pieces.length)];
        this.nextPiece = {
            type: randomType,
            shape: SHAPES[randomType].blocks,
            className: SHAPES[randomType].className,
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[randomType].blocks[0].length / 2),
            y: 0
        };
        
        // Check if new piece can be placed
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver = true;
            this.stopGame();
            alert('Game Over! Your score: ' + this.score);
        }
        
        // Update the next piece display
        this.renderNextPiece();
    }
    
    /**
     * Render the next piece in the preview area
     */
    renderNextPiece() {
        // Clear the next piece display
        const cells = this.nextPieceContainer.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
        });
        
        // Render the next piece
        const shape = this.nextPiece.shape;
        const className = this.nextPiece.className;
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const index = r * 4 + c;
                    cells[index].classList.add(className);
                }
            }
        }
    }
    
    /**
     * Draw the game board
     */
    render() {
        // Get all the cells
        const cells = this.container.querySelectorAll('.cell');
        
        // Clear the board
        cells.forEach(cell => {
            cell.className = 'cell';
        });
        
        // Draw the locked pieces on the grid
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c] !== EMPTY) {
                    const index = r * COLS + c;
                    cells[index].classList.add(this.grid[r][c]);
                }
            }
        }
        
        // Draw the active piece
        if (this.currentPiece) {
            const shape = this.currentPiece.shape;
            const x = this.currentPiece.x;
            const y = this.currentPiece.y;
            const className = this.currentPiece.className;
            
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const boardRow = y + r;
                        const boardCol = x + c;
                        
                        if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                            const index = boardRow * COLS + boardCol;
                            cells[index].classList.add(className);
                            cells[index].classList.add('active');
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Check if the current piece would collide in the given position
     */
    checkCollision(x, y, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue; // Skip empty cells
                
                const boardRow = y + r;
                const boardCol = x + c;
                
                // Check if out of bounds
                if (boardCol < 0 || boardCol >= COLS || boardRow >= ROWS) {
                    return true;
                }
                
                // Skip checks for rows above the grid
                if (boardRow < 0) continue;
                
                // Check if cell is already filled
                if (this.grid[boardRow][boardCol] !== EMPTY) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Move the current piece
     */
    movePiece(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.render();
            return true;
        }
        
        // If we tried to move down and got a collision, lock the piece
        if (dy > 0) {
            this.lockPiece();
            this.clearRows();
            this.createNewPiece();
            this.render();
        }
        
        return false;
    }
    
    /**
     * Rotate the current piece
     */
    rotatePiece() {
        // Create a copy of the current shape
        const shape = this.currentPiece.shape;
        const size = shape.length;
        
        // Create a new shape matrix
        const rotatedShape = Array.from({ length: size }, () => 
            Array.from({ length: size }, () => 0)
        );
        
        // Perform the rotation
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                rotatedShape[c][size - 1 - r] = shape[r][c];
            }
        }
        
        // Check if the rotated position is valid
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotatedShape)) {
            this.currentPiece.shape = rotatedShape;
            this.render();
        } else {
            // Try wall kicks - move the piece if it's too close to a wall
            // Check right wall
            let offset = 0;
            if (this.currentPiece.x + size > COLS) {
                offset = COLS - (this.currentPiece.x + size);
            }
            // Check left wall
            else if (this.currentPiece.x < 0) {
                offset = -this.currentPiece.x;
            }
            
            // Apply offset and check again
            if (offset !== 0 && !this.checkCollision(this.currentPiece.x + offset, this.currentPiece.y, rotatedShape)) {
                this.currentPiece.x += offset;
                this.currentPiece.shape = rotatedShape;
                this.render();
            }
        }
    }
    
    /**
     * Lock the current piece to the grid
     */
    lockPiece() {
        const shape = this.currentPiece.shape;
        const x = this.currentPiece.x;
        const y = this.currentPiece.y;
        const className = this.currentPiece.className;
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const boardRow = y + r;
                    const boardCol = x + c;
                    
                    // Only lock if it's within the grid
                    if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                        this.grid[boardRow][boardCol] = className;
                    }
                }
            }
        }
    }
    
    /**
     * Drop the piece immediately to the lowest possible position
     */
    hardDrop() {
        while (this.movePiece(0, 1)) {
            // Keep moving down until collision
        }
    }
    
    /**
     * Clear complete rows and update score
     */
    clearRows() {
        let linesCleared = 0;
        
        for (let r = ROWS - 1; r >= 0; r--) {
            // Check if row is full
            const isRowFull = this.grid[r].every(cell => cell !== EMPTY);
            
            if (isRowFull) {
                linesCleared++;
                
                // Remove the row and shift all rows above it down
                for (let y = r; y > 0; y--) {
                    this.grid[y] = [...this.grid[y - 1]];
                }
                
                // Create a new empty row at the top
                this.grid[0] = Array(COLS).fill(EMPTY);
                
                // Check the same row again (since we've shifted rows down)
                r++;
            }
        }
        
        if (linesCleared > 0) {
            // Update score - give more points for clearing multiple lines at once
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            
            // Update lines and level
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            if (this.level > 20) this.level = 20;
            
            // Update game speed
            this.gameSpeed = GAME_SPEEDS[this.level - 1];
            
            // Update displays
            this.updateDisplays();
            
            // If the drop interval is active, reset it with the new speed
            if (this.dropInterval) {
                this.stopDrop();
                this.startDrop();
            }
        }
    }
    
    /**
     * Update the score, level, and lines displays
     */
    updateDisplays() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.linesDisplay.textContent = this.lines;
    }
    
    /**
     * Start the game
     */
    startGame() {
        if (!this.gameOver && !this.isPaused) {
            this.startDrop();
        }
    }
    
    /**
     * Stop the game
     */
    stopGame() {
        this.stopDrop();
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.stopDrop();
        } else {
            this.startDrop();
        }
    }
    
    /**
     * Start the automatic dropping of pieces
     */
    startDrop() {
        if (this.dropInterval) clearInterval(this.dropInterval);
        
        this.dropInterval = setInterval(() => {
            this.movePiece(0, 1);
        }, this.gameSpeed);
    }
    
    /**
     * Stop the automatic dropping of pieces
     */
    stopDrop() {
        if (this.dropInterval) {
            clearInterval(this.dropInterval);
            this.dropInterval = null;
        }
    }
    
    /**
     * Reset the game
     */
    resetGame() {
        // Stop the current game
        this.stopGame();
        
        // Reset game state
        this.grid = Array.from({ length: ROWS }, () => 
            Array.from({ length: COLS }, () => EMPTY)
        );
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.gameSpeed = GAME_SPEEDS[0];
        
        // Update displays
        this.updateDisplays();
        
        // Create new pieces
        this.createNewPiece();
        
        // Render the board
        this.render();
    }
}

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new TetrisGame('tetrisContainer', 'nextPiece');
        
        // Log success message
        console.log('Tetris game initialized successfully');
    } catch (error) {
        console.error('Error initializing Tetris game:', error);
    }
});
