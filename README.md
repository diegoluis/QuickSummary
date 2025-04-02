# QuickSummary Chrome Extension

QuickSummary is a powerful Chrome extension that uses OpenAI's GPT models to generate concise, well-structured summaries of web pages. It also supports interactive follow-up questions about the content.

## Features

- 🤖 AI-powered page summaries using OpenAI's GPT models
- 📝 Customizable summary length (short, medium, long)
- 🎨 Different summary styles (concise, analytical, simple, detailed)
- ❓ Interactive follow-up questions about the content
- 🎯 Smart content extraction from various webpage layouts
- 📱 Clean, modern user interface
- ⚙️ Customizable settings and prompts

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Configuration

1. Click the extension icon in your Chrome toolbar
2. Click the settings (⚙️) icon
3. Enter your OpenAI API key
4. Customize your preferred settings:
   - Summary length
   - Summary style
   - Custom prompts
   - GPT model selection

## Usage

1. Navigate to any webpage you want to summarize
2. Click the QuickSummary extension icon
3. Wait for the AI to generate a summary
4. Ask follow-up questions about the content if needed

## Development

### Project Structure

```
QuickSummary/
├── manifest.json      # Extension configuration
├── content.js         # Main content script
├── background.js      # Background service worker
├── popup.html         # Extension popup interface
├── popup.js          # Popup functionality
├── options.html      # Settings page
├── options.js        # Settings functionality
├── modal.html        # Summary modal template
├── modal.css         # Modal styles
├── modal.js          # Modal functionality
└── icons/            # Extension icons
```

### Building

This extension doesn't require any build process. Simply load the directory as an unpacked extension in Chrome.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT API
- Chrome Extension APIs
- All contributors who have helped improve this extension 