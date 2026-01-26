// ===============================
// Avatar Popup Logic (FINAL)
// ===============================

(function () {
  // Debug proof
  document.body.style.border = "4px solid red";

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#avatarTrigger");
    const popup = document.getElementById("avatar-popup");

    if (!popup) return;

    // Click on avatar → toggle
    if (trigger) {
      e.stopPropagation();
      popup.classList.toggle("open");
      return;
    }

    // Click outside → close
    popup.classList.remove("open");
  });
})();
