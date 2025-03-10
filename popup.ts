import {OpenAI} from "openai";

class OpenAICompletions {
  private openai: OpenAI | null = null;
  private apiKeyContainer: HTMLElement | null = null;
  private chatContainer: HTMLElement | null = null;
  private inputContainer: HTMLElement | null = null;
  private apiKeyArea: HTMLTextAreaElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null;

  constructor() {
    document.addEventListener("DOMContentLoaded", () => {
      this.init()
    })
  }

  /**
   * Initializes the popup window by setting up event listeners, calling necessary functions, and checking for required elements.
   *
   * @remarks
   * This function is responsible for handling the initial setup of the popup window. It ensures that the necessary elements are present,
   * sets up event listeners for user interactions, and calls other functions to handle API key storage, container display, and chat functionality.
   *
   * @returns {Promise<void>} - A promise that resolves when the initialization process is complete.
   */
  private async init() {
    this.apiKeyContainer = document.getElementById("apikey-container")
    this.inputContainer = document.getElementById("input-container")
    this.chatContainer = document.getElementById("chat-container")
    this.apiKeyArea = document.querySelector(".apikey-area") as HTMLTextAreaElement
    this.inputTextArea = document.querySelector(".textarea-expand") as HTMLTextAreaElement
    this.loadHistory()
    if (this.apiKeyArea) {
      this.apiKeyArea.addEventListener("keydown", (event) => this.handleApiKey(event))
    }

    this.setContainer()

    if (this.inputTextArea) {
      this.inputTextArea.addEventListener("keydown", (event) => this.handleChatGpt(event));
    }
  }

  /**
   * Appends a message to the chat container with the specified sender and text.
   *
   * @remarks
   * This function creates a new div element, sets its class based on the sender,
   * converts the text to HTML using the `markdownToHTML` function, and appends it to the chat container.
   * It also scrolls the chat container to the bottom to show the new message.
   *
   * @param sender - The sender of the message. It can be either "user" or "bot".
   * @param text - The text content of the message.
   *
   * @returns {void} - This function does not return any value.
   */
  private appendMessage(sender: "user" | "bot", text: string): void {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
    messageDiv.innerHTML = this.markdownToHTML(text);
    this.chatContainer.appendChild(messageDiv);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  /**
   * Handles the user input for the API key and initializes the OpenAI instance.
   *
   * @remarks
   * This function is called when the user presses the Enter key while focused on the API key input area.
   * It retrieves the API key value from the input area, validates it, and initializes the OpenAI instance.
   * If the API key is valid, it hides the API key input area and displays the chat input area.
   *
   * @param event - The keyboard event that triggered this function.
   * @returns {Promise<void>} - A promise that resolves when the API key handling process is complete.
   */
  private async handleApiKey(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      const apiKeyValue = this.apiKeyArea?.value
      if (apiKeyValue && this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        await this.chromeStorageSet('key', apiKeyValue)
        this.openai = new OpenAI({ apiKey: apiKeyValue, dangerouslyAllowBrowser: true }); // Initialize OpenAI instance
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
      }
    }
  }

  private markdownToHTML(text: string): string {
    return text
    .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>') // H3 Headers
    .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')  // H2 Headers
    .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')   // H1 Headers
    .replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>') // Code blocks
    .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
    .replace(/\*(.*?)\*/g, '<i>$1</i>') // Italic
    .replace(/__(.*?)__/g, '<b>$1</b>') // Bold (alternative)
    .replace(/_(.*?)_/g, '<i>$1</i>') // Italic (alternative)
    .replace(/\n/g, "<br>"); // New lines
  }

  private async handleChatGpt(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const chatGptInput = this.inputTextArea?.value
      if (chatGptInput && this.inputTextArea instanceof HTMLTextAreaElement) {
        if (!this.openai) {
          const apiKey = await this.chromeStorageGet('key');
          this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true }); // Initialize OpenAI instance if not already initialized
        }
        const res = await this.chatGpt(chatGptInput)
        this.appendMessage("user", chatGptInput)
        this.appendMessage("bot", res)
        this.inputTextArea.value = ""; // Clear input field
        this.inputTextArea.style.height = "30px"; // Reset height
        this.saveHistory()
      }
    }
  }

  private async setContainer() {
    const apiKey = await this.chromeStorageGet('key')
    if (!apiKey) {
      if (this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        this.apiKeyContainer.style.display = "block"
        this.inputContainer.style.display = "none"
      }
    } else {
      if (this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
      }
    }
  }

  
private saveHistory(): void {
  chrome.storage.local.set({ chatHistory: this.chatContainer.innerHTML });
}

private loadHistory(): void {
  chrome.storage.local.get("chatHistory", (data) => {
      if (data.chatHistory) {
          this.chatContainer.innerHTML = data.chatHistory;
      }
  });
}

  private async chromeStorageSet(key: string, value: string): Promise<void> {
    return new Promise<void>(resolve => {
      chrome.storage.local.set({[key]: value}, () => {
        resolve()
      })
    })
  };
  
  private async chromeStorageGet(key: string): Promise<string> {
    return new Promise<string>(resolve => {
      chrome.storage.local.get(key, result => {
        this.openai = new OpenAI({apiKey: result.key, dangerouslyAllowBrowser: true})
        resolve(result.key)
      })
    })
  }
  
  private async chatGpt(textContent: string): Promise<string> {
    if (!this.openai) {
      return "Error: OpenAI missing"
    }

    let model = "gpt-4o-mini"
  
    const completions = await this.openai.chat.completions.create({
      model: model,
      store: true,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
            role: "user",
            content: textContent,
        },
      ],
    })

    return completions.choices[0].message.content || "No response from openai"
  }
  
  private exitChatGPT(): void {
    chrome.storage.local.clear(() => {})
  }
}

new OpenAICompletions()