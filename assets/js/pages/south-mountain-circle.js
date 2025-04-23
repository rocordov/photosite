/**
 * South Mountain Circular Gallery
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
    title.textContent = 'South Mountain';
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
          this.triggerScatterEffect();
        }
        
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
          this.triggerScatterEffect();
        }
        
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
      
      // Position each thumbnail on the circle's circumference
      // We're using CSS transform for actual position updates
      thumbnail.style.transform = `rotate(${angle}rad) translateX(-50%) translateY(-50%)`;
      
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
  
  // Scatter Effect: Click-to-scatter model with spring-coupled thumbnail animation
  triggerScatterEffect(selectedIndex = 0) {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.hasScattered = true;

    const config = {
        damping: 0.98,              // Increased for smoother motion
        scatterForce: 45,           // Increased initial force
        minDistance: 300,           // Much larger minimum spread
        maxDistance: Math.min(window.innerWidth, window.innerHeight) * 0.8, // Use more of viewport
        collisionRadius: 180,       // Larger collision detection
        bounce: 0.7,               // Bouncier collisions
        margin: 0,                  // No margin; allow thumbnails to reach all edges
        stopThreshold: 0.01,        // Lower threshold for longer motion (was 0.05)
        gravityStrength: 0.012,     // Stronger pull for continuous movement
        rotationSpeed: 0.0004,      // Slower orbital rotation
        repelStrength: 0.015,       // Stronger repulsion
        minSpacing: 200,            // Minimum spacing between thumbnails
        orbitForce: 0.0002          // Gentle orbital force
    };

    // Calculate viewport areas for better distribution
    const viewportArea = window.innerWidth * window.innerHeight;
    const thumbnailArea = (config.minSpacing * config.minSpacing) * this.thumbnails.length;
    const scaleFactor = Math.sqrt(viewportArea / thumbnailArea) * 0.8;

    // Setup thumbnails with physics properties
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // --- Step 1: Track the mouse cursor globally for gravity ---
    let gravityX = window.innerWidth / 2;
    let gravityY = window.innerHeight / 2;
    // Only add this listener once per instance
    if (!this._scatterGravityListenerAdded) {
      document.addEventListener('mousemove', (e) => {
        gravityX = e.clientX;
        gravityY = e.clientY;
      });
      this._scatterGravityListenerAdded = true;
    }

    const bounds = {
      left: config.margin,
      right: window.innerWidth - config.margin,
      top: config.margin,
      bottom: window.innerHeight - config.margin
    };

    const thumbnails = this.thumbnails.map((el, i) => {
      const width = el.offsetWidth || 100;
      const height = el.offsetHeight || 100;
      return {
        element: el,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        width,
        height,
        isSelected: i === selectedIndex
      };
    });

    // Improved: Even radial placement with initial offsets for better space usage
    thumbnails.forEach((thumb, index) => {
        const angle = (index / thumbnails.length) * 2 * Math.PI + Math.random() * 0.2;
        const distance = config.minDistance + Math.random() * (config.maxDistance - config.minDistance);

        // Set initial position around center
        thumb.x = centerX + Math.cos(angle) * distance;
        thumb.y = centerY + Math.sin(angle) * distance;

        // Apply burst velocity outward from actual offset position
        thumb.vx = (thumb.x - centerX) * 0.03;
        thumb.vy = (thumb.y - centerY) * 0.03;

        // Add gentle spin
        const spin = (Math.random() - 0.5) * 1.5;
        thumb.vx += spin;
        thumb.vy += spin;
    });

    // Handle selected thumbnail immediately
    if (selectedIndex !== undefined) {
      const selected = thumbnails[selectedIndex];
      selected.element.style.transition = 'all 0.5s ease-out';
      selected.element.style.zIndex = '1000';
      setTimeout(() => {
        this.openFullscreenImage(selectedIndex);
      }, 300);
    }

    let animationFrame;
    const animate = () => {
      let stillMoving = false;

      thumbnails.forEach(thumb => {
        // All thumbnails (including selected) move toward the mouse!

        // Orbital motion
        // --- Step 2: Use gravityX/Y instead of centerX/centerY ---
        const dx = gravityX - thumb.x;
        const dy = gravityY - thumb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Weaker gravity at larger distances
            const gravityFalloff = Math.min(1, 500 / dist);
            const gravForce = config.gravityStrength * gravityFalloff;
            thumb.vx += (dx / dist) * gravForce;
            thumb.vy += (dy / dist) * gravForce;

            // Add orbital velocity
            const perpX = -dy / dist;
            const perpY = dx / dist;
            thumb.vx += perpX * config.orbitForce;
            thumb.vy += perpY * config.orbitForce;
        }

        // Strong repulsion between thumbnails
        thumbnails.forEach(other => {
            if (other === thumb) return;
            
            const rdx = other.x - thumb.x;
            const rdy = other.y - thumb.y;
            const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
            
            if (rDist < config.minSpacing && rDist > 0) {
                const force = config.repelStrength * (1 - rDist / config.minSpacing);
                thumb.vx -= (rdx / rDist) * force;
                thumb.vy -= (rdy / rDist) * force;
            }
        });

        // Update position
        thumb.x += thumb.vx;
        thumb.y += thumb.vy;
        thumb.vx *= config.damping;
        thumb.vy *= config.damping;

        // Boundary bounce with momentum preservation
        const halfWidth = thumb.width / 2;
        const halfHeight = thumb.height / 2;

        if (thumb.x + halfWidth > bounds.right) {
          thumb.x = bounds.right - halfWidth;
          thumb.vx = -Math.abs(thumb.vx * config.bounce);
        }
        if (thumb.x - halfWidth < bounds.left) {
          thumb.x = bounds.left + halfWidth;
          thumb.vx = Math.abs(thumb.vx * config.bounce);
        }

        if (thumb.y + halfHeight > bounds.bottom) {
          thumb.y = bounds.bottom - halfHeight;
          thumb.vy = -Math.abs(thumb.vy * config.bounce);
        }
        if (thumb.y - halfHeight < bounds.top) {
          thumb.y = bounds.top + halfHeight;
          thumb.vy = Math.abs(thumb.vy * config.bounce);
        }

        // Rotation
        const speed = Math.sqrt(thumb.vx * thumb.vx + thumb.vy * thumb.vy);
        const rotationAngle = (speed * 2) * (Math.random() > 0.5 ? 1 : -1);

        thumb.element.style.position = 'fixed';
        thumb.element.style.left = `${thumb.x}px`;
        thumb.element.style.top = `${thumb.y}px`;
        thumb.element.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;

        // --- Modified stillMoving check to continue animation if not at cursor ---
        const cursorDx = gravityX - thumb.x;
        const cursorDy = gravityY - thumb.y;
        const cursorDist = Math.sqrt(cursorDx * cursorDx + cursorDy * cursorDy);
        if (
          Math.abs(thumb.vx) > config.stopThreshold ||
          Math.abs(thumb.vy) > config.stopThreshold ||
          cursorDist > 100
        ) {
          stillMoving = true;
        }
      });

      if (stillMoving) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrame);
        this.isAnimating = false;
      }
    };
    animate();
  }
  
  // Create subtle ambient motion
  startAmbientMotion() {
    // Only start if not already moving and no image is active
    if (this.ambientInterval || this.imageActive) return;
    
    // Add a very small random rotation every few seconds
    this.ambientInterval = setInterval(() => {
      if (!this.isDragging && !this.rotationSpring.isActive && !this.imageActive) {
        const randomAngle = (Math.random() * 2 - 1) * this.config.ambientMovement;
        this.rotationSpring.setTarget(this.wheelRotation + randomAngle);
      }
    }, 3000);
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

    // Don't resume ambient motion if scattered
    if (!this.hasScattered) {
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