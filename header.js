document.addEventListener('DOMContentLoaded', function() {
  // Get the header container
  const headerContainer = document.getElementById('site-header');
  if (!headerContainer) return;

  // Determine if we're in a subdirectory
  const currentPath = window.location.pathname;
  const inSubdirectory = currentPath.includes('/experiments/');
  
  // Set the root path based on directory level
  const rootPath = inSubdirectory ? '../' : './';
  
  // Fetch the header HTML
  fetch(`${rootPath}header.html`)
    .then(response => response.text())
    .then(html => {
      // Replace path placeholders
      html = html.replace(/\{\{ROOT_PATH\}\}/g, rootPath);
      
      // Insert the header HTML
      headerContainer.innerHTML = html;
      
      // Set current page as active
      const currentPage = currentPath.split('/').pop() || 'index.html';
      const isExperimentsPage = currentPath.includes('/experiments/');
      
      document.querySelectorAll('.nav-links a').forEach(link => {
        const dataPage = link.getAttribute('data-page');
        
        if ((currentPage === dataPage) || 
            (currentPage === '' && dataPage === 'index.html') ||
            (isExperimentsPage && dataPage === 'experiments/')) {
          link.setAttribute('aria-current', 'page');
        }
      });

      // Initialize mobile menu
      initMobileMenu();
      
      // Initialize theme toggle
      initThemeToggle();
    })
    .catch(error => {
      console.error('Error loading header:', error);
      headerContainer.innerHTML = `
        <nav>
          <a href="${rootPath}index.html">Home</a>
        </nav>
      `;
    });
});

// Mobile menu functionality
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.overlay');
  
  if (mobileMenuBtn && navLinks) {
    // Handle hamburger button click
    mobileMenuBtn.addEventListener('click', function() {
      const isOpen = mobileMenuBtn.classList.contains('open');
      
      if (!isOpen) {
        // Opening the menu
        mobileMenuBtn.classList.add('open');
        navLinks.classList.add('open');
        
        if (overlay) {
          overlay.classList.add('active');
        }
        
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        navLinks.setAttribute('aria-hidden', 'false');
      } else {
        // Closing the menu
        mobileMenuBtn.classList.remove('open');
        navLinks.classList.remove('open');
        
        if (overlay) {
          overlay.classList.remove('active');
        }
        
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', 'true');
      }
    });
    
    // Close menu when clicking overlay
    if (overlay) {
      overlay.addEventListener('click', function() {
        mobileMenuBtn.classList.remove('open');
        navLinks.classList.remove('open');
        overlay.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', 'true');
      });
    }
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        mobileMenuBtn.classList.remove('open');
        navLinks.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

// Theme toggle functionality
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference or use default (dark)
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply the saved theme on page load
    if (savedTheme === 'light') {
      htmlElement.classList.add('light-mode');
      themeToggle.setAttribute('aria-pressed', 'false');
    } else {
      themeToggle.setAttribute('aria-pressed', 'true');
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', function() {
      // Toggle light-mode class on html element
      htmlElement.classList.toggle('light-mode');
      
      // Update button aria-pressed state
      const isLightMode = htmlElement.classList.contains('light-mode');
      themeToggle.setAttribute('aria-pressed', !isLightMode);
      
      // Save preference to localStorage
      localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
    });
  }
}
