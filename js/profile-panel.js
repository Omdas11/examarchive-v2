// ===============================
// Expanded Profile Panel Logic (FINAL FINAL)
// ===============================

(function () {
  const panel = document.getElementById("profile-panel");
  if (!panel) return;

  const card = panel.querySelector(".profile-panel-card");

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open-profile]");
    const closeBtn = e.target.closest("[data-close-profile]");
    const isOpen = panel.classList.contains("open");

    // 👉 OPEN
    if (openBtn) {
      e.stopPropagation();
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      return;
    }

    // 👉 CLOSE via ❌
    if (closeBtn && isOpen) {
      e.stopPropagation();
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      return;
    }

    // 👉 CLOSE by clicking outside card
    if (isOpen && !card.contains(e.target)) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });
})();
