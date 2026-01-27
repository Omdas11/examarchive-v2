// ===============================
// Avatar Popup + Profile Bridge
// FINAL / BACKEND-READY
// ===============================

(function () {
  const popup = document.getElementById("avatar-popup");

  if (!popup) {
    console.warn("avatar-popup not found");
    return;
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#avatarTrigger");
    const logoutBtn = e.target.closest("#avatarLogoutBtn");

    // ---------------------------
    // Avatar trigger clicked
    // ---------------------------
    if (trigger) {
      e.stopPropagation();
      
      // Always toggle popup (whether logged in or not)
      popup.classList.toggle("open");
      console.log("Avatar trigger clicked - toggling popup");
      return;
    }

    // ---------------------------
    // Logout button clicked
    // ---------------------------
    if (logoutBtn) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Logout clicked");

      if (window.AppwriteAuth) {
        window.AppwriteAuth.logout()
          .then(() => {
            // Close popup and reload page
            popup.classList.remove("open");
            location.reload();
          })
          .catch(err => {
            console.error("Logout error:", err);
            alert("Logout failed. Please try again.");
          });
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
