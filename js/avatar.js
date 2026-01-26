// ===============================
// Avatar Popup Logic — HARD DEBUG
// ===============================

alert("avatar.js LOADED ✅");

(function () {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#avatarTrigger");
    const popup = document.getElementById("avatar-popup");

    if (!popup) {
      alert("❌ avatar-popup NOT FOUND in DOM");
      return;
    }

    // Avatar clicked
    if (trigger) {
      alert("👆 Avatar clicked");

      popup.classList.toggle("open");

      // VISUAL PROOF
      popup.style.background = popup.classList.contains("open")
        ? "limegreen"
        : "crimson";

      popup.style.color = "#000";
      popup.style.border = "4px solid black";

      alert("Popup classes now: " + popup.className);
      e.stopPropagation();
      return;
    }

    // Outside click
    popup.classList.remove("open");
    popup.style.background = "crimson";
  });
})();
