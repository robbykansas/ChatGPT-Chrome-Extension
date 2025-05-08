import { codewarsFeedback, hints, snippet, language } from "../constant/codewarsHints";
import { outputSchema } from "../schema/output";
import { Codewars } from "../codewars";
import { Storage } from "../storage";
import { appendMessage } from "../util/appendMessage";
import { getContent } from "../util/getContent";
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

  public async chatGpt(textContent: string): Promise<string> {
    if (!this.anthropic) {
      const apiKey = await this.storage.chromeStorageGet('key')
      this.anthropic = await createAnthropic({
        apiKey: apiKey,
        headers: { 'anthropic-dangerous-direct-browser-access': 'true'}, // for CORS problem
      })
    }

    const model = this.gptModel?.value || "gpt-4o-mini"
    const context = this.gptContext?.value || "assistant"
    let content = getContent(context)

    if (context != "codewars") {
      try {
        const {text} = await generateText({
          model: this.anthropic(model),
          messages: [
            { role: "system", content: content },
            {
              role: "user",
              content: textContent,
            },
          ],
        })
    
        return text
      } catch (error) {
        return "Unexpected error occurred. Please try again."
      }
    }  else {
      try {
        const { description, language, code } = await this.codewars?.codewarsContent()
        const prompt = content
          .replace(/{{problem_statement}}/g, description)
          .replace(/{{programming_language}}/g, language)
          .replace(/{{user_code}}/g, code)
  
        const res = await this.generateOutputCodewars(prompt, textContent, code)
        return res
      } catch (error) {
        return error
      }
    }
  }

  private async generateOutputCodewars(prompt: string, textContent: string, code: string): Promise<string> {
    const model = this.gptModel?.value
    const data = await generateObject({
      model: this.anthropic(model),
      schema: outputSchema,
      output: 'object',
      messages: [
        { role: "system", content: prompt },
        { role: "system", content: `extractedCode (this code is written by user): ${code}`},
        { role: "user", content: textContent },
      ],
    })
    
    let cHints, cSnippet, cLanguage = ""
    if (data.object.hints.length > 0) {
      cHints = hints
      .replace(/{{hint1}}/g, data.object.hints[0])
      .replace(/{{hint2}}/g, data.object.hints[1])
    }

    if (data.object.snippet != "") {
      cSnippet = snippet.replace(/{{snippet}}/g, data.object.snippet)
    }

    cLanguage = language.replace(/{{programming_language}}/g, data.object.programmingLanguage)

    const res = codewarsFeedback
      .replace(/{{feedback}}/g, data.object.feedback)
      .replace(/{{hints}}/g, cHints)
      .replace(/{{snippet}}/g, cSnippet)
      .replace(/{{language}}/g, cLanguage)

    return res
  }

  public async handleChatGpt(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const chatGptInput = this.inputTextArea?.value
      if (chatGptInput && this.inputTextArea instanceof HTMLTextAreaElement) {
        if (!this.anthropic) {
          const apiKey = await this.storage.chromeStorageGet('key')
          this.anthropic = await createAnthropic({
            apiKey: apiKey,
            headers: { 'anthropic-dangerous-direct-browser-access': 'true'}, // for CORS problem
          })
        }
        appendMessage("user", chatGptInput)
        this.inputTextArea.value = ""; // Clear input field
        const res = await this.chatGpt(chatGptInput)
        appendMessage("bot", res)
        this.storage.saveHistory()
      }
    }
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
          { role: "system", content: getContent("assistant") },
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