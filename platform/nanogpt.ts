import { codewarsFeedback, hints, snippet, language } from "../constant/codewarsHints";
import { GptMessage } from "../schema/model";
import { outputSchema } from "../schema/output";
import { Codewars } from "../codewars";
import { Storage } from "../storage";
import { appendMessage } from "../util/appendMessage";
import { getContent } from "../util/getContent";

export class NanoGPTModel {
  private gptModel: HTMLSelectElement | null = null;
  private gptContext: HTMLSelectElement | null = null;
  private inputTextArea: HTMLTextAreaElement | null = null;
  private codewars: Codewars;
  private storage: Storage;

  constructor() {
    this.gptModel = document.querySelector("#gpt-model")
    this.gptContext = document.querySelector("#gpt-context")
    this.inputTextArea = document.querySelector(".textarea-expand") as HTMLTextAreaElement
    this.codewars = new Codewars()
    this.storage = new Storage()
  }

  public async getModel(): Promise<Array<{ value: string; label: string }>> {
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

  public async chatGpt(textContent: string): Promise<string> {
    const apiKey = await this.storage.chromeStorageGet<string>('key');
    const model = this.gptModel?.value || "zai-org/glm-5:thinking"
    const context = this.gptContext?.value || "assistant"
    let content = getContent(context)
    const storedMessages = await this.storage.chromeStorageGet<GptMessage[]>("messages") || [];

    if (context != "codewars") {
      try {
        const messages = [
          { role: "system", content: content },
          ...storedMessages,
          { role: "user", content: textContent },
        ]

        const response = await fetch("https://nano-gpt.com/api/subscription/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages
          })
        })

        const data = await response.json();
        return data.choices[0].message.content
      } catch (error) {
        return "Unexpected error occurred. Please try again."
      }
    } else {
      try {
        const { description, language, code } = await this.codewars?.codewarsContent()
        const prompt = content
          .replace(/{{problem_statement}}/g, description)
          .replace(/{{programming_language}}/g, language)
          .replace(/{{user_code}}/g, code)

        const res = await this.generateOutputCodewars(prompt, textContent, code)
        return res
      } catch (error) {
        if (error instanceof Error) {
          return error.message
        }
        return "Unexpected error occurred. Please try again."
      }
    }
  }

  public async generateOutputCodewars(prompt: string, textContent: string, code: string): Promise<string> {
    const apiKey = await this.storage.chromeStorageGet<string>('key');
    const model = this.gptModel?.value || "zai-org/glm-5:thinking"
    const storedMessages = await this.storage.chromeStorageGet<GptMessage[]>("messages") || [];

    const messages = [
      { role: "system", content: prompt },
      { role: "system", content: `extractedCode (this code is written by user): ${code}`},
      ...storedMessages,
      { role: "user", content: textContent },
    ]

    const response = await fetch("https://nano-gpt.com/api/subscription/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: "json_object" }
      })
    })

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    const validated = outputSchema.parse(parsed);

    let cHints: string | undefined, cSnippet: string | undefined, cLanguage = ""
    if (validated.hints && validated.hints.length > 0) {
      cHints = hints
      .replace(/{{hint1}}/g, validated.hints[0] || "")
      .replace(/{{hint2}}/g, validated.hints[1] || "")
    }

    if (validated.snippet && validated.snippet != "") {
      cSnippet = snippet.replace(/{{snippet}}/g, validated.snippet)
    }

    cLanguage = language.replace(/{{programming_language}}/g, validated.programmingLanguage || "")

    const res = codewarsFeedback
      .replace(/{{feedback}}/g, validated.feedback)
      .replace(/{{hints}}/g, cHints || "")
      .replace(/{{snippet}}/g, cSnippet || "")
      .replace(/{{language}}/g, cLanguage)

    return res
  }

  public async handleChatGpt(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const chatGptInput = this.inputTextArea?.value
      if (chatGptInput && this.inputTextArea instanceof HTMLTextAreaElement) {
        appendMessage("user", chatGptInput)
        this.inputTextArea.value = "";
        const res = await this.chatGpt(chatGptInput)
        appendMessage("bot", res)
        this.storage.saveHistory()
      }
    }
  }

  public async validateApiKey(apikey: string): Promise<boolean> {
    try {
      const response = await fetch("https://nano-gpt.com/api/subscription/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apikey}`
        },
        body: JSON.stringify({
          model: "zai-org/glm-5:thinking",
          messages: [
            { role: "system", content: getContent("assistant") },
            { role: "user", content: "test" }
          ]
        })
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}