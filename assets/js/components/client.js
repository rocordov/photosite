    
    // Function to manually test data collection
    async function dataCollection() {
        // First, force DEBUG = true in our customizations script
        window.SESSION_TRACKER_DEBUG = true;
        
        // Load the customizations.js script dynamically
        const script = document.createElement('script');
        script.src = './assets/js/components/customizations.js';
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise(resolve => {
          script.onload = resolve;
          script.onerror = () => {
            throw new Error('Failed to load customizations.js');
          };
        });    
        const sessionData = localStorage.getItem('debug_session_data');
    }
    
    // Function to reset session storage
    function resetSessionStorage() {
      sessionStorage.removeItem('session_details_stored');
      localStorage.removeItem('debug_session_data');
    }
    resetSessionStorage();
    dataCollection();
