const chromeStorageSet = (key, value) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({[key]: value}, _ => {
      console.log("saved, <<<<<<")
      resolve()
    })
  })
};

const chromeStorageGet = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, result => {
      console.log(result, "got result")
      resolve(result)
    })
  })
}

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
  const apikey = "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"

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

const exitChatGPT = () => {
  chrome.storage.local.clear(_ => {
    console.log("delete key")
  })
}

document.addEventListener("DOMContentLoaded", async function () {
  const apiKeyContainer = document.getElementById("apikey-container")
  const inputContainer = document.getElementById("input-container")
  const apiKeyArea = document.querySelector(".apikey-area")
  const expandTextarea = document.querySelector(".textarea-expand");
  const scrollTextarea = document.querySelector(".textarea-scroll");
  if (!apiKeyContainer || !inputContainer) {
    console.log("none")
  }

  apiKeyArea.addEventListener("keydown", async function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      await chromeStorageSet('key', apiKeyArea.value)
      apiKeyContainer.style.display = "none"
      inputContainer.style.display = "block"
    }
  })

  const apikey = await chromeStorageGet('key')
  if (apikey.key != undefined) {
    apiKeyContainer.style.display = "none"
    inputContainer.style.display = "block"
  } else {
    apiKeyContainer.style.display = "block"
    inputContainer.style.display = "none"
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
});
