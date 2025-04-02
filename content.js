// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "showSummary") {
    showSummaryModal();
  }
});

// Function to extract main content from the page
function extractMainContent() {
  // Try to find main content containers
  const possibleContainers = [
    document.querySelector('article'),
    document.querySelector('main'),
    document.querySelector('.content'),
    document.querySelector('.post'),
    document.querySelector('.article')
  ];
  
  // Use the first valid container or fallback to body
  const container = possibleContainers.find(el => el !== null) || document.body;
  
  // Extract text
  let text = container.innerText;
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// Function to inject the modal
function showSummaryModal() {
  // Check if modal already exists - if so, remove it
  const existingModal = document.getElementById('quicksummary-modal-container');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // Create a container for the modal
  const modalContainer = document.createElement('div');
  modalContainer.id = 'quicksummary-modal-container';
  modalContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  `;
  
  // Create the modal itself
  const modal = document.createElement('div');
  modal.id = 'quicksummary-modal';
  modal.style.cssText = `
    background-color: white;
    width: 80%;
    max-width: 700px;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 80vh;
  `;
  
  // Create the modal header
  const modalHeader = document.createElement('div');
  modalHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e0e0e0;
  `;
  
  const headerTitle = document.createElement('h2');
  headerTitle.textContent = 'Page Summary';
  headerTitle.style.cssText = `
    margin: 0;
    font-size: 24px;
    font-weight: 500;
  `;
  
  const optionsButton = document.createElement('button');
  optionsButton.textContent = '⚙️';
  optionsButton.title = 'Settings';
  optionsButton.style.cssText = `
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    margin-right: 16px;
    color: #555;
  `;
  optionsButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: "openOptions" });
  });
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #333;
    padding: 0;
    line-height: 1;
  `;
  closeButton.addEventListener('click', function() {
    document.body.removeChild(modalContainer);
  });
  
  modalHeader.appendChild(headerTitle);
  modalHeader.appendChild(optionsButton);
  modalHeader.appendChild(closeButton);
  
  // Create the modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  `;
  
  // Create summary container
  const summaryContainer = document.createElement('div');
  
  const pageTitle = document.createElement('h3');
  pageTitle.id = 'page-title';
  pageTitle.style.cssText = `
    font-size: 18px;
    margin-top: 0;
    margin-bottom: 16px;
    word-break: break-word;
    font-weight: 500;
    line-height: 1.3;
  `;
  
  const summaryText = document.createElement('div');
  summaryText.id = 'summary-text';
  summaryText.style.cssText = `
    line-height: 1.6;
    color: #333;
    margin-bottom: 20px;
  `;
  
  summaryContainer.appendChild(pageTitle);
  summaryContainer.appendChild(summaryText);
  modalContent.appendChild(summaryContainer);
  
  // Create follow-up container
  const followUpContainer = document.createElement('div');
  followUpContainer.style.cssText = `
    margin-top: 20px;
    padding-top: 10px;
  `;
  
  const followUpMessages = document.createElement('div');
  followUpMessages.id = 'follow-up-messages';
  followUpMessages.style.cssText = `
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 16px;
  `;
  
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    display: flex;
    border: 1px solid #ddd;
    border-radius: 24px;
    overflow: hidden;
  `;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'follow-up-input';
  input.placeholder = 'Ask a follow-up question...';
  input.style.cssText = `
    flex: 1;
    padding: 12px 16px;
    border: none;
    outline: none;
    font-size: 16px;
    font-family: 'IBM Plex Sans', sans-serif;
  `;
  
  const sendButton = document.createElement('button');
  sendButton.id = 'send-question';
  sendButton.innerHTML = '&#10140;'; // Right arrow character
  sendButton.style.cssText = `
    background: none;
    border: none;
    padding: 0 16px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  inputContainer.appendChild(input);
  inputContainer.appendChild(sendButton);
  
  followUpContainer.appendChild(followUpMessages);
  followUpContainer.appendChild(inputContainer);
  modalContent.appendChild(followUpContainer);
  
  // Assemble the modal
  modal.appendChild(modalHeader);
  modal.appendChild(modalContent);
  modalContainer.appendChild(modal);
  
  // Add to the page
  document.body.appendChild(modalContainer);
  
  // Add event listener for clicking outside the modal
  modalContainer.addEventListener('click', function(event) {
    if (event.target === modalContainer) {
      document.body.removeChild(modalContainer);
    }
  });
  
  // Generate the summary
  generateSummary();
  
  // Add event listeners for follow-up questions
  sendButton.addEventListener('click', sendFollowUpQuestion);
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendFollowUpQuestion();
    }
  });
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

// Function to generate the summary using OpenAI
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
  const limitedContent = pageContent.slice(0, 4000);
  
  // Get API key and settings from storage
  chrome.storage.sync.get(
    ['apiKey', 'model', 'summaryLength', 'summaryStyle', 'customPrompt'], 
    function(items) {
      if (!items.apiKey) {
        const optionsUrl = chrome.runtime.getURL('options.html');
        
        // Method 1: Direct link to options (most reliable)
        summaryText.innerHTML = `Please set your OpenAI API key in the extension options. <a href="#" id="open-options">Open Options</a>`;
        
        // Use setTimeout to ensure the element exists
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
      
      // Prepare the API request
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${items.apiKey}`
        },
        body: JSON.stringify({
          model: items.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Please summarize the following web page content in about ${wordCount} words. Create a well-structured summary that's easy to read. Use bullet points (not numbered lists) for any lists, clear paragraphs, and simple language:\n\n${limitedContent}`
            }
          ]
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Extract the summary from the API response
        const summary = data.choices[0].message.content;
        
        // Format the markdown to HTML
        summaryText.innerHTML = formatMarkdownToHtml(summary);
        
        // Add some additional styling to the summary elements
        const summaryContainer = summaryText.parentElement;
        
        // Style any lists that were created
        const lists = summaryContainer.querySelectorAll('ul');
        lists.forEach(list => {
          list.style.paddingLeft = '28px';
          list.style.marginTop = '12px';
          list.style.marginBottom = '12px';
        });
        
        // Style individual list items
        const listItems = summaryContainer.querySelectorAll('li');
        listItems.forEach(item => {
          item.style.marginBottom = '6px';
          item.style.paddingLeft = '4px';
        });
        
        // Style headings
        const headings = summaryContainer.querySelectorAll('h1, h2, h3');
        headings.forEach(heading => {
          heading.style.marginTop = '18px';
          heading.style.marginBottom = '10px';
          heading.style.color = '#333';
          
          if (heading.tagName === 'H1') {
            heading.style.fontSize = '20px';
          } else if (heading.tagName === 'H2') {
            heading.style.fontSize = '18px';
          } else {
            heading.style.fontSize = '16px';
          }
        });
        
        // Add spacing between paragraphs
        const paragraphs = summaryText.innerHTML.split('<br><br>');
        if (paragraphs.length > 1) {
          summaryText.innerHTML = paragraphs.join('<div style="margin-bottom: 14px;"></div>');
        }
      })
      .catch(error => {
        console.error('Error generating summary:', error);
        summaryText.textContent = `Error generating summary: ${error.message}. Please check your API key or try again later.`;
      });
    }
  );
}

// Function to handle follow-up questions using OpenAI
function sendFollowUpQuestion() {
  const inputElement = document.getElementById('follow-up-input');
  const question = inputElement.value.trim();
  
  if (!question) return;
  
  // Clear the input
  inputElement.value = '';
  
  // Display user question
  addMessage(question, 'user');
  
  // Get conversation history for context
  const messagesContainer = document.getElementById('follow-up-messages');
  const messageElements = messagesContainer.querySelectorAll('.message');
  
  // Build conversation history (limit to last 5 messages)
  let history = [];
  const maxMessages = Math.min(messageElements.length, 5);
  for (let i = messageElements.length - maxMessages; i < messageElements.length; i++) {
    const message = messageElements[i];
    const role = message.classList.contains('user-message') ? 'user' : 'assistant';
    history.push({
      role: role,
      content: message.textContent
    });
  }
  
  // Get API key from storage
  chrome.storage.sync.get(['apiKey', 'model'], function(items) {
    if (!items.apiKey) {
      addMessage('API key is not set. Please check the extension options.', 'ai');
      return;
    }
    
    // Prepare the API request
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${items.apiKey}`
      },
      body: JSON.stringify({
        model: items.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant answering questions about a web page the user is viewing. Keep answers concise and focused on the question. Use markdown formatting for clear responses, with bullet points (never numbered lists), bold text, and structure when appropriate. Always use "-" for lists instead of numbers.'
          },
          ...history
        ]
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Extract the answer from the API response
      const answer = data.choices[0].message.content;
      
      // Format the markdown in the answer to HTML
      const formattedAnswer = formatMarkdownToHtml(answer);
      
      // Add the formatted answer
      addMessage(formattedAnswer, 'ai', true);
    })
    .catch(error => {
      console.error('Error sending question:', error);
      addMessage(`Error: ${error.message}. Please check your API key or try again later.`, 'ai');
    });
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
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    max-width: 80%;
    ${sender === 'user' ? 'margin-left: auto; background-color: #f0f0f0;' : 'background-color: #f5f7fa;'}
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
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}