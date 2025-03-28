/**
 * 2048 Game Implementation
 * A sliding tile puzzle game where you combine numbered tiles to reach 2048
 */

document.addEventListener('DOMContentLoaded', () => {
  // Game constants
  const GRID_SIZE = 4;
  const CELL_COUNT = GRID_SIZE * GRID_SIZE;
  const CELL_GAP = 15; // Gap between cells in pixels
  
  // DOM Elements
  const gridTiles = document.querySelector('.grid-tiles');
  const scoreDisplay = document.getElementById('score');
  const bestScoreDisplay = document.getElementById('best-score');
  const newGameButton = document.getElementById('new-game');
  const tryAgainButton = document.getElementById('try-again');
  const keepPlayingButton = document.getElementById('keep-playing');
  const gameMessageElement = document.querySelector('.game-message');
  const gameMessageText = gameMessageElement.querySelector('p');
  
  // Game state variables
  let board = [];
  let score = 0;
  let bestScore = localStorage.getItem('2048-best-score') || 0;
  let gameOver = false;
  let won = false;
  let keepPlaying = false;
  
  /**
   * Initialize the game
   * Sets up the game board and starts a new game
   */
  function initGame() {
    // Initialize best score from localStorage
    bestScoreDisplay.textContent = bestScore;
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyPress);
    newGameButton.addEventListener('click', startNewGame);
    tryAgainButton.addEventListener('click', startNewGame);
    keepPlayingButton.addEventListener('click', continueAfterWin);
    
    // Start a new game
    startNewGame();
  }
  
  /**
   * Starts a new game by resetting the board and score
   */
  function startNewGame() {
    // Clear the board and score
    board = createEmptyBoard();
    score = 0;
    gameOver = false;
    won = false;
    keepPlaying = false;
    
    // Update the score display
    updateScore();
    
    // Clear the grid
    gridTiles.innerHTML = '';
    
    // Add two initial tiles
    addRandomTile();
    addRandomTile();
    
    // Hide any game messages
    hideMessage();
  }
  
  /**
   * Creates an empty game board
   * @returns {Array} A 2D array representing the game board
   */
  function createEmptyBoard() {
    const board = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      board[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        board[row][col] = 0;
      }
    }
    return board;
  }
  
  /**
   * Adds a random tile (2 or 4) to an empty cell on the board
   */
  function addRandomTile() {
    if (isBoardFull()) return;
    
    // Find all empty cells
    const emptyCells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    // Choose a random empty cell
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // Add a 2 (90% chance) or 4 (10% chance)
    const value = Math.random() < 0.9 ? 2 : 4;
    board[randomCell.row][randomCell.col] = value;
    
    // Create tile element and add it to the grid
    createTileElement(randomCell.row, randomCell.col, value, true);
  }
  
  /**
   * Creates a visual tile element and adds it to the grid
   * @param {number} row - Row position of the tile
   * @param {number} col - Column position of the tile
   * @param {number} value - Value of the tile (2, 4, 8, etc.)
   * @param {boolean} isNew - Whether this is a newly added tile
   * @param {boolean} isMerged - Whether this tile was formed by merging
   */
  function createTileElement(row, col, value, isNew = false, isMerged = false) {
    // Calculate position
    const tileX = col * (100 / GRID_SIZE) + '%';
    const tileY = row * (100 / GRID_SIZE) + '%';
    
    // Create tile element
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`;
    tile.textContent = value;
    tile.dataset.row = row;
    tile.dataset.col = col;
    tile.dataset.value = value;
    
    // Set position
    tile.style.top = tileY;
    tile.style.left = tileX;
    
    // Add animation classes if needed
    if (isNew) tile.classList.add('new-tile');
    if (isMerged) tile.classList.add('merged');
    
    // For very large numbers, use a smaller font and different class
    if (value > 2048) {
      tile.classList.add('tile-super');
    }
    
    // Add to the grid
    gridTiles.appendChild(tile);
  }
  
  /**
   * Updates the entire grid display to match the current board state
   */
  function updateGridDisplay() {
    // Clear the current grid
    gridTiles.innerHTML = '';
    
    // Create tile elements for each non-zero cell
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board[row][col] !== 0) {
          createTileElement(row, col, board[row][col]);
        }
      }
    }
  }
  
  /**
   * Updates the score display and best score if needed
   */
  function updateScore() {
    scoreDisplay.textContent = score;
    
    // Update best score if current score is higher
    if (score > bestScore) {
      bestScore = score;
      bestScoreDisplay.textContent = bestScore;
      localStorage.setItem('2048-best-score', bestScore);
    }
  }
  
  /**
   * Handles keyboard input for game moves
   * @param {KeyboardEvent} event - The keyboard event
   */
  function handleKeyPress(event) {
    // Ignore keypresses if game is over
    if (gameOver && !keepPlaying) return;
    
    let moved = false;
    
    // Handle arrow keys
    switch (event.key) {
      case 'ArrowUp':
        moved = moveUp();
        event.preventDefault();
        break;
      case 'ArrowDown':
        moved = moveDown();
        event.preventDefault();
        break;
      case 'ArrowLeft':
        moved = moveLeft();
        event.preventDefault();
        break;
      case 'ArrowRight':
        moved = moveRight();
        event.preventDefault();
        break;
      default:
        return; // Ignore other keys
    }
    
    // If tiles moved, add a new random tile and check for game over
    if (moved) {
      setTimeout(() => {
        addRandomTile();
        updateScore();
        
        if (!canMove()) {
          gameOver = true;
          showGameOverMessage();
        }
      }, 150); // Short delay for animation
    }
  }
  
  /**
   * Moves all tiles up
   * @returns {boolean} Whether any tiles were moved
   */
  function moveUp() {
    return moveTiles(
      (row, col) => ({ startRow: row, startCol: col }),
      (step, maxStep) => step > 0,
      (step) => step - 1,
      (row, col) => row === 0 || (row > 0 && board[row - 1][col] !== 0)
    );
  }
  
  /**
   * Moves all tiles down
   * @returns {boolean} Whether any tiles were moved
   */
  function moveDown() {
    return moveTiles(
      (row, col) => ({ startRow: GRID_SIZE - 1 - row, startCol: col }),
      (step, maxStep) => step < maxStep - 1,
      (step) => step + 1,
      (row, col) => row === GRID_SIZE - 1 || (row < GRID_SIZE - 1 && board[row + 1][col] !== 0)
    );
  }
  
  /**
   * Moves all tiles left
   * @returns {boolean} Whether any tiles were moved
   */
  function moveLeft() {
    return moveTiles(
      (row, col) => ({ startRow: col, startCol: row }),
      (step, maxStep) => step > 0,
      (step) => step - 1,
      (row, col) => col === 0 || (col > 0 && board[row][col - 1] !== 0)
    );
  }
  
  /**
   * Moves all tiles right
   * @returns {boolean} Whether any tiles were moved
   */
  function moveRight() {
    return moveTiles(
      (row, col) => ({ startRow: col, startCol: GRID_SIZE - 1 - row }),
      (step, maxStep) => step < maxStep - 1,
      (step) => step + 1,
      (row, col) => col === GRID_SIZE - 1 || (col < GRID_SIZE - 1 && board[row][col + 1] !== 0)
    );
  }
  
  /**
   * Generic function to handle tile movement and merging in any direction
   * @param {Function} getStartPosition - Function to get starting position
   * @param {Function} shouldContinue - Function to check if iteration should continue
   * @param {Function} getNextStep - Function to get the next step
   * @param {Function} isBlocked - Function to check if a tile is blocked
   * @returns {boolean} Whether any tiles were moved
   */
  function moveTiles(getStartPosition, shouldContinue, getNextStep, isBlocked) {
    let moved = false;
    const mergedPositions = new Set(); // Track merged positions to prevent multiple merges
    
    // Create a temporary board to track changes
    const newBoard = createEmptyBoard();
    
    // Process each row and column
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        // Calculate the actual row and column to start with based on direction
        const { startRow, startCol } = getStartPosition(i, j);
        
        // Skip empty cells
        if (board[startRow][startCol] === 0) continue;
        
        let row = startRow;
        let col = startCol;
        let value = board[startRow][startCol];
        
        // Move the tile as far as possible in the given direction
        while (!isBlocked(row, col)) {
          const nextRow = row === startRow ? (col === startCol ? row : row) : getNextStep(row);
          const nextCol = col === startCol ? (row === startRow ? col : col) : getNextStep(col);
          
          // If the next position is empty, move there
          if (board[nextRow][nextCol] === 0) {
            row = nextRow;
            col = nextCol;
            moved = true;
          } 
          // If the next position has the same value and hasn't been merged, merge
          else if (board[nextRow][nextCol] === value && 
                  !mergedPositions.has(`${nextRow},${nextCol}`)) {
            row = nextRow;
            col = nextCol;
            value *= 2;
            score += value;
            mergedPositions.add(`${row},${col}`);
            moved = true;
            
            // Check for win (reaching 2048)
            if (value === 2048 && !won && !keepPlaying) {
              won = true;
              showWinMessage();
            }
          } else {
            break;
          }
        }
        
        // Update the new board with the final position of the tile
        newBoard[row][col] = value;
      }
    }
    
    // If any tiles moved, update the board
    if (moved) {
      board = newBoard;
      updateGridDisplay();
    }
    
    return moved;
  }
  
  /**
   * Checks if the board is completely full
   * @returns {boolean} Whether the board is full
   */
  function isBoardFull() {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board[row][col] === 0) {
          return false;
        }
      }
    }
    return true;
  }
  
  /**
   * Checks if any moves are possible
   * @returns {boolean} Whether any moves are possible
   */
  function canMove() {
    // If the board is not full, moves are possible
    if (!isBoardFull()) return true;
    
    // Check if any adjacent tiles have the same value (can be merged)
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = board[row][col];
        
        // Check right neighbor
        if (col < GRID_SIZE - 1 && board[row][col + 1] === value) {
          return true;
        }
        
        // Check bottom neighbor
        if (row < GRID_SIZE - 1 && board[row + 1][col] === value) {
          return true;
        }
      }
    }
    
    // No moves are possible
    return false;
  }
  
  /**
   * Shows the game over message
   */
  function showGameOverMessage() {
    gameMessageElement.classList.add('game-over');
    gameMessageText.textContent = 'Game Over!';
    gameMessageElement.style.display = 'flex';
    
    // Only show the try again button
    tryAgainButton.style.display = 'block';
    keepPlayingButton.style.display = 'none';
  }
  
  /**
   * Shows the win message
   */
  function showWinMessage() {
    gameMessageElement.classList.add('game-won');
    gameMessageText.textContent = 'You Win!';
    gameMessageElement.style.display = 'flex';
    
    // Show both buttons
    tryAgainButton.style.display = 'block';
    keepPlayingButton.style.display = 'block';
  }
  
  /**
   * Hides any game messages
   */
  function hideMessage() {
    gameMessageElement.classList.remove('game-over', 'game-won');
    gameMessageElement.style.display = 'none';
  }
  
  /**
   * Allows the player to continue after winning
   */
  function continueAfterWin() {
    keepPlaying = true;
    hideMessage();
  }
  
  // Initialize the game
  initGame();
});
