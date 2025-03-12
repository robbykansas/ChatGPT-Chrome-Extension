import { ASSISTANT_PROMPT } from "./constant/assistantPrompt";
import { CODING_PROMPT } from "./constant/codingPrompts";
import { CODEWARS_PROMPT } from "./constant/codewarsPrompts";
import { generateText } from "ai";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";

class OpenAICompletions {
  private openai: OpenAIProvider | null = null;
  private apiKeyContainer: HTMLElement | null = null;
  private chatContainer: HTMLElement | null = null;
  private inputContainer: HTMLElement | null = null;
  private selectContainer: HTMLDivElement | null = null;
  private apiKeyArea: HTMLTextAreaElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null;
  private gptModel: HTMLSelectElement | null = null;
  private gptContext: HTMLSelectElement | null = null;

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
    this.selectContainer = document.querySelector(".select-container") as HTMLDivElement
    this.apiKeyArea = document.querySelector(".apikey-area") as HTMLTextAreaElement
    this.inputTextArea = document.querySelector(".textarea-expand") as HTMLTextAreaElement
    this.gptModel = document.querySelector("#gpt-model")
    this.gptContext = document.querySelector("#gpt-context")

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
    console.log(messageDiv, "<<<<<<<<<<<<<<<")
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
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
        this.selectContainer.style.display = "flex"
      }
    }
  }

  /**
   * Converts markdown text to HTML.
   *
   * This function takes a string of markdown text as input and converts it to HTML.
   * It supports various markdown syntax elements such as headers, code blocks, inline code, bold, italic, and new lines.
   *
   * @param text - The markdown text to be converted to HTML.
   * @returns The HTML representation of the input markdown text.
   *
   * @remarks
   * The function uses regular expressions to match and replace the markdown syntax elements with their corresponding HTML tags.
   * The supported markdown syntax elements and their corresponding HTML tags are as follows:
   * - Headers:
   *   - ### Header 3: `### (.*?)(\n|$)` -> `<h3>$1</h3>`
   *   - ## Header 2: `## (.*?)(\n|$)` -> `<h2>$1</h2>`
   *   - # Header 1: `# (.*?)(\n|$)` -> `<h1>$1</h1>`
   * - Code blocks:
   *   - ```code```: ````([\s\S]+?)```` -> `<pre><code>$1</code></pre>`
   * - Inline code:
   *   - `code`: ```(`([^`]+)`)``` -> `<code>$1</code>`
   * - Bold:
   *   - **bold**: `\*\*(.*?)\*\*` -> `<b>$1</b>`
   *   - __bold__: `__(.*?)__` -> `<b>$1</b>`
   * - Italic:
   *   - *italic*: `\*(.*?)\*` -> `<i>$1</i>`
   *   - _italic_: `_(.*?)_` -> `<i>$1</i>`
   * - New lines:
   *   - New line: `\n` -> `<br>`
   */
  private markdownToHTML(text: string): string {
    const codeBlockPlaceholder = 'codeBlockPlaceholder';
    const codeBlocks: string[] = [];
    text = text.replace(/```([\s\S]+?)```/g, (match, p1) => {
      codeBlocks.push(`<pre><code>${this.escapeHTML(p1)}</code></pre>`);
      return codeBlockPlaceholder;
    });

    text = text
      .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>') // H3 Headers
      .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')  // H2 Headers
      .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')   // H1 Headers
      .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
      .replace(/\*(.*?)\*/g, '<i>$1</i>') // Italic
      .replace(/__(.*?)__/g, '<b>$1</b>') // Bold (alternative)
      .replace(/_(.*?)_/g, '<i>$1</i>') // Italic (alternative)
      .replace(/\n/g, "<br>"); // New lines

    text = text.replace(new RegExp(codeBlockPlaceholder, 'g'), () => codeBlocks.shift() || '');

    return text;
  }

  private escapeHTML(str: string): string {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  /**
   * Handles the user input for chat messages and sends them to the OpenAI model for processing.
   *
   * @remarks
   * This function is called when the user presses the Enter key while focused on the chat input area.
   * It retrieves the user's input, validates it, and sends it to the OpenAI model for processing.
   * If the OpenAI instance is not already initialized, it retrieves the API key from storage and initializes the instance.
   * The function then adds a loading indicator to the input area, sends the user's message to the chatGpt function,
   * appends the user's and bot's messages to the chat container, clears the input field, resets the input area's height,
   * and saves the chat history to storage.
   *
   * @param event - The keyboard event that triggered this function.
   * @returns {Promise<void>} - A promise that resolves when the chat handling process is complete.
   */
  private async handleChatGpt(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const chatGptInput = this.inputTextArea?.value
      if (chatGptInput && this.inputTextArea instanceof HTMLTextAreaElement) {
        if (!this.openai) {
          const apiKey = await this.chromeStorageGet('key');
          this.openai = await createOpenAI({
            compatibility: "strict",
            apiKey: apiKey,
          })
        }
        this.appendMessage("user", chatGptInput)
        this.inputTextArea.value = ""; // Clear input field
        const res = await this.chatGpt(chatGptInput)
        this.appendMessage("bot", res)
        this.saveHistory()
      }
    }
  }

  /**
   * Sets the display of the API key and chat input containers based on the availability of the API key.
   *
   * @remarks
   * This function retrieves the API key from storage using the `chromeStorageGet` method.
   * If the API key is not available, it displays the API key input container and hides the chat input container.
   * If the API key is available, it hides the API key input container and displays the chat input container.
   *
   * @returns {Promise<void>} - A promise that resolves when the container display process is complete.
   */
  private async setContainer() {
    const apiKey = await this.chromeStorageGet('key')
    if (!apiKey) {
      if (this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        this.apiKeyContainer.style.display = "block"
        this.inputContainer.style.display = "none"
        this.selectContainer.style.display = "none"
      }
    } else {
      if (this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
        this.selectContainer.style.display = "flex"
      }
    }
  }
/**
 * Saves the current chat history to the Chrome local storage.
 *
 * This function retrieves the innerHTML of the chat container and saves it to the Chrome local storage under the key "chatHistory".
 * It is called whenever the chat history needs to be saved, such as after a new message is sent or received.
 *
 * @remarks
 * The chat history is saved as a string in the "chatHistory" key of the Chrome local storage.
 * This allows the chat history to persist across browser sessions and be retrieved when the extension is reopened.
 *
 * @returns {void} - This function does not return any value.
 */
private saveHistory(): void {
  chrome.storage.local.set({ chatHistory: this.chatContainer.innerHTML });
}

/**
 * Loads the chat history from the Chrome local storage and appends it to the chat container.
 *
 * @remarks
 * This function retrieves the chat history stored in the Chrome local storage under the key "chatHistory".
 * If the chat history is available, it appends it to the chat container by updating the `innerHTML` property.
 * If the chat history is not available (i.e., the "chatHistory" key is not present in the local storage),
 * no action is taken.
 *
 * @returns {void} - This function does not return any value.
 */
private loadHistory(): void {
  chrome.storage.local.get("chatHistory", (data) => {
      if (data.chatHistory) {
          this.chatContainer.innerHTML = data.chatHistory;
      }
  });
}

  /**
   * Sets a value in the Chrome local storage using the provided key and value.
   *
   * @remarks
   * This function uses the `chrome.storage.local.set` method to store the provided key-value pair in the Chrome local storage.
   * It returns a promise that resolves when the storage operation is complete.
   *
   * @param key - The key under which the value will be stored in the Chrome local storage.
   * @param value - The value to be stored in the Chrome local storage.
   *
   * @returns {Promise<void>} - A promise that resolves when the storage operation is complete.
   */
  private async chromeStorageSet(key: string, value: string): Promise<void> {
    return new Promise<void>(resolve => {
      chrome.storage.local.set({[key]: value}, () => {
        resolve()
      })
    })
  };

  /**
   * Retrieves a value from the Chrome local storage using the provided key.
   *
   * @remarks
   * This function uses the `chrome.storage.local.get` method to retrieve the value associated with the given key from the Chrome local storage.
   * It returns a promise that resolves with the retrieved value.
   * If the specified key is not found in the local storage, the promise will resolve with `undefined`.
   *
   * @param key - The key under which the value is stored in the Chrome local storage.
   *
   * @returns {Promise<string>} - A promise that resolves with the retrieved value.
   */
  private async chromeStorageGet(key: string): Promise<string> {
    return new Promise<string>(resolve => {
      chrome.storage.local.get(key, result => {
        resolve(result.key)
      })
    })
  }
  
  private async chatGpt(textContent: string): Promise<string> {
    if (!this.openai) {
      return "Error: OpenAI missing"
    }

    const model = this.gptModel?.value || "gpt-4o-mini"
    const context = this.gptContext?.value || "assistant"
    let content = ""
    switch(context) {
      case "assistant":
        content = ASSISTANT_PROMPT
        break
      case "coding":
        content = CODING_PROMPT
        break
      case "codewars":
        content = CODEWARS_PROMPT
        break
    }

    const {text} = await generateText({
      model: this.openai(model),
      messages: [
        { role: "system", content: content },
        {
          role: "user",
          content: textContent,
        },
      ],
    })

    return text || "No response from openai"
  }
}

new OpenAICompletions()