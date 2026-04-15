import { Codewars } from "../codewars";
import { Storage } from "../storage";


export class NanoGPTModel {
  private gptModel: HTMLSelectElement | null = null;
  private gptContext: HTMLSelectElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null;
  private codewars: Codewars | null = null;
  private storage: Storage | null = null;

  constructor() {
    this.gptModel = document.getElementById("gpt-model") as HTMLSelectElement;
    this.gptContext = document.getElementById("gpt-context") as HTMLSelectElement;
    this.inputTextArea = document.getElementById("input-textarea") as HTMLTextAreaElement;
    this.codewars = new Codewars();
    this.storage = new Storage();
  }

  public async getModel(): Promise<Array<string>> {
    const apiKey = await this.storage.chromeStorageGet<string>('key');

    const response = await fetch("https://nano-gpt.com/api/subscription/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    })

    const data = await response.json();
    return data.data.map((model: { id: string; name: string }) => ({
      value: model.id,
      label: model.name
    }))
  }

  // public async chatGpt(textContent: string): Promise<string> {
  //   const model = this.gptModel?.value || "zai-org/glm-5:thinking";
  // }
}