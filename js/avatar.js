/* =========================================
   Avatar Popup Logic – FINAL (MOBILE SAFE)
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.querySelector(".avatar-trigger");
  const wrapper = document.querySelector(".avatar-wrapper");

  if (!trigger || !wrapper) return;

  let popup = document.getElementById("avatar-popup");

  // If popup not yet injected, fetch it
  if (!popup) {
    fetch("partials/avatar-popup.html")
      .then(res => res.text())
      .then(html => {
        wrapper.insertAdjacentHTML("beforeend", html);
        initPopup();
      });
  } else {
    initPopup();
  }

  function initPopup() {
    popup = document.getElementById("avatar-popup");
    if (!popup) return;

    // Toggle on avatar click
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      popup.classList.toggle("open");
      popup.setAttribute(
        "aria-hidden",
        popup.classList.contains("open") ? "false" : "true"
      );
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        popup.classList.remove("open");
        popup.setAttribute("aria-hidden", "true");
      }
    });

    // Prevent inside clicks from closing
    popup.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
});
