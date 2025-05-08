import { assistantPrompt } from "../constant/assistantPrompt";
import { codingPrompt } from "../constant/codingPrompts";
import { codewarsPrompt } from "../constant/codewarsPrompts";

function getContent(context: string): string {
  switch(context) {
    case "assistant":
      return assistantPrompt
    case "coding":
      return codingPrompt
    case "codewars":
      return codewarsPrompt
  }
}

export { getContent }