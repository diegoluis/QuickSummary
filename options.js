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

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', function() {
  if (validateSettings()) {
    saveOptions();
  }
});

document.getElementById('apiProvider').addEventListener('change', function(e) {
  updateProviderSection(e.target.value);
});

document.getElementById('resetPrompt').addEventListener('click', function() {
  document.getElementById('customPrompt').value = '';
});

// Save settings to chrome.storage
function saveOptions() {
  const provider = document.getElementById('apiProvider').value;
  
  const settings = {
    apiProvider: provider,
    openai: {
      apiKey: document.getElementById('openaiKey')?.value || '',
      model: document.getElementById('openaiModel')?.value || 'gpt-3.5-turbo'
    },
    gemini: {
      apiKey: document.getElementById('geminiKey')?.value || '',
      model: document.getElementById('geminiModel')?.value || 'gemini-pro'
    },
    anthropic: {
      apiKey: document.getElementById('anthropicKey')?.value || '',
      model: document.getElementById('anthropicModel')?.value || 'claude-3-sonnet'
    },
    deepseek: {
      apiKey: document.getElementById('deepseekKey')?.value || '',
      model: document.getElementById('deepseekModel')?.value || 'deepseek-chat'
    },
    summaryLength: document.getElementById('summaryLength')?.value || 'medium',
    summaryStyle: document.getElementById('summaryStyle')?.value || 'detailed',
    customPrompt: document.getElementById('customPrompt')?.value || ''
  };

  chrome.storage.sync.set(settings, function() {
    showStatus('Settings saved successfully!', 'success');
  });
}

// Restore settings from chrome.storage
function restoreOptions() {
  const defaultSettings = {
    apiProvider: 'openai',
    openai: { apiKey: '', model: 'gpt-3.5-turbo' },
    gemini: { apiKey: '', model: 'gemini-pro' },
    anthropic: { apiKey: '', model: 'claude-3-sonnet' },
    deepseek: { apiKey: '', model: 'deepseek-chat' },
    summaryLength: 'medium',
    summaryStyle: 'detailed',
    customPrompt: ''
  };

  chrome.storage.sync.get(defaultSettings, function(items) {
    try {
      // Safely set values with null checks
      const setElementValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
          element.value = value || '';
        }
      };

      setElementValue('apiProvider', items.apiProvider);
      setElementValue('openaiKey', items.openai?.apiKey);
      setElementValue('openaiModel', items.openai?.model);
      setElementValue('geminiKey', items.gemini?.apiKey);
      setElementValue('geminiModel', items.gemini?.model);
      setElementValue('anthropicKey', items.anthropic?.apiKey);
      setElementValue('anthropicModel', items.anthropic?.model);
      setElementValue('deepseekKey', items.deepseek?.apiKey);
      setElementValue('deepseekModel', items.deepseek?.model);
      setElementValue('summaryLength', items.summaryLength);
      setElementValue('summaryStyle', items.summaryStyle);
      setElementValue('customPrompt', items.customPrompt);
      
      // Show active provider section
      updateProviderSection(items.apiProvider);
    } catch (error) {
      console.error('Error restoring options:', error);
      showStatus('Error loading settings. Please try again.', 'error');
    }
  });
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    if (type === 'success') {
      setTimeout(function() {
        status.style.display = 'none';
      }, 3000);
    }
  }
}

// Update visible provider section
function updateProviderSection(provider) {
  try {
    // Hide all provider sections
    document.querySelectorAll('.provider-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show selected provider section
    const selectedSection = document.getElementById(`${provider}-section`);
    if (selectedSection) {
      selectedSection.classList.add('active');
    }
  } catch (error) {
    console.error('Error updating provider section:', error);
  }
}

// Validate settings before saving
function validateSettings() {
  const provider = document.getElementById('apiProvider')?.value;
  const apiKeyElement = document.getElementById(`${provider}Key`);
  
  if (!provider || !apiKeyElement) {
    showStatus('Error: Invalid provider selection.', 'error');
    return false;
  }

  const apiKey = apiKeyElement.value?.trim();
  
  if (!apiKey) {
    showStatus(`Please enter your ${provider.toUpperCase()} API key.`, 'error');
    return false;
  }
  
  // Provider-specific validation
  switch (provider) {
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        showStatus('Invalid OpenAI API key. Keys should start with "sk-".', 'error');
        return false;
      }
      break;
    case 'anthropic':
      if (!apiKey.startsWith('sk-ant-')) {
        showStatus('Invalid Anthropic API key. Keys should start with "sk-ant-".', 'error');
        return false;
      }
      break;
    case 'gemini':
      if (!apiKey.startsWith('AIza')) {
        showStatus('Invalid Google API key. Keys should start with "AIza".', 'error');
        return false;
      }
      break;
  }
  
  return true;
}