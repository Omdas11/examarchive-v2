// js/login-modal.js
console.log("✅ login-modal.js loaded");

function initLoginModal() {
  const modal = document.getElementById("login-modal");
  const loginBtn = document.querySelector(".login-trigger");

  if (!modal || !loginBtn) {
    alert("❌ Modal or Login button NOT found");
    return;
  }

  alert("✅ Login modal JS initialized");

  loginBtn.addEventListener("click", () => {
    alert("🔥 Opening login modal");
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
  });

  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close-login")) {
      modal.setAttribute("aria-hidden", "true");
      modal.style.display = "none";
    }
  });
}

// 🔥 Wait for header + modal to exist
document.addEventListener("login-modal:loaded", initLoginModal);
document.addEventListener("header:loaded", initLoginModal);
