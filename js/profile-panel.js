// ===============================
// Expanded Profile Panel – HARD DEBUG
// ===============================

(function () {
  alert("profile-panel.js LOADED");

  document.addEventListener("profile-panel:loaded", () => {
    alert("EVENT: profile-panel:loaded fired");

    const panel = document.getElementById("profile-panel");

    if (!panel) {
      alert("❌ profile-panel NOT FOUND in DOM");
      console.error("profile-panel missing");
      return;
    }

    alert("✅ profile-panel FOUND");

    // FORCE VISUAL DEBUG
    panel.style.outline = "4px solid red";
    panel.style.background = "rgba(255,0,0,0.05)";
    panel.style.display = "block";
    panel.style.opacity = "1";
    panel.style.pointerEvents = "auto";

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-profile]")) {
        alert("👉 View profile CLICK detected");
        panel.classList.add("open");
        panel.style.display = "block";
        panel.style.opacity = "1";
      }

      if (
        e.target.id === "profile-panel" ||
        e.target.closest("[data-close-profile]")
      ) {
        alert("✖ Close profile");
        panel.classList.remove("open");
      }
    });
  });
})();
