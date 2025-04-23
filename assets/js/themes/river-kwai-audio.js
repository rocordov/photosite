/**
 * River Kwai Theme - Audio Controls
 * Adds ambient audio to enhance the River Kwai gallery experience
 */

document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on the river-kwai theme
  if (!document.body.classList.contains('river-kwai-theme')) return;
  
  // Create audio component
  function initAudioControl() {
    // Create audio element
    const audioEl = document.createElement('audio');
    audioEl.id = 'ambient-audio';
    audioEl.loop = true;
    audioEl.volume = 0.2; // Start with low volume
    audioEl.innerHTML = `
      <source src="../../../assets/audio/jungle-ambient.mp3" type="audio/mpeg">
      Your browser does not support the audio element.
    `;
    document.body.appendChild(audioEl);
    
    // Create audio control button
    const audioControl = document.createElement('div');
    audioControl.className = 'audio-control muted';
    audioControl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M16 21c3.527-1.547 5.999-5.074 5.999-9.223 0-4.341-2.749-8.051-6.579-9.499"></path>
        <path d="M12 1v22l-7-5H1V6h4l7-5z"></path>
      </svg>
    `;
    document.body.appendChild(audioControl);
    
    // Track audio state
    let isPlaying = false;
    
    // Handle audio toggle
    audioControl.addEventListener('click', () => {
      if (isPlaying) {
        audioEl.pause();
        audioControl.classList.add('muted');
        localStorage.setItem('riverKwaiAudio', 'muted');
      } else {
        // Start with a fade-in
        audioEl.volume = 0;
        audioEl.play()
          .then(() => {
            // Fade in volume
            let vol = 0;
            const interval = setInterval(() => {
              vol += 0.02;
              if (vol >= 0.2) {
                vol = 0.2;
                clearInterval(interval);
              }
              audioEl.volume = vol;
            }, 100);
            
            audioControl.classList.remove('muted');
            localStorage.setItem('riverKwaiAudio', 'playing');
          })
          .catch(err => {
            // Handle autoplay restrictions
            console.log('Audio autoplay was prevented:', err);
            audioControl.classList.add('muted');
          });
      }
      
      isPlaying = !isPlaying;
    });
    
    // Check user preference
    const savedPreference = localStorage.getItem('riverKwaiAudio');
    if (savedPreference === 'playing') {
      // Don't autoplay immediately - wait for interaction
      audioControl.classList.add('ready-to-play');
      
      // Listen for first interaction with page
      const startAudioOnInteraction = () => {
        if (audioControl.classList.contains('ready-to-play')) {
          audioControl.click();
          audioControl.classList.remove('ready-to-play');
        }
        
        // Remove these listeners once audio has started
        document.removeEventListener('click', startAudioOnInteraction);
        document.removeEventListener('touchstart', startAudioOnInteraction);
        document.removeEventListener('scroll', startAudioOnInteraction);
      };
      
      document.addEventListener('click', startAudioOnInteraction);
      document.addEventListener('touchstart', startAudioOnInteraction);
      document.addEventListener('scroll', startAudioOnInteraction);
    }
  }
  
  // Initialize audio on page load
  initAudioControl();
});
