/**
 * Coffee Gallery Initialization
 * Loads and configures the Music and Coffee gallery
 */

import { loadComponent } from '../components/gallery-component-loader.js';
import { initCarousel } from '../components/carousel.js';

// Initialize the gallery when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load gallery configuration
  fetch('config.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load gallery configuration: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(config => {
      // Configure the gallery with the loaded configuration
      configureGallery(config);
    })
    .catch(error => {
      console.error('Error loading gallery configuration:', error);
      // Fallback to default configuration if the config file fails to load
      configureGallery(getDefaultConfig());
    });
});

/**
 * Configure the gallery with the provided configuration
 * @param {Object} config - Gallery configuration object
 */
function configureGallery(config) {
  // Calculate the relative path to the assets directory
  const pathToRoot = getPathToRoot();
  
  // Load components
  Promise.all([
    loadComponent('gallery-header', `${pathToRoot}assets/components/gallery/header.html`, { 
      GALLERY_TITLE: config.galleryTitle 
    }),
    loadComponent('gallery-carousel', `${pathToRoot}assets/components/gallery/carousel.html`),
    loadComponent('gallery-controls', `${pathToRoot}assets/components/gallery/controls.html`),
    loadComponent('gallery-info', `${pathToRoot}assets/components/gallery/gallery-info.html`, { 
      GALLERY_TITLE: config.galleryTitle,
      GALLERY_DESCRIPTION: config.description 
    })
  ])
  .then(() => {
    // Initialize carousel with configuration
    initCarousel('gallery-carousel', config.images, config.carouselOptions);
    
    // Apply theme styles if provided
    if (config.theme) {
      applyTheme(config.theme);
    }
  })
  .catch(error => {
    console.error('Error loading gallery components:', error);
  });
}

/**
 * Apply theme styles to the gallery
 * @param {Object} theme - Theme configuration object
 */
function applyTheme(theme) {
  const root = document.documentElement;
  
  // Apply theme colors if provided
  if (theme.bgColor) root.style.setProperty('--coffee-dark', theme.bgColor);
  if (theme.textColor) root.style.setProperty('--cream', theme.textColor);
  if (theme.accentColor) root.style.setProperty('--music-accent', theme.accentColor);
  if (theme.lineColor) root.style.setProperty('--line-color', theme.lineColor);
}

/**
 * Get the relative path to the root directory
 * @returns {string} Relative path to the root directory
 */
function getPathToRoot() {
  // Count the number of directories deep we are
  const path = window.location.pathname;
  const parts = path.split('/').filter(part => part.length > 0);
  
  // Check if we're in the gallery path
  const galleryPathIndex = parts.findIndex(part => part === 'Gallery');
  if (galleryPathIndex !== -1) {
    // Calculate the relative path to root based on gallery depth
    let relativePath = '';
    for (let i = galleryPathIndex; i < parts.length - 1; i++) {
      relativePath += '../';
    }
    return relativePath;
  }
  
  // Default: Calculate based on full path depth
  let relativePath = '';
  for (let i = 0; i < parts.length - 1; i++) {
    relativePath += '../';
  }
  
  return relativePath;
}

/**
 * Get default gallery configuration if the config file fails to load
 * @returns {Object} Default gallery configuration
 */
function getDefaultConfig() {
  return {
    galleryTitle: "Hillsboro Music and Coffee",
    description: "Experience Hillsboro's unique coffee culture where artisanal brews meet live music. Each image captures the harmony between carefully crafted beverages and the soulful sounds that fill these intimate spaces.",
    theme: {
      bgColor: "#2C1810",
      textColor: "#F5E6D3",
      accentColor: "#BE9B7B",
      lineColor: "#888"
    },
    images: [
      {
        src: "images/_7RV6586.jpg",
        title: "Acoustic Corner",
        description: "A cozy corner where local musicians often perform intimate sets"
      },
      {
        src: "images/_7RV6589.jpg",
        title: "Brewing Perfection",
        description: "Artisanal brewing methods that highlight the coffee's unique character"
      },
      {
        src: "images/_7RV6592.jpg",
        title: "Community Space",
        description: "Where conversations flow as freely as the coffee"
      }
    ],
    carouselOptions: {
      autoplay: true,
      autoplaySpeed: 5000,
      showLines: true,
      randomizeOption: true
    }
  };
}
