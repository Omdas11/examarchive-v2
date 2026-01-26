// ===============================
// Expanded Profile Panel Logic (FINAL)
// ===============================

(function () {
  const panel = document.getElementById("profile-panel");

  if (!panel) return;

  // OPEN
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-profile]")) {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
    }
  });

  // CLOSE (X button OR backdrop OR anywhere outside card)
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("open")) return;

    // Close triggers
    if (
      e.target.closest("[data-close-profile]") ||
      e.target === panel
    ) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });
})();
