/**
 * Theme Toggle Component JS
 * Handles light/dark mode preference switching and persistence
 */

export function initThemeToggle() {
  console.log('Initializing theme toggle...'); // Debug log
  
  const root = document.documentElement;
  
  // Set initial theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);
  
  // Handle both click and touch events
  document.addEventListener('click', handleThemeToggle);
  document.addEventListener('touchend', handleThemeToggle);

  function handleThemeToggle(e) {
    const themeToggle = e.target.closest('.theme-toggle');
    if (!themeToggle) return;
    
    e.preventDefault(); // Prevent double-firing on mobile
    
    console.log('Theme toggle triggered'); // Debug log
    const currentTheme = root.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  const isLight = theme === 'light';
  
  root.classList.toggle('light-mode', isLight);
  
  // Force a repaint on mobile devices
  document.body.style.display = 'none';
  document.body.offsetHeight; // Trigger reflow
  document.body.style.display = '';
}

// Initialize theme toggle on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initThemeToggle);

