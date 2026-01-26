// ===============================
// Expanded Profile Panel – DEBUG MODE
// ===============================

(function () {
  alert("✅ profile-panel.js LOADED");

  document.addEventListener("DOMContentLoaded", () => {
    alert("📦 DOMContentLoaded fired");

    const panel = document.getElementById("profile-panel");

    if (!panel) {
      alert("❌ profile-panel NOT FOUND in DOM");
      return;
    }

    // Force panel visible (proof)
    panel.style.display = "block";
    panel.style.position = "fixed";
    panel.style.inset = "0";
    panel.style.background = "rgba(0,0,0,0.6)";
    panel.style.zIndex = "99999";

    alert("🟢 profile-panel FOUND and FORCED visible");

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-profile]")) {
        alert("👉 View profile button CLICKED");
        panel.classList.add("open");
      }
    });
  });
})();
