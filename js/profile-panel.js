// ===============================
// Expanded Profile Panel Logic (FINAL & SAFE)
// ===============================

(function () {
  const panel = document.getElementById("profile-panel");
  if (!panel) return;

  const card = panel.querySelector(".profile-panel-card");

  // OPEN
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-profile]")) {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
    }
  });

  // CLOSE (X button OR outside click)
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("open")) return;

    // ❌ Close button
    if (e.target.closest("[data-close-profile]")) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      return;
    }

    // 👇 Click outside the card
    if (!card.contains(e.target)) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });
})();
