// ===============================
// Expanded Profile Panel Logic (FINAL FIX)
// ===============================

(function () {
  // Wait until profile panel HTML is injected
  document.addEventListener("profile-panel:loaded", () => {
    const panel = document.getElementById("profile-panel");

    if (!panel) {
      console.error("Profile panel not found after load");
      return;
    }

    document.addEventListener("click", (e) => {
      // OPEN from avatar popup
      if (e.target.closest("[data-open-profile]")) {
        e.preventDefault();
        panel.classList.add("open");
        return;
      }

      // CLOSE on backdrop or close button
      if (
        e.target.id === "profile-panel" ||
        e.target.closest("[data-close-profile]")
      ) {
        panel.classList.remove("open");
      }
    });
  });
})();
