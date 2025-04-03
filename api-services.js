// API Service configurations
const API_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: {
      'gpt-3.5-turbo': { maxTokens: 4096 },
      'gpt-4': { maxTokens: 8192 },
      'gpt-4-turbo': { maxTokens: 128000 }
    },
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (messages, model) => ({
      model: model,
      messages: messages
    }),
    parseResponse: (response) => response.choices[0].message.content
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1/models/',
    models: {
      'gemini-pro': { maxTokens: 30720 },
      'gemini-pro-vision': { maxTokens: 30720 }
    },
    headers: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (messages, model) => {
      // Convert chat format to Gemini format
      const contents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      return {
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };
    },
    parseResponse: (response) => response.candidates[0].content.parts[0].text,
    // Special handling for Gemini API URL
    getUrl: (model, apiKey) => `${API_CONFIGS.gemini.baseUrl}${model}:generateContent?key=${apiKey}`
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: {
      'claude-3-opus': { maxTokens: 200000 },
      'claude-3-sonnet': { maxTokens: 200000 },
      'claude-3-haiku': { maxTokens: 200000 }
    },
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (messages, model) => ({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      max_tokens: 1024
    }),
    parseResponse: (response) => response.content[0].text
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: {
      'deepseek-chat': { maxTokens: 8192 },
      'deepseek-coder': { maxTokens: 8192 }
    },
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (messages, model) => ({
      model: model,
      messages: messages
    }),
    parseResponse: (response) => response.choices[0].message.content
  }
};

// Main API service class
class APIService {
  constructor(provider, apiKey, model) {
    if (!API_CONFIGS[provider]) {
      throw new Error(`Unsupported API provider: ${provider}`);
    }
    this.config = API_CONFIGS[provider];
    this.apiKey = apiKey;
    this.model = model || Object.keys(this.config.models)[0];
    this.provider = provider;
  }

  async generateCompletion(messages) {
    try {
      // Get the appropriate URL (handle special case for Gemini)
      const url = this.provider === 'gemini' 
        ? this.config.getUrl(this.model, this.apiKey)
        : this.config.baseUrl;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.config.headers(this.apiKey),
        body: JSON.stringify(this.config.formatRequest(messages, this.model))
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return this.config.parseResponse(data);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static getAvailableProviders() {
    return Object.keys(API_CONFIGS);
  }

  static getModelsForProvider(provider) {
    return API_CONFIGS[provider] ? Object.keys(API_CONFIGS[provider].models) : [];
  }
} 