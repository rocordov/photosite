/**
 * Theme Toggle Component JS
 * Handles light/dark mode preference switching and persistence
 */

/**
 * Initialize the theme toggle functionality
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  const htmlElement = document.documentElement;
  
  // Check for saved theme preference or use default (dark)
  const savedTheme = localStorage.getItem('theme') || 'dark';
  
  // Apply the saved theme on page load
  applyTheme(savedTheme, themeToggle, htmlElement);
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    // Toggle light-mode class on html element
    const isLightMode = htmlElement.classList.contains('light-mode');
    const newTheme = isLightMode ? 'dark' : 'light';
    
    applyTheme(newTheme, themeToggle, htmlElement);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newTheme);
  });
}

/**
 * Apply the specified theme to the document
 * @param {string} theme - The theme to apply ('light' or 'dark')
 * @param {HTMLElement} toggleButton - The theme toggle button element
 * @param {HTMLElement} rootElement - The document's root element (usually htmlElement)
 */
function applyTheme(theme, toggleButton, rootElement) {
  if (theme === 'light') {
    rootElement.classList.add('light-mode');
    toggleButton.setAttribute('aria-pressed', 'false');
  } else {
    rootElement.classList.remove('light-mode');
    toggleButton.setAttribute('aria-pressed', 'true');
  }
}

// Initialize theme toggle on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initThemeToggle);

// Export functions for potential reuse
export { initThemeToggle, applyTheme };
