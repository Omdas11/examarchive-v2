document.body.style.border = "4px solid red";

document.addEventListener("header:loaded", () => {
  alert("avatar.js is running");

  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) {
    alert("Avatar elements NOT found");
    return;
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
    alert("Avatar clicked");
  });
});
