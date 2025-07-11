import { GptMessage } from "./schema/model";

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
    chrome.storage.local.remove('messages')
    
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

  public async chromeStorageSet<T>(key: string, value: T): Promise<void> {
    return new Promise<void>(resolve => {
      chrome.storage.local.set({[key]: value}, () => {
        resolve()
      })
    })
  };

  public async chromeStorageGet<T>(key: string): Promise<T | undefined> {
    return new Promise<T | undefined>(resolve => {
      chrome.storage.local.get(key, result => {
        resolve(result[key])
      })
    })
  }

  public async storeMessage(message: GptMessage): Promise<void> {
    const messages = await this.chromeStorageGet<GptMessage[]>("messages") || [];
    messages.push(message)
    await this.chromeStorageSet("messages", messages)
  }
}

