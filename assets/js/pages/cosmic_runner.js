/**
 * Cosmic Runner - A side-scrolling space runner game
 * 
 * This file contains the game logic for Cosmic Runner using Phaser 3, including:
 * - Game configuration and initialization
 * - Multiple game scenes (Title, Game, GameOver)
 * - Player spaceship controls
 * - Scrolling background
 * - Obstacle and power-up generation
 * - Collision detection and game mechanics
 */

// Wait for the DOM to be ready before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    
    // Game configuration
    const config = {
        type: Phaser.AUTO,
        parent: 'gameContainer',
        width: 800,
        height: 500,
        backgroundColor: '#000000',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [TitleScene, GameScene, GameOverScene]
    };
    
    // Initialize the game
    const game = new Phaser.Game(config);
    
    // Global game variables
    game.globals = {
        score: 0,
        highScore: localStorage.getItem('cosmicRunnerHighScore') || 0,
        gameSpeed: 1,
        gameStarted: false
    };
    
    // Set up UI button handlers
    document.getElementById('startButton').addEventListener('click', () => {
        if (!game.globals.gameStarted) {
            game.globals.gameStarted = true;
            game.scene.start('GameScene');
        }
    });
    
    document.getElementById('restartButton').addEventListener('click', () => {
        game.globals.score = 0;
        updateScoreDisplay(0);
        game.scene.start('GameScene');
    });
});

/**
 * Update the score display in the HTML
 * @param {number} score - The current score to display
 */
function updateScoreDisplay(score) {
    document.getElementById('score').textContent = score;
}

/**
 * Title Scene - The initial menu screen
 */
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }
    
    preload() {
        // Load title assets
        this.load.image('logo', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/phaser-dude.png');
        this.load.image('stars', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/skies/starfield.png');
        
        // We'll also preload game assets here to avoid delays later
        this.load.image('ship', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/ship.png');
        this.load.image('asteroid', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/asteroid.png');
        this.load.image('enemy', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/enemy-blue.png');
        this.load.image('powerup', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/orb-blue.png');
        this.load.image('explosion', 'https://cdn.jsdelivr.net/gh/photonstorm/phaser3-examples@master/public/assets/sprites/explosion.png');
    }
    
    create() {
        // Create a starry background
        this.starfield = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'stars')
            .setOrigin(0)
            .setScrollFactor(0);
        
        // Title text
        const titleText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY - 100, 
            'COSMIC RUNNER', 
            { 
                fontFamily: 'Arial',
                fontSize: '48px', 
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#7b2682',
                strokeThickness: 6,
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, stroke: true, fill: true }
            }
        ).setOrigin(0.5);
        
        // Instructions text
        const instructionsText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 50, 
            'Click "Start Game" to begin\nor press SPACE', 
            { 
                fontFamily: 'Arial',
                fontSize: '24px', 
                color: '#e0e0ff',
                align: 'center' 
            }
        ).setOrigin(0.5);
        
        // Make the text pulse
        this.tweens.add({
            targets: instructionsText,
            alpha: 0.5,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Listen for spacebar to start game
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
            this.game.globals.gameStarted = true;
        });
    }
    
    update() {
        // Scroll the starfield for a dynamic background
        this.starfield.tilePositionX += 0.5;
        this.starfield.tilePositionY += 0.2;
    }
}

/**
 * Game Scene - The main gameplay screen
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init() {
        // Initialize game variables
        this.score = 0;
        this.gameSpeed = 1;
        this.obstacleSpeed = 250;
        this.obstacleTimer = 0;
        this.powerUpTimer = 0;
        this.isPaused = false;
        this.isGameOver = false;
    }
    
    create() {
        // Reset score display
        updateScoreDisplay(0);
        
        // Create a parallax scrolling background with multiple layers for depth
        this.backgroundBack = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'stars')
            .setOrigin(0)
            .setScrollFactor(0)
            .setTint(0x333366);
            
        this.backgroundMid = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'stars')
            .setOrigin(0)
            .setScrollFactor(0);
        
        // Create the player's spaceship
        this.player = this.physics.add.sprite(150, this.cameras.main.centerY, 'ship');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.6);
        this.player.setDepth(1);
        
        // Add a subtle glow effect to the player's ship
        this.playerGlow = this.add.sprite(this.player.x, this.player.y, 'ship')
            .setScale(0.8)
            .setAlpha(0.3)
            .setTint(0x00ffff)
            .setBlendMode('ADD');
            
        // Add engine particles effect behind the player
        this.engineParticles = this.add.particles({
            key: 'powerup',
            config: {
                speed: 100,
                scale: { start: 0.2, end: 0 },
                blendMode: 'ADD',
                lifespan: 500,
                tint: 0x00ffff,
                emitting: true,
                follow: this.player,
                followOffset: { x: -30, y: 0 }
            }
        });
        
        // Set up groups for obstacles and power-ups
        this.obstacles = this.physics.add.group();
        this.powerUps = this.physics.add.group();
        
        // Set up collisions
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
        
        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Add WASD controls as alternative
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Set up pause functionality
        this.input.keyboard.on('keydown-P', () => {
            this.togglePause();
        });
        
        // Start spawning obstacles and power-ups
        this.time.addEvent({
            delay: 1500,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
        
        this.time.addEvent({
            delay: 10000,
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });
        
        // Score incrementer - add points over time for distance traveled
        this.time.addEvent({
            delay: 1000,
            callback: this.addScore,
            args: [10],
            callbackScope: this,
            loop: true
        });
        
        // Increase game speed gradually
        this.time.addEvent({
            delay: 30000,
            callback: this.increaseSpeed,
            callbackScope: this,
            loop: true
        });
    }
    
    update(time, delta) {
        if (this.isPaused || this.isGameOver) return;
        
        // Update background scroll (parallax effect - different layers move at different speeds)
        this.backgroundBack.tilePositionX += 0.5 * this.gameSpeed;
        this.backgroundMid.tilePositionX += 1 * this.gameSpeed;
        
        // Update player position based on input
        this.handlePlayerInput();
        
        // Update glow position to follow player
        this.playerGlow.x = this.player.x;
        this.playerGlow.y = this.player.y;
        
        // Move obstacles and check if they're off-screen
        this.obstacles.getChildren().forEach(obstacle => {
            obstacle.x -= 5 * this.gameSpeed;
            
            // Remove obstacle when it goes off screen
            if (obstacle.x < -obstacle.width) {
                obstacle.destroy();
            }
        });
        
        // Move power-ups and check if they're off-screen
        this.powerUps.getChildren().forEach(powerUp => {
            powerUp.x -= 3 * this.gameSpeed;
            
            // Power-ups float up and down
            powerUp.y += Math.sin(time / 500) * 0.5;
            
            // Rotate the power-up
            powerUp.angle += 1;
            
            // Remove power-up when it goes off screen
            if (powerUp.x < -powerUp.width) {
                powerUp.destroy();
            }
        });
    }
    
    /**
     * Handle player input for ship movement
     */
    handlePlayerInput() {
        // Set base player velocity
        const playerSpeed = 300;
        let velocityX = 0;
        let velocityY = 0;
        
        // Horizontal movement
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX = -playerSpeed;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX = playerSpeed;
        }
        
        // Vertical movement
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            velocityY = -playerSpeed;
            // Tilt ship slightly up when moving up
            this.player.angle = -10;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            velocityY = playerSpeed;
            // Tilt ship slightly down when moving down
            this.player.angle = 10;
        } else {
            // Reset angle when not moving vertically
            this.player.angle = 0;
        }
        
        // Set player velocity
        this.player.setVelocity(velocityX, velocityY);
    }
    
    /**
     * Spawn a random obstacle
     */
    spawnObstacle() {
        if (this.isPaused || this.isGameOver) return;
        
        // Randomly choose between asteroid or enemy ship
        const isAsteroid = Phaser.Math.Between(0, 1) === 0;
        const obstacleType = isAsteroid ? 'asteroid' : 'enemy';
        
        // Random y position
        const y = Phaser.Math.Between(50, this.cameras.main.height - 50);
        
        // Create the obstacle
        const obstacle = this.obstacles.create(this.cameras.main.width + 50, y, obstacleType);
        
        // Set properties based on type
        if (isAsteroid) {
            // Asteroids are bigger and slower
            obstacle.setScale(Phaser.Math.FloatBetween(0.6, 1.2));
            
            // Make asteroids rotate
            this.tweens.add({
                targets: obstacle,
                angle: 360,
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
                ease: 'Linear'
            });
        } else {
            // Enemy ships are smaller and faster
            obstacle.setScale(0.5);
            
            // Make enemy ships move up and down
            this.tweens.add({
                targets: obstacle,
                y: y + Phaser.Math.Between(-100, 100),
                duration: 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
        
        // Set physics properties
        obstacle.setVelocityX(-this.obstacleSpeed * this.gameSpeed);
        obstacle.setAngularVelocity(isAsteroid ? -30 : 0);
        
        // Add a subtle glow effect based on type
        const glowColor = isAsteroid ? 0xffaa00 : 0xff0000;
        const glow = this.add.sprite(obstacle.x, obstacle.y, obstacleType)
            .setScale(obstacle.scaleX * 1.3)
            .setAlpha(0.3)
            .setTint(glowColor)
            .setBlendMode('ADD');
            
        // Make the glow follow the obstacle
        this.tweens.add({
            targets: glow,
            x: '+=10',
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                glow.x = obstacle.x;
                glow.y = obstacle.y;
                glow.angle = obstacle.angle;
            },
            onComplete: () => {
                glow.destroy();
            }
        });
    }
    
    /**
     * Spawn a power-up
     */
    spawnPowerUp() {
        if (this.isPaused || this.isGameOver) return;
        
        // Random y position
        const y = Phaser.Math.Between(50, this.cameras.main.height - 50);
        
        // Create the power-up
        const powerUp = this.powerUps.create(this.cameras.main.width + 50, y, 'powerup');
        
        // Set properties
        powerUp.setScale(0.5);
        powerUp.setVelocityX(-150 * this.gameSpeed);
        
        // Add glow effect
        const glow = this.add.sprite(powerUp.x, powerUp.y, 'powerup')
            .setScale(1)
            .setAlpha(0.5)
            .setTint(0x00ffff)
            .setBlendMode('ADD');
            
        // Pulse the glow
        this.tweens.add({
            targets: glow,
            scale: 0.8,
            alpha: 0.3,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                glow.x = powerUp.x;
                glow.y = powerUp.y;
            },
            onComplete: () => {
                glow.destroy();
            }
        });
    }
    
    /**
     * Handle collision with obstacle
     * @param {Phaser.GameObjects.Sprite} player - The player sprite
     * @param {Phaser.GameObjects.Sprite} obstacle - The obstacle sprite
     */
    hitObstacle(player, obstacle) {
        // Game over only happens when not in debug mode (for testing)
        if (!this.physics.world.debug) {
            this.isGameOver = true;
            
            // Create explosion effect
            this.createExplosion(player.x, player.y);
            
            // Hide the player
            player.setVisible(false);
            this.playerGlow.setVisible(false);
            this.engineParticles.stop();
            
            // Store high score
            if (this.score > this.game.globals.highScore) {
                this.game.globals.highScore = this.score;
                localStorage.setItem('cosmicRunnerHighScore', this.score);
            }
            
            // Show game over screen after a delay
            this.time.delayedCall(1500, () => {
                this.scene.start('GameOverScene', { score: this.score });
            });
        }
    }
    
    /**
     * Handle collecting a power-up
     * @param {Phaser.GameObjects.Sprite} player - The player sprite
     * @param {Phaser.GameObjects.Sprite} powerUp - The power-up sprite
     */
    collectPowerUp(player, powerUp) {
        // Remove the power-up
        powerUp.destroy();
        
        // Add score
        this.addScore(50);
        
        // Create flash effect
        const flash = this.add.sprite(player.x, player.y, 'powerup')
            .setScale(2)
            .setAlpha(0.7)
            .setTint(0x00ffff)
            .setBlendMode('ADD');
            
        // Animate the flash
        this.tweens.add({
            targets: flash,
            scale: 5,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Temporarily speed up ship
        const originalScale = player.scaleX;
        this.tweens.add({
            targets: player,
            scaleX: originalScale * 1.2,
            scaleY: originalScale * 1.2,
            duration: 300,
            yoyo: true
        });
    }
    
    /**
     * Add to the player's score and update the display
     * @param {number} points - The points to add
     */
    addScore(points) {
        if (this.isPaused || this.isGameOver) return;
        
        this.score += points;
        updateScoreDisplay(this.score);
    }
    
    /**
     * Increase game speed
     */
    increaseSpeed() {
        if (this.isPaused || this.isGameOver) return;
        
        this.gameSpeed += 0.1;
        this.obstacleSpeed += 20;
        
        // Create a speed-up flash effect
        const speedText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            'SPEED UP!', 
            { 
                fontFamily: 'Arial',
                fontSize: '48px', 
                color: '#ffff00',
                stroke: '#ff0000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setAlpha(0);
        
        // Animate the text
        this.tweens.add({
            targets: speedText,
            alpha: 1,
            y: this.cameras.main.centerY - 50,
            duration: 600,
            ease: 'Cubic.easeOut',
            yoyo: true,
            hold: 600,
            onComplete: () => {
                speedText.destroy();
            }
        });
    }
    
    /**
     * Create an explosion effect
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    createExplosion(x, y) {
        // Create explosion particles
        const particles = this.add.particles({
            key: 'explosion',
            config: {
                x: x,
                y: y,
                speed: { min: 50, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 800,
                gravityY: 0,
                quantity: 30,
                emitting: false
            }
        });
        
        // Emit particles then destroy
        particles.emitParticleAt(x, y, 30);
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Flash effect
        this.cameras.main.flash(500, 255, 50, 50);
        this.cameras.main.shake(500, 0.02);
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Pause physics and animations
            this.physics.pause();
            this.tweens.pauseAll();
            
            // Show pause text
            this.pauseText = this.add.text(
                this.cameras.main.centerX, 
                this.cameras.main.centerY, 
                'PAUSED\n\nPress P to resume', 
                { 
                    fontFamily: 'Arial',
                    fontSize: '32px', 
                    color: '#ffffff',
                    align: 'center' 
                }
            ).setOrigin(0.5);
        } else {
            // Resume physics and animations
            this.physics.resume();
            this.tweens.resumeAll();
            
            // Remove pause text
            if (this.pauseText) {
                this.pauseText.destroy();
            }
        }
    }
}

/**
 * Game Over Scene - Shown when the player loses
 */
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.score = data.score || 0;
    }
    
    create() {
        // Create a starry background
        this.starfield = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'stars')
            .setOrigin(0)
            .setScrollFactor(0);
        
        // Game Over text
        const gameOverText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY - 100, 
            'GAME OVER', 
            { 
                fontFamily: 'Arial',
                fontSize: '64px', 
                color: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6,
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, stroke: true, fill: true }
            }
        ).setOrigin(0.5);
        
        // Score text
        const scoreText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            `Score: ${this.score}`, 
            { 
                fontFamily: 'Arial',
                fontSize: '32px', 
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // High score text
        const highScoreText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 50, 
            `High Score: ${this.game.globals.highScore}`, 
            { 
                fontFamily: 'Arial',
                fontSize: '24px', 
                color: '#ffff00'
            }
        ).setOrigin(0.5);
        
        // Restart instructions
        const restartText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 150, 
            'Click "Restart" to play again\nor press SPACE', 
            { 
                fontFamily: 'Arial',
                fontSize: '20px', 
                color: '#e0e0ff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Make the restart text pulse
        this.tweens.add({
            targets: restartText,
            alpha: 0.5,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Listen for spacebar to restart
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
    
    update() {
        // Scroll the starfield for a dynamic background
        this.starfield.tilePositionX += 0.5;
        this.starfield.tilePositionY += 0.2;
    }
}
