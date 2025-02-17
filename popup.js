const chatGpt = async (textContent) => {
  console.log(textContent)
  let model = "gpt-4o-mini"
  let message = [
    { role: "system", content: "You are a helpful assistant." },
    {
        role: "user",
        content: textContent,
    },
  ]
  const apikey = ""

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apikey}`
    },
    body: JSON.stringify({
      model: model,
      messages: message,
      store: true
    })
  })

  const data = await res.json();

  console.log(data.choices[0].message.content)
  return data.choices[0].message.content
}

window.onload = async function () {
  const expandTextarea = document.querySelector(".textarea-expand");
  const scrollTextarea = document.querySelector(".textarea-scroll");

  if (!expandTextarea || !scrollTextarea) {
      console.error("Textarea elements not found. Check your HTML class names.");
      return;
  }

  expandTextarea.addEventListener("keydown", async function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault(); // Prevent new line
          const res = await chatGpt(expandTextarea.value)
          scrollTextarea.value += res; // Append text
          expandTextarea.value = ""; // Clear input field
          expandTextarea.style.height = "30px"; // Reset height
      }
  });

  expandTextarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px"; // Auto-expand
  });
};
