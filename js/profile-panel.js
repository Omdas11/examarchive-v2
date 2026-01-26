// ===============================
// Profile Panel Logic (FINAL, SAFE)
// ===============================

(function () {
  function initProfilePanel() {
    const panel = document.getElementById("profile-panel");
    if (!panel) {
      console.warn("Profile panel not found");
      return;
    }

    // GLOBAL click handler (mobile-safe)
    document.addEventListener("click", (e) => {
      // ---- OPEN ----
      const openBtn = e.target.closest("[data-open-profile]");
      if (openBtn) {
        e.preventDefault();
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        return;
      }

      // ---- CLOSE (backdrop or close button) ----
      if (
        e.target === panel ||
        e.target.closest("[data-close-profile]")
      ) {
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
      }
    });
  }

  // Wait until panel HTML is injected
  if (document.readyState === "loading") {
    document.addEventListener("profile:loaded", initProfilePanel);
  } else {
    initProfilePanel();
  }
})();
