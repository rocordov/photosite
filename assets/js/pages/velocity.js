/**
 * Velocity.js Animation Implementation
 * Creates a multi-step animation sequence using Velocity.js
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get the main animation element
  const animateBox = document.getElementById('animateBox');
  
  // Get the restart button
  const restartBtn = document.getElementById('restartAnimation');
  
  // Check if animation element exists
  if (!animateBox) {
    console.error('Animation target element not found in DOM');
    return;
  }
  
  // Check if Velocity is loaded
  if (!window.Velocity) {
    console.error('Velocity.js library not loaded');
    
    // Display error message in animation stage
    const animationStage = document.querySelector('.animation-stage');
    if (animationStage) {
      animationStage.innerHTML = `
        <div class="fallback-message" style="display: block;">
          <h2>Animation library not loaded</h2>
          <p>There was an error loading the Velocity.js animation library. Please try refreshing the page.</p>
        </div>
      `;
    }
    return;
  }
  
  /**
   * Main animation sequence function
   * Uses Velocity's UI pack for additional effects
   */
  function runAnimation() {
    try {
      // Reset any ongoing animations
      Velocity(animateBox, 'stop', true);
      
      // Reset element to initial state
      animateBox.style.opacity = '0';
      animateBox.style.transform = 'translateX(-200px)';
      
      // Step 1: Slide in from left with fade in
      Velocity(animateBox, { 
        opacity: 1,
        translateX: ['75px', '-200px'],  // [end value, start value]
      }, {
        duration: 800,
        easing: 'easeOutQuint',
        complete: () => {
          // Step 2: Scale up and rotate
          Velocity(animateBox, {
            scale: [1.2, 1],
            rotateZ: '45deg'
          }, {
            duration: 600,
            easing: 'easeInOutCubic',
            complete: () => {
              // Step 3: Change color
              Velocity(animateBox, {
                backgroundColor: '#7E57C2', // Purple color
                color: '#FFFFFF'
              }, {
                duration: 400,
                complete: () => {
                  // Step 4: Bounce with elastic easing
                  Velocity(animateBox, {
                    translateY: ['-50px', '0px'],
                    rotateZ: '0deg'
                  }, {
                    duration: 800,
                    easing: 'easeOutElastic',
                    complete: () => {
                      // Step 5: Pulse effect and move to center
                      Velocity(animateBox, {
                        translateX: 'calc(50vw - 75px)',
                        translateY: '75px'
                      }, {
                        duration: 600,
                        easing: 'easeOutQuad',
                        complete: () => {
                          // Final effect: subtle pulse
                          Velocity(animateBox, 'callout.pulse');
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    } catch (error) {
      // Error handling
      console.error('Animation error:', error);
      
      // Display error message
      const animationStage = animateBox.closest('.animation-stage');
      if (animationStage) {
        animationStage.innerHTML = `
          <div class="fallback-message" style="display: block;">
            <h2>Animation Error</h2>
            <p>There was an error running the animation sequence.</p>
            <p class="error-details" style="color: var(--accent); font-size: 0.9rem; margin-top: 1rem;">Error: ${error.message}</p>
          </div>
        `;
      }
    }
  }
  
  // Add event listener to restart button
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      runAnimation();
    });
  }
  
  // Run the animation immediately when page loads
  runAnimation();
  
  // Update animation on theme toggle to ensure colors match the theme
  document.addEventListener('themeToggle', () => {
    // Get current theme
    const isLightMode = document.documentElement.classList.contains('light-mode');
    
    // Reset any ongoing animations
    Velocity(animateBox, 'stop', true);
    
    // Update box color to match theme
    Velocity(animateBox, {
      backgroundColor: isLightMode ? '#00796B' : '#00BCD4' // Different accent colors for light/dark
    }, {
      duration: 300,
      queue: false
    });
  });
});
