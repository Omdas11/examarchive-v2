// js/avatar.js
// ============================================
// Avatar + Header Auth UI Binder (Phase 9.2.3 - Classic JS)
// NO IMPORTS - Plain JavaScript only
// ============================================

window.Avatar = {
  init: function() {
    console.log('[AVATAR] Initializing avatar bindings...');
    
    // Init after header loads
    document.addEventListener("header:loaded", () => {
      const loginBtn = document.querySelector(".login-trigger");
      const avatarBtn = document.querySelector(".avatar-trigger");
      const avatarMini = document.querySelector(".avatar-mini");

      this.bindAuthUI(loginBtn, avatarBtn, avatarMini);
    });

    // Logout handler
    document.addEventListener("click", async (e) => {
      if (e.target.closest("[data-logout]")) {
        if (window.__supabase__) {
          await window.__supabase__.auth.signOut();
          window.__SESSION__ = null;
        }
        location.reload();
      }
    });
  },

  bindAuthUI: function(loginBtn, avatarBtn, avatarMini) {
    // Listen for auth state changes
    window.addEventListener('auth-state-changed', (e) => {
      const session = e.detail.session;
      if (session && session.user) {
        this.showUser(session.user, loginBtn, avatarBtn, avatarMini);
      } else {
        this.showGuest(loginBtn, avatarBtn, avatarMini);
      }
    });

    // Check initial state
    if (window.__SESSION__ && window.__SESSION__.user) {
      this.showUser(window.__SESSION__.user, loginBtn, avatarBtn, avatarMini);
    } else {
      this.showGuest(loginBtn, avatarBtn, avatarMini);
    }
  },

  showUser: function(user, loginBtn, avatarBtn, avatarMini) {
    // Toggle visibility
    if (loginBtn) loginBtn.setAttribute("hidden", "true");
    if (avatarBtn) avatarBtn.removeAttribute("hidden");

    // Show initial
    const name = user.user_metadata?.name || user.email || "U";
    if (avatarMini) {
      avatarMini.textContent = name.charAt(0).toUpperCase();
    }

    // Optional: color
    if (window.applyAvatarColors) {
      window.applyAvatarColors(name);
    }
  },

  showGuest: function(loginBtn, avatarBtn, avatarMini) {
    if (avatarBtn) avatarBtn.setAttribute("hidden", "true");
    if (loginBtn) loginBtn.removeAttribute("hidden");

    if (avatarMini) {
      avatarMini.textContent = "?";
    }
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.Avatar.init());
} else {
  window.Avatar.init();
}
