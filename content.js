// Cache for storing summaries
let summaryCache = {
  data: null,
  timestamp: null,
  url: null
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showSummary") {
    showSummaryModal();
  }
});

// Function to show the summary modal
function showSummaryModal() {
  // Check if modal already exists
  const existingModal = document.getElementById('quicksummary-modal-container');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.id = 'quicksummary-modal-container';
  modalContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 25vw;
    height: 100vh;
    z-index: 999999;
    pointer-events: none;
    box-shadow: -1px 0 0 #e9ecef;
  `;

  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'quicksummary-resize-handle';
  resizeHandle.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    cursor: col-resize;
    pointer-events: auto;
  `;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('modal.html');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    pointer-events: auto;
  `;

  // Add resize handle and iframe to container
  modalContainer.appendChild(resizeHandle);
  modalContainer.appendChild(iframe);
  document.body.appendChild(modalContainer);

  // Add resize functionality
  let isResizing = false;
  let startX;
  let startWidth;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = modalContainer.offsetWidth;
    
    // Add overlay to prevent iframe from capturing mouse events during resize
    const overlay = document.createElement('div');
    overlay.id = 'quicksummary-resize-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000000;
      cursor: col-resize;
    `;
    document.body.appendChild(overlay);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const width = document.documentElement.clientWidth;
    const newWidth = width - e.clientX;
    
    // Limit minimum and maximum width
    const minWidth = 300;
    const maxWidth = Math.min(800, width * 0.8);
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      modalContainer.style.width = newWidth + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      const overlay = document.getElementById('quicksummary-resize-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  });

  // Wait for iframe to load
  iframe.onload = () => {
    // Extract main content
    const content = extractMainContent();
    
    // Send content to iframe
    iframe.contentWindow.postMessage({
      type: 'content',
      content: content
    }, '*');
  };

  // Listen for messages from iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'closeModal') {
      modalContainer.remove();
    } else if (event.data.type === 'getContent') {
      // Send content back to iframe
      event.source.postMessage({
        type: 'content',
        content: extractMainContent()
      }, '*');
    }
  });
}

// Function to extract main content from the page
function extractMainContent() {
  // Try to find the main content container
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.article',
    '.post',
    '.content',
    '#content',
    '#main',
    '.main'
  ];

  let content = '';
  let title = document.title;

  // Try each selector
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Get text content and clean it up
      content = element.textContent
        .replace(/\s+/g, ' ')
        .trim();
      break;
    }
  }

  // If no content found, get all text from body
  if (!content) {
    content = document.body.textContent
      .replace(/\s+/g, ' ')
      .trim();
  }

  return {
    title: title,
    content: content
  };
}

// Markdown to HTML formatter function
function formatMarkdownToHtml(markdownText) {
  return markdownText
    // Headers
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Bullet lists (including converting numbered lists to bullet points)
    .replace(/^\s*[-*]\s(.*$)/gm, '<li>$1</li>')
    .replace(/^\s*\d+\.\s(.*$)/gm, '<li>$1</li>') // Convert numbered lists to regular list items
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    // Paragraphs
    .replace(/\n\n(?!<)/g, '<br><br>')
    // Clean up any duplicate list tags
    .replace(/<\/ul>\s*<ul>/g, '');
}

// Function to generate the summary using selected API provider
function generateSummary() {
  const pageTitle = document.getElementById('page-title');
  const summaryText = document.getElementById('summary-text');
  
  // Set the page title
  pageTitle.textContent = `Summary of ${document.title || window.location.href}`;
  
  // Display loading state
  summaryText.textContent = "Generating summary...";
  
  // Get the page content to summarize
  const pageContent = extractMainContent();
  
  // Limit content to avoid token limits (first 4000 characters)
  const limitedContent = pageContent.content.slice(0, 4000);
  
  // Get API settings from storage
  chrome.storage.sync.get(
    ['apiProvider', 'openai', 'anthropic', 'deepseek', 'summaryLength', 'summaryStyle', 'customPrompt'], 
    function(items) {
      const provider = items.apiProvider || 'openai';
      const providerSettings = items[provider];
      
      if (!providerSettings || !providerSettings.apiKey) {
        const optionsUrl = chrome.runtime.getURL('options.html');
        summaryText.innerHTML = `Please set your ${provider.toUpperCase()} API key in the extension options. <a href="#" id="open-options">Open Options</a>`;
        
        setTimeout(() => {
          const openOptionsLink = document.getElementById('open-options');
          if (openOptionsLink) {
            openOptionsLink.addEventListener('click', function(e) {
              e.preventDefault();
              try {
                chrome.runtime.sendMessage({ action: "openOptions" });
              } catch (err) {
                console.error("Error sending message:", err);
                window.open(optionsUrl, '_blank');
              }
            });
          }
        }, 50);
        
        return;
      }
      
      // Build the prompt based on settings
      let systemPrompt;
      let wordCount;
      
      // Set word count based on length preference
      switch(items.summaryLength || 'medium') {
        case 'short':
          wordCount = 100;
          break;
        case 'long':
          wordCount = 250;
          break;
        case 'medium':
        default:
          wordCount = 150;
      }
      
      // Set style-specific instructions
      let styleInstructions = '';
      switch(items.summaryStyle || 'detailed') {
        case 'concise':
          styleInstructions = 'Focus only on the most essential information. Be direct and to the point.';
          break;
        case 'analytical':
          styleInstructions = 'Analyze the content critically. Identify key arguments, evidence, and implications.';
          break;
        case 'simple':
          styleInstructions = 'Use simple language suitable for a general audience. Avoid jargon and complex terms.';
          break;
        case 'detailed':
        default:
          styleInstructions = 'Provide a balanced summary with both main points and important details.';
      }
      
      // Use custom prompt if provided, otherwise build from settings
      if (items.customPrompt) {
        systemPrompt = items.customPrompt;
      } else {
        systemPrompt = `You are an expert summarizer that creates well-formatted, easy-to-read summaries. 
        Format your summaries with:
        - Clear paragraphs with line breaks between them
        - Bullet points for key items and lists (always use bullet points with "-" instead of numbered lists)
        - Headings when appropriate to organize information
        - Bold text for important terms or concepts
        
        ${styleInstructions}
        
        Keep your language clear, concise, and engaging. Focus on extracting the most important information while maintaining readability.
        
        Always use proper markdown formatting in your response:
        - Use # for main headings
        - Use - for bullet points (never use numbered lists)
        - Use **text** for bold text
        - Use *text* for italic text
        - Use line breaks between paragraphs`;
      }
      
      try {
        // Create API service instance
        const apiService = new APIService(provider, providerSettings.apiKey, providerSettings.model);
        
        // Generate summary
        apiService.generateCompletion([
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please summarize the following web page content in about ${wordCount} words. Create a well-structured summary that's easy to read. Use bullet points (not numbered lists) for any lists, clear paragraphs, and simple language:\n\n${limitedContent}`
          }
        ])
        .then(summary => {
          // Format and cache the summary
          const formattedSummary = formatMarkdownToHtml(summary);
          
          // Cache the summary
          summaryCache.data = formattedSummary;
          summaryCache.timestamp = Date.now();
          summaryCache.url = window.location.href;
          
          // Display the summary
          summaryText.innerHTML = formattedSummary;
        })
        .catch(error => {
          console.error('Error generating summary:', error);
          summaryText.textContent = `Error generating summary: ${error.message}. Please check your API key or try again later.`;
        });
      } catch (error) {
        console.error('Error initializing API service:', error);
        summaryText.textContent = `Error: ${error.message}. Please check your settings and try again.`;
      }
    }
  );
}

// Function to handle follow-up questions
function sendFollowUpQuestion() {
  const inputElement = document.getElementById('follow-up-input');
  const question = inputElement.value.trim();
  
  if (!question) return;
  
  // Clear the input
  inputElement.value = '';
  
  // Display user question
  addMessage(question, 'user');
  
  // Get the page content for context
  const pageContent = extractMainContent();
  const limitedContent = pageContent.content.slice(0, 4000);
  
  // Get API settings from storage
  chrome.storage.sync.get(['apiProvider', 'openai', 'anthropic', 'deepseek'], function(items) {
    const provider = items.apiProvider || 'openai';
    const providerSettings = items[provider];
    
    if (!providerSettings || !providerSettings.apiKey) {
      addMessage(`Please set your ${provider.toUpperCase()} API key in the extension options.`, 'ai');
      return;
    }
    
    try {
      // Create API service instance
      const apiService = new APIService(provider, providerSettings.apiKey, providerSettings.model);
      
      // Send question
      apiService.generateCompletion([
        {
          role: 'system',
          content: `You are a helpful assistant answering questions about a specific article. Your answers must be based ONLY on the content provided in the article. If the information is not present in the article, respond with "I apologize, but that information is not present in the article." Do not use any external knowledge or make assumptions. Keep answers concise and focused on the question.`
        },
        {
          role: 'user',
          content: `Here is the article content:\n\n${limitedContent}\n\nPlease answer this question based ONLY on the article content: ${question}`
        }
      ])
      .then(answer => {
        // Format and display the answer
        const formattedAnswer = formatMarkdownToHtml(answer);
        addMessage(formattedAnswer, 'ai', true);
      })
      .catch(error => {
        console.error('Error sending question:', error);
        addMessage(`Error: ${error.message}. Please check your API key or try again later.`, 'ai');
      });
    } catch (error) {
      console.error('Error initializing API service:', error);
      addMessage(`Error: ${error.message}. Please check your settings and try again.`, 'ai');
    }
  });
}

// Function to add a message to the conversation
function addMessage(text, sender, isHTML = false) {
  const messagesContainer = document.getElementById('follow-up-messages');
  const messageElement = document.createElement('div');
  
  messageElement.className = `message ${sender}-message`;
  
  if (isHTML) {
    messageElement.innerHTML = text;
  } else {
    messageElement.textContent = text;
  }
  
  messageElement.style.cssText = `
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 85%;
    ${sender === 'user' 
      ? 'margin-left: auto; background-color: #007bff; color: white;' 
      : 'background-color: #f0f0f0; color: #333;'}
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `;
  
  // Style lists in AI messages
  if (isHTML && sender === 'ai') {
    setTimeout(() => {
      const lists = messageElement.querySelectorAll('ul, ol');
      lists.forEach(list => {
        list.style.paddingLeft = '24px';
        list.style.marginTop = '8px';
        list.style.marginBottom = '8px';
      });
      
      const headings = messageElement.querySelectorAll('h1, h2, h3');
      headings.forEach(heading => {
        heading.style.marginTop = '12px';
        heading.style.marginBottom = '8px';
        heading.style.fontSize = '16px';
      });
    }, 10);
  }
  
  messagesContainer.appendChild(messageElement);
  
  // Scroll the modal content instead of the messages container
  const modalContent = document.querySelector('#quicksummary-modal > div');
  if (modalContent) {
    modalContent.scrollTop = modalContent.scrollHeight;
  }
}