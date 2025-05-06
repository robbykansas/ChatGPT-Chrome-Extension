export class Storage {
  public loadSavedContext(): void {
    let gptContext: HTMLSelectElement | null = null;
    let gptModel: HTMLSelectElement | null = null;
    gptContext = document.querySelector("#gpt-context")
    gptModel = document.querySelector("#gpt-model")
  
    chrome.storage.local.get("selectedContext", (data) => {
      if (data.selectedContext && gptContext) {
        gptContext.value = data.selectedContext;
      }
    });
  
    chrome.storage.local.get("selectedModel", (data) => {
      if (data.selectedModel && gptModel) {
        gptModel.value = data.selectedModel;
      }
    });
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
  public saveHistory(): void {
    const chatContainer = document.getElementById("chat-container")
    chrome.storage.local.set({ chatHistory: chatContainer.innerHTML });
  }

  public clearHistoryFunc(): void {
    chrome.storage.local.remove('chatHistory', () => {
      location.reload()
    });
  }

  public closeModelFunc(): void {
    chrome.storage.local.remove('key', () => {
      location.reload()
    })
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
  public loadHistory(): void {
    const chatContainer = document.getElementById("chat-container")
    chrome.storage.local.get("chatHistory", (data) => {
      if (data.chatHistory) {
        chatContainer.innerHTML = data.chatHistory;
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
  public chromeStorageSet(key: string, value: string): void {
    chrome.storage.local.set({[key]: value})
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
  public chromeStorageGet(key: string): any {
    chrome.storage.local.get(key, result => {
      return result.key
    })
  }
}

