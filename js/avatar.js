// ===============================
// Avatar Popup Logic (FINAL CLEAN)
// ===============================

(function () {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#avatarTrigger");
    const popup = document.getElementById("avatar-popup");

    if (!popup) return;

    // Toggle on avatar click
    if (trigger) {
      e.stopPropagation();
      const isOpen = popup.classList.toggle("open");
      popup.setAttribute("aria-hidden", String(!isOpen));
      return;
    }

    // Click outside → close
    if (popup.classList.contains("open")) {
      popup.classList.remove("open");
      popup.setAttribute("aria-hidden", "true");
    }
  });
})();
