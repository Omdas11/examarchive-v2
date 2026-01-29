// js/auth.js
import { account } from "./appwrite.js";

window.AppwriteAuth = {
  user: null,

  async restoreSession() {
    try {
      const user = await account.get();
      this.user = user;

      alert("✅ SESSION RESTORED: " + user.email);

      // Hide login button
      document.querySelectorAll(".login-trigger").forEach(btn => {
        btn.hidden = true;
      });

      // Show avatar trigger
      document.querySelectorAll("[data-auth-only='user']").forEach(el => {
        el.hidden = false;
      });

      document.dispatchEvent(
        new CustomEvent("auth:changed", { detail: user })
      );

    } catch (err) {
      alert("ℹ️ No active session");
    }
  }
};
