// ===============================
// Expanded Profile Panel Logic (FINAL FIXED)
// ===============================

(function () {
  alert("profile-panel.js LOADED");

  const panel = document.getElementById("profile-panel");
  if (!panel) {
    alert("❌ profile-panel NOT FOUND");
    return;
  }

  alert("✅ profile-panel FOUND");

  // 🔓 OPEN panel
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open-profile]");
    if (openBtn) {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      return;
    }

    // 🔒 CLOSE panel (X button OR backdrop)
    const closeBtn = e.target.closest("[data-close-profile]");
    if (closeBtn) {
      e.preventDefault();
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      return;
    }
  });

  // 🔒 ESC key close (accessibility)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });

  document.dispatchEvent(
    new CustomEvent("profile-panel:loaded")
  );
})();
