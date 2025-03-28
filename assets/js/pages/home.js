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
  "“Trying to define yourself is like trying to bite your own teeth.” — Alan Watts",
  "“Man suffers only because he takes seriously what the gods made for fun.” — Alan Watts",
  "“We seldom realize that our most private thoughts and emotions are not actually our own.” — Alan Watts",
  "“The meaning of life is just to be alive. It is so plain and so obvious and so simple.” — Alan Watts",
  "“This is the real secret of life—to be completely engaged with what you are doing in the here and now.” — Alan Watts",
  "“Muddy water is best cleared by leaving it alone.” — Alan Watts",
  "“Advice? I don’t have advice. Stop aspiring and start writing.” — Alan Watts",
  "“To have faith is to trust yourself to the water. When you swim you don't grab hold of it—if you do, you sink; instead, you relax and float.” — Alan Watts",
  "“The only way to make sense out of change is to plunge into it, move with it, and join the dance.” — Alan Watts",
  "“You are an aperture through which the universe is looking at and exploring itself.” — Alan Watts",
  "“Through our eyes, the universe is perceiving itself; through our ears, it is listening to its harmonies.” — Alan Watts",
  "“The menu is not the meal.” — Alan Watts",
  "“You are a function of what the whole universe is doing, just as a wave is a function of what the whole ocean is doing.” — Alan Watts",
  "“I have realized that the past and the future are illusions; only the present exists—and that is all there is.” — Alan Watts",
  "“The more a thing tends to be permanent, the more it tends to be lifeless.” — Alan Watts",
  "“We are living in a culture entirely hypnotized by the illusion of time.” — Alan Watts",
  "“Jesus Christ knew he was God. So wake up and eventually find out who you really are.” — Alan Watts",
  "“The art of living is neither drifting carelessly nor clinging fearfully to the past—it is being fully alive in the present.” — Alan Watts",
  "“Try to imagine what it will be like to go to sleep and never wake up... then imagine waking up having never slept.” — Alan Watts",
  "“Problems that remain persistently insoluble are often simply questions asked in the wrong way.” — Alan Watts",
  "“Things are as they are. When you gaze at the universe at night, you make no comparisons between right and wrong stars.” — Alan Watts",
  "“Tomorrow and plans for tomorrow have no significance unless you are in full contact with the reality of the present.” — Alan Watts",
  "“A scholar tries to learn something every day; a student of Buddhism tries to unlearn something daily.” — Alan Watts",
  "“We do not come into this world; we come out of it, as leaves from a tree.” — Alan Watts",
  "“It’s like throwing a bottle of ink at a wall: it splatters in fascinating patterns.” — Alan Watts",
  "“Every intelligent individual wants to know what makes him tick, yet finds that understanding oneself is the most elusive task of all.” — Alan Watts",
  "“Imagine being able to dream for 75 years in a single night—and then dreaming the life you live today.” — Alan Watts",
  "“Life is like music for its own sake. We live in an eternal now, just as a melody is experienced in every note.” — Alan Watts",
  "“When we try to exercise power or control over someone else, we inevitably give them the same power over us.” — Alan Watts",
  "“We have forgotten that thoughts and words are merely conventions—tools to describe reality, not reality itself.” — Alan Watts",
  "“I owe my solitude to other people.” — Alan Watts",
  "“You don't look out there for God; you look within yourself.” — Alan Watts",
  "“The ego is nothing other than the focus of your conscious attention.” — Alan Watts",
  "“Never pretend to a love which you do not actually feel; love cannot be commanded.” — Alan Watts",
  "“Listen carefully, and you’ll discover that there is no past, no future—only the eternal present.” — Alan Watts",
  "“You are under no obligation to be the same person you were five minutes ago.” — Alan Watts",
  "“Existence is a dance—an endlessly spontaneous expression that needs no explanation.” — Alan Watts",
  "“The reason you don't know what you want is because you already have it.” — Alan Watts",
  "“Intellectualizing life only creates a gap between you and the living moment.” — Alan Watts",
  "“The mundane and the sacred are one and the same.” — Alan Watts",
  "“Don’t overcomplicate the beauty of existence—simply be.” — Alan Watts",
  "“If you try to catch the flow of a river with a bucket, you only grasp a part of its essence.” — Alan Watts",
  "“We are the universe experiencing itself in a myriad of forms.” — Alan Watts",
  "“The secret of life is to live in harmony with the unfolding moment.” — Alan Watts",
  "“True wisdom arises when you let go of trying to understand it all.” — Alan Watts",
  "“The past and future are mere illusions—only the present is real.” — Alan Watts",
  "“To understand life, you must learn to let go of the need to understand it.” — Alan Watts",
  "“Happiness is not a destination but a way of experiencing the journey.” — Alan Watts",
  "“Simplicity is the ultimate sophistication.” — Alan Watts",
  "“Our consciousness is but a brief flicker in the eternal now.” — Alan Watts",
  "“We define ourselves by what society tells us, but that is only a shadow of our true being.” — Alan Watts",
  "“Allow the natural flow of life to guide you rather than resisting its course.” — Alan Watts",
  "“When you try to control everything, you miss the beauty of spontaneous life.” — Alan Watts",
  "“Your true self is beyond all labels and definitions.” — Alan Watts",
  "“The more you cling, the more you lose; the more you let go, the more you gain.” — Alan Watts",
  "“To know yourself is to realize you are the universe in motion.” — Alan Watts",
  "“Meditation is not an escape from life—it is the process of fully experiencing it.” — Alan Watts",
  "“The mind is a marvelous servant but a terrible master.” — Alan Watts",
  "“Our ideas about ourselves are simply constructs of society.” — Alan Watts",
  "“In every moment there lies a spark of the divine.” — Alan Watts",
  "“The self is a process, not a static entity.” — Alan Watts",
  "“Reality is like a mirror—it reflects back what you project onto it.” — Alan Watts",
  "“Life is a series of natural and spontaneous changes; don’t fight them.” — Alan Watts",
  "“All efforts to fix life only disturb its inherent flow.” — Alan Watts",
  "“The universe unfolds exactly as it should; trust in its process.” — Alan Watts",
  "“Every experience is a part of the cosmic dance.” — Alan Watts",
  "“Don’t take life too seriously; none of us get out alive anyway.” — Alan Watts",
  "“The pursuit of security is itself the greatest insecurity.” — Alan Watts",
  "“True freedom is found when you release the need to control.” — Alan Watts",
  "“In stillness, the secrets of the universe are revealed.” — Alan Watts",
  "“You are not a drop in the ocean—you are the entire ocean in a drop.” — Alan Watts",
  "“The ego is a construct that limits your infinite potential.” — Alan Watts",
  "“Embrace uncertainty and live fully in the moment.” — Alan Watts",
  "“The future is merely a concept; there is no such thing as tomorrow.” — Alan Watts",
  "“Happiness isn’t pursued—it arises naturally when you are at peace.” — Alan Watts",
  "“The only true security lies in the impermanence of life.” — Alan Watts",
  "“Life is not a destination but an ongoing unfolding of experiences.” — Alan Watts",
  "“To be truly free, you must release your self-imposed limitations.” — Alan Watts",
  "“The mystery of life is not to be solved but to be experienced.” — Alan Watts",
  "“All existence is interconnected—each moment is woven into the tapestry of the universe.” — Alan Watts",
  "“Overanalyzing life blinds you to its inherent beauty.” — Alan Watts",
  "“Wisdom comes not from accumulating facts but from understanding their limits.” — Alan Watts",
  "“Every moment invites you to experience life fully.” — Alan Watts",
  "“Your perceptions are colored by your beliefs—but they are not the ultimate truth.” — Alan Watts",
  "“Every breath is a reminder of the miracle of existence.” — Alan Watts",
  "“Enlightenment is the realization that there is no separation between you and the universe.” — Alan Watts",
  "“When you let go of self-importance, you discover your true strength.” — Alan Watts",
  "“Art is the expression of the eternal in a fleeting moment.” — Alan Watts",
  "“Reality cannot be fully captured in words; it must be lived.” — Alan Watts",
  "“The more you try to control life, the more chaotic it becomes.” — Alan Watts",
  "“In the end, only the present moment matters.” — Alan Watts",
  "“Every individual is an expression of the Whole, like branches on a tree.” — Alan Watts",
  "“The universe loves you—even when you forget it.” — Alan Watts",
  "“Listening deeply opens the door to understanding yourself and the world.” — Alan Watts",
  "“The illusion of separateness is the root of all suffering.” — Alan Watts",
  "“To be in tune with life, align yourself with the rhythms of nature.” — Alan Watts",
  "“Life is the dance of existence, and you are its dancer.” — Alan Watts",
  "“Every end is simply the beginning of something new.” — Alan Watts",
  "“The beauty of life lies in its constant change.” — Alan Watts",
  "“Allow your actions to flow naturally without rigid structure.” — Alan Watts",
  "“The pursuit of perfection is an endless, ever-changing journey.” — Alan Watts",
  "“You are the universe playing hide and seek with itself.” — Alan Watts",
  "“Only when you surrender to life can you truly live.” — Alan Watts",
  "“Every experience, whether joyous or painful, is a chance to grow.” — Alan Watts",
  "“Live fully by embracing the unknown.” — Alan Watts",
  "“Your inner self is a vast, uncharted territory waiting to be explored.” — Alan Watts",
  "“Don’t let your mind create boundaries that aren’t truly there.” — Alan Watts",
  "“The dance of life is most beautiful when you let go of control.” — Alan Watts",
  "“Every moment holds the potential for revelation.” — Alan Watts",
  "“The secret to happiness is to stop chasing it and let it find you.” — Alan Watts",
  "“Your existence is a gift; every moment is a treasure.” — Alan Watts",
  "“The universe is an endless play of energy and form.” — Alan Watts",
  "“Life is not about arriving but about the journey itself.” — Alan Watts",
  "“To experience true joy, be present in every moment.” — Alan Watts",
  "“The wisdom of life isn’t in accumulating knowledge but in embracing simplicity.” — Alan Watts",
  "“Freedom comes from releasing the need to always be right.” — Alan Watts",
  "“Your true nature lies beyond words and thoughts.” — Alan Watts",
  "“Resisting change only intensifies suffering.” — Alan Watts",
  "“Let go of the illusion of control, and let life flow naturally.” — Alan Watts",
  "“Life is like a river—it flows, and you must learn to move with it.” — Alan Watts",
  "“The joy of living is found in embracing life’s continuous unfolding.” — Alan Watts",
  "“Even the smallest moment holds infinite possibilities.” — Alan Watts",
  "“Stop trying to be perfect; start being your true self.” — Alan Watts",
  "“When you embrace uncertainty, you open yourself to life’s wonders.” — Alan Watts",
  "“The mind is a powerful tool—but it can also confine you.” — Alan Watts",
  "“True love isn’t forced; it emerges naturally when you’re true to yourself.” — Alan Watts",
  "“Every moment is a chance to renew yourself.” — Alan Watts",
  "“Happiness is a byproduct of living authentically.” — Alan Watts",
  "“The universe is playful—don’t take it too seriously.” — Alan Watts",
  "“To know the truth, let go of the need to know everything.” — Alan Watts",
  "“When you stop seeking, you begin to find.” — Alan Watts",
  "“The beauty of life is its constant evolution.” — Alan Watts",
  "“There is magic in the ordinary if you take the time to notice it.” — Alan Watts",
  "“Your perceptions shape your reality—but they are not reality itself.” — Alan Watts",
  "“The universe is a mirror reflecting back what you project.” — Alan Watts",
  "“Don’t confuse the map with the territory.” — Alan Watts",
  "“Life’s essence is not in accumulating things, but in creating meaningful experiences.” — Alan Watts",
  "“Allow yourself to be surprised by the beauty of the unexpected.” — Alan Watts",
  "“Life is a tapestry woven from countless moments.” — Alan Watts",
  "“When you truly listen, you hear the voice of the universe.” — Alan Watts",
  "“Release your need for certainty, and embrace life’s mystery.” — Alan Watts",
  "“Every heartbeat is a reminder of existence’s miracle.” — Alan Watts",
  "“The present moment is the only moment that truly exists.” — Alan Watts",
  "“There is profound wisdom in simplicity.” — Alan Watts",
  "“The journey of life is measured by depth, not distance.” — Alan Watts",
  "“In every struggle lies the seed of growth.” — Alan Watts",
  "“To be alive is to be in a constant state of becoming.” — Alan Watts",
  "“Look beyond appearances to discover the deeper truth.” — Alan Watts",
  "“Our lives are interconnected like threads in an immense tapestry.” — Alan Watts",
  "“True freedom comes from embracing your authentic self.” — Alan Watts",
  "“Let go of the past and fear not the future; live fully in the now.” — Alan Watts",
  "“In the silence of your heart, you will find the answers.” — Alan Watts",
  "“Every breath you take is a gift.” — Alan Watts",
  "“Life is a celebration of the present moment.” — Alan Watts",
  "“Find joy in the little things—they are the essence of life.” — Alan Watts",
  "“The path to enlightenment is paved with awareness and presence.” — Alan Watts",
  "“Immerse yourself in life, and your experience will be richer for it.” — Alan Watts",
  "“Your inner light shines brightest when you ignore external validation.” — Alan Watts",
  "“Embrace life’s paradoxes; they reveal deeper truths.” — Alan Watts",
  "“When you surrender to the flow, you become one with the universe.” — Alan Watts",
  "“Wisdom is knowing the limits of your own knowledge.” — Alan Watts",
  "“Do not try to control the uncontrollable; simply be present.” — Alan Watts",
  "“Your soul reflects the infinite.” — Alan Watts",
  "“The universe is an endless dance of creation and dissolution.” — Alan Watts",
  "“What you perceive as limits are merely challenges in disguise.” — Alan Watts",
  "“The true voyage of discovery is to see with new eyes.” — Alan Watts",
  "“The pursuit of knowledge without wisdom is like a ship without a rudder.” — Alan Watts",
  "“Every moment of awareness brings you closer to liberation.” — Alan Watts",
  "“The beauty of existence lies in its impermanence.” — Alan Watts",
  "“Don’t just exist—live fully in every moment.” — Alan Watts",
  "“Each day is a blank page in the story of your life.” — Alan Watts",
  "“The present holds the key to infinite possibilities.” — Alan Watts",
  "“True power lies in letting go, not in holding on.” — Alan Watts",
  "“The ego is an illusion that limits your true potential.” — Alan Watts",
  "“Let your heart be your guide and trust your journey.” — Alan Watts",
  "“Every action is a thread in the fabric of the universe.” — Alan Watts",
  "“The most profound truths are often the simplest.” — Alan Watts",
  "“When you see the interconnectedness of all things, compassion naturally follows.” — Alan Watts",
  "“Life is a spontaneous creation—celebrate its unpredictability.” — Alan Watts",
  "“Living authentically means honoring the mystery of your own existence.” — Alan Watts",
  "“Every moment is a fresh start.” — Alan Watts",
  "“Joy is not bought—it is experienced in living fully.” — Alan Watts",
  "“The universe does not owe you an explanation; it simply is.” — Alan Watts",
  "“Step into the present, where life unfolds in its truest form.” — Alan Watts",
  "“Your existence is a dynamic process—embrace its constant evolution.” — Alan Watts",
  "“Within every challenge lies the seed for transformation.” — Alan Watts",
  "“Let go of perfection and find beauty in imperfection.” — Alan Watts",
  "“When you are fully present, you tap into infinite wisdom.” — Alan Watts",
  "“Peace comes from accepting life as it is, without judgment.” — Alan Watts",
  "“Your mind is a tool—use it to observe, not to control.” — Alan Watts",
  "“Every ending is the beginning of something new.” — Alan Watts",
  "“In the interplay of light and shadow, life finds meaning.” — Alan Watts",
  "“To truly live, experience the world without preconceptions.” — Alan Watts",
  "“The universe speaks in symbols and silence—learn to listen.” — Alan Watts",
  "“There is profound joy in simply being.” — Alan Watts",
  "“The more you let go, the more you become.” — Alan Watts",
  "“Insight comes not by searching, but by experiencing life directly.” — Alan Watts",
  "“The beauty of the moment is revealed when you cease to hold onto it.” — Alan Watts",
  "“Embrace the flow of life and trust that you are exactly where you need to be.” — Alan Watts",
  "“Remember, you are not separate from the universe—you are the universe experiencing itself.” — Alan Watts"
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
