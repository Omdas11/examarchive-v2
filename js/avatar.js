document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) return;

  // Toggle popup
  trigger.addEventListener("click", (e) => {
    e.stopPropagation(); // 🔑 critical
    popup.classList.toggle("open");
  });

  // Prevent inside clicks from closing
  popup.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Close ONLY when clicking outside
  document.addEventListener("click", () => {
    popup.classList.remove("open");
  });

  // Mobile touch safety
  document.addEventListener("touchstart", () => {
    popup.classList.remove("open");
  });
});
