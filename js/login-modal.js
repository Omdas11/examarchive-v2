import { supabase } from "./supabase.js";

alert("✅ login-modal.js (supabase) loaded");

let oauthLocked = false;

/* ===============================
   WAIT FOR MODAL
   =============================== */
function waitForModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector('[data-provider="google"]');
  const closeBtn = document.querySelector(".modal-close");

  if (!modal || !googleBtn || !loginBtn) {
    alert("⏳ Waiting for login modal DOM…");
    return setTimeout(waitForModal, 300);
  }

  alert("🔥 Modal + buttons FOUND");

  /* ===============================
     OPEN MODAL (ALWAYS ALLOWED)
     =============================== */
  loginBtn.addEventListener("click", () => {
    alert("🟢 LOGIN CLICKED → opening modal");
    modal.classList.add("open");
  });

  /* ===============================
     CLOSE MODAL
     =============================== */
  closeBtn?.addEventListener("click", () => {
    alert("❌ Login modal closed");
    modal.classList.remove("open");
  });

  /* ===============================
     GOOGLE LOGIN
     =============================== */
  googleBtn.addEventListener("click", async () => {
    if (oauthLocked) {
      alert("🛑 OAuth blocked — already signed in");
      return;
    }

    alert("🚀 GOOGLE OAUTH START");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      alert("❌ OAuth error: " + error.message);
    } else {
      alert("🔁 Redirecting to Google…");
    }
  });
}

waitForModal();

/* ===============================
   AUTH STATE LISTENER (LOCK ONLY OAUTH)
   =============================== */
supabase.auth.onAuthStateChange((event) => {
  alert("🔔 AUTH EVENT: " + event);

  if (event === "SIGNED_IN") {
    oauthLocked = true;
    alert("🔒 OAuth locked after SIGNED_IN");

    // Close modal if open
    document.querySelector(".login-modal")?.classList.remove("open");
  }
});
