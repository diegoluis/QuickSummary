// Cache for storing summaries
let summaryCache = {
  data: null,
  timestamp: null,
  url: null
};

// Store the last content for regenerating summaries
let lastContent = null;

// Initialize the modal
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('send-question').addEventListener('click', sendFollowUpQuestion);
  document.getElementById('generate-summary').addEventListener('click', () => {
    if (lastContent) {
      // Show loading state
      document.getElementById('summary-text').innerHTML = `
        <div class="loading">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="animate-spin">
            <path d="M12 4.75V6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17.1266 6.87347L16.0659 7.93413" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.25 12H17.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17.1266 17.1265L16.0659 16.0659" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 19.25V17.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.87347 17.1265L7.93413 16.0659" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4.75 12H6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.87347 6.87347L7.93413 7.93413" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="margin-left: 12px">Generating new summary...</span>
        </div>
      `;
      
      // Clear the cache
      summaryCache = {
        data: null,
        timestamp: null,
        url: null
      };
      
      // Generate new summary
      generateSummary(lastContent);
    }
  });
  document.getElementById('follow-up-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendFollowUpQuestion();
    }
  });
  document.getElementById('settings-button').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openOptions' });
  });

  // Listen for messages from the content script
  window.addEventListener('message', (event) => {
    if (event.data.type === 'content') {
      lastContent = event.data.content;
      loadOrGenerateSummary(event.data.content);
    }
  });
});

// Close the modal
async function closeModal() {
  // Save the current summary to storage before closing
  if (summaryCache.data) {
    const key = `summary_${window.location.href}`;
    await chrome.storage.local.set({
      [key]: summaryCache
    });
  }
  window.parent.postMessage({ type: 'closeModal' }, '*');
}

// Load existing summary or generate new one
async function loadOrGenerateSummary(content) {
  try {
    // Show loading state
    document.getElementById('summary-text').innerHTML = `
      <div class="loading">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="animate-spin">
          <path d="M12 4.75V6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17.1266 6.87347L16.0659 7.93413" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19.25 12H17.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17.1266 17.1265L16.0659 16.0659" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 19.25V17.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.87347 17.1265L7.93413 16.0659" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4.75 12H6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.87347 6.87347L7.93413 7.93413" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="margin-left: 12px">Loading summary...</span>
      </div>
    `;

    // Check for cached summary in storage
    const key = `summary_${window.location.href}`;
    const result = await chrome.storage.local.get(key);
    const cached = result[key];

    if (cached && cached.url === window.location.href) {
      // Use cached summary
      summaryCache = cached;
      document.getElementById('summary-text').innerHTML = formatMarkdownToHtml(cached.data);
    } else {
      // Generate new summary
      generateSummary(content);
    }

  } catch (error) {
    console.error('Error loading summary:', error);
    document.getElementById('summary-text').innerHTML = `
      <div class="error-message">
        Error loading summary: ${error.message}
      </div>
    `;
  }
}

// Generate summary using the API service
async function generateSummary(content) {
  try {
    // Get API settings from storage
    const settings = await chrome.storage.sync.get([
      'apiProvider',
      'openai',
      'anthropic',
      'deepseek',
      'gemini',
      'summaryLength',
      'summaryStyle',
      'customPrompt'
    ]);

    // Check if API key is set
    const apiKey = settings[settings.apiProvider]?.apiKey;
    if (!apiKey) {
      document.getElementById('summary-text').innerHTML = `
        <div class="error-message">
          Please set your API key in the extension options.
          <br><br>
          <a href="chrome-extension://${chrome.runtime.id}/options.html" target="_blank">Open Options</a>
        </div>
      `;
      return;
    }

    // Build the system prompt
    const wordCount = settings.summaryLength || 'medium';
    const style = settings.summaryStyle || 'concise';
    const customPrompt = settings.customPrompt || '';
    
    const systemPrompt = customPrompt || `
      You are an expert summarizer that creates well-formatted, easy-to-read summaries.
      Format your summaries with:
      - Clear paragraphs with line breaks between them
      - Bullet points for key items and lists (always use bullet points with "-" instead of numbered lists)
      - Headings when appropriate to organize information
      - Bold text for important terms or concepts
      
      Please provide a ${wordCount} summary in a ${style} style.
      Keep your language clear, concise, and engaging.
      Focus on extracting the most important information while maintaining readability.
    `;

    // Create messages array for the API
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Please summarize the following text:\n\n${content.content}`
      }
    ];

    // Create API service instance with model selection
    const providerSettings = settings[settings.apiProvider];
    const apiService = new APIService(
      settings.apiProvider, 
      apiKey,
      providerSettings?.model
    );
    
    // Generate summary
    const response = await apiService.generateCompletion(messages);
    
    // Format and display the summary
    const formattedSummary = formatMarkdownToHtml(response);
    document.getElementById('summary-text').innerHTML = formattedSummary;
    
    // Cache the summary
    summaryCache = {
      data: response,
      timestamp: Date.now(),
      url: window.location.href
    };

  } catch (error) {
    console.error('Error generating summary:', error);
    document.getElementById('summary-text').innerHTML = `
      <div class="error-message">
        Error generating summary: ${error.message}
      </div>
    `;
  }
}

// Send follow-up question
async function sendFollowUpQuestion() {
  const input = document.getElementById('follow-up-input');
  const question = input.value.trim();
  
  if (!question) return;
  
  // Add user question to the chat
  addMessageToChat('user', question);
  input.value = '';
  
  try {
    // Get API settings from storage
    const settings = await chrome.storage.sync.get([
      'apiProvider',
      'openai',
      'anthropic',
      'deepseek',
      'gemini'
    ]);

    // Check if API key is set
    const apiKey = settings[settings.apiProvider]?.apiKey;
    if (!apiKey) {
      addMessageToChat('assistant', 'Please set your API key in the extension options.');
      return;
    }

    // Create API service instance with model selection
    const providerSettings = settings[settings.apiProvider];
    const apiService = new APIService(
      settings.apiProvider,
      apiKey,
      providerSettings?.model
    );
    
    // Create messages array for the API
    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant answering questions about a specific article. 
        Your answers must be based ONLY on the content provided in the article. 
        If the information is not present in the article, respond with "I apologize, but that information is not present in the article." 
        Do not use any external knowledge or make assumptions. 
        Keep answers concise and focused on the question.`
      },
      {
        role: 'user',
        content: `Here is the article content:\n\n${lastContent.content}\n\nPlease answer this question based ONLY on the article content: ${question}`
      }
    ];

    // Generate response
    const response = await apiService.generateCompletion(messages);
    
    // Add response to the chat
    addMessageToChat('assistant', response);

  } catch (error) {
    console.error('Error sending follow-up question:', error);
    addMessageToChat('assistant', `Error: ${error.message}`);
  }
}

// Add a message to the chat
function addMessageToChat(role, content) {
  const messagesContainer = document.getElementById('follow-up-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  messageDiv.innerHTML = formatMarkdownToHtml(content);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format markdown to HTML
function formatMarkdownToHtml(text) {
  // Basic markdown formatting
  return text
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}