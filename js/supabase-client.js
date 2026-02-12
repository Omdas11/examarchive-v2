// js/supabase-client.js
// ============================================
// ENHANCED SUPABASE CLIENT
// Phase 9.2.8 - Fixed to wait for Supabase initialization
// Includes storage helpers for Phase 8
// ============================================

/**
 * Storage bucket names
 */
const BUCKETS = {
  TEMP: 'uploads-temp',
  APPROVED: 'uploads-approved'
};

/**
 * Upload file to Supabase Storage with resumable uploads
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @param {string} options.bucket - Bucket name
 * @param {string} options.path - File path in bucket
 * @param {Function} options.onProgress - Progress callback (percent)
 * @returns {Promise<Object>} Upload result with path and error
 */
async function uploadFile(file, { bucket, path, onProgress }) {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    // For small files (< 6MB), use regular upload
    if (file.size < 6 * 1024 * 1024) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      if (onProgress) onProgress(100);
      return { data, error: null };
    }

    // For larger files, use resumable upload
    // Note: Resumable uploads require additional setup
    // For now, we'll use regular upload with progress tracking
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    if (onProgress) onProgress(100);
    return { data, error: null };

  } catch (error) {
    console.error('Upload error:', error);
    return { data: null, error };
  }
}

/**
 * Get public URL for a file in approved bucket
 * @param {string} path - File path
 * @returns {string|null} Public URL or null if Supabase not ready
 */
function getPublicUrl(path) {
  const supabase = window.__supabase__;
  if (!supabase) {
    console.error('[STORAGE] Supabase not initialized for getPublicUrl');
    return null;
  }
  const { data } = supabase.storage
    .from(BUCKETS.APPROVED)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Get signed URL for a file in private bucket
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string|null>} Signed URL or null
 */
async function getSignedUrl(bucket, path, expiresIn = 3600) {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

/**
 * Move file between buckets
 * @param {string} fromBucket - Source bucket
 * @param {string} fromPath - Source path
 * @param {string} toBucket - Destination bucket
 * @param {string} toPath - Destination path
 * @returns {Promise<boolean>} Success status
 */
async function moveFile(fromBucket, fromPath, toBucket, toPath) {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    // Download from source
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(fromBucket)
      .download(fromPath);

    if (downloadError) throw downloadError;

    // Upload to destination
    const { error: uploadError } = await supabase.storage
      .from(toBucket)
      .upload(toPath, fileData, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Delete from source
    const { error: deleteError } = await supabase.storage
      .from(fromBucket)
      .remove([fromPath]);

    if (deleteError) {
      console.error('Error deleting source file:', deleteError);
      // Don't throw - file was copied successfully
    }

    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
}

/**
 * Delete file from storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @returns {Promise<boolean>} Success status
 */
async function deleteFile(bucket, path) {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Copy file within or between buckets
 * @param {string} fromBucket - Source bucket
 * @param {string} fromPath - Source path
 * @param {string} toBucket - Destination bucket
 * @param {string} toPath - Destination path
 * @returns {Promise<boolean>} Success status
 */
async function copyFile(fromBucket, fromPath, toBucket, toPath) {
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    // Download from source
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(fromBucket)
      .download(fromPath);

    if (downloadError) throw downloadError;

    // Upload to destination
    const { error: uploadError } = await supabase.storage
      .from(toBucket)
      .upload(toPath, fileData, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    return true;
  } catch (error) {
    console.error('Error copying file:', error);
    return false;
  }
}


// Expose to window for other scripts
window.SupabaseClient = {
  BUCKETS,
  uploadFile,
  getPublicUrl,
  getSignedUrl,
  moveFile,
  deleteFile,
  copyFile
};
