import { supabase } from "./supabase.js";

alert("✅ login-modal.js (supabase) loaded");

/* ===============================
   🔒 AUTH GUARD (ANTI-LOOP)
   =============================== */
let loginLocked = false;

async function authGuard() {
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    loginLocked = true;
    alert("🛑 User already logged in — login modal DISABLED");
  } else {
    alert("ℹ️ No active user — login allowed");
  }
}

authGuard();

/* ===============================
   WAIT FOR MODAL
   =============================== */
function waitForModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector('[data-provider="google"]');
  const closeBtn = document.querySelector(".modal-close");

  if (!modal || !googleBtn) {
    alert("⏳ Waiting for login modal DOM…");
    return setTimeout(waitForModal, 300);
  }

  alert("🔥 Modal + Google button FOUND");

  /* ===============================
     OPEN MODAL
     =============================== */
  loginBtn?.addEventListener("click", async () => {
    const { data } = await supabase.auth.getUser();

    if (data?.user) {
      alert("✅ Already logged in — modal will NOT open");
      return;
    }

    alert("🟢 LOGIN CLICKED — opening modal");
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
    if (loginLocked) {
      alert("🛑 OAuth BLOCKED — user already signed in");
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
   🔔 AUTH STATE LISTENER
   =============================== */
supabase.auth.onAuthStateChange((event) => {
  alert("🔔 AUTH EVENT: " + event);

  if (event === "SIGNED_IN") {
    loginLocked = true;
    alert("🔒 Login locked after SIGNED_IN");
  }
});
