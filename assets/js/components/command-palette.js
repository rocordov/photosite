/**
 * Command Palette Component JS
 * Provides keyboard-driven navigation and command interface
 */

// Store navigation options
const navigationOptions = [
  { name: 'Home', icon: 'fa-home', url: './index.html', shortcut: 'G H' },
  { name: 'Projects', icon: 'fa-briefcase', url: './projects.html', shortcut: 'G P' },
  { name: 'About', icon: 'fa-user', url: './about.html', shortcut: 'G A' },
  { name: 'Experiments', icon: 'fa-flask', url: './experiments/index.html', shortcut: 'G E' },
  { name: 'Connect', icon: 'fa-envelope', url: './connect.html', shortcut: 'G C' },
  { name: 'Feedback', icon: 'fa-comment', url: '#feedback', shortcut: 'G F' },
  { name: 'Toggle Dark/Light Mode', icon: 'fa-moon', action: 'toggleTheme', shortcut: 'G T' }
];

// Track selected item
let selectedIndex = -1;

/**
 * Initialize the command palette
 */
function initCommandPalette() {
  const commandPalette = document.getElementById('command-palette');
  const commandInput = document.getElementById('command-palette-input');
  const commandResults = document.getElementById('command-palette-results');
  
  if (!commandPalette || !commandInput || !commandResults) return;
  
  // Function to toggle command palette visibility
  function toggleCommandPalette() {
    commandPalette.classList.toggle('active');
    if (commandPalette.classList.contains('active')) {
      commandInput.focus();
      renderResults(navigationOptions);
    } else {
      commandInput.value = '';
      selectedIndex = -1;
    }
  }
  
  // Function to render filtered results
  function renderResults(results) {
    if (results.length === 0) {
      commandResults.innerHTML = '<div class="command-palette-no-results">No matching commands found</div>';
      return;
    }
    
    let resultsHTML = '';
    results.forEach((option, index) => {
      const selectedClass = index === selectedIndex ? 'selected' : '';
      resultsHTML += `
        <div class="command-palette-item ${selectedClass}" data-index="${index}" tabindex="0" role="option" aria-selected="${index === selectedIndex}">
          <i class="fas ${option.icon}"></i>
          <span>${option.name}</span>
          <div class="command-palette-shortcut">${option.shortcut}</div>
        </div>
      `;
    });
    
    commandResults.innerHTML = resultsHTML;
    
    // Add click event listeners to items
    document.querySelectorAll('.command-palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        executeCommand(results[index]);
      });
      
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const index = parseInt(item.dataset.index);
          executeCommand(results[index]);
        }
      });
    });
  }
  
  // Function to execute a command
  function executeCommand(option) {
    if (option.action === 'toggleTheme') {
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) themeToggle.click();
    } else if (option.url) {
      if (option.url.startsWith('#')) {
        // Scroll to the element if it's an anchor
        const element = document.querySelector(option.url);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to the URL
        window.location.href = option.url;
      }
    }
    
    toggleCommandPalette();
  }
  
  // Filter results based on input
  commandInput.addEventListener('input', () => {
    const query = commandInput.value.toLowerCase();
    selectedIndex = -1;
    
    const filteredOptions = navigationOptions.filter(option => 
      option.name.toLowerCase().includes(query)
    );
    
    renderResults(filteredOptions);
  });
  
  // Keyboard navigation for command palette
  commandInput.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.command-palette-item');
    const filteredOptions = navigationOptions.filter(option => 
      option.name.toLowerCase().includes(commandInput.value.toLowerCase())
    );
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          executeCommand(filteredOptions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        toggleCommandPalette();
        break;
        
      default:
        return;
    }
    
    // Update selected item visually
    renderResults(filteredOptions);
  });
  
  // Close palette when clicking outside
  commandPalette.addEventListener('click', (e) => {
    if (e.target === commandPalette) {
      toggleCommandPalette();
    }
  });
  
  // Keyboard shortcut to open command palette (Cmd+K / Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
    
    // Handle Escape key if palette is open
    if (e.key === 'Escape' && commandPalette.classList.contains('active')) {
      e.preventDefault();
      toggleCommandPalette();
    }
  });
}

// Initialize command palette on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initCommandPalette);

// Export functions for potential reuse
export { initCommandPalette };
