/**
 * Home Page Specific JavaScript
 * Contains scripts specifically for the homepage functionality
 */

// Welcome messages functionality
let welcomeMessages = [];  // Will be populated from JSON

// Load welcome messages from JSON file
fetch('/assets/components/flags.json')
  .then(response => response.json())
  .then(data => {
    welcomeMessages = data;
  })
  .catch(error => {
    console.error('Error loading welcome messages:', error);
    // Fallback welcome message if loading fails
    
    welcomeMessages = [{ text: "Welcome", flag: "👋" }];
  });

let currentIndex = 0;
const welcomeEl = document.getElementById('animated-welcome');

/**
 * Cycle through welcome messages with animation
 */
function cycleWelcomeMessages() {
  if (!welcomeEl) return;
  
  welcomeEl.classList.remove('fade-in');
  void welcomeEl.offsetWidth; // Trigger reflow
  welcomeEl.classList.add('fade-in');
  const { text, flag } = welcomeMessages[currentIndex];
  welcomeEl.textContent = `${flag} ${text}`;
  currentIndex = (currentIndex + 1) % welcomeMessages.length;
}

// Quotes functionality
let quotes = []; // Will be populated from JSON
console.debug('Starting loading quotes:');
// Load quotes from JSON file
fetch('/assets/components/quotes.json')
  .then(response => response.json())
  .then(data => {
    quotes = data;
    displayRandomQuote(); // Move this inside the .then block
  })
  .catch(error => {
    console.error('Error loading quotes:', error);
    // Fallback quote if loading fails
    quotes = ["The meaning of life is just to be alive. — Alan Watts"];
    displayRandomQuote(); // Ensure fallback quote is displayed
  });

/**
 * Display a random quote from the quotes array
 */
function displayRandomQuote() {
  const quoteDisplay = document.getElementById('quote-display');
  if (!quoteDisplay) {
    console.error('Quote display element not found.');
    return;
  } 
  
  // Guard against empty quotes array
  if (!quotes || quotes.length === 0) {
    console.warn('No quotes available to display');
    return;
  }

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  // Handle both object and string formats
  if (typeof randomQuote === 'object' && randomQuote.quote && randomQuote.author) {
    quoteDisplay.textContent = `${randomQuote.quote} — ${randomQuote.author}`;
  } else if (typeof randomQuote === 'string') {
    quoteDisplay.textContent = randomQuote;
  } else {
    console.error('Invalid quote format:', randomQuote);
    quoteDisplay.textContent = 'The meaning of life is just to be alive. — Alan Watts';
  }
  
  console.debug('Random quote displayed:', randomQuote);
}

/**
 * Initialize gallery from albums.json
 */
async function initGallery() {
  const galleryContainer = document.getElementById('gallery-menu');
  if (!galleryContainer) return;
  
  try {
    // Fetch the albums data from the JSON file
    const response = await fetch('albums.json');
    //console.debug('Response:', response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const albums = await response.json();
    console.debug(`Number of albums loaded: ${albums.length}`);
    
    // Shuffle the albums array using Fisher-Yates algorithm
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    const shuffledAlbums = shuffleArray(albums);
    
    // Clear any existing content
    galleryContainer.innerHTML = '';
    
    // Create and append gallery items in randomized order
    shuffledAlbums.forEach((album, index) => {
      const galleryItem = document.createElement('a');
      galleryItem.className = 'gallery-item';
      galleryItem.href = album.link;
      galleryItem.setAttribute('aria-label', `View ${album.title} photo gallery`);
      galleryItem.style.animationDelay = `${0.1 * (index + 1)}s`;
      
      const thumbnail = document.createElement('img');
      thumbnail.className = 'thumbnail';
      thumbnail.src = album.thumbnail;
      thumbnail.alt = `${album.title} photography collection - thumbnail preview`;
      thumbnail.loading = 'lazy';
      
      const caption = document.createElement('div');
      caption.className = 'caption';
      caption.textContent = album.title;
      
      galleryItem.appendChild(thumbnail);
      galleryItem.appendChild(caption);
      galleryContainer.appendChild(galleryItem);
    });
  } catch (error) {
    console.error('Error loading albums:', error);
    galleryContainer.innerHTML = 
      `<div style="color: var(--text); text-align: center; width: 100%;">
        <p>Unable to load gallery albums. Please try again later.</p>
      </div>`;
  }
}

// Initialize homepage elements
document.addEventListener('DOMContentLoaded', () => {
  // Initialize welcome message
  if (welcomeEl) {
    welcomeEl.classList.add('fade-in');
    setInterval(cycleWelcomeMessages, 4500); // Change message every 4.5 seconds
  }
  
  // Initialize quote
  
  displayRandomQuote();
  
  // Initialize gallery
  initGallery();
});
