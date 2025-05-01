export class Codewars {
  private gptContext: HTMLSelectElement | null = null;

  constructor() {
    this.gptContext = document.querySelector("#gpt-context")
  }
  public async checkCodewarsTab(): Promise<void> {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const codewarsOption = document.querySelector("#gpt-context option[value='codewars']") as HTMLOptionElement;
  
      if (tab && tab.url && tab.url.includes("codewars.com")) {
        // Enable the codewars option if the current tab is on codewars.com
        if (codewarsOption) {
          codewarsOption.disabled = false;
        }
      } else {
        // Disable the codewars option if the current tab is not on codewars.com
        if (codewarsOption) {
          codewarsOption.disabled = true;
          this.gptContext.value = "assistant"
        }
      }
    });
  }

  public async codewarsContent(): Promise<{ description: string, language: string, code: string }> {
    return new Promise<{ description: string, language: string, code: string }>( (resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0]
        if (tab.url?.includes('codewars.com')) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: () => {
              const scrapeDescription = document.querySelectorAll("#description p, #description pre code")
              const description = Array.from(scrapeDescription)
                .map(line => line.textContent || "")
                .join("\n")
              
              const programmingLanguage = document.querySelectorAll("span.mr-4 > span")
              const language = Array.from(programmingLanguage)
                .map(lang => lang.textContent || "")
                .join("\n")
              
              const firstCode = document.querySelector(".CodeMirror-code")
              const userCode = firstCode.querySelectorAll(".CodeMirror-line")
              const code = Array.from(userCode)
                .map(line => line.textContent || "")
                .join("\n")
  
              return { description, language, code }
            }
          }, (result) => {
            if (chrome.runtime.lastError || !result || !result[0].result) {
              reject("Failed to scrape data from Codewars.");
            } else {
              resolve(result[0].result);
            }
          })
        } else {
          reject("You must access codewars problem to use this feature.")
        }
      })
    })
  }
}