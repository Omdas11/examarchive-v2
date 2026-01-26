// ===============================
// Avatar Popup Logic (BULLETPROOF)
// ===============================

(function () {
  function initAvatarPopup() {
    const trigger = document.getElementById("avatarTrigger");
    const popup = document.getElementById("avatar-popup");

    // ⛔ If elements not ready, retry
    if (!trigger || !popup) {
      setTimeout(initAvatarPopup, 50);
      return;
    }

    // ✅ DEBUG: prove JS is running
    trigger.style.outline = "2px solid lime";

    // ---------- TOGGLE ----------
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      popup.classList.toggle("open");
      popup.setAttribute(
        "aria-hidden",
        popup.classList.contains("open") ? "false" : "true"
      );
    });

    // ---------- CLICK OUTSIDE ----------
    document.addEventListener("click", (e) => {
      if (!popup.contains(e.target) && !trigger.contains(e.target)) {
        popup.classList.remove("open");
        popup.setAttribute("aria-hidden", "true");
      }
    });
  }

  // Start once DOM is usable
  document.addEventListener("DOMContentLoaded", initAvatarPopup);
})();
