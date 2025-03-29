/**
 * Header Component JS
 * Handles header initialization, navigation state, and mobile menu
 */

/**
 * Initialize the site header by loading the header HTML and setting up navigation
 */
function initHeader() {

  // Get the header container
  const headerContainer = document.getElementById('site-header');
  if (!headerContainer) return;

  // Determine if we're in a subdirectory
  const currentPath = window.location.pathname;
  const inSubdirectory = currentPath.includes('/experiments/');
  
  // Set the root path based on directory level
  const rootPath = inSubdirectory ? '../' : './';
  
  // Fetch the header HTML
  fetch(`${rootPath}components/header.html`)
    .then(response => response.text())
    .then(html => {
      // Replace path placeholders
      html = html.replace(/\{\{ROOT_PATH\}\}/g, rootPath);
      
      // Insert the header HTML
      headerContainer.innerHTML = html;
      
      // Set current page as active
      setActivePage(currentPath);
      
      // Initialize mobile menu
      initMobileMenu();
    })
    .catch(error => {
      console.error('Error loading header:', error);
      headerContainer.innerHTML = `
        <nav>
          <a href="${rootPath}index.html">Home</a>
        </nav>
      `;
    });
}

/**
 * Set the current page as active in the navigation
 * @param {string} currentPath - The current page path
 */
function setActivePage(currentPath) {
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
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.overlay');
  
  if (mobileMenuBtn && navLinks) {
    console.log("Mobile menu initialization");
    
    // Handle hamburger button click
    mobileMenuBtn.addEventListener('click', function() {
      const isOpen = mobileMenuBtn.classList.contains('open');
      
      if (!isOpen) {
        // Opening the menu
        mobileMenuBtn.classList.add('open');
        navLinks.classList.add('open');
        
        if (overlay) {
          overlay.classList.add('active');
          
          // Make the overlay not block navigation links by placing it behind them
          // The overlay only needs to darken the background
          overlay.style.zIndex = '1';
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
      overlay.addEventListener('click', function(e) {
        // Only close if clicking the overlay itself, not its children
        if (e.target === overlay) {
          mobileMenuBtn.classList.remove('open');
          navLinks.classList.remove('open');
          overlay.classList.remove('active');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
          navLinks.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }
}

/**
 * Sticky & Shrinking Navigation
 */
function initStickyNav() {
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 100) {
      nav.classList.add('shrink');
    } else {
      nav.classList.remove('shrink');
    }
  });
}

// Initialize header on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  initHeader();
  initStickyNav();
});

// Export functions for potential reuse
export { initHeader, initMobileMenu, initStickyNav };
