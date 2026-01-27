// ===============================
// Supabase Init
// ===============================
const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZ2VvZmZ0cmhoeXZuanBwdHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NzY5ODMsImV4cCI6MjA1MTA1Mjk4M30.CvnyoKEI2PZ6I3RHR4Shyw_lIMB8NdN";

// Ensure supabase library is loaded
if (!window.supabase) {
  console.error("Supabase library not loaded. Please ensure the CDN script is loaded first.");
}

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===============================
// Helpers
// ===============================
function getInitials(email) {
  if (!email) return "??";
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

function setAvatar(user) {
  // Header avatar
  const avatarMini = document.querySelector(".avatar-mini");
  if (avatarMini) {
    avatarMini.textContent = getInitials(user.email);
  }

  // Profile panel avatar
  const avatarLarge = document.querySelector(".profile-avatar");
  if (avatarLarge) {
    avatarLarge.setAttribute("data-initials", getInitials(user.email));
  }

  // Text fields
  document.querySelectorAll('[data-field="name"]').forEach(el => {
    el.textContent = user.email;
  });

  document.querySelectorAll('[data-field="username"]').forEach(el => {
    el.textContent = user.email;
  });
}

/**
 * 🔥 SINGLE SOURCE OF TRUTH
 */
function applyAuthState(user) {
  const isLoggedIn = !!user;

  document.body.classList.toggle("logged-in", isLoggedIn);

  document.querySelectorAll("[data-auth-only]").forEach(el => {
    const wants = el.getAttribute("data-auth-only");
    el.hidden = !(
      (wants === "user" && isLoggedIn) ||
      (wants === "guest" && !isLoggedIn)
    );
  });

  if (isLoggedIn) {
    setAvatar(user);
  }
}

// ===============================
// Initial Session (WAIT FOR DOM + PARTIALS)
// ===============================

// Maximum time to wait for partials before falling back (2 seconds)
const AUTH_INIT_TIMEOUT_MS = 2000;

async function initAuthState() {
  const { data } = await supabase.auth.getSession();
  applyAuthState(data.session?.user || null);
}

// Wait for required partials based on what's on the page
let headerLoaded = false;
let profilePanelLoaded = false;
let authInitialized = false; // Prevent duplicate initialization

// Check if profile panel portal exists on this page
const hasProfilePanel = !!document.getElementById("profile-panel-portal");

function tryInitAuth() {
  if (authInitialized) return; // Already initialized
  
  const canInit = headerLoaded && (!hasProfilePanel || profilePanelLoaded);
  if (canInit) {
    authInitialized = true;
    initAuthState();
  }
}

document.addEventListener("header:loaded", () => {
  headerLoaded = true;
  tryInitAuth();
});

document.addEventListener("profile-panel:loaded", () => {
  profilePanelLoaded = true;
  tryInitAuth();
});

// Fallback: if partials don't load within timeout, init anyway
setTimeout(() => {
  if (!authInitialized) {
    console.warn("Auth init fallback triggered after", AUTH_INIT_TIMEOUT_MS, "ms");
    authInitialized = true;
    initAuthState();
  }
}, AUTH_INIT_TIMEOUT_MS);

// ===============================
// Auth Listener
// ===============================
supabase.auth.onAuthStateChange((_event, session) => {
  applyAuthState(session?.user || null);
});

// ===============================
// Profile Panel Login / Logout
// ===============================
document.addEventListener("profile-panel:loaded", () => {
  const emailInput = document.getElementById("profileLoginEmail");
  const loginBtn = document.getElementById("profileLoginBtn");
  const loginMsg = document.getElementById("profileLoginMsg");
  const logoutBtn = document.getElementById("profileLogoutBtn");

  // Login (guest)
  if (loginBtn && emailInput) {
    loginBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      if (!email) {
        loginMsg.textContent = "Please enter your email.";
        return;
      }

      loginMsg.textContent = "Sending login link…";

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        loginMsg.textContent = error.message;
      } else {
        loginMsg.textContent =
          "Check your email ✉️ (open link in the same browser)";
      }
    });
  }

  // Logout (user)
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      location.reload();
    });
  }
});
