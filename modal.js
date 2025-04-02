// Initialize variables
let pageData = null;

// Listen for messages from the content script
window.addEventListener('message', function(event) {
  if (event.data.action === "generateSummary") {
    pageData = event.data.data;
    generateSummary(pageData);
  }
});

// Close button event listener
document.getElementById('close-modal').addEventListener('click', function() {
  window.parent.postMessage({ action: "closeModal" }, "*");
});

// Send question button event listener
document.getElementById('send-question').addEventListener('click', function() {
  sendFollowUpQuestion();
});

// Enter key event listener for the input field
document.getElementById('follow-up-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendFollowUpQuestion();
  }
});

// Function to generate the initial summary
function generateSummary(data) {
  // Set the page title
  document.getElementById('page-title').textContent = 
    `Summary of ${data.title || data.url}`;
  
  // Display loading state
  document.getElementById('summary-text').textContent = "Generating summary...";
  
  // In a real implementation, you would call an AI service here
  // For this demo, we'll simulate an API call with a timeout
  setTimeout(() => {
    // Sample summary - in a real implementation, this would come from an AI service
    const sampleSummary = `This webpage discusses the importance of AI-powered summarization tools for improving productivity and information retention. It highlights how such tools can help users quickly understand the main points of articles, research papers, and other web content without having to read everything in detail. The article specifically mentions benefits for students, researchers, and busy professionals who need to process large amounts of information efficiently.

The page also covers the technical aspects of how modern summarization algorithms work, explaining the difference between extractive summarization (which pulls out important sentences) and abstractive summarization (which generates new text to capture the essence of the content). It evaluates the strengths and limitations of current AI summarization technologies and discusses future improvements.`;
    
    document.getElementById('summary-text').textContent = sampleSummary;
  }, 1500);
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
  
  // In a real implementation, you would send this to an AI service
  // For this demo, we'll simulate a response
  setTimeout(() => {
    // Sample responses - in a real implementation, these would come from an AI service
    const responses = [
      "The article mentions that extractive summarization works by identifying and extracting key sentences, while abstractive summarization generates entirely new text to capture the main ideas.",
      "According to the page, the main benefits are time-saving, improved comprehension, and better information retention, especially for students and researchers.",
      "The limitations discussed include occasional misinterpretation of context, difficulties with highly technical content, and sometimes missing important nuances in the original text."
    ];
    
    // Pick a random response for the demo
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addMessage(randomResponse, 'ai');
  }, 1000);
}

// Function to add a message to the conversation
function addMessage(text, sender) {
  const messagesContainer = document.getElementById('follow-up-messages');
  const messageElement = document.createElement('div');
  
  messageElement.className = `message ${sender}-message`;
  messageElement.textContent = text;
  
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}