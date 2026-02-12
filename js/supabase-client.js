// js/supabase-client.js
// ============================================
// SUPABASE CLIENT SINGLETON - Phase 1.4
// SINGLE SOURCE OF TRUTH for Supabase client instance
// Guarantees client is created once and safely accessed
// ============================================

const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nwdMKnjcV_o-WSe_VMs9CQ_xpaMeGAT";

let supabaseInstance = null;

/**
 * Get or create Supabase client instance
 * This is the ONLY way to access the Supabase client
 * Ensures client is created once and safely reused
 * 
 * @returns {Object|null} Supabase client or null if SDK not loaded
 */
function getSupabase() {
  // If instance already exists, return it
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Check if Supabase SDK is loaded
  if (!window.supabase || !window.supabase.createClient) {
    console.error('[SUPABASE-CLIENT] Supabase SDK not loaded. Include CDN script first.');
    return null;
  }

  // Create client instance
  try {
    supabaseInstance = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce"
        }
      }
    );

    console.log('[SUPABASE-CLIENT] Client instance created');

    // Store in window.App for backward compatibility
    if (window.App) {
      window.App.supabase = supabaseInstance;
    }

    // Also expose globally for classic scripts (backward compatibility)
    window.__supabase__ = supabaseInstance;

    return supabaseInstance;
  } catch (error) {
    console.error('[SUPABASE-CLIENT] Error creating client:', error);
    return null;
  }
}

// Expose getSupabase globally
window.getSupabase = getSupabase;

// For backward compatibility, also create a waitForSupabase that uses getSupabase
window.waitForSupabase = async function(timeout = 10000) {
  // Try to get client immediately
  const client = getSupabase();
  if (client) {
    return Promise.resolve(client);
  }

  // If no client yet, wait for app:ready or poll
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const readyHandler = () => {
      const client = getSupabase();
      if (client) {
        resolve(client);
      }
    };
    document.addEventListener('app:ready', readyHandler, { once: true });
    
    const interval = setInterval(() => {
      const client = getSupabase();
      if (client) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        resolve(client);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        console.error('[SUPABASE-CLIENT] Timeout waiting for Supabase client');
        resolve(null);
      }
    }, 50);
  });
};

console.log('[SUPABASE-CLIENT] Singleton module loaded');
