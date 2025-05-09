import { codewarsFeedback, hints, snippet, language } from "../constant/codewarsHints";
import { outputSchema } from "../schema/output";
import { Codewars } from "../codewars";
import { Storage } from "../storage";
import { appendMessage } from "../util/appendMessage";
import { getContent } from "../util/getContent";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";

export class OpenAIModel {
  private openai: OpenAIProvider | null = null;
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
    if (!this.openai) {
      const apiKey = await this.storage.chromeStorageGet<string>('key');
      this.openai = await createOpenAI({
        compatibility: "strict",
        apiKey: apiKey,
      })
    }
  
    const model = this.gptModel?.value || "gpt-4o-mini"
    const context = this.gptContext?.value || "assistant"
    let content = getContent(context)
  
    if (context != "codewars") {
      try {
        const {text} = await generateText({
          model: this.openai(model),
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
        return error
      }
    }
  }

  public async generateOutputCodewars(prompt: string, textContent: string, code: string): Promise<string> {
    const model = this.gptModel?.value
    const data = await generateObject({
      model: this.openai(model),
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

  /**
   * Handles the user input for chat messages and sends them to the OpenAI model for processing.
   *
   * @remarks
   * This function is called when the user presses the Enter key while focused on the chat input area.
   * It retrieves the user's input, validates it, and sends it to the OpenAI model for processing.
   * If the OpenAI instance is not already initialized, it retrieves the API key from storage and initializes the instance.
   * The function then adds a loading indicator to the input area, sends the user's message to the chatGpt function,
   * appends the user's and bot's messages to the chat container, clears the input field, resets the input area's height,
   * and saves the chat history to storage.
   *
   * @param event - The keyboard event that triggered this function.
   * @returns {Promise<void>} - A promise that resolves when the chat handling process is complete.
   */
  public async handleChatGpt(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const chatGptInput = this.inputTextArea?.value
      if (chatGptInput && this.inputTextArea instanceof HTMLTextAreaElement) {
        if (!this.openai) {
          const apiKey = await this.storage.chromeStorageGet<string>('key');
          this.openai = await createOpenAI({
            compatibility: "strict",
            apiKey: apiKey,
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

  public async validateApiKey(apikey: string): Promise<boolean> {
    this.openai = await createOpenAI({
      compatibility: "strict",
      apiKey: apikey,
    })

    try {
      await generateText({
        model: this.openai("gpt-4o-mini"),
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