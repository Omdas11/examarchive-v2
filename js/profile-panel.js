/* ================================
   Expanded Profile Panel – FINAL FIX
   ================================ */

(() => {
  const panel = document.getElementById("profile-panel");
  if (!panel) return;

  // DEBUG (remove later if you want)
  console.log("profile-panel.js ACTIVE");

  // ---------- OPEN ----------
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-open-profile]");
    if (!openBtn) return;

    e.preventDefault();
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  });

  // ---------- CLOSE (X button OR backdrop OR anywhere outside card) ----------
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("open")) return;

    const closeBtn = e.target.closest("[data-close-profile]");
    const card = e.target.closest(".profile-panel-card");

    // Close if:
    // 1. Clicked X
    // 2. Clicked backdrop
    // 3. Clicked anywhere outside the card
    if (closeBtn || !card) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });

  // ---------- ESC KEY ----------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  });
})();
