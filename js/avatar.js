// ===============================
// Avatar Popup + Profile Bridge
// FINAL / BACKEND-READY
// ===============================

(function () {
  const popup = document.getElementById("avatar-popup");
  const panel = document.getElementById("profile-panel");

  if (!popup) {
    console.warn("avatar-popup not found");
    return;
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#avatarTrigger");
    const openProfileBtn = e.target.closest("[data-open-profile]");

    // ---------------------------
    // Avatar trigger clicked
    // ---------------------------
    if (trigger) {
      e.stopPropagation();
      
      // Check if user is logged in
      const isLoggedIn = document.body.classList.contains("logged-in");
      
      if (isLoggedIn) {
        // Logged in: toggle popup
        popup.classList.toggle("open");
        console.log("Avatar trigger clicked (logged in)");
      } else {
        // Guest: redirect to login page
        console.log("Avatar trigger clicked (guest) - redirecting to login");
        window.location.href = "login.html";
      }
      return;
    }

    // ---------------------------
    // Open expanded profile panel
    // ---------------------------
    if (openProfileBtn) {
      e.stopPropagation();
      console.log("Open profile clicked");

      popup.classList.remove("open");

      if (panel) {
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
      } else {
        console.warn("profile-panel not found");
      }

      return;
    }

    // ---------------------------
    // Click outside → close popup
    // ---------------------------
    if (!e.target.closest("#avatar-popup")) {
      popup.classList.remove("open");
    }
  });
})();
