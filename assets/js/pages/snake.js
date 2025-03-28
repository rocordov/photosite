/**
 * Snake Game Implementation
 * A classic snake game using HTML5 Canvas and JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreDisplay = document.getElementById('score');
  const finalScoreDisplay = document.getElementById('finalScore');
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const newGameButton = document.getElementById('newGameButton');
  const gameOverModal = document.getElementById('gameOverModal');
  
  // Mobile control buttons
  const upButton = document.getElementById('upButton');
  const downButton = document.getElementById('downButton');
  const leftButton = document.getElementById('leftButton');
  const rightButton = document.getElementById('rightButton');
  
  // Game settings
  const GAME_SPEED = 100; // Lower is faster
  const CELL_SIZE = 20;
  const GRID_SIZE = canvas.width / CELL_SIZE;
  
  // Game state
  let snake = [];
  let food = {};
  let score = 0;
  let direction = 'right'; // Initial direction
  let nextDirection = 'right';
  let gameRunning = false;
  let gameLoop;
  
  // Snake colors based on theme
  let snakeColor = '#00BCD4'; // Default color
  let headColor = '#0097A7';
  let foodColor = '#FF4081';
  let gridColor = 'rgba(255, 255, 255, 0.1)';
  
  /**
   * Initialize the game
   * Set up the canvas, initial snake, and food position
   */
  function initGame() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create initial snake (3 segments)
    snake = [
      { x: 6, y: 10 }, // Head
      { x: 5, y: 10 },
      { x: 4, y: 10 }
    ];
    
    // Reset game state
    score = 0;
    direction = 'right';
    nextDirection = 'right';
    scoreDisplay.textContent = score;
    
    // Generate first food item
    generateFood();
    
    // Initial draw
    draw();
    
    // Update theme colors
    updateThemeColors();
    
    // Add event listener for theme changes
    document.addEventListener('themeToggle', updateThemeColors);
  }
  
  /**
   * Update colors based on current theme
   */
  function updateThemeColors() {
    const isLightMode = document.documentElement.classList.contains('light-mode');
    
    if (isLightMode) {
      snakeColor = '#00796B';  // Darker teal for light mode
      headColor = '#004D40';   // Even darker teal for head
      foodColor = '#D81B60';   // Darker pink for light mode
      gridColor = 'rgba(0, 0, 0, 0.1)';
    } else {
      snakeColor = '#00BCD4';  // Bright teal for dark mode
      headColor = '#0097A7';   // Slightly darker teal for head
      foodColor = '#FF4081';   // Bright pink for dark mode
      gridColor = 'rgba(255, 255, 255, 0.1)';
    }
    
    // Redraw if game is not running
    if (!gameRunning) {
      draw();
    }
  }
  
  /**
   * Start the game
   * Initializes game state and starts the game loop
   */
  function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    startButton.disabled = true;
    restartButton.disabled = false;
    
    // Start game loop
    gameLoop = setInterval(() => {
      update();
      draw();
    }, GAME_SPEED);
  }
  
  /**
   * Restart the game
   * Stops the current game and starts a new one
   */
  function restartGame() {
    // Stop current game loop
    clearInterval(gameLoop);
    gameRunning = false;
    
    // Hide game over modal if visible
    gameOverModal.classList.remove('show');
    
    // Initialize new game
    initGame();
    
    // Start game again
    startGame();
  }
  
  /**
   * End the game
   * Stops the game loop and displays game over screen
   */
  function endGame() {
    clearInterval(gameLoop);
    gameRunning = false;
    finalScoreDisplay.textContent = score;
    gameOverModal.classList.add('show');
    startButton.disabled = true;
    restartButton.disabled = false;
  }
  
  /**
   * Generate food at a random position
   * Ensures food doesn't appear on the snake
   */
  function generateFood() {
    // Generate random position
    let newFood;
    let foodOnSnake;
    
    // Keep generating until valid position is found
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      
      // Check if food is on the snake
      foodOnSnake = snake.some(segment => 
        segment.x === newFood.x && segment.y === newFood.y
      );
    } while (foodOnSnake);
    
    food = newFood;
  }
  
  /**
   * Update game state
   * Moves snake, checks collisions, updates score
   */
  function update() {
    // Update direction (only allow 90 degree turns)
    if (
      (direction === 'up' || direction === 'down') && 
      (nextDirection === 'left' || nextDirection === 'right')
    ) {
      direction = nextDirection;
    } else if (
      (direction === 'left' || direction === 'right') && 
      (nextDirection === 'up' || nextDirection === 'down')
    ) {
      direction = nextDirection;
    }
    
    // Calculate new head position
    const head = { ...snake[0] };
    
    switch (direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }
    
    // Check for wall collision
    if (
      head.x < 0 || 
      head.x >= GRID_SIZE || 
      head.y < 0 || 
      head.y >= GRID_SIZE
    ) {
      endGame();
      return;
    }
    
    // Check for self collision (skip the tail as it will move)
    for (let i = 0; i < snake.length - 1; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        endGame();
        return;
      }
    }
    
    // Add new head to the front of the snake
    snake.unshift(head);
    
    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
      // Increase score
      score += 10;
      scoreDisplay.textContent = score;
      
      // Generate new food
      generateFood();
    } else {
      // Remove tail segment if no food was eaten
      snake.pop();
    }
  }
  
  /**
   * Draw the game
   * Renders the snake, food, and grid on the canvas
   */
  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw food
    drawCell(food.x, food.y, foodColor);
    
    // Draw snake
    snake.forEach((segment, index) => {
      // Head has a different color
      const color = index === 0 ? headColor : snakeColor;
      drawCell(segment.x, segment.y, color);
    });
  }
  
  /**
   * Draw a grid on the canvas
   */
  function drawGrid() {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
  
  /**
   * Draw a cell at grid coordinates
   * @param {number} x - X grid coordinate
   * @param {number} y - Y grid coordinate
   * @param {string} color - Cell color
   */
  function drawCell(x, y, color) {
    const padding = 1; // Space between cell and grid lines
    
    ctx.fillStyle = color;
    ctx.fillRect(
      x * CELL_SIZE + padding, 
      y * CELL_SIZE + padding, 
      CELL_SIZE - padding * 2, 
      CELL_SIZE - padding * 2
    );
  }
  
  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyDown(event) {
    // Only handle arrow keys
    switch (event.key) {
      case 'ArrowUp':
        if (direction !== 'down') nextDirection = 'up';
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (direction !== 'up') nextDirection = 'down';
        event.preventDefault();
        break;
      case 'ArrowLeft':
        if (direction !== 'right') nextDirection = 'left';
        event.preventDefault();
        break;
      case 'ArrowRight':
        if (direction !== 'left') nextDirection = 'right';
        event.preventDefault();
        break;
    }
  }
  
  /**
   * Handle direction button click for mobile
   * @param {string} newDirection - The direction to change to
   */
  function changeDirection(newDirection) {
    // Prevent 180-degree turns
    if (
      (newDirection === 'up' && direction !== 'down') ||
      (newDirection === 'down' && direction !== 'up') ||
      (newDirection === 'left' && direction !== 'right') ||
      (newDirection === 'right' && direction !== 'left')
    ) {
      nextDirection = newDirection;
    }
  }
  
  // Event listeners
  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', restartGame);
  newGameButton.addEventListener('click', restartGame);
  document.addEventListener('keydown', handleKeyDown);
  
  // Mobile control buttons
  upButton.addEventListener('click', () => changeDirection('up'));
  downButton.addEventListener('click', () => changeDirection('down'));
  leftButton.addEventListener('click', () => changeDirection('left'));
  rightButton.addEventListener('click', () => changeDirection('right'));
  
  // Prevent scrolling when using arrow keys
  window.addEventListener('keydown', (e) => {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  });
  
  // Touch support for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  
  canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // Determine swipe direction based on strongest component
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && direction !== 'left') {
        nextDirection = 'right';
      } else if (dx < 0 && direction !== 'right') {
        nextDirection = 'left';
      }
    } else {
      // Vertical swipe
      if (dy > 0 && direction !== 'up') {
        nextDirection = 'down';
      } else if (dy < 0 && direction !== 'down') {
        nextDirection = 'up';
      }
    }
    
    // Reset touch start position
    touchStartX = touchEndX;
    touchStartY = touchEndY;
    
    e.preventDefault();
  }, { passive: false });
  
  // Initialize game on load
  initGame();
});
