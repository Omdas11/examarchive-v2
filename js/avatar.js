document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) {
    console.error("Avatar elements missing");
    return;
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    popup.classList.remove("open");
  });
});
