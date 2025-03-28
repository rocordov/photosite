/**
 * Transformers.js Chatbot Implementation
 * 
 * This file implements a client-side AI chatbot using Hugging Face's Transformers.js library.
 * It loads a small, instruction-tuned language model (Xenova/SmolLM2-135M-Instruct) directly 
 * in the browser and uses it to generate responses to user messages.
 * 
 * All processing happens locally in the browser without sending data to external servers.
 */

//import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm';
//import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
//import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0';
//import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1';

// Configuration object
const CONFIG = {
    //model: 'Xenova/SmolLM2-135M-Instruct',
    model: 'onnx-community/SmolLM2-135M-Instruct-ONNX-GQA',
    max_new_tokens: 512,
    temperature: 0.4,
    top_p: 0.8,
    repetition_penalty: 1.2,
    typingSpeed: 20,
    useTypingEffect: true,
    systemPrompt: `You are a helpful, friendly AI assistant running directly in the user's browser using the Transformers.js library. You're designed to be concise but informative.`,
    auth_token: localStorage.getItem('hf_token') // Get token from localStorage
};



// Add this after the CONFIG object definition
function loadSavedSettings() {
    // Load each setting from localStorage, falling back to default values
    CONFIG.model = localStorage.getItem('CONFIG_model') || 'onnx-community/SmolLM2-135M-Instruct-ONNX-GQA';
    CONFIG.max_new_tokens = parseInt(localStorage.getItem('CONFIG_max_new_tokens')) || 512;
    CONFIG.temperature = parseFloat(localStorage.getItem('CONFIG_temperature')) || 0.4;
    CONFIG.top_p = parseFloat(localStorage.getItem('CONFIG_top_p')) || 0.8;
    CONFIG.repetition_penalty = parseFloat(localStorage.getItem('CONFIG_repetition_penalty')) || 1.2;
    CONFIG.typingSpeed = parseInt(localStorage.getItem('CONFIG_typingSpeed')) || 20;
    CONFIG.systemPrompt = localStorage.getItem('CONFIG_systemPrompt') || CONFIG.systemPrompt;
    
    
}

// Suppress source map warnings specifically
if (!CONFIG.debugMode) {
    const originalConsoleError = console.error;
    console.error = (message, ...args) => {
        if (typeof message === 'string' && message.includes('.map') && message.includes('Failed to load resource')) {
            return; // Suppress source map errors
        }
        originalConsoleError(message, ...args); // Log other errors
    };
}
// Load saved settings first
loadSavedSettings();


// DOM Elements
const elements = {
    chatContainer: document.getElementById('chatContainer'),
    conversation: document.getElementById('conversation'),
    conversationContainer: document.getElementById('conversationContainer'),
    userInput: document.getElementById('userInput'),
    sendButton: document.getElementById('sendButton'),
    loadingContainer: document.getElementById('loadingContainer'),
    loadingText: document.getElementById('loadingText'),
    loadingInfo: document.getElementById('loadingInfo'),
    progressBar: document.getElementById('progressBar'),
    modelStatus: document.getElementById('modelStatus'),
    statusText: document.querySelector('.status-text')
};

// Chat history to maintain context
let chatHistory = [];

// Reference to the pipeline once loaded
let generator = null;

// UI state management
const UI = {
    updateLoadingStatus(status) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = status;
        }
    },
    
    updateProgressBar(progress) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
};

// Debug utilities
const Debug = {
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const debugLog = document.getElementById('debugLog');
        if (debugLog) {
            debugLog.innerHTML += `[${timestamp}] ${message}\n`;
            debugLog.scrollTop = debugLog.scrollHeight;
        }
        console.log(`[Debug] ${message}`);
    },
    
    error(message, error) {
        const timestamp = new Date().toLocaleTimeString();
        const debugLog = document.getElementById('debugLog');
        if (debugLog) {
            debugLog.innerHTML += `[${timestamp}] ERROR: ${message}\n${error}\n`;
            debugLog.scrollTop = debugLog.scrollHeight;
        }
        console.error(`[Debug Error] ${message}`, error);
    }
};

// Model initialization with auth
async function initializeModel() {
    try {
        Debug.log('Starting model initialization...');
        UI.updateLoadingStatus('Checking authentication...');

        const token = CONFIG.auth_token;
        if (!token) {
            Debug.log('No authentication token found');
            document.getElementById('authContainer').style.display = 'block';
            document.getElementById('loadingContainer').style.display = 'none';
            return;
        }

        Debug.log('Token found, initializing model...');
        UI.updateLoadingStatus('Loading model...');

        const modelConfig = {
        quantized: true,
        dtype: 'q8',
            progress_callback: (data) => {
                const progress = ((data.loaded / (data.total || 1)) * 100).toFixed(2);
                const downloadedMB = (data.loaded / (1024 * 1024)).toFixed(2);
                const totalMB = (data.total / (1024 * 1024)).toFixed(2);

                //Debug.log(`Loading: ${progress}% (${downloadedMB}MB / ${totalMB}MB)`);
                //Debug.log(`Status: ${data.status || 'downloading'}`);

                UI.updateProgressBar(progress);
                UI.updateLoadingStatus(`Loading: ${progress}%`);
            },
            headers: new Headers({
                'Authorization': `Bearer ${token}`
            })
        };

        try {
            const generator = await pipeline('text-generation', CONFIG.model, modelConfig);
            Debug.log('Model pipeline created successfully!');
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('loadingContainer').style.display = 'none';
            document.getElementById('sendButton').disabled = false;
            document.getElementById('userInput').disabled = false;
            return generator;
        } catch (err) {
            if (err.message.includes('Unauthorized')) {
                Debug.error('Authentication failed. Clearing token.', err);
                localStorage.removeItem('hf_token'); // Clear invalid token
                document.getElementById('authContainer').style.display = 'block';
                UI.updateLoadingStatus('Authentication required. Please login.');

                // Prompt user to re-enter token
                promptForToken();
            } else {
                Debug.error('Error loading model:', err);
            }
            throw err;
        }
    } catch (err) {
        Debug.error('Unexpected error during model initialization:', err);
        throw err;
    }
}

function promptForToken() {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        Debug.log('Setting up login button listener');
        loginButton.addEventListener('click', async () => {
            const token = prompt("Enter your Hugging Face access token:");
            if (token) {
                Debug.log('New token entered, saving...');
                localStorage.setItem('hf_token', token);

                // Try to initialize the model with the new token
                try {
                    document.getElementById('authContainer').style.display = 'none';
                    document.getElementById('loadingContainer').style.display = 'block';
                    UI.updateLoadingStatus('Loading model with new token...');

                    generator = await initializeModel();
                    if (generator) {
                        modelReady();
                        Debug.log('Model loaded successfully with new token!');
                    }
                } catch (error) {
                    modelError(error);
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Debug.log('Page loaded, initializing model...');
    initializeModel();
});

/**
 * Called when model loading progress updates
 */
function progressCallback(progress) {
    // Calculate overall percentage
    const percentage = Math.round((progress.loaded / progress.total) * 100);
    
    // Update progress bar width
    elements.progressBar.style.width = `${percentage}%`;
    
    // Update loading text based on loading stage
    let stage = 'Downloading model files';
    if (progress.status === 'ready') {
        stage = 'Preparing model';
    } else if (progress.status === 'complete') {
        stage = 'Finalizing';
    }
    
    // Update UI
    updateLoadingStatus(`${stage} (${percentage}%)`, 
                      `Downloaded ${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`);
}

/**
 * Called when the model is successfully loaded and ready to use
 */
function modelReady() {
    // Update UI to show model is ready
    elements.sendButton.disabled = false;
    elements.userInput.disabled = false;
    elements.loadingContainer.classList.add('hidden');
    elements.modelStatus.classList.add('model-ready');
    elements.statusText.textContent = 'Ready';
    
    // Focus the input field
    elements.userInput.focus();
    
    console.log('Model loaded successfully and ready to generate text');
    elements.sendButton.classList.remove('disabled');
}

/**
 * Called when there's an error loading or initializing the model
 */
function modelError(error) {
    elements.loadingText.textContent = 'Error loading model';
    elements.loadingInfo.textContent = error.message || 'Please try reloading the page';
    elements.loadingContainer.style.backgroundColor = 'rgba(254, 226, 226, 0.9)';
    elements.modelStatus.classList.add('model-error');
    elements.statusText.textContent = 'Error';

    if (error.message.includes('Unauthorized')) {
        elements.loadingInfo.textContent = 'Authentication failed. Please login again.';
    }

    console.error('Model loading error:', error);
}

/**
 * Update the loading status display
 */
function updateLoadingStatus(text, info) {
    elements.loadingText.textContent = text;
    if (info) {
        elements.loadingInfo.textContent = info;
    }
}

/**
 * Set up event listeners for the chat interface
 */
function setupEventListeners() {
    // Send button click
    elements.sendButton.addEventListener('click', handleSendMessage);
    
    // Enter key in input field
    elements.userInput.addEventListener('keydown', (e) => {
        // Allow Enter to send, but Shift+Enter for new line
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        
        // Auto-resize the textarea as user types
        setTimeout(() => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }, 0);
    });
    
    // Auto-focus input when clicking anywhere in chat container
    elements.chatContainer.addEventListener('click', (e) => {
        // Only focus if we're not clicking on a button or the input itself
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'A') {
            elements.userInput.focus();
        }
    });
}

/**
 * Handle sending a message from the user
 */
async function handleSendMessage() {
    // Prevent multiple submissions
    if (elements.sendButton.disabled) {
        Debug.log('Message submission in progress, ignoring...');
        return;
    }

    const userMessage = elements.userInput.value.trim();
    
    // Don't send empty messages
    if (!userMessage) {
        Debug.log('Empty message, ignoring');
        return;
    }
    
    if (!generator) {
        Debug.error('Model not initialized', 'Cannot send message');
        addMessageToChat('assistant', 'Sorry, the model is not ready yet. Please wait or try refreshing the page.');
        return;
    }
    
    // Disable input and button immediately
    elements.sendButton.disabled = true;
    elements.userInput.disabled = true;
    elements.sendButton.classList.add('disabled');
    
    Debug.log(`Sending message: ${userMessage.substring(0, 50)}...`);
    
    try {
        // Add user message to display
        addMessageToChat('user', userMessage);
        
        // Clear input field and reset its height
        elements.userInput.value = '';
        elements.userInput.style.height = 'auto';
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        Debug.log('Generating response...');
        
        // Generate response
        const response = await generateResponse(userMessage);
        Debug.log('Response generated successfully');
        
        // Remove typing indicator
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Add messages to chat history
        chatHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: response }
        );
        
        // Display AI response
        if (CONFIG.useTypingEffect) {
            await displayWithTypingEffect(response);
        } else {
            addMessageToChat('assistant', response);
        }
    } catch (error) {
        Debug.error('Error generating response:', error);
        addMessageToChat('assistant', 'I encountered an error generating a response. Please try again.');
    } finally {
        // Re-enable input and button
        elements.sendButton.disabled = false;
        elements.userInput.disabled = false;
        elements.sendButton.classList.remove('disabled');
        elements.userInput.focus();
    }
}

/**
 * Generate a response using the loaded model
 */
async function generateResponse(userMessage) {
    try {
        // Combine chat history into a formatted prompt
        const formattedPrompt = formatPrompt(userMessage);
        Debug.log('Formatted prompt:\n' + formattedPrompt); // <-- Add this line
        
        // Generate text using the pipeline
        const result = await generator(formattedPrompt, {
            max_new_tokens: CONFIG.max_new_tokens,
            temperature: CONFIG.temperature,
            top_p: CONFIG.top_p,
            repetition_penalty: CONFIG.repetition_penalty,
            do_sample: true
        });
        
        // Extract the generated text
        let generatedText = result[0].generated_text;
        
        // Remove the prompt from the generated text to get just the response
        generatedText = generatedText.substring(formattedPrompt.length).trim();
        
        // Clean up the response (remove any leftover system prompt markers, etc.)
        generatedText = cleanResponse(generatedText);
        
        return generatedText;
    } catch (error) {
        console.error('Error in text generation:', error);
        throw error;
    }
}

/**
 * Format the prompt to send to the model based on chat history
 */
function formatPrompt(currentUserMessage) {
    // Start with the system prompt
    let prompt = `<|system|>\n${CONFIG.systemPrompt}\n<|user|>\n`;
    
    // Add chat history (limit to last 6 exchanges to fit in context window)
    const limitedHistory = chatHistory.slice(-6);
    
    for (let i = 0; i < limitedHistory.length; i++) {
        const message = limitedHistory[i];
        prompt += `${message.content}\n`;
        
        // Add role marker for next message
        if (i < limitedHistory.length - 1) {
            const nextRole = limitedHistory[i + 1].role === 'user' ? '<|user|>\n' : '<|assistant|>\n';
            prompt += nextRole;
        }
    }
    
    // If current message isn't in history yet, add it
    if (!limitedHistory.length || limitedHistory[limitedHistory.length - 1].content !== currentUserMessage) {
        prompt += `${currentUserMessage}\n<|assistant|>\n`;
    }
    
    return prompt;
}

/**
 * Clean up the response text from the model
 */
function cleanResponse(text) {
    // Remove any role indicators that might have leaked in
    text = text.replace(/<\|user\|>/g, '')
               .replace(/<\|assistant\|>/g, '')
               .replace(/<\|system\|>/g, '');
    
    // Handle potential cutoff at the end of responses
    const endIndex = text.indexOf('<');
    if (endIndex > 0) {
        text = text.substring(0, endIndex).trim();
    }
    
    return text;
}

/**
 * Add a message to the chat display
 */
function addMessageToChat(role, content) {
    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    // Create message content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Parse message content and handle paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        contentDiv.appendChild(p);
    });
    
    // Assemble message
    messageDiv.appendChild(contentDiv);
    elements.conversation.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
}

/**
 * Show typing indicator while the AI is "typing"
 */
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    
    // Add the three dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDiv.appendChild(dot);
    }
    
    elements.conversation.appendChild(typingDiv);
    scrollToBottom();
    
    return typingDiv;
}

/**
 * Display AI response with a typing effect
 */
async function displayWithTypingEffect(text) {
    return new Promise((resolve) => {
        // Create message elements
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Split text into paragraphs
        const paragraphs = text.split('\n').filter(p => p.trim() !== '');
        
        // Create paragraph elements
        const pElements = paragraphs.map(() => {
            const p = document.createElement('p');
            contentDiv.appendChild(p);
            return p;
        });
        
        // Assemble message and add to DOM
        messageDiv.appendChild(contentDiv);
        elements.conversation.appendChild(messageDiv);
        scrollToBottom();
        
        // Variables for the typing effect
        let fullText = '';
        let charIndex = 0;
        let paragraphIndex = 0;
        let currentParagraphText = '';
        
        // Function to simulate typing
        const typeNextChar = () => {
            // If we're at the end of all paragraphs, finish
            if (paragraphIndex >= paragraphs.length) {
                scrollToBottom();
                resolve();
                return;
            }
            
            // Get current paragraph
            const currentParagraph = paragraphs[paragraphIndex];
            
            // If we've typed the full current paragraph, move to the next one
            if (currentParagraphText.length >= currentParagraph.length) {
                paragraphIndex++;
                charIndex = 0;
                currentParagraphText = '';
                typeNextChar();
                return;
            }
            
            // Add the next character
            currentParagraphText += currentParagraph[charIndex];
            pElements[paragraphIndex].textContent = currentParagraphText;
            charIndex++;
            
            // Schedule next character
            scrollToBottom();
            setTimeout(typeNextChar, CONFIG.typingSpeed);
        };
        
        // Start typing
        typeNextChar();
    });
}

/**
 * Scroll the conversation to the bottom
 */
function scrollToBottom() {
    elements.conversationContainer.scrollTop = elements.conversationContainer.scrollHeight;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Remove the import statement and use the global object
//let pipeline;

//async function waitForTransformers() {
//    while (!window.Transformers) {
//        await new Promise(resolve => setTimeout(resolve, 100));
//    }
//    pipeline = window.Transformers.pipeline;
//}

// Update the initChatbot function
async function initChatbot() {
    
    
    // Insert settings panel HTML into chat container
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        chatContainer.insertAdjacentHTML('afterbegin', `
      <button id="toggleSettingsButton" style="margin: 10px; float: right;">⚙️ Settings</button>
      <div id="settingsPanel" class="settings-panel hidden">
        <label>Model:
            <input type="text" id="settingModel" value="${CONFIG.model}">
        </label>
        <label>Max New Tokens:
            <input type="number" id="settingMaxTokens" value="${CONFIG.max_new_tokens}">
        </label>
        <label>Temperature:
            <input type="number" step="0.1" id="settingTemperature" value="${CONFIG.temperature}">
        </label>
        <label>Top P:
            <input type="number" step="0.1" id="settingTopP" value="${CONFIG.top_p}">
        </label>
        <label>Repetition Penalty:
            <input type="number" step="0.1" id="settingRepetition" value="${CONFIG.repetition_penalty}">
        </label>
        <label>Typing Speed (ms):
            <input type="number" id="settingTypingSpeed" value="${CONFIG.typingSpeed}">
        </label>
        <label>System Prompt:
            <textarea id="settingSystemPrompt">${CONFIG.systemPrompt}</textarea>
        </label>
        <button id="saveSettingsButton">Apply Settings</button>
      </div>
        `);
    }

    // Inject CSS for settings panel
    const style = document.createElement('style');
    style.textContent = `
  .settings-panel.hidden {
      display: none;
  }
  .settings-panel {
      padding: 1em;
      border: 1px solid #ccc;
      margin: 1em 0;
      background: #f9f9f9;
  }
  .settings-panel label {
      display: block;
      margin-bottom: 0.5em;
  }
    `;
    document.head.appendChild(style);

    // Set up settings panel event listeners
    document.getElementById('toggleSettingsButton').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.toggle('hidden');
    });

    // Update the save settings event listener
    document.getElementById('saveSettingsButton').addEventListener('click', () => {
        // Save all settings to localStorage
        const newSettings = {
            model: document.getElementById('settingModel').value,
            max_new_tokens: document.getElementById('settingMaxTokens').value,
            temperature: document.getElementById('settingTemperature').value,
            top_p: document.getElementById('settingTopP').value,
            repetition_penalty: document.getElementById('settingRepetition').value,
            typingSpeed: document.getElementById('settingTypingSpeed').value,
            systemPrompt: document.getElementById('settingSystemPrompt').value
        };
        
        // Validate settings before saving
        if (!newSettings.model || !newSettings.max_new_tokens || !newSettings.systemPrompt) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Save to localStorage
        Object.entries(newSettings).forEach(([key, value]) => {
            localStorage.setItem(`CONFIG_${key}`, value);
        });
        
        Debug.log('Settings saved to localStorage');
        alert('Settings saved. The chat will now reload to apply the new configuration.');
        location.reload();
    });

    try {
        Debug.log('Initializing chatbot...');
        // Set up event listeners first
        setupEventListeners();
        Debug.log('Event listeners set up');
        
        const token = CONFIG.auth_token;
        if (token) {
            generator = await initializeModel(); // Use authenticated model load
            if (generator) {
                modelReady();
                Debug.log('Model and chat interface ready');
            }
        } else {
            Debug.log('No token found, showing login prompt...');
            document.getElementById('authContainer').style.display = 'block';
            document.getElementById('loadingContainer').style.display = 'none';
        }
    } catch (error) {
        modelError(error);
    }
}

// Initialize the chatbot when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initChatbot);
