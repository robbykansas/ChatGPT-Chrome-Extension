/**
 * Appends a message to the chat container with the specified sender and text.
 *
 * @remarks
 * This function creates a new div element, sets its class based on the sender,
 * converts the text to HTML using the `markdownToHTML` function, and appends it to the chat container.
 * It also scrolls the chat container to the bottom to show the new message.
 *
 * @param sender - The sender of the message. It can be either "user" or "bot".
 * @param text - The text content of the message.
 *
 * @returns {void} - This function does not return any value.
 */
function appendMessage(sender: "user" | "bot", text: string): void {
  const messageDiv = document.createElement("div");
  const chatContainer = document.getElementById("chat-container") as HTMLDivElement;
  messageDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
  messageDiv.innerHTML = markdownToHTML(text);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Converts markdown text to HTML.
 * 
 * This function takes a string of markdown-formatted text and converts it to HTML.
 * It handles code blocks, headers, inline code, bold text, italic text, and line breaks.
 * 
 * @param text - The markdown-formatted text to be converted to HTML.
 * @returns The input text converted to HTML format.
 */
function markdownToHTML(text: string): string {
  const codeBlockPlaceholder = 'codeBlockPlaceholder';
  const codeBlocks: string[] = [];
  text = text.replace(/```([\s\S]+?)```/g, (match, p1) => {
    codeBlocks.push(`<pre><code>${escapeHTML(p1)}</code></pre>`);
    return codeBlockPlaceholder;
  });

  text = text
    .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>') // H3 Headers
    .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')  // H2 Headers
    .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')   // H1 Headers
    .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
    .replace(/\*(.*?)\*/g, '<i>$1</i>') // Italic
    .replace(/__(.*?)__/g, '<b>$1</b>') // Bold (alternative)
    .replace(/_(.*?)_/g, '<i>$1</i>') // Italic (alternative)
    .replace(/\n/g, "<br>"); // New lines

  text = text.replace(new RegExp(codeBlockPlaceholder, 'g'), () => codeBlocks.shift() || '');

  return text;
}

/**
 * Escapes special characters in a string to prevent XSS attacks when rendering HTML.//+
 * //+
 * @param str - The input string that needs to be escaped.//+
 * @returns A new string with special characters replaced by their HTML entity equivalents.//+
 */
function escapeHTML(str: string): string {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

export { appendMessage };