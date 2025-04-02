document.addEventListener('DOMContentLoaded', function() {
    // Load saved options
    chrome.storage.sync.get(['apiKey', 'model', 'summaryLength', 'summaryStyle', 'customPrompt'], function(items) {
      if (items.apiKey) {
        document.getElementById('apiKey').value = items.apiKey;
      }
      if (items.model) {
        document.getElementById('model').value = items.model;
      } else {
        document.getElementById('model').value = 'gpt-3.5-turbo';
      }
      if (items.summaryLength) {
        document.getElementById('summaryLength').value = items.summaryLength;
      }
      if (items.summaryStyle) {
        document.getElementById('summaryStyle').value = items.summaryStyle;
      }
      if (items.customPrompt) {
        document.getElementById('customPrompt').value = items.customPrompt;
      }
    });
    
    // Reset prompt button
    document.getElementById('resetPrompt').addEventListener('click', function() {
      document.getElementById('customPrompt').value = '';
    });
    
    // Save options
    document.getElementById('save').addEventListener('click', function() {
      const apiKey = document.getElementById('apiKey').value.trim();
      const model = document.getElementById('model').value;
      const summaryLength = document.getElementById('summaryLength').value;
      const summaryStyle = document.getElementById('summaryStyle').value;
      const customPrompt = document.getElementById('customPrompt').value.trim();
      
      if (!apiKey) {
        showStatus('Please enter your OpenAI API key.', 'error');
        return;
      }
      
      if (!apiKey.startsWith('sk-')) {
        showStatus('This doesn\'t look like a valid OpenAI API key. Keys typically start with "sk-".', 'error');
        return;
      }
      
      chrome.storage.sync.set({
        apiKey: apiKey,
        model: model,
        summaryLength: summaryLength,
        summaryStyle: summaryStyle,
        customPrompt: customPrompt
      }, function() {
        showStatus('Settings saved successfully! You can now close this tab and use the extension.', 'success');
      });
    });
    
    function showStatus(message, type) {
      const status = document.getElementById('status');
      status.textContent = message;
      status.className = 'status ' + type;
      status.style.display = 'block';
      
      if (type === 'success') {
        setTimeout(function() {
          status.style.display = 'none';
        }, 5000);
      }
    }
  });