// ===============================
// Supabase Init
// ===============================
alert("auth.js loaded");
const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CvnyoKEI2PZ6I3RHR4Shyw_lIMB8NdN";

const supabase = supabaseJs.createClient(
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

  avatar.textContent = getInitials(user?.email);
}

// ===============================
// Auth State Listener
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
// Login (Email Magic Link)
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
    alert("Check your email for login link ✉️");
  }
}

// ===============================
// Logout
// ===============================
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// Expose for buttons
window.login = login;
window.logout = logout;
