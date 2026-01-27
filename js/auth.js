// ===============================
// Supabase Init
// ===============================
const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CvnyoKEI2PZ6I3RHR4Shyw_lIMB8NdN";

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
async function initAuthState() {
  const { data } = await supabase.auth.getSession();
  applyAuthState(data.session?.user || null);
}

// Wait for both header and profile-panel partials to load
let headerLoaded = false;
let profilePanelLoaded = false;

document.addEventListener("header:loaded", () => {
  headerLoaded = true;
  if (profilePanelLoaded) initAuthState();
});

document.addEventListener("profile-panel:loaded", () => {
  profilePanelLoaded = true;
  if (headerLoaded) initAuthState();
});

// Fallback: if partials don't load within 3 seconds, init anyway
setTimeout(() => {
  if (!headerLoaded || !profilePanelLoaded) {
    console.warn("Auth init fallback triggered");
    initAuthState();
  }
}, 3000);

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
          emailRedirectTo: "https://omdas11.github.io/examarchive-v2/"
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
