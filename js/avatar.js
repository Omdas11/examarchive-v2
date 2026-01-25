/* =========================
   Avatar Popup Logic (FINAL)
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.querySelector(".avatar-trigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) return;

  // Toggle popup
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !trigger.contains(e.target)) {
      popup.classList.remove("open");
    }
  });

  // Prevent popup clicks from closing itself
  popup.addEventListener("click", (e) => {
    e.stopPropagation();
  });
});
