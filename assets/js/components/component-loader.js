import { initThemeToggle } from './theme-toggle.js';

/**
 * Component Loader
 * Utility for loading HTML components like header and footer
 */

/**
 * Load an HTML component into a specified container
 * @param {string} elementId - The ID of the container element
 * @param {string} componentPath - Path to the component HTML file
 * @param {Object} [replacements={}] - Variables to replace in the component
 * @returns {Promise} - Promise that resolves when component is loaded
 */
function loadComponent(elementId, componentPath, replacements = {}) {
  return new Promise((resolve, reject) => {
    const element = document.getElementById(elementId);
    if (!element) {
      reject(new Error(`Element with ID "${elementId}" not found`));
      return;
    }
    
    fetch(componentPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        // Process replacements
        Object.keys(replacements).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          html = html.replace(regex, replacements[key]);
        });
        
        // Insert the HTML
        element.innerHTML = html;
        
        // Execute any scripts in the component
        element.querySelectorAll('script').forEach(script => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.textContent = script.textContent;
          script.parentNode.replaceChild(newScript, script);
        });
        
        resolve(element);
      })
      .catch(error => {
        console.error(`Error loading component: ${componentPath}`, error);
        reject(error);
      });
  });
}

/**
 * Load both header and footer components
 */
function loadLayoutComponents() {
  const inSubdirectory = window.location.pathname.includes('/experiments/');
  const rootPath = inSubdirectory ? '../' : './';
  
  loadComponent('site-header', `${rootPath}components/header.html`, { ROOT_PATH: rootPath })
    .then(() => {
      if (window.initMobileMenu) window.initMobileMenu();
      // Remove the window.initThemeToggle call since we're using the import
      return loadComponent('site-footer', `${rootPath}components/footer.html`, { ROOT_PATH: rootPath });
    })
    .then(() => {
      initBackToTop();
      initThemeToggle(); // Initialize theme toggle here
    })
    .catch(error => {
      console.error('Error loading layout components:', error);
    });
}

/**
 * Initialize back-to-top button functionality
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;
  
  // Show/hide back-to-top button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  // Smooth scroll to top when button is clicked
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Load the customizations script that collects and stores session data
 */
function loadCustomizationsScript() {
  const inSubdirectory = window.location.pathname.includes('/experiments/');
  const rootPath = inSubdirectory ? '../' : './';
  
  // Create and append the script element
  const script = document.createElement('script');
  script.src = `${rootPath}assets/js/components/customizations.js`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  
  console.log('Customizations script loaded');
}

// Initialize components on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Load client.js and execute functions
  const script = document.createElement('script');
  script.src = `../assets/js/components/client.js`;
  script.onload = () => {
    resetSessionStorage();
    dataCollection();
  };
  document.head.appendChild(script);
  
  console.log('Component loader initialized');
  loadLayoutComponents();
  loadCustomizationsScript();
  console.log('Component loader initialized');
  loadLayoutComponents();
  loadCustomizationsScript();
});

// Export functions for potential reuse
export { loadComponent, loadLayoutComponents, initBackToTop };
