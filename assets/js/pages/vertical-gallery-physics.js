/**
 * Vertical Gallery - Spring Physics Animation
 * Enhanced slinky-like motion for a connected, springy gallery experience
 */

class SpringyGallery {
  constructor() {
    // Spring physics configuration - more pronounced for visual effect
    this.config = {
      // Extremely exaggerated spring values for dramatic slinky effect
      tension: 8,            // Very low tension makes springs extremely stretchy
      friction: 4,           // Lower friction allows for visible oscillation
      mass: 2.5,             // Higher mass increases inertia dramatically
      precision: 0.05,       // Lower precision allows more continuous movement
      maxDisplacement: 350,  // Allow very large displacement for dramatic effect
      historySize: 8,        // Track more scroll positions for smoother inertia
      velocityFactor: 1.2,   // Significantly amplify velocity impact
      delayOffset: 0.3,      // Large delay multiplier for exaggerated slinky effect
      rebound: true,         // Enable bounce-back effect
      staggerDelay: 0.12,    // Longer stagger delay between adjacent images
      rotationFactor: 0.03,  // More pronounced rotation effect
      scaleFactor: 0.05      // More pronounced scaling effect
    };

    // DOM elements and animation state
    this.images = [];
    this.scrollHistory = [];
    this.lastScrollY = window.scrollY;
    this.animating = false;
    this.imageData = [];
    this.lastTime = 0;
    this.ticking = false;

    // Initialize
    this.init();
  }

  init() {
    // Query and store image container elements
    this.images = Array.from(document.querySelectorAll('.image-container'));
    
    if (this.images.length === 0) {
      console.warn('No image containers found. SpringyGallery requires .image-container elements.');
      return;
    }
    
    // Initialize data for each image
    this.initializeImageData();
    
    // Cache initial positions and setup baseline state
    this.cachePositions();
    
    // Setup scroll listener and animation frame
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
    
    // Force initial application of spring simulation
    this.triggerAnimation();
    
    console.log('SpringyGallery initialized with', this.images.length, 'images');
  }
  
  initializeImageData() {
    // Create spring physics properties for each image with staggered parameters
    this.imageData = this.images.map((el, index) => {
      // Extract existing transform as baseline
      const style = window.getComputedStyle(el);
      const baseTransform = style.transform === 'none' ? '' : style.transform;
      
      // Calculate staggered spring settings for slinky effect
      // Vary tension and friction with index to create connected wave motion
      const uniqueTension = this.config.tension * (1 + Math.sin(index * 0.2) * 0.25);
      const uniqueFriction = this.config.friction * (1 + Math.cos(index * 0.3) * 0.3);
      const uniqueMass = this.config.mass * (1 + Math.sin(index * 0.15) * 0.2);
      
      // Create data structure for this image's physics
      return {
        element: el,
        index,
        baseTransform,
        // Physical properties
        tension: uniqueTension,
        friction: uniqueFriction,
        mass: uniqueMass,
        // State variables
        position: 0,
        targetPosition: 0,
        velocity: 0,
        acceleration: 0,
        // Element positioning
        baseY: 0,
        height: el.offsetHeight,
        // Delay factor - creates the slinky effect
        delay: index * this.config.staggerDelay,
        // Previous state for smooth transitions
        lastPosition: 0,
        // Initial display offset
        startingOffset: 0
      };
    });
  }
  
  cachePositions() {
    // Cache the positions of all images relative to document
    this.imageData.forEach(data => {
      const rect = data.element.getBoundingClientRect();
      data.baseY = rect.top + window.scrollY;
      data.height = rect.height;
    });
  }
  
  onScroll(event) {
    // Record scroll position with timestamp
    const now = performance.now();
    const scrollY = window.scrollY;
    
    // Calculate scroll velocity
    const scrollDelta = scrollY - this.lastScrollY;
    this.lastScrollY = scrollY;
    
    // Store scroll positions for momentum calculation
    this.scrollHistory.push({
      position: scrollY,
      time: now,
      delta: scrollDelta
    });
    
    // Keep history at fixed size
    if (this.scrollHistory.length > this.config.historySize) {
      this.scrollHistory.shift();
    }
    
    // Calculate weighted scroll velocity based on recent history
    const velocity = this.calculateScrollVelocity();
    
    // Update spring targets based on scroll velocity
    this.updateTargetPositions(velocity);
    
    // Ensure animation is running
    this.triggerAnimation();
  }
  
  calculateScrollVelocity() {
    // No history yet
    if (this.scrollHistory.length < 2) return 0;
    
    // Calculate weighted average of recent movement
    let totalWeight = 0;
    let weightedDelta = 0;
    
    // Newer entries have more influence
    this.scrollHistory.forEach((entry, i) => {
      const weight = (i + 1) / this.scrollHistory.length;
      weightedDelta += entry.delta * weight;
      totalWeight += weight;
    });
    
    // Normalize by weights and amplify by velocity factor
    return (weightedDelta / totalWeight) * this.config.velocityFactor;
  }
  
  updateTargetPositions(velocity) {
    // Process even tiny movements for continuous effect
    if (Math.abs(velocity) < 0.05) return;
    
    // Apply dramatically different target positions to each image
    // This creates the connected, slinky-like motion
    this.imageData.forEach((data, i) => {
      // Base displacement on velocity, but significantly amplified
      
      // Calculate a phase shift based on image position in the stack
      // This makes images move with dramatically different timing
      const phaseShift = i * this.config.delayOffset;
      
      // For stronger slinky effect, make the impact depend on image index
      // Earlier images react more quickly, later images lag behind dramatically
      const positionImpact = Math.max(0.2, 1 - (phaseShift * 1.5));
      
      // Apply some randomness to create more organic movement
      const randomFactor = 1 + ((Math.sin(i * 3.7) * 0.2));
      
      // Set target position with amplified values for dramatic effect
      data.targetPosition = velocity * positionImpact * randomFactor;
      
      // Add slight permanent offset to images based on their index
      // This creates a cascading effect even when still
      const permanentOffset = i % 2 === 0 ? 5 : -5;
      data.targetPosition += permanentOffset;
    });
  }
  
  triggerAnimation() {
    if (!this.ticking) {
      this.ticking = true;
      requestAnimationFrame(this.animate.bind(this));
    }
  }
  
  animate(timestamp) {
    // Calculate time delta in seconds (capped to avoid jumps after tab switches)
    const deltaTime = Math.min(0.064, this.lastTime ? (timestamp - this.lastTime) / 1000 : 0.016);
    this.lastTime = timestamp;
    
    let stillMoving = false;
    
    // Update spring physics for each image
    this.imageData.forEach(data => {
      // Apply spring physics equations
      this.updateElementPhysics(data, deltaTime);
      
      // Check if this element is still in motion
      if (Math.abs(data.velocity) > 0.1 || 
          Math.abs(data.position - data.targetPosition) > 0.1) {
        stillMoving = true;
      }
    });
    
    // Apply all visual changes at once to minimize layout thrashing
    this.applyVisualUpdates();
    
    // Continue animation if needed
    this.ticking = stillMoving;
    if (stillMoving) {
      requestAnimationFrame(this.animate.bind(this));
    }
  }
  
  updateElementPhysics(data, deltaTime) {
    // Skip simulation if element is off screen
    if (!data.element.isConnected) return;
    
    // Calculate spring force using Hooke's law: F = -kx
    // Where k = spring tension, x = displacement from target
    const displacement = data.position - data.targetPosition;
    const springForce = -data.tension * displacement;
    
    // Calculate damping force F = -cv
    // Where c = friction coefficient, v = velocity
    const dampingForce = -data.friction * data.velocity;
    
    // Sum forces
    const netForce = springForce + dampingForce;
    
    // Calculate acceleration: F = ma → a = F/m
    data.acceleration = netForce / data.mass;
    
    // Update velocity: v = v₀ + at
    data.velocity += data.acceleration * deltaTime;
    
    // Update position: x = x₀ + vt
    const newPosition = data.position + data.velocity * deltaTime;
    
    // Store previous position for interpolation
    data.lastPosition = data.position;
    
    // Update current position
    data.position = newPosition;
    
    // Apply rebound if enabled and moving past target significantly
    if (this.config.rebound) {
      // Detect if we've moved past the target
      if ((data.lastPosition < data.targetPosition && data.position > data.targetPosition) ||
          (data.lastPosition > data.targetPosition && data.position < data.targetPosition)) {
        // Add a slight boost to velocity for more springy effect
        data.velocity *= 1.05;
      }
    }
  }
  
  applyVisualUpdates() {
    // Apply all transform updates in batch to avoid layout thrashing
    this.imageData.forEach(data => {
      const { element, position, baseTransform } = data;
      
      // Apply transform with hardware acceleration
      // Combine the spring offset with the original transform
      let transform = `${baseTransform} translateY(${position}px) translateZ(0)`;
      
      // Apply more dramatic rotation based on velocity for organic movement
      const rotation = Math.min(3, Math.max(-3, data.velocity * this.config.rotationFactor));
      transform += ` rotate(${rotation}deg)`;
      
      // More pronounced scale change based on velocity and distance from target
      const distanceRatio = Math.min(1, Math.abs(data.position - data.targetPosition) / 50);
      const velocityImpact = Math.min(0.1, Math.abs(data.velocity) / 100);
      const scale = 1 + (distanceRatio * this.config.scaleFactor) + velocityImpact;
      transform += ` scale(${scale})`;
      
      // Add subtle skew for more dynamic movement
      const skew = Math.min(1, Math.max(-1, data.velocity * 0.005));
      transform += ` skewY(${skew}deg)`;
      
      // Apply all transforms at once
      element.style.transform = transform;
      
      // Apply subtle opacity changes based on movement
      const baseOpacity = 0.85;
      const opacityBoost = Math.min(0.15, Math.abs(data.velocity) / 200);
      element.style.opacity = baseOpacity + opacityBoost;
      
      // If this is the element with the highest velocity, highlight it more
      if (Math.abs(data.velocity) > 15) {
        element.style.opacity = 1;
        element.style.zIndex = 20; // Bring to front temporarily
      } else {
        element.style.zIndex = ''; // Reset
      }
    });
  }
  
  onResize() {
    // Update element positions on resize
    this.cachePositions();
    
    // Ensure animation runs after resize
    this.triggerAnimation();
  }
  
  // Public method to manually trigger animation
  forceAnimation() {
    // Create a dramatic slinky-like wave through all images
    this.imageData.forEach((data, index) => {
      // Staggered impulse creates wave-like motion
      const delay = index * 30; // milliseconds of delay
      
      setTimeout(() => {
        // Wave-like pattern of velocities
        const direction = index % 3 === 0 ? 1 : -1;
        const amplitude = 120 + (Math.random() * 80);
        data.velocity += direction * amplitude;
        
        // Make sure animation is running
        this.triggerAnimation();
      }, delay);
    });
  }
  
  // Clean up event listeners
  destroy() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    
    // Reset transforms
    this.imageData.forEach(data => {
      data.element.style.transform = data.baseTransform;
    });
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Create and store the gallery instance
  window.springyGallery = new SpringyGallery();
  
  // Add debugger/demo function to window
  window.bounceGallery = () => window.springyGallery.forceAnimation();
});
