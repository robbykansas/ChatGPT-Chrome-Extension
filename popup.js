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

const chatGpt = async (textContent, apikey) => {
  console.log(apikey.key, "<<<<")
  let model = "gpt-4o-mini"
  let message = [
    { role: "system", content: "You are a helpful assistant." },
    {
        role: "user",
        content: textContent,
    },
  ]

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apikey.key}`
    },
    body: JSON.stringify({
      model: model,
      messages: message,
      store: true
    })
  })

  return res.json()
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
          const res = await chatGpt(expandTextarea.value, apikey)
          scrollTextarea.value = res.choices[0].message.content; // Append text
          expandTextarea.value = ""; // Clear input field
          expandTextarea.style.height = "30px"; // Reset height
      }
  });

  expandTextarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px"; // Auto-expand
  });
});
