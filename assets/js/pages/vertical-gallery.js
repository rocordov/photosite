/**
 * Vertical Gallery - JavaScript functionality
 * Handles scroll effects, intersection observations, and thumbnail navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const imageContainers = document.querySelectorAll('.image-container');
  const thumbnails = document.querySelectorAll('.thumbnail');
  
  // Set up Intersection Observer to detect which images are in the viewport
  const observerOptions = {
    root: null, // viewport
    rootMargin: '-20% 0px -20% 0px', // tighter margin around the viewport
    threshold: [0.2, 0.4, 0.6, 0.8] // multiple thresholds for smoother transitions
  };
  
  // Create observer instance for bokeh effect
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Get the image container element
      const container = entry.target;
      
      // Get the image's data-index attribute
      const index = parseInt(container.dataset.index);
      
      // Toggle in-focus class based on intersection status
      if (entry.isIntersecting) {
        // Calculate how visible the image is
        const visibilityRatio = entry.intersectionRatio;
        
        // Add in-focus class to the image that's most in view
        if (visibilityRatio > 0.6) {
          container.classList.add('in-focus');
          
          // Update the active thumbnail
          updateActiveThumbnail(index);
        } else {
          // For partially visible images, we'll still show them but without full focus
          container.classList.remove('in-focus');
        }
      } else {
        // Remove in-focus class when image is out of view
        container.classList.remove('in-focus');
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
    // Remove active class from all thumbnails
    thumbnails.forEach(thumb => {
      thumb.classList.remove('active');
    });
    
    // Add active class to the thumbnail corresponding to the visible image
    const activeThumbnail = document.querySelector(`.thumbnail[data-index="${index}"]`);
    if (activeThumbnail) {
      activeThumbnail.classList.add('active');
    }
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
  
  // Handle initial scroll position
  window.addEventListener('load', () => {
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
    
    // Add in-focus class to the most visible image
    const mostVisibleContainer = document.querySelector(`.image-container[data-index="${mostVisibleIndex}"]`);
    if (mostVisibleContainer) {
      mostVisibleContainer.classList.add('in-focus');
    }
    
    // Update the active thumbnail based on the most visible image
    updateActiveThumbnail(mostVisibleIndex);
    
    // Smooth scroll to ensure the image is properly centered if it's partially in view
    setTimeout(() => {
      mostVisibleContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 500);
  });
});
