import { supabase } from "./supabase.js";

alert("✅ login-modal.js loaded");

/* =====================================
   🚫 STOP MODAL LOGIC AFTER OAUTH RETURN
   ===================================== */
if (window.location.hash.includes("access_token")) {
  alert("⛔ OAuth return detected — login modal DISABLED");
  // Supabase will restore session automatically
  throw new Error("OAuth return — stop login-modal.js");
}

/* =====================================
   NORMAL LOGIN MODAL LOGIC (PRE-LOGIN)
   ===================================== */
function waitForModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector('[data-provider="google"]');
  const closeBtn = document.querySelector(".modal-close");

  if (!modal || !loginBtn || !googleBtn) {
    alert("⏳ Waiting for login modal DOM…");
    return setTimeout(waitForModal, 300);
  }

  alert("🔥 Login modal + Google button FOUND");

  // Open modal
  loginBtn.addEventListener("click", () => {
    alert("🟢 Login clicked → opening modal");
    modal.classList.add("open");
  });

  // Close modal
  closeBtn?.addEventListener("click", () => {
    alert("❌ Login modal closed");
    modal.classList.remove("open");
  });

  // Google OAuth
  googleBtn.addEventListener("click", async () => {
    alert("🚀 GOOGLE OAUTH START");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      alert("❌ OAuth error: " + error.message);
    } else {
      alert("🔁 Redirecting to Google…");
    }
  });
}

waitForModal();
