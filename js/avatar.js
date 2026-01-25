document.addEventListener("header:loaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) return;

  // Toggle popup
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  // Close ONLY when clicking outside
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !trigger.contains(e.target)) {
      popup.classList.remove("open");
    }
  });
});
