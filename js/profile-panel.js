// ===============================
// Expanded Profile Panel Logic (FINAL)
// ===============================

(function () {
  const panel = document.getElementById("profile-panel");
  if (!panel) return;

  const card = panel.querySelector(".profile-panel-card");

  // OPEN panel
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open-profile]");
    if (openBtn) {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      return;
    }

    // CLOSE via explicit close triggers
    const closeBtn = e.target.closest("[data-close-profile]");
    if (closeBtn) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      return;
    }

    // CLOSE when clicking OUTSIDE card
    if (
      panel.classList.contains("open") &&
      !card.contains(e.target)
    ) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });

  // ESC key close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });

  document.dispatchEvent(
    new CustomEvent("profile-panel:ready")
  );
})();
