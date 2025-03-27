/**
 * Home Page Specific JavaScript
 * Contains scripts specifically for the homepage functionality
 */

// Welcome messages functionality
const welcomeMessages = [
  { text: "Welcome", flag: "🏳️‍🌈" },
  { text: "Bienvenue", flag: "🇫🇷" },
  { text: "Willkommen", flag: "🇩🇪" },
  { text: "Benvenuto", flag: "🇮🇹" },
  { text: "ยินดีต้อนรับ", flag: "🇹🇭" },
  { text: "ようこそ", flag: "🇯🇵" },
  { text: "환영합니다", flag: "🇰🇷" },
  { text: "欢迎", flag: "🇨🇳" },
  { text: "स्वागत है", flag: "🇮🇳" },
  { text: "Добро пожаловать", flag: "🇷🇺" },
  { text: "Bem-vindo", flag: "🇵🇹" },
  { text: "Välkommen", flag: "🇸🇪" },
  { text: "Aloha", flag: "🇺🇸" },
  // Trimmed for brevity
];

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
const quotes = [
  "Trying to define yourself is like trying to bite your own teeth.",
  "Man suffers only because he takes seriously what the gods made for fun.",
  "We seldom realize, for example, that our most private thoughts and emotions are not actually our own.",
  "The meaning of life is just to be alive. It is so plain and so obvious and so simple.",
  "This is the real secret of life — to be completely engaged with what you are doing in the here and now.",
  "You are the universe experiencing itself.",
  "You didn't come into this world. You came out of it, like a wave from the ocean.",
  // Trimmed for brevity
];

/**
 * Display a random quote from the quotes array
 */
function displayRandomQuote() {
  const quoteDisplay = document.getElementById('quote-display');
  if (!quoteDisplay) return;
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteDisplay.textContent = quotes[randomIndex];
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
    setInterval(cycleWelcomeMessages, 4000); // Change message every 4 seconds
  }
  
  // Initialize quote
  displayRandomQuote();
  
  // Initialize gallery
  initGallery();
});
