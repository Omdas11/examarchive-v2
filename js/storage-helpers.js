// js/storage-helpers.js
// ============================================
// STORAGE HELPERS - Phase 6 (Appwrite)
// File storage migrated from Supabase Storage to Appwrite.
// Supabase is still used for Auth, DB, RLS, Roles, RPC.
// ============================================

/**
 * Upload a file to Appwrite Storage
 * @param {File} file - File to upload
 * @param {Object} options
 * @param {string} options.bucketId - Appwrite bucket ID
 * @param {string} [options.fileId]  - Custom file ID (generated if omitted)
 * @param {Function} [options.onProgress] - Progress callback (percent)
 * @returns {Promise<{ data: { fileId: string, fileUrl: string } | null, error: Error | null }>}
 */
async function uploadFile(file, { bucketId, fileId, onProgress }) {
  try {
    const appwrite = window.getAppwrite ? window.getAppwrite() : null;
    if (!appwrite) throw new Error('Appwrite not initialised');

    const resolvedFileId = fileId || (window.generateAppwriteId ? window.generateAppwriteId() : ('f' + Date.now()));

    const result = await appwrite.storage.createFile(bucketId, resolvedFileId, file);

    if (onProgress) onProgress(100);

    const fileUrl = window.getAppwriteFileViewUrl
      ? window.getAppwriteFileViewUrl(bucketId, result.$id)
      : '#';

    return { data: { fileId: result.$id, fileUrl }, error: null };
  } catch (error) {
    console.error('[STORAGE] Upload error:', error);
    return { data: null, error };
  }
}

/**
 * Get a direct view URL for an Appwrite file.
 * For public-read buckets this URL is stable and requires no auth.
 * @param {string} bucketId
 * @param {string} fileId
 * @returns {string} URL
 */
function getFileViewUrl(bucketId, fileId) {
  return window.getAppwriteFileViewUrl
    ? window.getAppwriteFileViewUrl(bucketId, fileId)
    : '#';
}

/**
 * Delete a file from Appwrite Storage
 * @param {string} bucketId - Appwrite bucket ID
 * @param {string} fileId   - Appwrite file ID
 * @returns {Promise<boolean>} true on success
 */
async function deleteFile(bucketId, fileId) {
  try {
    const appwrite = window.getAppwrite ? window.getAppwrite() : null;
    if (!appwrite) throw new Error('Appwrite not initialised');
    await appwrite.storage.deleteFile(bucketId, fileId);
    return true;
  } catch (error) {
    console.error('[STORAGE] Delete error:', error);
    return false;
  }
}

// Expose to window for other scripts
window.StorageHelpers = {
  uploadFile,
  getFileViewUrl,
  deleteFile
};

// Legacy alias kept for backwards compatibility
window.SupabaseClient = window.StorageHelpers;
