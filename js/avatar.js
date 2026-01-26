// ===============================
// Avatar Popup – MOBILE SAFE
// ===============================

document.addEventListener("header:loaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) return;

  // 🔥 IMPORTANT: remove any old handlers
  trigger.onclick = null;

  // ✅ OPEN / CLOSE (TOUCH + CLICK SAFE)
  const togglePopup = (e) => {
    e.preventDefault();
    e.stopPropagation();
    popup.classList.toggle("open");
  };

  trigger.addEventListener("click", togglePopup);
  trigger.addEventListener("touchstart", togglePopup, { passive: false });

  // ✅ CLOSE when tapping outside
  document.addEventListener("click", () => {
    popup.classList.remove("open");
  });

  document.addEventListener("touchstart", () => {
    popup.classList.remove("open");
  }, { passive: true });
});
