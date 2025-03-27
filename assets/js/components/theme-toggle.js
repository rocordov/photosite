/**
 * Theme Toggle Component JS
 * Handles light/dark mode preference switching and persistence
 */

/**
 * Initialize the theme toggle functionality
 */
export function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  
  if (!themeToggle) {
    console.warn('Theme toggle button not found');
    return;
  }

  // Set initial state
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme, themeToggle, root);
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    const currentTheme = root.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme, themeToggle, root);
    localStorage.setItem('theme', newTheme);
    
    // Debug logging
    console.log('Theme toggled:', newTheme);
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
