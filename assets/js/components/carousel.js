/**
 * Carousel Component
 * Reusable carousel functionality for gallery pages
 */

/**
 * Initialize a carousel with configuration
 * @param {string} containerId - ID of the container element
 * @param {Array} images - Array of image objects with src, title, and description
 * @param {Object} options - Configuration options for the carousel
 */
export function initCarousel(containerId, images, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Carousel container with ID "${containerId}" not found`);
    return;
  }

  // Set default options
  const config = {
    autoplay: true,
    autoplaySpeed: 5000,
    showLines: true,
    randomizeOption: true,
    ...options
  };

  let currentIndex = 0;
  let slides = [];
  let isRandom = false;
  let timeout;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let moveX = 0;
  let moveY = 0;
  const dragThreshold = 50; // Minimum drag distance to trigger slide change

  // Create carousel slides
  function createCarousel() {
    // Get the carousel wrapper
    const carousel = container.querySelector('.carousel-wrapper');
    if (!carousel) {
      console.error('Carousel wrapper not found inside the container');
      return;
    }

    carousel.innerHTML = '';
    
    images.forEach((image, index) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.innerHTML = `<img src="${image.src}" alt="${image.title || ''}">`;
      slide.dataset.index = index;
      
      carousel.appendChild(slide);
      slides.push(slide);
    });
    
    // Set initial slide positions
    updateSlides();
    
    // Draw connecting lines if enabled
    if (config.showLines) {
      drawLines();
    }
  }
  
  // Update slide positions and classes
  function updateSlides() {
    slides.forEach((slide) => {
      const slideIndex = parseInt(slide.dataset.index);
      
      // Remove all classes
      slide.classList.remove('active', 'prev', 'next');
      
      // Add appropriate class based on position
      if (slideIndex === currentIndex) {
        slide.classList.add('active');
      } else if ((slideIndex === currentIndex - 1) || 
                (currentIndex === 0 && slideIndex === slides.length - 1)) {
        slide.classList.add('prev');
      } else if ((slideIndex === currentIndex + 1) || 
                (currentIndex === slides.length - 1 && slideIndex === 0)) {
        slide.classList.add('next');
      }
    });
    
    // Update connecting lines if enabled
    if (config.showLines) {
      drawLines();
    }
  }
  
  // Draw connecting lines between images
  function drawLines() {
    const linesContainer = container.querySelector('.connecting-lines svg');
    if (!linesContainer) return;

    linesContainer.innerHTML = '';
    
    const activeSlide = container.querySelector('.carousel-slide.active');
    const prevSlide = container.querySelector('.carousel-slide.prev');
    const nextSlide = container.querySelector('.carousel-slide.next');
    
    if (!activeSlide) return;
    
    const activeRect = activeSlide.getBoundingClientRect();
    const activeX = activeRect.x + activeRect.width / 2;
    const activeY = activeRect.y + activeRect.height / 2;
    
    if (prevSlide) {
      const prevRect = prevSlide.getBoundingClientRect();
      const prevX = prevRect.x + prevRect.width / 2;
      const prevY = prevRect.y + prevRect.height / 2;
      
      drawLine(linesContainer, prevX, prevY, activeX, activeY);
    }
    
    if (nextSlide) {
      const nextRect = nextSlide.getBoundingClientRect();
      const nextX = nextRect.x + nextRect.width / 2;
      const nextY = nextRect.y + nextRect.height / 2;
      
      drawLine(linesContainer, activeX, activeY, nextX, nextY);
    }
  }
  
  // Helper function to draw SVG line
  function drawLine(linesContainer, x1, y1, x2, y2) {
    // Convert to SVG coordinate space
    const rect = linesContainer.getBoundingClientRect();
    x1 -= rect.x;
    y1 -= rect.y;
    x2 -= rect.x;
    y2 -= rect.y;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    
    linesContainer.appendChild(line);
  }
  
  // Go to next slide
  function nextSlide() {
    if (isRandom) {
      // Random mode: go to a random slide that's not the current one
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * slides.length);
      } while (newIndex === currentIndex && slides.length > 1);
      
      currentIndex = newIndex;
    } else {
      // Linear mode: go to next slide
      currentIndex = (currentIndex + 1) % slides.length;
    }
    
    updateSlides();
    resetAutoplay();
  }
  
  // Go to previous slide
  function prevSlide() {
    if (isRandom) {
      // Random mode: go to a random slide that's not the current one
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * slides.length);
      } while (newIndex === currentIndex && slides.length > 1);
      
      currentIndex = newIndex;
    } else {
      // Linear mode: go to previous slide
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    }
    
    updateSlides();
    resetAutoplay();
  }
  
  // Set up autoplay
  function startAutoplay() {
    if (!config.autoplay) return;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      nextSlide();
    }, config.autoplaySpeed);
  }
  
  // Reset autoplay timer
  function resetAutoplay() {
    clearTimeout(timeout);
    startAutoplay();
  }
  
  // Initialize drag support for touch and mouse
  function initDragSupport() {
    // Get the carousel wrapper
    const carousel = container.querySelector('.carousel-wrapper');
    if (!carousel) return;

    // Touch events
    carousel.addEventListener('touchstart', handleDragStart, { passive: true });
    carousel.addEventListener('touchmove', handleDrag, { passive: true });
    carousel.addEventListener('touchend', handleDragEnd);
    
    // Mouse events
    carousel.addEventListener('mousedown', handleDragStart);
    carousel.addEventListener('mousemove', handleDrag);
    carousel.addEventListener('mouseup', handleDragEnd);
    carousel.addEventListener('mouseleave', handleDragEnd);
    
    function handleDragStart(e) {
      isDragging = true;
      const point = e.touches ? e.touches[0] : e;
      startX = point.clientX;
      startY = point.clientY;
      moveX = 0;
      moveY = 0;
      
      // Add dragging class for visual feedback
      carousel.classList.add('dragging');
    }
    
    function handleDrag(e) {
      if (!isDragging) return;
      
      const point = e.touches ? e.touches[0] : e;
      moveX = point.clientX - startX;
      moveY = point.clientY - startY;
      
      // Apply drag transform to active slide
      const activeSlide = container.querySelector('.carousel-slide.active');
      if (activeSlide) {
        activeSlide.style.transform = `scale(1.05) translateX(${moveX}px)`;
      }
    }
    
    function handleDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      
      // Remove dragging class
      carousel.classList.remove('dragging');
      
      // Reset active slide transform
      const activeSlide = container.querySelector('.carousel-slide.active');
      if (activeSlide) {
        activeSlide.style.transform = '';
      }
      
      // Check if drag distance exceeds threshold
      if (Math.abs(moveX) > dragThreshold) {
        if (moveX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      }
      
      // Reset values
      startX = 0;
      startY = 0;
      moveX = 0;
      moveY = 0;
    }
  }

  // Set up event handlers for mode switch if enabled
  function setupModeSwitch() {
    if (!config.randomizeOption) return;

    const modeSwitch = document.getElementById('mode-switch');
    if (!modeSwitch) return;

    const linearMode = document.querySelector('.mode-switch .linear');
    const randomMode = document.querySelector('.mode-switch .random');
    
    // Handle click on mode switch
    modeSwitch.addEventListener('click', function() {
      isRandom = !isRandom;
      
      if (isRandom) {
        modeSwitch.classList.add('random');
        linearMode.classList.remove('active');
        randomMode.classList.add('active');
      } else {
        modeSwitch.classList.remove('random');
        linearMode.classList.add('active');
        randomMode.classList.remove('active');
      }
      
      resetAutoplay();
    });
    
    // Click on linear/random text also toggles mode
    if (linearMode) {
      linearMode.addEventListener('click', function() {
        if (isRandom) {
          isRandom = false;
          modeSwitch.classList.remove('random');
          linearMode.classList.add('active');
          randomMode.classList.remove('active');
          resetAutoplay();
        }
      });
    }
    
    if (randomMode) {
      randomMode.addEventListener('click', function() {
        if (!isRandom) {
          isRandom = true;
          modeSwitch.classList.add('random');
          linearMode.classList.remove('active');
          randomMode.classList.add('active');
          resetAutoplay();
        }
      });
    }
  }

  // Setup keyboard navigation
  function setupKeyboardNav() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    });
  }

  // Initialize the carousel
  function initialize() {
    createCarousel();
    
    // Setup event handlers
    setupModeSwitch();
    setupKeyboardNav();
    initDragSupport();
    
    // Handle window resize
    window.addEventListener('resize', function() {
      if (config.showLines) {
        drawLines();
      }
    });
    
    // Click on prev/next slides to navigate
    container.addEventListener('click', function(e) {
      const carousel = container.querySelector('.carousel-wrapper');
      if (!carousel) return;

      const clickedSlide = e.target.closest('.carousel-slide');
      if (!clickedSlide) return;
      
      if (clickedSlide.classList.contains('prev')) {
        prevSlide();
      } else if (clickedSlide.classList.contains('next')) {
        nextSlide();
      }
    });
    
    // Start autoplay
    startAutoplay();
  }

  // Initialize the carousel
  initialize();

  // Return public methods and properties
  return {
    next: nextSlide,
    prev: prevSlide,
    goTo: function(index) {
      if (index >= 0 && index < slides.length) {
        currentIndex = index;
        updateSlides();
        resetAutoplay();
      }
    },
    getCurrentIndex: function() {
      return currentIndex;
    },
    updateLines: function() {
      if (config.showLines) {
        drawLines();
      }
    },
    refresh: function() {
      createCarousel();
    }
  };
}
