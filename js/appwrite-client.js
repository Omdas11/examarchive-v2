// js/appwrite-client.js
// ============================================
// APPWRITE CLIENT SINGLETON - Phase 6
// File storage has been migrated from Supabase Storage to Appwrite.
// Only Project ID and Endpoint are used here — NO secret API keys.
// Supabase remains responsible for Auth, DB, RLS, Roles, and RPC.
// ============================================

// ---- Configuration (public values only, no secrets) ----
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6857f1810039a2a4d7b6"; // Appwrite Project ID
const APPWRITE_PAPERS_BUCKET_ID = "papers";           // Bucket for paper PDFs
const APPWRITE_AVATARS_BUCKET_ID = "avatars";         // Bucket for user avatars

let _appwriteClient = null;
let _appwriteStorage = null;

/**
 * Get or initialise the Appwrite client/storage singleton.
 * Requires the Appwrite Web SDK (window.Appwrite) to be loaded via CDN first.
 * @returns {{ client: Client, storage: Storage } | null}
 */
function getAppwrite() {
  if (_appwriteClient && _appwriteStorage) {
    return { client: _appwriteClient, storage: _appwriteStorage };
  }

  if (!window.Appwrite) {
    console.error('[APPWRITE] SDK not loaded — include the Appwrite CDN script before appwrite-client.js');
    return null;
  }

  try {
    const { Client, Storage } = window.Appwrite;
    _appwriteClient = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
    _appwriteStorage = new Storage(_appwriteClient);
    return { client: _appwriteClient, storage: _appwriteStorage };
  } catch (err) {
    console.error('[APPWRITE] Failed to initialise client:', err);
    return null;
  }
}

/**
 * Build a direct view URL for an Appwrite file.
 * No SDK or auth required — works for public-read buckets.
 * @param {string} bucketId
 * @param {string} fileId
 * @returns {string} URL
 */
function getAppwriteFileViewUrl(bucketId, fileId) {
  if (!bucketId || !fileId) return '#';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

/**
 * Generate a unique Appwrite-compatible file ID.
 * Uses Appwrite's ID.unique() if available, falls back to a simple generator.
 * @returns {string}
 */
function generateAppwriteId() {
  if (window.Appwrite && window.Appwrite.ID) {
    return window.Appwrite.ID.unique();
  }
  // Fallback: 20-char alphanumeric string compatible with Appwrite IDs
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// ---- Expose globally ----
window.getAppwrite = getAppwrite;
window.getAppwriteFileViewUrl = getAppwriteFileViewUrl;
window.generateAppwriteId = generateAppwriteId;
window.APPWRITE_PAPERS_BUCKET_ID = APPWRITE_PAPERS_BUCKET_ID;
window.APPWRITE_AVATARS_BUCKET_ID = APPWRITE_AVATARS_BUCKET_ID;
window.APPWRITE_ENDPOINT = APPWRITE_ENDPOINT;
window.APPWRITE_PROJECT_ID = APPWRITE_PROJECT_ID;
