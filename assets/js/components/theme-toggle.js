/**
 * Theme Toggle Component JS
 * Handles light/dark mode preference switching and persistence
 */

export function initThemeToggle() {
  console.log('Initializing theme toggle...'); // Debug log
  
  const themeToggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  
  if (!themeToggle) {
    //console.error('Theme toggle button not found in DOM');
    return;
  }

  // Set initial theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  console.log('Saved theme:', savedTheme); // Debug log
  
  applyTheme(savedTheme);
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    console.log('Theme toggle clicked'); // Debug log
    const currentTheme = root.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// Helper function to apply theme
function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('light-mode', theme === 'light');
}

// Initialize theme toggle on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initThemeToggle);

