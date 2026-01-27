// ===============================
// 🔍 MOBILE VISUAL DEBUG BAR
// ===============================
(function createDebugBar() {
  const bar = document.createElement("div");
  bar.id = "auth-debug";
  bar.style.cssText = `
    position: fixed;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    background: #111;
    color: #fff;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 12px;
    z-index: 99999;
    opacity: 0.85;
    max-width: 90%;
    text-align: center;
  `;
  bar.textContent = "Auth: loading…";
  document.body.appendChild(bar);
})();

function debug(msg) {
  console.log("[AUTH]", msg);
  const bar = document.getElementById("auth-debug");
  if (bar) bar.textContent = `Auth: ${msg}`;
}

// ===============================
// 🧠 SUPABASE INIT
// ===============================
const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CvnyoKEI2PZ6I3RHR4Shyw_lIMB8NdN";

if (!window.supabase) {
  debug("❌ Supabase CDN not loaded");
  throw new Error("Supabase CDN missing");
}

debug("✅ Supabase CDN loaded");

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = supabase;

// ===============================
// 👤 HELPERS
// ===============================
function getInitials(email) {
  if (!email) return "??";
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

function setAvatar(user) {
  const avatar = document.querySelector(".avatar-mini");
  if (!avatar) {
    debug("⚠️ avatar-mini not found");
    return;
  }
  avatar.textContent = getInitials(user.email);
  debug("👤 Avatar set");
}

// ===============================
// 🔁 APPLY AUTH STATE (SINGLE SOURCE)
// ===============================
function applyAuthState(user) {
  const isLoggedIn = !!user;

  document.body.classList.toggle("logged-in", isLoggedIn);
  debug(isLoggedIn ? "🟢 logged in" : "⚪ guest");

  document.querySelectorAll("[data-auth-only]").forEach(el => {
    const wants = el.getAttribute("data-auth-only");
    const show =
      (wants === "user" && isLoggedIn) ||
      (wants === "guest" && !isLoggedIn);
    el.hidden = !show;
  });

  if (isLoggedIn) {
    setAvatar(user);
  }
}

// ===============================
// 🔍 INITIAL SESSION CHECK
// ===============================
(async () => {
  debug("⏳ checking session");
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    debug("❌ session error");
    console.error(error);
    return;
  }

  applyAuthState(data.session?.user || null);
})();

// ===============================
// 🔄 AUTH STATE LISTENER
// ===============================
supabase.auth.onAuthStateChange((event, session) => {
  debug(`🔄 auth event: ${event}`);
  applyAuthState(session?.user || null);
});

// ===============================
// 🚪 LOGOUT
// ===============================
async function logout() {
  debug("🚪 logging out");
  await supabase.auth.signOut();
  location.reload();
}

// ===============================
// 🧩 HEADER AVATAR CLICK
// ===============================
document.addEventListener("header:loaded", () => {
  debug("📦 header loaded");

  const avatarTrigger = document.getElementById("avatarTrigger");
  if (!avatarTrigger) {
    debug("❌ avatarTrigger missing");
    return;
  }

  avatarTrigger.addEventListener("click", async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      logout();
    } else {
      debug("➡️ redirect login");
      window.location.href = "login.html";
    }
  });
});
