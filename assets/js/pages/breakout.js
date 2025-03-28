/**
 * Breakout/Brick Breaker Game Implementation
 * 
 * This file contains the game logic for a Breakout game, including:
 * - Ball physics and movement
 * - Paddle control with keyboard and mouse inputs
 * - Brick layout, collision detection, and destruction
 * - Game state management (start, pause, reset, game over)
 * - Score tracking and level progression
 */

// Game Class - Main controller for the Breakout game
class BreakoutGame {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set actual canvas dimensions (adjusting for display size)
        this.setCanvasDimensions();
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // Game statistics
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Animation frame ID (for canceling animation)
        this.reqAnimFrame = null;
        
        // Game speed (for increasing difficulty)
        this.speed = 1;
        
        // Initialize game objects
        this.initializeGameObjects();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Draw the initial game state
        this.drawInitialState();
    }
    
    /**
     * Set the canvas dimensions based on the container
     */
    setCanvasDimensions() {
        // Fixed game dimensions (aspect ratio 4:3)
        this.gameWidth = 800;
        this.gameHeight = 600;
        
        // Set canvas dimensions
        this.canvas.width = this.gameWidth;
        this.canvas.height = this.gameHeight;
    }
    
    /**
     * Initialize game objects (ball, paddle, bricks)
     */
    initializeGameObjects() {
        // Create the ball
        const ballRadius = 10;
        const ballX = this.gameWidth / 2;
        const ballY = this.gameHeight - 60;
        this.ball = new Ball(ballX, ballY, ballRadius, '#e94560');
        
        // Create the paddle
        const paddleWidth = 120;
        const paddleHeight = 15;
        const paddleX = (this.gameWidth - paddleWidth) / 2;
        const paddleY = this.gameHeight - 30;
        this.paddle = new Paddle(paddleX, paddleY, paddleWidth, paddleHeight, '#4d80e4', this.gameWidth);
        
        // Create the bricks
        this.createBricks();
    }
    
    /**
     * Create brick layout for the current level
     */
    createBricks() {
        // Brick configurations
        const rows = 5 + Math.min(3, this.level - 1); // More rows as levels increase
        const columns = 9;
        const brickWidth = 80;
        const brickHeight = 25;
        const brickPadding = 10;
        const topOffset = 60;
        const leftOffset = (this.gameWidth - ((brickWidth + brickPadding) * columns - brickPadding)) / 2;
        
        // Brick colors (different for each row)
        const colors = [
            '#e94560', '#ff8a5c', '#ffd460', 
            '#75cfb8', '#00b8a9', '#f08a5d', '#b83b5e'
        ];
        
        // Create the bricks array
        this.bricks = [];
        for (let c = 0; c < columns; c++) {
            for (let r = 0; r < rows; r++) {
                // Calculate position
                const brickX = leftOffset + c * (brickWidth + brickPadding);
                const brickY = topOffset + r * (brickHeight + brickPadding);
                
                // Assign points based on row (higher rows = more points)
                const points = (rows - r) * 10;
                
                // Create the brick and add to array
                const color = colors[r % colors.length];
                this.bricks.push(new Brick(brickX, brickY, brickWidth, brickHeight, color, points));
            }
        }
    }
    
    /**
     * Set up event listeners for game controls
     */
    setupEventListeners() {
        // Mouse movement for paddle control
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            const relativeX = e.clientX - this.canvas.getBoundingClientRect().left;
            this.paddle.moveTo(relativeX);
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'Left') {
                this.paddle.moveLeft();
            } else if (e.key === 'ArrowRight' || e.key === 'Right') {
                this.paddle.moveRight();
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
        
        // Pause game when window loses focus
        window.addEventListener('blur', () => {
            if (this.gameRunning && !this.gamePaused) {
                this.togglePause();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            // No need to change canvas dimensions, just ensure rendering is correct
            if (!this.gameRunning) {
                this.drawInitialState();
            }
        });
    }
    
    /**
     * Start the game
     */
    startGame() {
        if (this.gameRunning && !this.gamePaused) return;
        
        if (this.gamePaused) {
            // Unpause the game
            this.gamePaused = false;
            document.getElementById('pauseButton').textContent = 'Pause';
        } else {
            // Start a new game
            this.gameRunning = true;
            this.gameOver = false;
            document.getElementById('startButton').textContent = 'Restart';
        }
        
        // Start the game loop
        this.gameLoop();
    }
    
    /**
     * Toggle game pause state
     */
    togglePause() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            // Pause the game
            this.cancelAnimation();
            document.getElementById('pauseButton').textContent = 'Resume';
            
            // Draw pause message
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            this.ctx.font = '40px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.gameWidth / 2, this.gameHeight / 2);
        } else {
            // Resume the game
            document.getElementById('pauseButton').textContent = 'Pause';
            this.gameLoop();
        }
    }
    
    /**
     * Reset the game to initial state
     */
    resetGame() {
        // Reset game state
        this.cancelAnimation();
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // Reset game statistics
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.speed = 1;
        
        // Update displays
        this.updateScoreDisplay();
        
        // Reset game objects
        this.initializeGameObjects();
        
        // Update button text
        document.getElementById('startButton').textContent = 'Start Game';
        document.getElementById('pauseButton').textContent = 'Pause';
        
        // Draw the initial state
        this.drawInitialState();
    }
    
    /**
     * Draw the initial welcome screen
     */
    drawInitialState() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw background
        this.ctx.fillStyle = '#121212';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw welcome message
        this.ctx.font = '40px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BREAKOUT', this.gameWidth / 2, this.gameHeight / 2 - 50);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Click "Start Game" to play', this.gameWidth / 2, this.gameHeight / 2);
        
        // Draw game objects in initial positions
        this.paddle.draw(this.ctx);
        this.ball.draw(this.ctx);
        
        // Draw some bricks for visual effect
        for (const brick of this.bricks) {
            brick.draw(this.ctx);
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw background
        this.ctx.fillStyle = '#121212';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Update and draw the paddle
        this.paddle.update();
        this.paddle.draw(this.ctx);
        
        // Update and draw the ball
        this.ball.update(this.speed);
        this.ball.draw(this.ctx);
        
        // Draw the bricks
        for (const brick of this.bricks) {
            if (brick.visible) {
                brick.draw(this.ctx);
            }
        }
        
        // Check for collisions
        this.checkCollisions();
        
        // Check if level is complete
        this.checkLevelComplete();
        
        // Check if ball is out of bounds
        this.checkBallOutOfBounds();
        
        // Request next animation frame
        this.reqAnimFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Cancel the animation frame
     */
    cancelAnimation() {
        if (this.reqAnimFrame) {
            cancelAnimationFrame(this.reqAnimFrame);
            this.reqAnimFrame = null;
        }
    }
    
    /**
     * Check for collisions between ball and other objects
     */
    checkCollisions() {
        // Ball-Wall collisions (left and right)
        if (this.ball.x - this.ball.radius < 0 || 
            this.ball.x + this.ball.radius > this.gameWidth) {
            this.ball.dx = -this.ball.dx;
        }
        
        // Ball-Wall collision (top)
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
        
        // Ball-Paddle collision
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            // Calculate relative position of ball on paddle (0 to 1)
            const hitPosition = (this.ball.x - this.paddle.x) / this.paddle.width;
            
            // Calculate new angle based on hit position (-60° to 60°)
            const angle = (hitPosition * 120 - 60) * Math.PI / 180;
            
            // Set new velocity based on angle
            const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
            this.ball.dx = speed * Math.sin(angle);
            this.ball.dy = -speed * Math.cos(angle);
            
            // Ensure the ball moves upward and doesn't get stuck
            if (this.ball.dy > -2) {
                this.ball.dy = -2;
            }
        }
        
        // Ball-Brick collisions
        for (const brick of this.bricks) {
            if (brick.visible && this.ballHitsBrick(this.ball, brick)) {
                // Hide the brick
                brick.visible = false;
                
                // Add points to score
                this.score += brick.points;
                this.updateScoreDisplay();
                
                // Determine which side of the brick was hit
                
                // Check if left or right collision
                if (this.ball.x < brick.x || this.ball.x > brick.x + brick.width) {
                    this.ball.dx = -this.ball.dx;
                } 
                // Check if top or bottom collision
                else {
                    this.ball.dy = -this.ball.dy;
                }
                
                // Only process one brick collision per frame for simplicity
                break;
            }
        }
    }
    
    /**
     * Check if the ball hits a brick
     */
    ballHitsBrick(ball, brick) {
        // Find the closest point on the brick to the ball's center
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        
        // Calculate distance between ball's center and the closest point
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        // Check if the distance is less than the ball's radius
        return distance <= ball.radius;
    }
    
    /**
     * Check if the level is complete (all bricks destroyed)
     */
    checkLevelComplete() {
        const remainingBricks = this.bricks.filter(brick => brick.visible).length;
        
        if (remainingBricks === 0) {
            // Level complete
            this.level++;
            
            // Update speed based on level
            this.speed = 1 + (this.level - 1) * 0.2;
            if (this.speed > 2.5) this.speed = 2.5;
            
            // Reset ball and paddle
            this.ball.reset(this.gameWidth / 2, this.gameHeight - 60);
            this.paddle.reset((this.gameWidth - this.paddle.width) / 2);
            
            // Create new bricks layout for next level
            this.createBricks();
            
            // Update level display
            document.getElementById('level').textContent = this.level;
            
            // Show level up message
            this.cancelAnimation();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            this.ctx.font = '40px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`LEVEL ${this.level}`, this.gameWidth / 2, this.gameHeight / 2 - 20);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Get Ready!', this.gameWidth / 2, this.gameHeight / 2 + 20);
            
            // Pause briefly before starting next level
            this.gamePaused = true;
            setTimeout(() => {
                this.gamePaused = false;
                this.gameLoop();
            }, 2000);
        }
    }
    
    /**
     * Check if the ball is out of bounds (bottom)
     */
    checkBallOutOfBounds() {
        if (this.ball.y + this.ball.radius > this.gameHeight) {
            this.lives--;
            this.updateScoreDisplay();
            
            if (this.lives <= 0) {
                // Game over
                this.gameOver = true;
                this.cancelAnimation();
                
                // Show game over message
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
                this.ctx.font = '40px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', this.gameWidth / 2, this.gameHeight / 2 - 20);
                this.ctx.font = '24px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.gameWidth / 2, this.gameHeight / 2 + 20);
            } else {
                // Reset ball and paddle
                this.ball.reset(this.gameWidth / 2, this.gameHeight - 60);
                this.paddle.reset((this.gameWidth - this.paddle.width) / 2);
                
                // Pause briefly before continuing
                this.cancelAnimation();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
                this.ctx.font = '30px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Lives Remaining: ${this.lives}`, this.gameWidth / 2, this.gameHeight / 2);
                
                setTimeout(() => {
                    this.gameLoop();
                }, 1000);
            }
        }
    }
    
    /**
     * Update the score display
     */
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
}

// Ball Class - Represents the game ball
class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = 4; // Initial horizontal speed
        this.dy = -4; // Initial vertical speed
        this.initialX = x;
        this.initialY = y;
    }
    
    /**
     * Draw the ball
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
    
    /**
     * Update ball position
     */
    update(speedMultiplier = 1) {
        this.x += this.dx * speedMultiplier;
        this.y += this.dy * speedMultiplier;
    }
    
    /**
     * Reset ball to initial position
     */
    reset(x, y) {
        this.x = x || this.initialX;
        this.y = y || this.initialY;
        
        // Randomize direction slightly
        const angle = (Math.random() * 60 - 30) * Math.PI / 180;
        const speed = 4;
        this.dx = speed * Math.sin(angle);
        this.dy = -speed * Math.cos(angle);
    }
}

// Paddle Class - Represents the player's paddle
class Paddle {
    constructor(x, y, width, height, color, gameWidth) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.gameWidth = gameWidth;
        this.speed = 8;
        this.targetX = x; // For smooth movement
    }
    
    /**
     * Draw the paddle
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
    
    /**
     * Update paddle position (smooth movement towards target)
     */
    update() {
        // Move towards target position with smooth animation
        if (Math.abs(this.targetX - this.x) > this.speed) {
            if (this.targetX > this.x) {
                this.x += this.speed;
            } else {
                this.x -= this.speed;
            }
        } else {
            this.x = this.targetX;
        }
    }
    
    /**
     * Move paddle to specific x position (mouse control)
     */
    moveTo(x) {
        // Calculate the center of the paddle
        const paddleCenterX = x - this.width / 2;
        
        // Keep paddle within game boundaries
        this.targetX = Math.max(0, Math.min(this.gameWidth - this.width, paddleCenterX));
    }
    
    /**
     * Move paddle left (keyboard control)
     */
    moveLeft() {
        this.targetX = Math.max(0, this.x - this.speed);
    }
    
    /**
     * Move paddle right (keyboard control)
     */
    moveRight() {
        this.targetX = Math.min(this.gameWidth - this.width, this.x + this.speed);
    }
    
    /**
     * Reset paddle to specific position
     */
    reset(x) {
        this.x = x;
        this.targetX = x;
    }
}

// Brick Class - Represents a breakable brick
class Brick {
    constructor(x, y, width, height, color, points) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.points = points;
        this.visible = true;
    }
    
    /**
     * Draw the brick if visible
     */
    draw(ctx) {
        if (!this.visible) return;
        
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add a subtle 3D effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.stroke();
        
        ctx.closePath();
    }
}

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create an instance of the game
        const game = new BreakoutGame();
        
        // Log success message
        console.log('Breakout game initialized successfully');
    } catch (error) {
        console.error('Error initializing Breakout game:', error);
    }
});
