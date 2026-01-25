// ===============================
// Avatar Popup Logic (FINAL)
// ===============================

// Wait until footer is injected by common.js
document.addEventListener("footer:loaded", () => {
  initAvatarPopup();
});

function initAvatarPopup() {
  const trigger = document.getElementById("avatarTrigger");
  const portal = document.getElementById("avatar-portal");

  if (!trigger || !portal) {
    console.warn("Avatar trigger or portal not found");
    return;
  }

  // Load popup HTML into portal
  fetch("partials/avatar-popup.html")
    .then(res => res.text())
    .then(html => {
      portal.innerHTML = html;

      const popup = document.getElementById("avatar-popup");
      if (!popup) return;

      // Toggle popup
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("open");
      });

      // Close on outside click
      document.addEventListener("click", () => {
        popup.classList.remove("open");
      });

      // Prevent popup click from closing itself
      popup.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    })
    .catch(err => {
      console.error("Failed to load avatar popup:", err);
    });
}
