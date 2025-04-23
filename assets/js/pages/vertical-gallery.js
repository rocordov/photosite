/**
 * Vertical Gallery - JavaScript functionality
 * Optimized for performance with overlapping image layout
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const imageContainers = document.querySelectorAll('.image-container');
  const thumbnails = document.querySelectorAll('.thumbnail');
  
  // Track the currently focused image
  let currentFocusedIndex = -1;
  
  // Use a more efficient Intersection Observer configuration
  const observerOptions = {
    root: null, // viewport
    rootMargin: '-20% 0px -20% 0px', // margin around the viewport
    threshold: [0.5] // Simplified threshold - better performance
  };
  
  // Create observer instance with optimized callbacks
  const imageObserver = new IntersectionObserver((entries) => {
    // Use requestAnimationFrame to optimize visual updates
    requestAnimationFrame(() => {
      // Keep track of the most visible image
      let maxVisibility = 0;
      let mostVisibleIndex = -1;
      
      // Process all entries to find the most visible one
      entries.forEach(entry => {
        const container = entry.target;
        const index = parseInt(container.dataset.index);
        
        if (entry.isIntersecting) {
          const visibilityRatio = entry.intersectionRatio;
          
          if (visibilityRatio > maxVisibility) {
            maxVisibility = visibilityRatio;
            mostVisibleIndex = index;
          }
        }
      });
      
      // Only update the DOM if the most visible image has changed
      if (mostVisibleIndex >= 0 && mostVisibleIndex !== currentFocusedIndex) {
        // Remove focus from previously focused image
        if (currentFocusedIndex >= 0) {
          const prevFocused = document.querySelector(`.image-container[data-index="${currentFocusedIndex}"]`);
          if (prevFocused) {
            prevFocused.classList.remove('in-focus');
          }
        }
        
        // Set focus on the new most visible image
        const newFocused = document.querySelector(`.image-container[data-index="${mostVisibleIndex}"]`);
        if (newFocused) {
          newFocused.classList.add('in-focus');
        }
        
        // Update thumbnails
        updateActiveThumbnail(mostVisibleIndex);
        
        // Update the current focused index
        currentFocusedIndex = mostVisibleIndex;
      }
    });
  }, observerOptions);
  
  // Initialize observer for all image containers
  imageContainers.forEach(container => {
    imageObserver.observe(container);
  });
  
  // Thumbnail click handler
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
      const index = parseInt(thumbnail.dataset.index);
      scrollToImage(index);
    });
  });
  
  /**
   * Updates the active thumbnail based on the visible image
   * @param {number} index - The index of the currently visible image
   */
  function updateActiveThumbnail(index) {
    // Use classList operations directly instead of querying for active thumbnails
    thumbnails.forEach((thumb, i) => {
      if (parseInt(thumb.dataset.index) === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }
  
  /**
   * Scrolls to the image corresponding to the clicked thumbnail
   * @param {number} index - The index of the image to scroll to
   */
  function scrollToImage(index) {
    const targetImage = document.querySelector(`.image-container[data-index="${index}"]`);
    if (targetImage) {
      // Smooth scroll to the target image
      targetImage.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
  
  // Handle initial image focus based on scroll position
  function setInitialFocus() {
    // Find which image is most visible on initial load
    let maxVisibility = 0;
    let mostVisibleIndex = 0;
    
    imageContainers.forEach((container, index) => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the image is visible
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const visibility = visibleHeight / container.offsetHeight;
      
      if (visibility > maxVisibility) {
        maxVisibility = visibility;
        mostVisibleIndex = index;
      }
    });
    
    // Set the most visible image as focused
    const mostVisibleContainer = document.querySelector(`.image-container[data-index="${mostVisibleIndex}"]`);
    if (mostVisibleContainer) {
      mostVisibleContainer.classList.add('in-focus');
      currentFocusedIndex = mostVisibleIndex;
    }
    
    // Update the active thumbnail
    updateActiveThumbnail(mostVisibleIndex);
    
    // Center the image without unnecessary style resets
    setTimeout(() => {
      mostVisibleContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  }
  
  // Set up initial focus once images have loaded
  if (document.readyState === 'complete') {
    setInitialFocus();
  } else {
    window.addEventListener('load', setInitialFocus);
  }
  
  // Add passive scroll listener for better scroll performance
  window.addEventListener('scroll', () => {
    // Do nothing - let the IntersectionObserver handle visibility changes
    // This empty listener with passive option helps some browsers optimize scrolling
  }, { passive: true });
});
