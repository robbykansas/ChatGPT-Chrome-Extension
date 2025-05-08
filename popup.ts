import { Storage } from "./storage";
import { Codewars } from "./codewars";
import { OpenAIModel } from "./platform/openai";
import { AnthropicModel } from "./platform/anthropic";

class OpenAICompletions {
  private apiKeyContainer: HTMLElement | null = null;
  private inputContainer: HTMLElement | null = null;
  private selectContainer: HTMLDivElement | null = null;
  private chatContainer: HTMLElement | null = null;
  private apikeyMessage: HTMLParagraphElement | null = null;
  private apiKeyArea: HTMLTextAreaElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null;
  private aiPlatform: HTMLSelectElement | null = null;
  private gptModel: HTMLSelectElement | null = null;
  private gptContext: HTMLSelectElement | null = null;
  private clearHistory: HTMLButtonElement | null = null;
  private closeModel: HTMLButtonElement | null = null;
  private storage: Storage | null = null;
  private codewars: Codewars | null = null;
  private openaiModel: OpenAIModel | null = null;
  private anthropicModel: AnthropicModel | null = null;

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
    this.apikeyMessage = document.getElementById("apikey-message") as HTMLParagraphElement
    this.selectContainer = document.querySelector(".select-container") as HTMLDivElement
    this.apiKeyArea = document.querySelector(".apikey-area") as HTMLTextAreaElement
    this.inputTextArea = document.querySelector(".textarea-expand") as HTMLTextAreaElement
    this.gptModel = document.querySelector("#gpt-model")
    this.gptContext = document.querySelector("#gpt-context")
    this.aiPlatform = document.querySelector("#ai-platform")
    this.clearHistory = document.querySelector("#clear-history")
    this.closeModel = document.querySelector("#close-model")
    this.storage = new Storage()
    this.codewars = new Codewars()
    this.openaiModel = new OpenAIModel()
    this.anthropicModel = new AnthropicModel()

    this.storage.loadHistory()
    if (this.apiKeyArea) {
      this.apiKeyArea.addEventListener("keydown", async (event) => await this.handleApiKey(event))
    }

    if (this.clearHistory) {
      this.clearHistory.addEventListener("click", () =>  this.storage.clearHistoryFunc());
    }

    if (this.closeModel) {
      this.closeModel.addEventListener("click", () => this.storage.closeModelFunc());
    }

    if (this.gptContext) {
      this.gptContext.addEventListener("change", () => {
        const selectedContext = this.gptContext?.value;
        chrome.storage.local.set({ selectedContext });
      })
    }

    if (this.gptModel) {
      this.gptModel.addEventListener("change", () => {
        const selectedModel = this.gptModel?.value;
        chrome.storage.local.set({ selectedModel });
      })
    }

    await this.setContainer()

    await this.setModelOptions()

    this.storage.loadSavedContext();

    this.codewars.checkCodewarsTab()

    if (this.inputTextArea) {
      this.inputTextArea.addEventListener("keydown", async (event) => {
        const platform = await this.storage.chromeStorageGet('platform')
        switch (platform) {
          case "openai":
            await this.openaiModel.handleChatGpt(event)
            break;
          case "anthropic":
            await this.anthropicModel.handleChatGpt(event)
            break;
        }
      });
    }
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
        let valid = false
        switch (this.aiPlatform?.value) {
          case "openai":
            valid = await this.openaiModel.validateApiKey(apiKeyValue)
            break;
          case "anthropic":
            valid = await this.anthropicModel.validateAnthropicKey(apiKeyValue)
            break;
        }

        if (!valid) {
          this.apikeyMessage.innerHTML = "Invalid API key."
        } else {
          const platform = this.aiPlatform?.value
          await this.storage.chromeStorageSet('platform', platform)
          await this.storage.chromeStorageSet('key', apiKeyValue)
          location.reload()
        }
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
    const apiKey = await this.storage.chromeStorageGet('key')
    if (!apiKey) {
      if (this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        this.apiKeyContainer.style.display = "block"
        this.inputContainer.style.display = "none"
        this.selectContainer.style.display = "none"
        this.chatContainer.style.display = "none"
      }
    } else {
      if (this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
        this.selectContainer.style.display = "flex"
      }
    }
  }

  private async setModelOptions() {
    const platform = await this.storage.chromeStorageGet('platform')
    if (!this.gptModel) return

    const openAiModel = [
      { value: "gpt-4o-mini", label: "GPT-4o-mini" },
      { value: "gpt-4o", label: "GPT-4o" },
    ]

    const anthropicModel = [
      { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
      { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
      { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
      { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
    ]

    switch (platform) {
      case "openai":
        openAiModel.forEach(model => {
          const option = document.createElement("option")
          option.value = model.value
          option.textContent = model.label
          this.gptModel.appendChild(option)
        })
        this.gptModel.value = "gpt-4o-mini"
        return
      case "anthropic":
        anthropicModel.forEach(model => {
          const option = document.createElement("option")
          option.value = model.value
          option.textContent = model.label
          this.gptModel.appendChild(option)
        })
        this.gptModel.value = "claude-3-haiku-20240307"
        return
    }
  }
}

new OpenAICompletions()