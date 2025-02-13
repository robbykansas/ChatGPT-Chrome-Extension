document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("expandingTextarea");

  textarea.addEventListener("input", function () {
      this.style.height = "30px"; // Reset height
      this.style.height = Math.min(this.scrollHeight, 60) + "px"; // Expand up to 2 lines
  });
});