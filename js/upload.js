// ===============================
// Upload Page - Auth Guard
// ===============================

import { requireAuth } from "./common.js";

console.log("📤 upload.js loaded");

// Check auth when page loads
document.addEventListener("DOMContentLoaded", async () => {
  const isAuthenticated = await requireAuth({
    showMessage: true,
    redirectToLogin: false
  });
  
  if (!isAuthenticated) {
    console.log("🔒 Upload page requires authentication");
    // UI is already updated by requireAuth
  } else {
    console.log("✅ User authenticated, upload page ready");
  }
});
