/**
 *
 * Interactive circular photo gallery with spring physics and flip animations
 */

// Spring Physics class - handles all elastic movement
class SpringPhysics {
  constructor(options = {}) {
    // Spring configuration with defaults
    this.config = {
      tension: options.tension || 120,     // Spring stiffness
      friction: options.friction || 14,     // Damping factor
      mass: options.mass || 1,              // Mass of object
      precision: options.precision || 0.01, // Threshold for stopping animation
      initialValue: options.initialValue || 0,
      initialVelocity: options.initialVelocity || 0
    };

    // Spring state
    this.position = this.config.initialValue;
    this.velocity = this.config.initialVelocity;
    this.target = this.config.initialValue;
    
    // Animation state
    this.isActive = false;
    this.animationFrame = null;
    this.lastTime = null;
    
    // Event callbacks
    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});
  }

  // Set the target position
  setTarget(target) {
    this.target = target;
    
    // Start animation if not already running
    if (!this.isActive) {
      this.isActive = true;
      this.lastTime = performance.now();
      this.animate();
    }
  }
  
  // Add an impulse to the spring (immediate velocity change)
  addImpulse(velocity) {
    this.velocity += velocity;
    
    // Start animation if not already running
    if (!this.isActive) {
      this.isActive = true;
      this.lastTime = performance.now();
      this.animate();
    }
  }
  
  // Core spring physics animation loop
  animate() {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.064); // Cap to avoid spiral of death
    this.lastTime = now;
    
    // Calculate spring force using Hooke's Law: F = -k * x
    // where k is the spring constant (tension) and x is displacement
    const displacement = this.position - this.target;
    const springForce = -this.config.tension * displacement;
    
    // Calculate damping force: F = -c * v
    // where c is the damping coefficient (friction) and v is velocity
    const dampingForce = -this.config.friction * this.velocity;
    
    // Calculate acceleration: F = ma -> a = F/m
    const acceleration = (springForce + dampingForce) / this.config.mass;
    
    // Update velocity: v = v₀ + at
    this.velocity += acceleration * deltaTime;
    
    // Update position: x = x₀ + vt
    this.position += this.velocity * deltaTime;
    
    // Notify position update
    this.onUpdate(this.position);
    
    // Check if spring has settled (close enough to target with minimal velocity)
    const isSettled = Math.abs(this.velocity) < this.config.precision && 
                      Math.abs(displacement) < this.config.precision;
    
    if (isSettled) {
      // Snap to exact position to avoid floating point imprecision
      this.position = this.target;
      this.velocity = 0;
      this.isActive = false;
      cancelAnimationFrame(this.animationFrame);
      this.onComplete();
    } else {
      // Continue animation
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }
  
  // Stop animation immediately
  stop() {
    this.isActive = false;
    cancelAnimationFrame(this.animationFrame);
  }
}

// Main CircularGallery class
class CircularGallery {
  constructor(containerId, options = {}) {
    // Configuration with defaults
    this.config = {
      numThumbnails: options.numThumbnails || 20,     // Number of thumbnails to show around the circle
      rotationSensitivity: options.rotationSensitivity || 0.1, // How sensitive the wheel is to drag
      ambientMovement: options.ambientMovement || 0.5, // Amount of ambient floating movement
      initialRotation: options.initialRotation || 0,   // Starting rotation
      scatterRadius: options.scatterRadius || 300,     // Scatter radius for the unravel effect
      scatterRotation: options.scatterRotation || 20,  // Max random rotation for scattered thumbnails
      scatterDuration: options.scatterDuration || 1.8, // Duration of scatter animation in seconds
      scatterJitter: options.scatterJitter || 0.3      // Amount of position randomness in scatter
    };
    
    // DOM elements
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      console.error('Container element not found');
      return;
    }
    
    // Get all image paths from the container
    this.imagePaths = this.extractImagePaths();
    
    if (this.imagePaths.length === 0) {
      console.error('No images found in the container');
      return;
    }
    
    // Limit thumbnails if we have fewer images than config
    this.config.numThumbnails = Math.min(this.config.numThumbnails, this.imagePaths.length);
    
    // State variables
    this.currentImageIndex = 0;
    this.wheelRotation = this.config.initialRotation;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastDragX = 0;
    this.lastDragY = 0;
    this.touchStarted = false;
    this.imageActive = false;
    this.hasScattered = false; // Track if the scatter effect has been triggered
    this.scatterPositions = []; // Store the scattered positions for each thumbnail
    this.isAnimating = false; // Track animation state
    this._clickTimeout = null; // Add click handling state
    this._lastClickTime = 0; // Add click handling state
    this.userInteracted = false; // Track user interaction for ambient motion
    this.snakeAnimationActive = false; // Controls snake-following animation
    
    // Spring physics for the wheel rotation
    this.rotationSpring = new SpringPhysics({
      tension: 80,      // More relaxed spring for smoother rotation
      friction: 12,     // Lower friction for more bounciness
      initialValue: this.config.initialRotation,
      onUpdate: (value) => {
        this.wheelRotation = value;
        this.updateWheelTransform();
      }
    });
    
    // Build the gallery UI
    this.buildGallery();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initial positioning
    this.updateThumbnailPositions();
    
    // Add ambient motion
    this.startAmbientMotion();
  }
  
  // Extract all image paths from the container
  extractImagePaths() {
    const images = [];
    
    // Look for regular img tags
    const imgTags = this.container.querySelectorAll('img');
    imgTags.forEach(img => {
      if (img.src) images.push({
        src: img.src,
        alt: img.alt || 'Gallery image'
      });
    });
    
    // Also check for noscript section which might contain image paths
    const noscript = this.container.querySelector('noscript');
    if (noscript) {
      const parser = new DOMParser();
      const noscriptContent = parser.parseFromString('<div>' + noscript.textContent + '</div>', 'text/html');
      const noscriptImgs = noscriptContent.querySelectorAll('img');
      
      noscriptImgs.forEach(img => {
        if (img.src) images.push({
          src: img.src,
          alt: img.alt || 'Gallery image'
        });
      });
    }
    
    return images;
  }
  
  // Build the gallery UI
  buildGallery() {
    // Clear container
    this.container.innerHTML = '';
    this.container.className = 'gallery-container';
    
    // Add title
    const title = document.createElement('h1');
    title.className = 'gallery-title';
    // Extract directory name from the current path
    const pathParts = window.location.pathname.split('/');
    const dirName = pathParts[pathParts.length - 2] || 'Gallery';
    // Convert to title case and replace hyphens/underscores/percent20 with spaces
    title.textContent = decodeURIComponent(dirName).replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    this.container.appendChild(title);
    
    // Create wheel container
    this.wheelContainer = document.createElement('div');
    this.wheelContainer.className = 'wheel-container';
    this.container.appendChild(this.wheelContainer);
    
    // Create thumbnail wheel
    this.thumbnailWheel = document.createElement('div');
    this.thumbnailWheel.className = 'thumbnail-wheel';
    this.thumbnailWheel.dataset.hasScattered = 'false';
    this.wheelContainer.appendChild(this.thumbnailWheel);
    
    // Create thumbnails and position them in a circle
    this.thumbnails = [];
    
    for (let i = 0; i < this.config.numThumbnails; i++) {
      const imageIndex = i % this.imagePaths.length;
      const imageData = this.imagePaths[imageIndex];
      
      const thumbnail = document.createElement('div');
      thumbnail.className = 'thumbnail';
      thumbnail.dataset.index = imageIndex;
      
      const img = document.createElement('img');
      img.src = imageData.src;
      img.alt = imageData.alt;
      img.loading = 'lazy';
      
      thumbnail.appendChild(img);
      this.thumbnailWheel.appendChild(thumbnail);
      this.thumbnails.push(thumbnail);
    }
    
    // Update thumbnail click/touch handler
    this.thumbnails.forEach((thumbnail, i) => {
        // Track touch state
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchMove = false;

        // Touch start handler
        thumbnail.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isTouchMove = false;
        }, { passive: false });

        // Touch move handler
        thumbnail.addEventListener('touchmove', (e) => {
            if (Math.abs(e.touches[0].clientX - touchStartX) > 5 ||
                Math.abs(e.touches[0].clientY - touchStartY) > 5) {
                isTouchMove = true;
            }
        });

        // Touch end handler
        thumbnail.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!isTouchMove && !this.isAnimating) {
                this.userInteracted = true;
                const imageIndex = parseInt(thumbnail.dataset.index);
                this.triggerScatterEffect(imageIndex);
            }
        });

        // Keep click handler for desktop
        thumbnail.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Prevent rapid clicks
            if (this.isAnimating) return;

            this.userInteracted = true;
            const imageIndex = parseInt(thumbnail.dataset.index);
            this.triggerScatterEffect(imageIndex);
        });
    });

    // Create fullscreen view
    this.fullscreenView = document.createElement('div');
    this.fullscreenView.className = 'fullscreen-view';
    this.container.appendChild(this.fullscreenView);
    
    // Create fullscreen image container
    this.fullscreenImage = document.createElement('div');
    this.fullscreenImage.className = 'fullscreen-image';
    this.fullscreenView.appendChild(this.fullscreenImage);
    
    // Add click handler to close fullscreen when clicking the fullscreen image
    this.fullscreenImage.addEventListener('click', (e) => {
      this.closeFullscreenImage();
      e.stopPropagation();
    });
    
    // Add navigation buttons
    this.prevButton = document.createElement('button');
    this.prevButton.className = 'nav-button prev-button';
    this.prevButton.innerHTML = '&larr;';
    this.prevButton.addEventListener('click', (e) => {
      this.showPreviousImage();
      e.stopPropagation();
    });
    this.fullscreenView.appendChild(this.prevButton);
    
    this.nextButton = document.createElement('button');
    this.nextButton.className = 'nav-button next-button';
    this.nextButton.innerHTML = '&rarr;';
    this.nextButton.addEventListener('click', (e) => {
      this.showNextImage();
      e.stopPropagation();
    });
    this.fullscreenView.appendChild(this.nextButton);
    
    // Add close button
    this.closeButton = document.createElement('button');
    this.closeButton.className = 'close-button';
    this.closeButton.innerHTML = '&times;';
    this.closeButton.addEventListener('click', (e) => {
      this.closeFullscreenImage();
      e.stopPropagation();
    });
    this.fullscreenView.appendChild(this.closeButton);
  }
  
  // Set up event listeners for interaction
  setupEventListeners() {
    // First interaction triggers scatter effect
    this.wheelContainer.addEventListener('click', (e) => {
      if (!this.hasScattered && !this.isDragging) {
        this.userInteracted = true;
        this.triggerScatterEffect();
        e.preventDefault();
        // Still allow the click to be processed for image selection
        // after a small delay to let the scatter effect start
        return;
      }
    });
    
    // Mouse events for wheel rotation
    this.wheelContainer.addEventListener('mousedown', (e) => {
      if (!this.imageActive) {
        // Trigger scatter effect on first interaction if it hasn't happened yet
        if (!this.hasScattered) {
          this.userInteracted = true;
          this.triggerScatterEffect();
        }
        this.userInteracted = true;
        this.startDrag(e.clientX, e.clientY);
        e.preventDefault();
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.updateDrag(e.clientX, e.clientY);
        e.preventDefault();
      }
    });
    
    document.addEventListener('mouseup', () => {
      this.endDrag();
    });
    
    // Touch events for mobile
    this.wheelContainer.addEventListener('touchstart', (e) => {
      if (!this.imageActive && e.touches.length === 1) {
        // Trigger scatter effect on first interaction if it hasn't happened yet
        if (!this.hasScattered) {
          this.userInteracted = true;
          this.triggerScatterEffect();
        }
        this.userInteracted = true;
        this.touchStarted = true;
        this.startDrag(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.updateDrag(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
      this.touchStarted = false;
      this.endDrag();
    });
    
    // Keyboard navigation when in fullscreen mode
    document.addEventListener('keydown', (e) => {
      if (this.imageActive) {
        if (e.key === 'Escape') {
          this.closeFullscreenImage();
        } else if (e.key === 'ArrowLeft') {
          this.showPreviousImage();
        } else if (e.key === 'ArrowRight') {
          this.showNextImage();
        }
      }
    });
    
    // Window resize handling
    window.addEventListener('resize', () => {
      this.updateThumbnailPositions();
    });
  }
  
  // Start dragging the wheel
  startDrag(x, y) {
    // Clear any pending click timeout
    if (this._clickTimeout) {
        clearTimeout(this._clickTimeout);
    }
    this.userInteracted = true;
    this.isDragging = true;
    this.dragStartX = x;
    this.dragStartY = y;
    this.lastDragX = x;
    this.lastDragY = y;
    // Stop ambient motion and spring animation when user interacts
    this.stopAmbientMotion();
    this.rotationSpring.stop();
  }
  
  // Update during drag
  updateDrag(x, y) {
    if (!this.isDragging) return;
    
    // Calculate the drag distance and direction
    const deltaX = x - this.lastDragX;
    const deltaY = this.lastDragY - y; // Reversed to make dragging feel more natural
    
    // The wheel's center is the origin point for rotation calculation
    const wheelRect = this.wheelContainer.getBoundingClientRect();
    const wheelCenterX = wheelRect.left + wheelRect.width / 2;
    const wheelCenterY = wheelRect.top + wheelRect.height / 2;
    
    // Calculate vectors from center to previous and current positions
    const prevVectorX = this.lastDragX - wheelCenterX;
    const prevVectorY = this.lastDragY - wheelCenterY;
    const currVectorX = x - wheelCenterX;
    const currVectorY = y - wheelCenterY;
    
    // Calculate the angle between these vectors (rotational change)
    const angle = Math.atan2(
      prevVectorX * currVectorY - prevVectorY * currVectorX,
      prevVectorX * currVectorX + prevVectorY * currVectorY
    );
    
    // Convert to degrees and add rotational sensitivity
    const rotationChange = (angle * 180 / Math.PI) * this.config.rotationSensitivity;
    
    // Update rotation - direct update during drag for responsiveness
    this.wheelRotation += rotationChange;
    this.updateWheelTransform();
    
    // Save the current position for the next update
    this.lastDragX = x;
    this.lastDragY = y;
  }
  
  // End drag interaction
  endDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Calculate final velocity based on last few movements
    // Here we could implement more sophisticated velocity calculation
    const dragVelocity = (this.lastDragX - this.dragStartX) * 0.1;
    
    // Set the target as current position (let the spring settle where it is)
    // but add an impulse based on the final velocity
    this.rotationSpring.setTarget(this.wheelRotation);
    this.rotationSpring.addImpulse(dragVelocity);
    
    // Resume ambient motion after a delay
    setTimeout(() => {
      if (!this.isDragging && !this.imageActive) {
        this.startAmbientMotion();
      }
    }, 2000);
  }
  
  // Position thumbnails in a circle
  updateThumbnailPositions() {
    const angleStep = (2 * Math.PI) / this.thumbnails.length;

    this.thumbnails.forEach((thumbnail, i) => {
      const angle = i * angleStep;

      // Store the original circular position for each thumbnail
      if (!thumbnail.dataset.originalAngle) {
        thumbnail.dataset.originalAngle = angle.toString();
        thumbnail.dataset.index = i.toString();
      }

      // Lay out thumbnails in a visible circular arc centered in the gallery
      const radius = 300; // circle radius in pixels
      const centerX = 0;
      const centerY = 0;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      thumbnail.style.position = 'absolute';
      thumbnail.style.left = `50%`;
      thumbnail.style.top = `50%`;
      thumbnail.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle}rad)`;

      // Prepare scatter positions array (will be used later in scatter effect)
      if (this.scatterPositions.length < this.thumbnails.length) {
        this.scatterPositions.push({
          originalAngle: angle,
          scatterAngle: null,
          scatterDistance: null,
          rotation: null
        });
      }
    });
  }
  
  // Update the wheel's rotation transform
  updateWheelTransform() {
    if (this.thumbnailWheel) {
      // Only apply the wheel rotation if we haven't scattered yet
      if (!this.hasScattered) {
        this.thumbnailWheel.style.transform = `rotate(${this.wheelRotation}deg)`;
      } else {
        // After scattering, we don't rotate the entire wheel anymore
        this.thumbnailWheel.style.transform = '';
      }
    }
  }
  
  // Scatter Effect: Snake-following behavior after scatter
  triggerScatterEffect(selectedIndex = 0) {
    if (this.isAnimating) return;
    this.userInteracted = true;
    this.isAnimating = true;
    this.hasScattered = true;

    // Store the index of the selected thumbnail (if any)
    const openIndex = selectedIndex;

    // Start the snake animation
    this.startSnakeAnimation();

    // After animation begins, trigger fullscreen image if a thumbnail was selected
    if (openIndex !== undefined) {
      setTimeout(() => {
        this.openFullscreenImage(openIndex);
      }, 600); // Delay to let animation begin
    }
    // Removed timeout that ended animation after 8 seconds
  }

  // Start or resume the snake-following animation (organic wandering head)
  startSnakeAnimation() {
    if (this.snakeAnimationActive) return;
    this.snakeAnimationActive = true;
    this.isAnimating = true;

    const thumbnails = this.thumbnails;
    const leadHistory = [];
    let head = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let velocity = { x: 2, y: 1.5 };

    const speedLimit = 3;
    const turnRate = 0.15;

    const animateSnake = () => {
      if (!this.snakeAnimationActive) {
        this.isAnimating = false;
        return;
      }

      // Randomly adjust velocity slightly
      velocity.x += (Math.random() - 0.5) * turnRate;
      velocity.y += (Math.random() - 0.5) * turnRate;

      // Clamp velocity
      const mag = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      if (mag > speedLimit) {
        velocity.x = (velocity.x / mag) * speedLimit;
        velocity.y = (velocity.y / mag) * speedLimit;
      }

      // Move head
      head.x += velocity.x;
      head.y += velocity.y;

      // Reflect off walls
      if (head.x < 0 || head.x > window.innerWidth) velocity.x *= -1;
      if (head.y < 0 || head.y > window.innerHeight) velocity.y *= -1;

      // Record head position
      leadHistory.unshift({ x: head.x, y: head.y });
      const maxHistory = thumbnails.length * 40;
      if (leadHistory.length > maxHistory) {
        leadHistory.pop();
      }

      thumbnails.forEach((thumb, index) => {
        const historyIndex = index * 50;
        const pos = leadHistory[historyIndex] || head;
        thumb.style.position = 'fixed';
        thumb.style.left = `${pos.x}px`;
        thumb.style.top = `${pos.y}px`;
        thumb.style.transform = `translate(-50%, -50%) scale(1)`;
      });

      requestAnimationFrame(animateSnake);
    };

    animateSnake();
  }
  
  // Create subtle ambient motion
  startAmbientMotion() {
    // Only start if not already moving, no image is active, and no user interaction
    if (this.ambientInterval || this.imageActive || this.userInteracted) return;

    this.ambientInterval = setInterval(() => {
      if (!this.isDragging && !this.rotationSpring.isActive && !this.imageActive && !this.userInteracted) {
        this.wheelRotation += 0.2; // small rotation step
        this.updateWheelTransform();
      }
    }, 50); // 20 frames per second
  }
  
  // Stop ambient motion
  stopAmbientMotion() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
  
  // Open a fullscreen image
  openFullscreenImage(imageIndex) {
    // Reset animation state first
    this.isAnimating = false;

    // Mark image as active to prevent wheel interaction
    this.imageActive = true;
    this.currentImageIndex = imageIndex;
    
    // Add active class to wheel to trigger blur and scale transitions
    this.wheelContainer.classList.add('image-active');
    
    // Create image and add to fullscreen view
    const imageData = this.imagePaths[imageIndex];
    this.fullscreenImage.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = imageData.src;
    img.alt = imageData.alt;
    this.fullscreenImage.appendChild(img);
    
    // Show fullscreen view
    this.fullscreenView.classList.add('active');
    
    // Stop ambient motion while viewing image
    this.stopAmbientMotion();
    
    // Reset animation flag to allow further clicks after fullscreen opens
    this.isAnimating = false;
    
    // Make the selected thumbnail pulse briefly to show which one was selected
    if (this.hasScattered) {
      // Find the thumbnail with this index
      const selectedThumbnail = [...this.thumbnails].find(thumb => 
        parseInt(thumb.dataset.index) === imageIndex);
      
      if (selectedThumbnail) {
        // Add a brief highlight pulse
        selectedThumbnail.classList.add('selected');
        
        // Remove it after animation completes
        setTimeout(() => {
          selectedThumbnail.classList.remove('selected');
        }, 1000);
      }
    }
  }
  
  // Close fullscreen image
  closeFullscreenImage() {
    this.imageActive = false;
    
    // Hide fullscreen view
    this.fullscreenView.classList.remove('active');
    
    // Remove active class from wheel to revert blur and scale
    this.wheelContainer.classList.remove('image-active');

    // Find the last viewed thumbnail
    const lastViewedThumb = this.thumbnails.find(t => 
        parseInt(t.dataset.index) === this.currentImageIndex
    );

    if (lastViewedThumb && this.hasScattered) {
        // Get current bounds
        const margin = 150;
        const bounds = {
            left: margin,
            right: window.innerWidth - margin,
            top: margin,
            bottom: window.innerHeight - margin
        };

        // Position at bottom center with animation
        lastViewedThumb.style.transition = 'all 0.5s ease-out';
        lastViewedThumb.style.position = 'fixed';
        lastViewedThumb.style.left = `${window.innerWidth / 2}px`;
        lastViewedThumb.style.top = `${bounds.bottom}px`;
        lastViewedThumb.style.transform = 'translate(-50%, -50%) rotate(0deg)';
        lastViewedThumb.style.zIndex = '1';

        // Clear transition after animation
        setTimeout(() => {
            lastViewedThumb.style.transition = '';
            lastViewedThumb.style.zIndex = '';
        }, 500);
    }

    // Resume snake animation if scattered
    if (this.hasScattered) {
        // Resume the snake-following animation
        this.startSnakeAnimation();
    } else {
        // Don't resume ambient motion if scattered
        setTimeout(() => {
            if (!this.isDragging && !this.imageActive) {
                this.startAmbientMotion();
            }
        }, 1000);
    }
  }
  
  // Show the next image in fullscreen mode
  showNextImage() {
    if (!this.imageActive) return;
    
    this.currentImageIndex = (this.currentImageIndex + 1) % this.imagePaths.length;
    const imageData = this.imagePaths[this.currentImageIndex];
    
    // Update the image with animation
    this.fullscreenImage.style.transform = 'scale(0.95) rotateY(-10deg)';
    
    setTimeout(() => {
      const img = this.fullscreenImage.querySelector('img');
      img.src = imageData.src;
      img.alt = imageData.alt;
      this.fullscreenImage.style.transform = 'scale(1) rotateY(0deg)';
    }, 300);
  }
  
  // Show the previous image in fullscreen mode
  showPreviousImage() {
    if (!this.imageActive) return;
    
    this.currentImageIndex = (this.currentImageIndex - 1 + this.imagePaths.length) % this.imagePaths.length;
    const imageData = this.imagePaths[this.currentImageIndex];
    
    // Update the image with animation
    this.fullscreenImage.style.transform = 'scale(0.95) rotateY(10deg)';
    
    setTimeout(() => {
      const img = this.fullscreenImage.querySelector('img');
      img.src = imageData.src;
      img.alt = imageData.alt;
      this.fullscreenImage.style.transform = 'scale(1) rotateY(0deg)';
    }, 300);
  }
  
  // Destroy the gallery and clean up
  destroy() {
    this.stopAmbientMotion();
    this.rotationSpring.stop();
    
    // Remove event listeners (simplified here, would need to match exact functions)
    document.removeEventListener('mousemove', this.updateDrag);
    document.removeEventListener('mouseup', this.endDrag);
    document.removeEventListener('touchmove', this.updateDrag);
    document.removeEventListener('touchend', this.endDrag);
    
    // Clear the container
    this.container.innerHTML = '';
  }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create the circular gallery
  const gallery = new CircularGallery('juicebox-container', {
    numThumbnails: 24,              // Display 24 thumbnails in the wheel
    rotationSensitivity: 1,       // Wheel rotation sensitivity
    ambientMovement: 1.8,           // Subtle ambient movement
    initialRotation: 15,            // Start with a slight rotation
    scatterRadius: Math.max(window.innerWidth, window.innerHeight) * 0.35, // Responsive scatter distance
    scatterRotation: 45,            // More dramatic rotation for scattered thumbnails
    scatterDuration: 2.2,           // Longer duration for more dramatic effect
    scatterJitter: 0.5              // More randomness in scatter positioning
  });
  
  // Make gallery accessible globally for debugging
  window.circularGallery = gallery;
  
  // Add a resize handler to maintain scattered positions
  window.addEventListener('resize', () => {
    // If we have scattered thumbnails, we might want to adjust their positions
    // for the new viewport size, but for now we'll leave them as is
    // since dramatic resizing is less common during normal use
  });
});

// Defensive patch for runtime error: Add checks for getBoundingClientRect
(function() {
  // Find the container and thumbnails
  const container = document.getElementById('juicebox-container');
  if (!container) return;
  const thumbnails = container.querySelectorAll('.thumbnail');
  if (thumbnails.length === 0) return;
  if (!container.getBoundingClientRect) {
    console.error("Container does not support getBoundingClientRect");
    return;
  }

  // Patch physicsStep to safely access getBoundingClientRect
  if (window.CircularGallery && CircularGallery.prototype.physicsStep) {
    const origPhysicsStep = CircularGallery.prototype.physicsStep;
    CircularGallery.prototype.physicsStep = function() {
      // Defensive getBoundingClientRect usage
      const rect = this.container.getBoundingClientRect?.();
      if (!rect) return;
      // ...rest of original function, but replace all uses of getBoundingClientRect with rect
      return origPhysicsStep.apply(this, arguments);
    };
  }

  // Patch scatterThumbnails to safely access getBoundingClientRect
  if (window.CircularGallery && CircularGallery.prototype.scatterThumbnails) {
    const origScatterThumbnails = CircularGallery.prototype.scatterThumbnails;
    CircularGallery.prototype.scatterThumbnails = function() {
      const rect = this.container.getBoundingClientRect?.();
      if (!rect) {
        console.error("Failed to get container bounds during scatter.");
        return;
      }
      return origScatterThumbnails.apply(this, arguments);
    };
  }
})();