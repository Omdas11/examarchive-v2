// ===============================
// Expanded Profile Panel Logic (FIXED)
// ===============================

document.addEventListener("profile-panel:loaded", () => {
  const panel = document.getElementById("profile-panel");
  if (!panel) {
    console.warn("[ProfilePanel] panel not found");
    return;
  }

  document.addEventListener("click", (e) => {
    // Open from avatar popup
    if (e.target.closest("[data-open-profile]")) {
      e.preventDefault();
      panel.classList.add("open");
      return;
    }

    // Close on backdrop or close button
    if (
      e.target.id === "profile-panel" ||
      e.target.closest("[data-close-profile]")
    ) {
      panel.classList.remove("open");
    }
  });
});
