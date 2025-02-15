window.onload = function () {
  const expandTextarea = document.querySelector(".textarea-expand");
  const scrollTextarea = document.querySelector(".textarea-scroll");

  if (!expandTextarea || !scrollTextarea) {
      console.error("Textarea elements not found. Check your HTML class names.");
      return;
  }

  expandTextarea.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault(); // Prevent new line
          scrollTextarea.value += expandTextarea.value + "\n"; // Append text
          expandTextarea.value = ""; // Clear input field
          expandTextarea.style.height = "30px"; // Reset height
      }
  });

  expandTextarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px"; // Auto-expand
  });
};
