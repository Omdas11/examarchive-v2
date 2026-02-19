// js/app.module.js
// ============================================
// SINGLE MODULE ENTRY POINT
// This is the ONLY file that uses type="module"
// ============================================

import { initAuth } from './modules/auth.module.js';
import { initDebug } from './modules/debug.module.js';

console.log('[APP] Module entry loaded');

// Initialize auth FIRST (this is critical for session restoration)
await initAuth();

// Initialize debug system
initDebug();

console.log('[APP] All modules initialized');
