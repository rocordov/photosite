/**
 * Customizations.js
 * 
 * This script captures browser/client session details and stores them in Supabase.
 * It runs on every page load through the modular header system and collects:
 * - Browser information (name, version, user agent)
 * - Operating system details
 * - Screen resolution and color depth
 * - Language and timezone
 * - Cookies status and referrer
 * - Authentication data if the user is logged in
 * 
 * The data is stored in the client_session_details table in Supabase.
 */

// Use a self-executing function to avoid polluting the global namespace
(function() {
    'use strict';

    // Control whether to log debug information to console
    const DEBUG = false;

    // Session storage key to prevent multiple submissions per session
    const SESSION_STORAGE_KEY = 'session_details_stored';

    // Check if details were already stored in this session
    // This prevents storing data on every page navigation within the same session
    function alreadyStoredInSession() {
        return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    }

    // Mark as stored in the current session
    function markAsStoredInSession() {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }

    // Debug logging function
    function logDebug(message, data) {
        if (DEBUG) {
            console.log(`[SessionTracker] ${message}`, data || '');
        }
    }

    // Log errors
    function logError(message, error) {
        console.error(`[SessionTracker] ${message}`, error);
    }

    // =================================================================
    // Supabase Integration
    // =================================================================

    let supabase = null;

    /**
     * Initialize the Supabase client
     * - First tries to load the key from a local file
     * - Falls back to a hardcoded anon key if file loading fails
     */
    async function initializeSupabase() {
        try {
            let SUPABASE_ANON_KEY = '';

            // Try to load the key from a file first
            try {
                const response = await fetch('/secrets/supabase.key');
                if (response.ok) {
                    SUPABASE_ANON_KEY = (await response.text()).trim();
                    logDebug('Loaded Supabase key from file');
                }
            } catch (error) {
                // Silently handle file loading errors
                logDebug('Failed to load Supabase key from file, using fallback');
            }

            // Fallback to hardcoded key if we couldn't load from file
            if (!SUPABASE_ANON_KEY) {
                SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZnlwZWVkbG1ncXFodWtqaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk1MzYsImV4cCI6MjA1ODc4NTUzNn0.8qkf2crtzNOUCNpzEm0zMG9eUEkK0ldj48oeN3vdbiQ';
            }

            // Initialize Supabase client
            supabase = window.supabase.createClient(
                'https://yyfypeedlmgqqhukjhbe.supabase.co',
                SUPABASE_ANON_KEY,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                }
            );

            logDebug('Supabase client initialized');
            return true;
        } catch (error) {
            logError('Failed to initialize Supabase client', error);
            return false;
        }
    }

    // =================================================================
    // Session Detail Collection Functions
    // =================================================================

    /**
     * Get browser name and version
     * @returns {Object} Browser info with name and version
     */
    function getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = "Unknown";
        let browserVersion = "";
        
        // Detect browser name and version
        if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Mozilla Firefox";
            browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || "";
        } else if (userAgent.indexOf("SamsungBrowser") > -1) {
            browserName = "Samsung Internet";
            browserVersion = userAgent.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || "";
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
            browserName = "Opera";
            browserVersion = userAgent.indexOf("Opera") > -1 
                ? userAgent.match(/Opera\/([0-9.]+)/)?.[1] || ""
                : userAgent.match(/OPR\/([0-9.]+)/)?.[1] || "";
        } else if (userAgent.indexOf("Edg") > -1) {
            browserName = "Microsoft Edge";
            browserVersion = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || "";
        } else if (userAgent.indexOf("Chrome") > -1) {
            browserName = "Google Chrome";
            browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || "";
        } else if (userAgent.indexOf("Safari") > -1) {
            browserName = "Apple Safari";
            browserVersion = userAgent.match(/Safari\/([0-9.]+)/)?.[1] || "";
        } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
            browserName = "Internet Explorer";
            browserVersion = userAgent.indexOf("MSIE") > -1 
                ? userAgent.match(/MSIE ([0-9.]+)/)?.[1] || ""
                : userAgent.match(/rv:([0-9.]+)/)?.[1] || "";
        }
        
        return {
            name: browserName,
            version: browserVersion
        };
    }

    /**
     * Get operating system details
     * @returns {String} OS name and version
     */
    function getOperatingSystem() {
        const userAgent = navigator.userAgent;
        let osName = "Unknown";
        let osVersion = "";
        
        if (userAgent.indexOf("Win") > -1) {
            osName = "Windows";
            if (userAgent.indexOf("Windows NT 10.0") > -1) osVersion = "10";
            else if (userAgent.indexOf("Windows NT 6.3") > -1) osVersion = "8.1";
            else if (userAgent.indexOf("Windows NT 6.2") > -1) osVersion = "8";
            else if (userAgent.indexOf("Windows NT 6.1") > -1) osVersion = "7";
            else if (userAgent.indexOf("Windows NT 6.0") > -1) osVersion = "Vista";
            else if (userAgent.indexOf("Windows NT 5.1") > -1) osVersion = "XP";
            else if (userAgent.indexOf("Windows NT 5.0") > -1) osVersion = "2000";
        } else if (userAgent.indexOf("Mac") > -1) {
            osName = "macOS";
            // Attempt to extract macOS version
            const macOSVersionMatch = userAgent.match(/Mac OS X ([0-9_]+)/);
            if (macOSVersionMatch) {
                osVersion = macOSVersionMatch[1].replace(/_/g, '.');
            }
        } else if (userAgent.indexOf("Android") > -1) {
            osName = "Android";
            const match = userAgent.match(/Android ([0-9.]+)/);
            if (match) osVersion = match[1];
        } else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
            osName = "iOS";
            // Attempt to extract iOS version
            const iosVersionMatch = userAgent.match(/OS ([0-9_]+)/);
            if (iosVersionMatch) {
                osVersion = iosVersionMatch[1].replace(/_/g, '.');
            }
        } else if (userAgent.indexOf("Linux") > -1) {
            osName = "Linux";
        }
        
        return osVersion ? `${osName} ${osVersion}` : osName;
    }

    /**
     * Get screen resolution and viewport size
     * @returns {String} Screen resolution string
     */
    function getScreenResolution() {
        return `${window.screen.width}x${window.screen.height} (${window.innerWidth}x${window.innerHeight} viewport)`;
    }

    /**
     * Get timezone information
     * @returns {String} Timezone with UTC offset
     */
    function getTimezone() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset();
        const hours = Math.abs(Math.floor(offset / 60));
        const minutes = Math.abs(offset % 60);
        const sign = offset < 0 ? "+" : "-";
        return `${timezone} (UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")})`;
    }

    /**
     * Get user authentication information if available
     * @returns {Promise<Object>} Authentication data or null
     */
    async function getAuthenticationInfo() {
        if (!supabase) {
            return null;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                const user = session.user;
                return {
                    is_authenticated: true,
                    user_id: user.id,
                    auth_provider: user.app_metadata?.provider || null,
                    email: user.email || null,
                    display_name: user.user_metadata?.full_name || null,
                    avatar_url: user.user_metadata?.avatar_url || null
                };
            }
        } catch (error) {
            logError('Failed to get authentication info', error);
        }

        return {
            is_authenticated: false
        };
    }

    /**
     * Collect all client session details
     * @returns {Promise<Object>} All collected details
     */
    async function collectClientSessionDetails() {
        const browser = getBrowserInfo();
        
        // Get auth info (or default to not authenticated)
        const authInfo = await getAuthenticationInfo() || { is_authenticated: false };
        
        // Combine all data
        return {
            // Browser and system data
            browser: `${browser.name} ${browser.version}`,
            os: getOperatingSystem(),
            screen_resolution: getScreenResolution(),
            language: navigator.language || navigator.userLanguage || "Unknown",
            user_agent: navigator.userAgent,
            color_depth: `${window.screen.colorDepth}-bit`,
            timezone: getTimezone(),
            cookies_enabled: navigator.cookieEnabled,
            referring_url: document.referrer || "Direct navigation",
            ip_address: null, // This will be captured server-side by Supabase
            
            // Authentication data
            ...authInfo
        };
    }

    /**
     * Store session details in Supabase database
     * @param {Object} details - The session details to store
     * @returns {Promise<boolean>} Whether storage was successful
     */
    async function storeSessionDetails(details) {
        if (!supabase) {
            logError('Supabase client not initialized');
            return false;
        }

        try {
            const { data, error } = await supabase
                .from('client_session_details')
                .insert([{
                    ...details,
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                throw error;
            }

            logDebug('Session details stored successfully', data);
            return true;
        } catch (error) {
            logError('Failed to store session details', error);
            return false;
        }
    }

    /**
     * Main initialization function - runs when the script loads
     */
    async function initialize() {
        // Check if we've already stored data in this session
        if (alreadyStoredInSession()) {
            logDebug('Session details already stored in this session');
            return;
        }

        try {
            // Check if Supabase JS is loaded
            if (!window.supabase) {
                // Load Supabase JS if not available
                logDebug('Loading Supabase JS client');
                await loadSupabaseClient();
            }

            // Initialize Supabase client
            const initialized = await initializeSupabase();
            if (!initialized) {
                logError('Failed to initialize Supabase');
                return;
            }

            // Collect session details
            const sessionDetails = await collectClientSessionDetails();
            logDebug('Collected session details', sessionDetails);

            // Store details in Supabase
            const stored = await storeSessionDetails(sessionDetails);
            if (stored) {
                markAsStoredInSession();
                logDebug('Session tracking complete');
            }
        } catch (error) {
            logError('Session tracking failed', error);
        }
    }

    /**
     * Load the Supabase JS client dynamically if not already available
     */
    function loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.6/dist/umd/supabase.min.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Supabase client'));
            document.head.appendChild(script);
        });
    }

    // Initialize after the page has loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
