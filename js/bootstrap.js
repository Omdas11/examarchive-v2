// js/bootstrap.js
// ============================================
// EMERGENCY BOOTSTRAP - Phase 9.2.2
// Must load FIRST before any other scripts
// ============================================

console.log('[BOOT] bootstrap.js loaded');

// Set global bootstrap flag
window.__APP_BOOTED__ = true;

// Global error handler - makes JS failures VISIBLE
window.addEventListener('error', (e) => {
  const errorMsg = `JS ERROR: ${e.message}\nFile: ${e.filename}\nLine: ${e.lineno}`;
  alert(errorMsg);
  console.error('[BOOT] JavaScript Error:', e);
});

// Global promise rejection handler - catches async failures
window.addEventListener('unhandledrejection', (e) => {
  const errorMsg = `PROMISE ERROR: ${e.reason}`;
  alert(errorMsg);
  console.error('[BOOT] Unhandled Promise Rejection:', e);
});

console.log('[BOOT] Global error handlers installed');
console.log('[BOOT] Bootstrap complete - app ready to load');
