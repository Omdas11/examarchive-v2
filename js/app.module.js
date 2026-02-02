// js/app.module.js
// ============================================
// SINGLE MODULE ENTRY POINT - Phase 9.2.3
// This is the ONLY file in the entire project that uses type="module"
// All other JavaScript files MUST be classic scripts
// ============================================

import { initAuth } from './modules/auth.module.js';
import { initDebug } from './modules/debug.module.js';

console.log('[APP] Module entry loaded');

// Initialize auth FIRST (this is critical for session restoration)
await initAuth();

// Initialize debug system
initDebug();

console.log('[APP] All modules initialized');
