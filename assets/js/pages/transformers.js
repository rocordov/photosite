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
    model: 'Xenova/SmolLM2-135M-Instruct',
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.9,
    repetition_penalty: 1.2,
    typingSpeed: 20,
    useTypingEffect: true,
    systemPrompt: `You are a helpful, friendly AI assistant running directly in the user's browser using the Transformers.js library. You're designed to be concise but informative.`,
    auth_token: localStorage.getItem('hf_token') // Get token from localStorage
};

// Suppress source map warnings specifically in production
if (!CONFIG.debugMode) {
    const originalConsoleError = console.error;
    console.error = (message, ...args) => {
        if (typeof message === 'string' && message.includes('.map') && message.includes('Failed to load resource')) {
            return; // Suppress source map errors
        }
        originalConsoleError(message, ...args); // Log other errors
    };

    const originalConsoleWarn = console.warn;
    console.warn = (message, ...args) => {
        if (typeof message === 'string' && message.includes('.map')) {
            return; // Suppress source map warnings
        }
        originalConsoleWarn(message, ...args); // Log other warnings
    };
}

// Ensure debugMode is defined in CONFIG
if (typeof CONFIG.debugMode === 'undefined') {
    CONFIG.debugMode = false; // Default to production mode
}

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

        const token = localStorage.getItem('hf_token');
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
            progress_callback: (data) => {
                const progress = ((data.loaded / data.total) * 100).toFixed(2);
                const downloadedMB = (data.loaded / (1024 * 1024)).toFixed(2);
                const totalMB = (data.total / (1024 * 1024)).toFixed(2);

                Debug.log(`Loading: ${progress}% (${downloadedMB}MB / ${totalMB}MB)`);
                Debug.log(`Status: ${data.status}`);

                UI.updateProgressBar(progress);
                UI.updateLoadingStatus(`Loading: ${progress}%`);
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        try {
            const generator = await pipeline('text-generation', CONFIG.model, modelConfig);
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
    const userMessage = elements.userInput.value.trim();
    
    // Don't send empty messages
    if (!userMessage || !generator) return;
    
    // Add user message to display
    addMessageToChat('user', userMessage);
    
    // Clear input field and reset its height
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    
    // Disable input while generating response
    elements.sendButton.disabled = true;
    elements.userInput.disabled = true;
    
    // Add user message to chat history
    chatHistory.push({ role: 'user', content: userMessage });
    
    try {
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        // Generate response
        const response = await generateResponse(userMessage);
        
        // Remove typing indicator
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Add AI response to chat history
        chatHistory.push({ role: 'assistant', content: response });
        
        // Display AI response with typing effect if enabled
        if (CONFIG.useTypingEffect) {
            await displayWithTypingEffect(response);
        } else {
            addMessageToChat('assistant', response);
        }
    } catch (error) {
        console.error('Error generating response:', error);
        addMessageToChat('assistant', 'I encountered an error generating a response. Please try again.');
    } finally {
        // Re-enable input
        elements.sendButton.disabled = false;
        elements.userInput.disabled = false;
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

// Main initialization function
async function initChatbot() {
    try {
    const token = localStorage.getItem('hf_token');
        if (token) {
            generator = await initializeModel(); // Use authenticated model load
            if (generator) modelReady();
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
