// js/common.js
// ============================================
// GLOBAL BOOTSTRAP (Theme + Partials + Auth Hook)
// SUPABASE – MOBILE DEBUG VERSION
// ============================================

import { supabase } from "./supabase.js";

/* ===============================
   Apply saved theme early
   =============================== */
(function () {
  const theme = localStorage.getItem("theme") || "light";
  const night = localStorage.getItem("night");

  document.body.setAttribute("data-theme", theme);
  if (night === "on") {
    document.body.setAttribute("data-night", "on");
  }
})();

/* ===============================
   Mobile debug helper (VISIBLE)
   =============================== */
function debugBox(text) {
  let box = document.getElementById("debug-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "debug-box";
    box.style.position = "fixed";
    box.style.bottom = "10px";
    box.style.left = "10px";
    box.style.zIndex = "999999";
    box.style.background = "#000";
    box.style.color = "#0f0";
    box.style.padding = "8px";
    box.style.fontSize = "12px";
    box.style.fontFamily = "monospace";
    box.style.maxWidth = "90vw";
    document.body.appendChild(box);
  }
  box.textContent = text;
  console.log(text);
}

/* ===============================
   Load partial helper
   =============================== */
function loadPartial(id, file, callback) {
  fetch(file)
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById(id);
      if (!container) {
        debugBox("❌ Missing container: #" + id);
        return;
      }
      container.innerHTML = html;
      callback && callback();
    })
    .catch(() => debugBox("❌ Failed to load " + file));
}

/* ===============================
   Header
   =============================== */
loadPartial("header", "partials/header.html", () => {
  highlightActiveNav();
  document.dispatchEvent(new CustomEvent("header:loaded"));
  debugBox("✅ Header loaded");
});

/* ===============================
   Footer
   =============================== */
loadPartial("footer", "partials/footer.html");

/* ===============================
   Avatar popup
   =============================== */
loadPartial("avatar-portal", "partials/avatar-popup.html", () => {
  document.dispatchEvent(new CustomEvent("avatar:loaded"));
});

/* ===============================
   Profile panel
   =============================== */
loadPartial("profile-panel-portal", "partials/profile-panel.html", () => {
  document.dispatchEvent(new CustomEvent("profile-panel:loaded"));
});

/* ===============================
   Login modal
   =============================== */
loadPartial("login-modal-portal", "partials/login-modal.html", () => {
  document.dispatchEvent(new CustomEvent("login-modal:loaded"));
});

/* ===============================
   Highlight active nav
   =============================== */
function highlightActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
}

/* ===============================
   Mobile menu
   =============================== */
document.addEventListener("click", (e) => {
  const menuBtn = e.target.closest(".menu-btn");
  const mobileNav = document.getElementById("mobileNav");

  if (menuBtn && mobileNav) {
    mobileNav.classList.toggle("open");
    document.body.classList.toggle("menu-open");
    return;
  }

  if (e.target.closest(".mobile-nav a")) {
    mobileNav?.classList.remove("open");
    document.body.classList.remove("menu-open");
  }
});

/* ===============================
   Footer year
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* ===============================
   Lazy-load avatar.js
   =============================== */
document.addEventListener("avatar:loaded", () => {
  if (document.getElementById("avatar-script")) return;
  const s = document.createElement("script");
  s.src = "js/avatar.js";
  s.defer = true;
  s.id = "avatar-script";
  document.body.appendChild(s);
});

/* ===============================
   🔥 SUPABASE AUTH RESTORE + UI SYNC (DEBUG)
   =============================== */
async function syncAuthToUI(stage) {
  debugBox("🔄 syncAuthToUI @ " + stage);

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    debugBox("❌ Auth error: " + error.message);
    return;
  }

  const user = data?.user || null;

  debugBox(
    "🔎 " + stage +
    " | auth=" + (user ? "USER" : "NULL") +
    " | authEls=" + document.querySelectorAll("[data-auth-only]").length
  );

  document.querySelectorAll("[data-auth-only]").forEach(el => {
    const mode = el.getAttribute("data-auth-only");
    el.hidden = mode === "user" ? !user : !!user;
  });

  const avatarMini = document.querySelector(".avatar-mini");
  if (avatarMini && user) {
    const name = user.user_metadata?.full_name || user.email || "U";
    avatarMini.textContent = name[0].toUpperCase();
  }
}

/* ===============================
   Restore session (SAFE MULTI-HOOK)
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  syncAuthToUI("DOMContentLoaded");
});

window.addEventListener("load", () => {
  syncAuthToUI("window.load");
});

document.addEventListener("header:loaded", () => {
  syncAuthToUI("header.loaded");
});

/* ===============================
   Supabase auth state listener
   =============================== */
supabase.auth.onAuthStateChange((event, session) => {
  alert("🔔 AUTH EVENT: " + event);
  debugBox("🔔 Auth change: " + event);
  syncAuthToUI("auth.change");
});
