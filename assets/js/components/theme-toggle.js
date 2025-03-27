/**
 * Theme Toggle Component JS
 * Handles light/dark mode preference switching and persistence
 */

/**
 * Initialize the theme toggle functionality
 */
export function initThemeToggle() {
  console.log('Initializing theme toggle...'); // Debug log
  
  const themeToggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  
  if (!themeToggle) {
    console.error('Theme toggle button not found in DOM');
    return;
  }

  console.log('Theme toggle button found:', themeToggle); // Debug log
  
  // Set initial theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  console.log('Saved theme:', savedTheme); // Debug log
  applyTheme(savedTheme, themeToggle, root);
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', (e) => {
    console.log('Theme toggle clicked'); // Debug log
    e.preventDefault();
    
    const isCurrentlyLight = root.classList.contains('light-mode');
    root.classList.toggle('light-mode');
    
    // Save theme preference
    localStorage.setItem('theme', isCurrentlyLight ? 'dark' : 'light');
    console.log('Theme set to:', isCurrentlyLight ? 'dark' : 'light'); // Debug log
    
    // Toggle icon visibility
    const sunIcon = themeToggle.querySelector('.fa-sun');
    const moonIcon = themeToggle.querySelector('.fa-moon');
    
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isCurrentlyLight ? 'block' : 'none';
      moonIcon.style.display = isCurrentlyLight ? 'none' : 'block';
    }
  });
}

/**
 * Apply the specified theme to the document
 * @param {string} theme - The theme to apply ('light' or 'dark')
 * @param {HTMLElement} toggleButton - The theme toggle button element
 * @param {HTMLElement} rootElement - The document's root element (usually htmlElement)
 */
function applyTheme(theme, toggleButton, rootElement) {
  const isLight = theme === 'light';
  rootElement.classList.toggle('light-mode', isLight);
  toggleButton.setAttribute('aria-pressed', (!isLight).toString());
  
  // Update icons visibility if they exist
  const sunIcon = toggleButton.querySelector('.fa-sun');
  const moonIcon = toggleButton.querySelector('.fa-moon');
  
  if (sunIcon && moonIcon) {
    sunIcon.style.display = isLight ? 'none' : 'block';
    moonIcon.style.display = isLight ? 'block' : 'none';
  }
}

// Initialize theme toggle on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initThemeToggle);

// Export functions for potential reuse
export { initThemeToggle, applyTheme };
