// ===============================
// Supabase Init
// ===============================
const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CvnyoKEI2PZ6I3RHR4Shyw_lIMB8NdN";

// Safety check (prevents silent failure)
if (!window.supabase) {
  console.error("Supabase CDN not loaded");
} else {
  console.log("Supabase loaded");
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
  const avatar = document.querySelector(".avatar-mini");
  if (!avatar) return;

  avatar.textContent = getInitials(user.email);
}

// ===============================
// Initial Session Check
// ===============================
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    setAvatar(data.session.user);
    document.body.classList.add("logged-in");
  }
})();

// ===============================
// Auth State Change
// ===============================
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    setAvatar(session.user);
    document.body.classList.add("logged-in");
  } else {
    document.body.classList.remove("logged-in");
  }
});

// ===============================
// Login / Logout
// ===============================
async function login() {
  const email = prompt("Enter your email to login:");
  if (!email) return;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href
    }
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Check your email for the login link ✉️");
  }
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// ===============================
// Attach avatar click AFTER header loads
// ===============================
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
