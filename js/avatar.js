document.addEventListener("DOMContentLoaded", () => {
  const avatarBtn = document.querySelector(".avatar-trigger");
  const popup = document.getElementById("avatar-popup");

  if (!avatarBtn || !popup) return;

  // Ensure popup is positioned relative to header
  const header = document.querySelector(".site-header");
  header.style.position = "relative";

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !avatarBtn.contains(e.target)) {
      popup.classList.remove("open");
    }
  });
});
