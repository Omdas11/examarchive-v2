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
  const avatar = document.querySelector(".avatar-mini");
  if (!avatar) return;
  avatar.textContent = getInitials(user.email);
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
// Initial Session
// ===============================
(async () => {
  const { data } = await supabase.auth.getSession();
  applyAuthState(data.session?.user || null);
})();

// ===============================
// Auth Listener
// ===============================
supabase.auth.onAuthStateChange((_event, session) => {
  applyAuthState(session?.user || null);
});

// ===============================
// Login / Logout (HEADER ONLY)
// ===============================
async function login() {
  const email = prompt("Enter your email to login:");
  if (!email) return;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "https://omdas11.github.io/examarchive-v2/"
    }
  });

  if (error) alert(error.message);
  else alert("Check your email for the login link ✉️");
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// ===============================
// Attach avatar click (NOT on login page)
// ===============================
if (!document.body.hasAttribute("data-auth-page")) {
  document.addEventListener("header:loaded", () => {
    const avatarTrigger = document.getElementById("avatarTrigger");
    if (!avatarTrigger) return;

    avatarTrigger.addEventListener("click", async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await logout();
      } else {
        await login();
      }
    });
  });
}
