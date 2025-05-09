export type GptMessage = {
  role: "assistant" | "user" | "system" | "data"
  content: string 
}