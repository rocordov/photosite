/**
 * Gallery Component Loader
 * Utility for loading HTML components for gallery pages
 */

/**
 * Load an HTML component into a specified container
 * @param {string} elementId - The ID of the container element
 * @param {string} componentPath - Path to the component HTML file
 * @param {Object} [replacements={}] - Variables to replace in the component
 * @returns {Promise} - Promise that resolves when component is loaded
 */
export function loadComponent(elementId, componentPath, replacements = {}) {
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
