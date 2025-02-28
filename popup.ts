import {OpenAI} from "openai";

class OpenAICompletions {
  private openai: OpenAI | null = null;
  private apiKeyContainer: HTMLElement | null = null;
  private inputContainer: HTMLElement | null = null;
  private apiKeyArea: HTMLTextAreaElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null
  private outputTextArea: HTMLTextAreaElement | null = null

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
    this.apiKeyArea = document.querySelector(".apikey-area") as HTMLTextAreaElement
    this.inputTextArea = document.querySelector(".textarea-expand") as HTMLTextAreaElement
    this.outputTextArea = document.querySelector(".textarea-scroll") as HTMLTextAreaElement
    if (this.apiKeyArea) {
      this.apiKeyArea.addEventListener("keydown", (event) => this.handleApiKey(event))
    }

    this.setContainer()

    if (this.inputTextArea) {
      this.inputTextArea.addEventListener("keydown", (event) => this.handleChatGpt(event));

      this.outputTextArea.addEventListener("input", function () {
          this.style.height = "auto";
          this.style.height = this.scrollHeight + "px"; // Auto-expand
      });
    }
  }

  private async handleApiKey(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const apiKeyValue = this.apiKeyArea?.value
      if (apiKeyValue && this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        await this.chromeStorageSet('key', apiKeyValue)
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
      }
    }
  }

  private async handleChatGpt(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const chatGptInput = this.inputTextArea?.value
      if (chatGptInput && this.inputTextArea instanceof HTMLTextAreaElement && this.outputTextArea instanceof HTMLTextAreaElement) {
        const res = await this.chatGpt(chatGptInput)
        this.outputTextArea.value = res; // Append text
        this.inputTextArea.value = ""; // Clear input field
        this.inputTextArea.style.height = "30px"; // Reset height
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
  
    // const res = await fetch("https://api.openai.com/v1/chat/completions", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${apikey.key}`
    //   },
    //   body: JSON.stringify({
    //     model: model,
    //     messages: message,
    //     store: true
    //   })
    // })
  
    // return res.json()
  }
  
  private exitChatGPT(): void {
    chrome.storage.local.clear(() => {})
  }
}

new OpenAICompletions()