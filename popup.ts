import { Storage } from "./storage";
import { Codewars } from "./codewars";
import { OpenAIModel } from "./openai";

class OpenAICompletions {
  private apiKeyContainer: HTMLElement | null = null;
  private inputContainer: HTMLElement | null = null;
  private selectContainer: HTMLDivElement | null = null;
  private apiKeyArea: HTMLTextAreaElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null;
  private gptModel: HTMLSelectElement | null = null;
  private gptContext: HTMLSelectElement | null = null;
  private clearHistory: HTMLButtonElement | null = null;
  private storage: Storage | null = null;
  private codewars: Codewars | null = null;
  private openaiModel: OpenAIModel | null = null;

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
    this.selectContainer = document.querySelector(".select-container") as HTMLDivElement
    this.apiKeyArea = document.querySelector(".apikey-area") as HTMLTextAreaElement
    this.inputTextArea = document.querySelector(".textarea-expand") as HTMLTextAreaElement
    this.gptModel = document.querySelector("#gpt-model")
    this.gptContext = document.querySelector("#gpt-context")
    this.clearHistory = document.querySelector("#clear-history")
    this.storage = new Storage()
    this.codewars = new Codewars()
    this.openaiModel = new OpenAIModel()

    this.storage.loadHistory()
    if (this.apiKeyArea) {
      this.apiKeyArea.addEventListener("keydown", (event) => this.handleApiKey(event))
    }

    if (this.clearHistory) {
      this.clearHistory.addEventListener("click", () =>  this.storage.clearHistoryFunc());
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

    this.setContainer()

    if (this.inputTextArea) {
      this.inputTextArea.addEventListener("keydown", (event) => this.openaiModel.handleChatGpt(event));
    }

    this.storage.loadSavedContext();

    this.codewars.checkCodewarsTab()
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
        await this.storage.chromeStorageSet('key', apiKeyValue)
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
        this.selectContainer.style.display = "flex"
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
      }
    } else {
      if (this.apiKeyContainer instanceof HTMLElement && this.inputContainer instanceof HTMLElement) {
        this.apiKeyContainer.style.display = "none"
        this.inputContainer.style.display = "block"
        this.selectContainer.style.display = "flex"
      }
    }
  }
}

new OpenAICompletions()