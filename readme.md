# ChatGPT Chrome Extension

[extension]: chrome://extensions/

A Chrome extension that integrates with OpenAI's ChatGPT to provide conversational AI capabilities directly in your browser.

## Features

- **Chat with ChatGPT**: Ask questions and get responses directly in the extension.
- **Model Selection**: Choose between different GPT models (e.g., `gpt-4o-mini`, `gpt-4o`).
- **Context Selection**: Switch between contexts like `assistant`, `coding`, and `codewars`.
- **Codewars Integration**: Automatically scrape content from Codewars when on a Codewars problem page.
- **Clear Chat History**: Easily clear your chat history with a single button click.

## Installation

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/your-username/ChatGPT-Chrome-Extension.git
   make build
   ```

2. Open [extension], toggle developer mode on, load unpacked dist file created by vite