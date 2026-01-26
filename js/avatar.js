// DEBUG (remove later)
document.body.style.border = "4px solid red";

document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) {
    console.warn("Avatar elements not found");
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
