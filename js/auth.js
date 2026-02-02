// js/auth.js
// Phase 9.2.3 - Converted to Classic JS (NO IMPORTS)
// Simple auth check - mainly for legacy/debug purposes

console.log("🔐 auth.js loaded");

async function checkAuth() {
  await new Promise((resolve) => {
    if (window.__AUTH_READY__) {
      resolve();
      return;
    }
    const checkInterval = setInterval(() => {
      if (window.__AUTH_READY__) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);
  });

  const session = window.__SESSION__;

  if (!session) {
    console.log("ℹ️ No active session");
    return;
  }

  const user = session.user;
  console.log("✅ Logged in as: " + user.email);

  // expose user globally
  window.currentUser = user;

  // update UI
  document.body.classList.add("logged-in");
}

checkAuth();

// listen for auth changes
window.addEventListener('auth-state-changed', (e) => {
  const session = e.detail.session;
  if (session) {
    console.log("🔄 Session updated");
    window.location.reload();
  }
});
