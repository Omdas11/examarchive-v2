/* ================================
   Login Modal Handler
   ================================ */

(function () {
  const AUTH_WAIT_DELAY_MS = 200;
  const AUTH_WAIT_MAX_ATTEMPTS = 3;
  let modalInitialized = false;

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForAppwriteAuth() {
    for (let attempt = 0; attempt < AUTH_WAIT_MAX_ATTEMPTS; attempt++) {
      if (window.AppwriteAuth && typeof window.AppwriteAuth.loginWithGitHub === "function") {
        return window.AppwriteAuth;
      }

      if (attempt < AUTH_WAIT_MAX_ATTEMPTS - 1) {
        await delay(AUTH_WAIT_DELAY_MS);
      }
    }

    throw new Error("Appwrite not initialized");
  }

  function initLoginModal() {
    if (modalInitialized) return;

    const modal = document.getElementById("login-modal");
    if (!modal) {
      console.warn("login-modal not found at init");
      return;
    }
    modalInitialized = true;

    console.log("login-modal initialized");

    const githubBtn = document.getElementById("githubLoginBtn");
    const msgEl = document.getElementById("loginModalMsg");

    // ---------- OPEN MODAL ----------
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest("[data-open-login]");
      if (!openBtn) return;

      e.preventDefault();
      
      if (modal) {
        modal.setAttribute("aria-hidden", "false");
      }
      
      // Focus the GitHub button for accessibility
      setTimeout(() => {
        if (githubBtn) githubBtn.focus();
      }, 100);
    });

    // ---------- CLOSE MODAL ----------
    document.addEventListener("click", (e) => {
      if (modal.getAttribute("aria-hidden") !== "false") return;

      const closeBtn = e.target.closest("[data-close-login]");
      const card = e.target.closest(".login-modal-card");

      // Close if X button, backdrop click, or outside card
      if (closeBtn || !card) {
        modal.setAttribute("aria-hidden", "true");
        
        // Clear any messages
        if (msgEl) {
          msgEl.hidden = true;
          msgEl.textContent = "";
          msgEl.classList.remove("error");
        }
      }
    });

    // ---------- ESC KEY ----------
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
        modal.setAttribute("aria-hidden", "true");
        
        if (msgEl) {
          msgEl.hidden = true;
          msgEl.textContent = "";
          msgEl.classList.remove("error");
        }
      }
    });

    // ---------- GITHUB LOGIN ----------
    if (githubBtn) {
      githubBtn.addEventListener("click", async () => {
        try {
          const appwriteAuth = await waitForAppwriteAuth();

          // Show loading message
          if (msgEl) {
            msgEl.textContent = "Redirecting to GitHub...";
            msgEl.classList.remove("error");
            msgEl.hidden = false;
          }

          githubBtn.disabled = true;
          githubBtn.textContent = "Redirecting...";

          // Trigger GitHub OAuth (will redirect to GitHub)
          await appwriteAuth.loginWithGitHub();

        } catch (error) {
          console.error("Login error:", error);
          
          if (msgEl) {
            msgEl.textContent = error.message || "Login failed. Please try again.";
            msgEl.classList.add("error");
            msgEl.hidden = false;
          }

          githubBtn.disabled = false;
          githubBtn.innerHTML = `
            <svg class="github-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          `;
        }
      });
    }
  }

  // Wait until login modal partial is loaded
  document.addEventListener("login-modal:loaded", initLoginModal);

})();
