document.body.style.border = "4px solid red";

document.addEventListener("header:loaded", () => {
  const trigger = document.getElementById("avatarTrigger");
  const popup = document.getElementById("avatar-popup");

  if (!trigger || !popup) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });

  // Close when clicking outside
  document.addEventListener("click", () => {
    popup.classList.remove("open");
  });
});
