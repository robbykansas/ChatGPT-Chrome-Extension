import { assistantPrompt } from "../constant/assistantPrompt";
// import { codingPrompt } from "../constant/codingPrompt";
// import { codewarsPrompt } from "../constant/codewarsPrompt";
// import { codewarsHints } from "../constant/codewarsHints";
// import { outputSchema } from "../schema/output";
import { Codewars } from "../codewars";
import { Storage } from "../storage";
import { createAnthropic, AnthropicProvider } from "@ai-sdk/anthropic";
import { generateText, generateObject } from "ai";

export class AnthropicModel {
  private anthropic: AnthropicProvider | null = null;
  private gptModel: HTMLSelectElement | null = null;
  private gptContext: HTMLSelectElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null;
  private codewars: Codewars | null = null;
  private storage: Storage | null = null;

  constructor() {
    this.gptModel = document.querySelector("#gpt-model")
    this.gptContext = document.querySelector("#gpt-context")
    this.inputTextArea = document.querySelector(".textarea-expand") as HTMLTextAreaElement
    this.codewars = new Codewars()
    this.storage = new Storage()
  }

  public async validateAnthropicKey(apikey: string): Promise<boolean> {
    this.anthropic = await createAnthropic({
      apiKey: apikey,
      headers: { 'anthropic-dangerous-direct-browser-access': 'true'}, // for CORS problem
    })

    try {
      await generateText({
        model: this.anthropic("claude-3-haiku-20240307"),
        messages: [
          { role: "system", content: assistantPrompt },
          {
            role: "user",
            content: "test",
          },
        ],
      })
      return true
    } catch (error) {
      return false
    }
  }
}