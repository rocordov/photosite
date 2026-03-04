/**
 * Home Page Specific JavaScript
 * Contains scripts specifically for the homepage functionality
 */

const welcomeEl = document.getElementById('animated-welcome');
let welcomeMessages = [];
let currentIndex = 0;

async function loadWelcomeMessages() {
  try {
    const response = await fetch('/assets/components/flags.json');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    welcomeMessages = await response.json();
  } catch (error) {
    console.error('Error loading welcome messages:', error);
    welcomeMessages = [{ text: "Welcome", flag: "👋" }];
  }
}

function cycleWelcomeMessages() {
  if (!welcomeEl) return;
  
  welcomeEl.classList.remove('fade-in');
  void welcomeEl.offsetWidth; // Trigger reflow
  welcomeEl.classList.add('fade-in');
  const { text, flag } = welcomeMessages[currentIndex];
  welcomeEl.textContent = `${flag} ${text}`;
  currentIndex = (currentIndex + 1) % welcomeMessages.length;
}

let quotes = [];

async function loadQuotes() {
  try {
    const response = await fetch('/assets/components/quotes.json');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    quotes = await response.json();
  } catch (error) {
    console.error('Error loading quotes:', error);
    quotes = ["The meaning of life is just to be alive. — Alan Watts"];
  }
}

function displayRandomQuote() {
  const quoteDisplay = document.getElementById('quote-display');
  if (!quoteDisplay) {
    console.error('Quote display element not found.');
    return;
  } 
  
  if (!quotes || quotes.length === 0) {
    console.warn('No quotes available to display');
    return;
  }

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
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

async function initGallery() {
  const galleryContainer = document.getElementById('gallery-menu');
  if (!galleryContainer) return;
  
  try {
    const response = await fetch('albums.json');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const albums = await response.json();
    console.debug(`Number of albums loaded: ${albums.length}`);
    
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    const shuffledAlbums = shuffleArray(albums);
    
    galleryContainer.innerHTML = '';
    
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadWelcomeMessages();
  if (welcomeEl) {
    welcomeEl.classList.add('fade-in');
    cycleWelcomeMessages();
    setInterval(cycleWelcomeMessages, 4500);
  }

  await loadQuotes();
  displayRandomQuote();

  initGallery();
});
