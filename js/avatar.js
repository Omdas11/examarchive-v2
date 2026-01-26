alert("avatar.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  console.log("trigger:", trigger);
  console.log("popup:", popup);

  if (!trigger || !popup) {
    alert("Avatar elements NOT found");
    return;
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    alert("Avatar clicked");
    popup.classList.toggle("open");
  });
});
