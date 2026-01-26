// ===============================
// Avatar Popup + Profile Bridge
// FINAL / BACKEND-READY
// ===============================

(function () {
  console.log("avatar.js loaded");

  const popup = document.getElementById("avatar-popup");
  const panel = document.getElementById("profile-panel");

  if (!popup) {
    console.warn("avatar-popup not found");
    return;
  }

  // DEBUG: visual proof popup exists
  popup.style.outline = "2px dashed #22c55e";

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#avatarTrigger");
    const openProfileBtn = e.target.closest("[data-open-profile]");

    // ---------------------------
    // Toggle avatar popup
    // ---------------------------
    if (trigger) {
      e.stopPropagation();
      popup.classList.toggle("open");
      console.log("Avatar trigger clicked");
      return;
    }

    // ---------------------------
    // Open expanded profile panel
    // ---------------------------
    if (openProfileBtn) {
      e.stopPropagation();
      console.log("Open profile clicked");

      popup.classList.remove("open");

      if (panel) {
        panel.classList.add("open");

        // visual proof
        panel.style.outline = "3px solid #3b82f6";
      } else {
        console.warn("profile-panel not found");
      }

      return;
    }

    // ---------------------------
    // Click outside → close popup
    // ---------------------------
    if (!e.target.closest("#avatar-popup")) {
      popup.classList.remove("open");
    }
  });
})();
