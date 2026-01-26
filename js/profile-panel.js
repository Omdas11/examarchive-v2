// ===============================
// Expanded Profile Panel Logic (FINAL FIX)
// ===============================

(function () {
  const panel = document.getElementById("profile-panel");

  if (!panel) return;

  // 🔒 ENSURE CLOSED ON LOAD
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");

  document.addEventListener("click", (e) => {
    // Open from avatar popup
    if (e.target.closest("[data-open-profile]")) {
      e.preventDefault();
      e.stopPropagation();

      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      return;
    }

    // Close conditions
    if (
      e.target.closest("[data-close-profile]") ||
      e.target === panel
    ) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });

})();
