// js/bootstrap.js
// ============================================
// SINGLE GLOBAL BOOTSTRAP - Phase 9.2.4
// Must load FIRST before any other scripts
// ============================================

(function () {
  if (window.__APP_BOOTED__) return;
  window.__APP_BOOTED__ = true;

  console.log('[BOOT] Initializing app');

  window.App = {
    ready: false,
    supabase: null,
    session: null
  };

  // Global error handler - makes JS failures VISIBLE
  window.addEventListener('error', (e) => {
    const errorMsg = `JS ERROR: ${e.message}\nFile: ${e.filename}\nLine: ${e.lineno}`;
    console.error('[BOOT] JavaScript Error:', e);
  });

  // Global promise rejection handler - catches async failures
  window.addEventListener('unhandledrejection', (e) => {
    const errorMsg = `PROMISE ERROR: ${e.reason}`;
    console.error('[BOOT] Unhandled Promise Rejection:', e);
  });

  console.log('[BOOT] Global error handlers installed');
  console.log('[BOOT] Bootstrap complete - app ready to load');
})();
