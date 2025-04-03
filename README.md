# QuickSummary Chrome Extension

QuickSummary is a powerful Chrome extension that generates concise summaries of web pages using various AI providers. It offers a flexible, multi-API approach allowing users to choose their preferred AI service.

## Features

- **Multi-API Support**: Choose from multiple AI providers:
  - OpenAI (GPT-3.5/4)
  - Google Gemini
  - Anthropic Claude
  - DeepSeek

- **Customizable Summaries**:
  - Adjustable length (short, medium, long)
  - Different styles (concise, detailed, analytical, simple)
  - Custom system prompts for advanced users

- **Interactive Features**:
  - Follow-up questions about the article
  - Real-time responses based on article content
  - Cached summaries for faster access

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Configuration

1. Click the extension icon and select "Options" or right-click and choose "Options"
2. Choose your preferred API provider
3. Enter your API key for the selected provider
4. Select your preferred model
5. Customize summary length and style
6. Save your settings

### API Provider Setup

#### OpenAI
- Visit [OpenAI API Keys](https://platform.openai.com/account/api-keys)
- Create an account or sign in
- Generate a new API key (starts with 'sk-')
- Available models: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo

#### Google Gemini
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Sign in with your Google account
- Create an API key (starts with 'AIza')
- Available models: Gemini Pro (text), Gemini Pro Vision (text & image)

#### Anthropic Claude
- Visit [Anthropic Console](https://console.anthropic.com/account/keys)
- Create an account or sign in
- Generate an API key (starts with 'sk-ant-')
- Available models: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

#### DeepSeek
- Visit [DeepSeek Platform](https://platform.deepseek.com/)
- Create an account or sign in
- Generate an API key
- Available models: DeepSeek Chat, DeepSeek Coder

## Usage

1. Navigate to any webpage you want to summarize
2. Click the QuickSummary extension icon
3. Wait for the summary to generate
4. Use the follow-up questions feature to ask specific questions about the article

### Summary Customization

- **Length Options**:
  - Short: ~100 words
  - Medium: ~150 words (default)
  - Long: ~250+ words

- **Style Options**:
  - Concise: Essential information only
  - Detailed: Balanced coverage (default)
  - Analytical: Critical analysis
  - Simple: Easy-to-understand language

## Advanced Features

### Custom Prompts
Advanced users can create custom system prompts in the options page to tailor the summary generation to their specific needs.

### Caching
The extension caches summaries for previously visited pages to provide instant access when revisiting them.

## Technical Details

- Built with vanilla JavaScript
- Uses Chrome Storage API for settings management
- Implements a unified API service layer for multiple providers
- Supports markdown formatting in summaries
- Includes error handling and validation for API keys

## Security

- API keys are stored securely in Chrome's storage system
- All API communications use HTTPS
- No data is stored on external servers
- API keys are validated for format before saving

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue in the GitHub repository. 