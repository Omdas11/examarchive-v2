// Phase 9.2.8 - Fixed timing issues with ES modules
// js/upload-handler.js
// ============================================
// UPLOAD HANDLER - Supabase Storage Integration
// Phase 9.2.8: Fixed debug logging to handle missing Debug object
// ============================================

// Safe debug logging helpers that work before Debug module loads
function safeLogInfo(module, message, data) {
  if (window.Debug && window.Debug.logInfo) {
    window.Debug.logInfo(module, message, data);
  } else {
    console.log(`[${module.toUpperCase()}] ${message}`, data || '');
  }
}

function safeLogWarn(module, message, data) {
  if (window.Debug && window.Debug.logWarn) {
    window.Debug.logWarn(module, message, data);
  } else {
    console.warn(`[${module.toUpperCase()}] ${message}`, data || '');
  }
}

function safeLogError(module, message, data) {
  if (window.Debug && window.Debug.logError) {
    window.Debug.logError(module, message, data);
  } else {
    console.error(`[${module.toUpperCase()}] ${message}`, data || '');
  }
}

// Module constants
const UploadDebugModule = {
  UPLOAD: 'upload',
  STORAGE: 'storage',
  AUTH: 'auth'
};

/**
 * Wait for Supabase client to be initialized
 * @param {number} timeout - Max time to wait in ms (default 10000)
 * @returns {Promise<Object|null>} Supabase client or null on timeout
 */
async function waitForSupabaseClient(timeout = 10000) {
  if (window.__supabase__) {
    return window.__supabase__;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const readyHandler = () => {
      if (window.__supabase__) {
        resolve(window.__supabase__);
      }
    };
    document.addEventListener('app:ready', readyHandler, { once: true });
    
    const interval = setInterval(() => {
      if (window.__supabase__) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        resolve(window.__supabase__);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        console.error('[UPLOAD-HANDLER] Timeout waiting for Supabase client');
        resolve(null);
      }
    }, 50);
  });
}

/**
 * Handle file upload to temp storage with submission tracking
 * @param {File} file - PDF file to upload
 * @param {Object} metadata - Paper metadata
 * @param {string} metadata.paperCode - Paper/subject code
 * @param {number} metadata.examYear - Examination year
 * @param {string} metadata.paperName - Paper name (optional)
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<Object>} Result with submissionId and error
 */
async function handlePaperUpload(file, metadata, onProgress) {
  try {
    safeLogInfo(UploadDebugModule.UPLOAD, 'Starting paper upload', { filename: file?.name });

    // Validate file
    if (!file || file.type !== 'application/pdf') {
      safeLogError(UploadDebugModule.UPLOAD, 'Invalid file type - only PDF allowed', { type: file?.type });
      throw new Error('Only PDF files are allowed');
    }

    if (file.size > 50 * 1024 * 1024) {
      safeLogError(UploadDebugModule.UPLOAD, 'File size exceeds limit', { size: file.size });
      throw new Error('File size must be less than 50MB');
    }

    // CRITICAL: Wait for Supabase to be ready
    safeLogInfo(UploadDebugModule.UPLOAD, 'Waiting for Supabase client...');
    const supabase = await waitForSupabaseClient();
    
    if (!supabase) {
      throw new Error('Failed to initialize upload service. Please refresh and try again.');
    }

    // CRITICAL: Wait for session to be ready before uploading
    safeLogInfo(UploadDebugModule.UPLOAD, 'Verifying authenticated session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      safeLogError(UploadDebugModule.UPLOAD, 'Session error', { error: sessionError.message });
      throw new Error('Session verification failed. Please try signing in again.');
    }

    // 🧨 HARD FAIL IF NO SESSION
    if (!session) {
      safeLogWarn(UploadDebugModule.UPLOAD, 'No active session found. Upload blocked.');
      throw new Error('You must be signed in to upload');
    }

    safeLogInfo(UploadDebugModule.UPLOAD, 'Session verified. User authenticated.', { userId: session.user.id });

    const userId = session.user.id;
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(file.name);
    
    // Generate storage path: {userId}/{timestamp}-{filename}
    const storagePath = `${userId}/${timestamp}-${sanitizedFilename}`;

    // Get bucket name from SupabaseClient - ensure it's loaded first
    // SupabaseClient is a synchronous script loaded before this runs
    const TEMP_BUCKET = (window.SupabaseClient && window.SupabaseClient.BUCKETS) 
      ? window.SupabaseClient.BUCKETS.TEMP 
      : 'uploads-temp';  // Fallback matches BUCKETS.TEMP definition in supabase-client.js

    // Upload to temp bucket using authenticated client
    safeLogInfo(UploadDebugModule.UPLOAD, 'Uploading file to storage...', { bucket: TEMP_BUCKET, path: storagePath });
    
    // Use SupabaseClient.uploadFile if available, otherwise direct upload
    let uploadResult;
    if (window.SupabaseClient?.uploadFile) {
      uploadResult = await window.SupabaseClient.uploadFile(file, {
        bucket: TEMP_BUCKET,
        path: storagePath,
        onProgress
      });
    } else {
      // Fallback to direct upload
      const { data, error } = await supabase.storage
        .from(TEMP_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        uploadResult = { data: null, error };
      } else {
        uploadResult = { data, error: null };
        if (onProgress) onProgress(100);
      }
    }

    if (uploadResult.error) {
      safeLogError(UploadDebugModule.STORAGE, 'Storage upload failed', { error: uploadResult.error.message });
      throw uploadResult.error;
    }

    safeLogInfo(UploadDebugModule.UPLOAD, 'File uploaded successfully to storage');

    // Create submission record
    safeLogInfo(UploadDebugModule.UPLOAD, 'Creating submission record in database...');
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: userId,
        original_filename: file.name,
        file_size: file.size,
        content_type: file.type,
        temp_path: storagePath,
        paper_code: metadata.paperCode,
        paper_name: metadata.paperName || null,
        exam_year: metadata.examYear,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      safeLogError(UploadDebugModule.UPLOAD, 'Database submission record creation failed', { error: submissionError.message });
      
      // Try to clean up uploaded file
      safeLogWarn(UploadDebugModule.UPLOAD, 'Attempting to clean up uploaded file...');
      await supabase.storage
        .from(TEMP_BUCKET)
        .remove([storagePath]);
      
      throw submissionError;
    }

    safeLogInfo(UploadDebugModule.UPLOAD, 'Upload completed successfully', { submissionId: submission.id });

    return {
      success: true,
      submissionId: submission.id,
      message: 'Upload successful! Your submission is pending review.',
      error: null
    };

  } catch (error) {
    safeLogError(UploadDebugModule.UPLOAD, 'Upload failed', { error: error.message });
    console.error('Upload error:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Upload failed. Please try again.';
    
    if (error.message?.includes('JWT') || error.message?.includes('jwt')) {
      userMessage = 'Your session has expired. Please sign in again.';
      safeLogError(UploadDebugModule.AUTH, 'JWT token expired or invalid');
    } else if (error.message?.includes('RLS') || error.message?.includes('policy') || error.message?.includes('permission')) {
      userMessage = 'Permission denied. Please ensure you are signed in and try again.';
      safeLogError(UploadDebugModule.STORAGE, 'RLS policy violation - user may not be authenticated or lacks permission');
    } else if (error.message?.includes('storage')) {
      userMessage = 'File storage error. Please try again or contact support.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      // Use the error message if it's already user-friendly
      const friendlyErrors = ['PDF', 'size', 'signed in', 'allowed', 'refresh'];
      if (friendlyErrors.some(term => error.message.includes(term))) {
        userMessage = error.message;
      }
    }
    
    return {
      success: false,
      submissionId: null,
      message: userMessage,
      error
    };
  }
}

/**
 * Get user's submissions
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} List of submissions
 */
async function getUserSubmissions(status = null) {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseClient();
    if (!supabase) {
      console.warn('[UPLOAD-HANDLER] Supabase not ready for getUserSubmissions');
      return [];
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return [];
    }

    let query = supabase
      .from('submissions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSubmissions:', error);
    return [];
  }
}

/**
 * Get all pending submissions (admin/reviewer only)
 * @returns {Promise<Array>} List of pending submissions
 */
async function getPendingSubmissions() {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseClient();
    if (!supabase) {
      console.warn('[UPLOAD-HANDLER] Supabase not ready for getPendingSubmissions');
      return [];
    }

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:user_id (email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPendingSubmissions:', error);
    return [];
  }
}

/**
 * Get submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Submission data
 */
async function getSubmission(submissionId) {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseClient();
    if (!supabase) {
      console.warn('[UPLOAD-HANDLER] Supabase not ready for getSubmission');
      return null;
    }

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:user_id (email)
      `)
      .eq('id', submissionId)
      .single();

    if (error) {
      console.error('Error fetching submission:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSubmission:', error);
    return null;
  }
}

/**
 * Sanitize filename for storage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Remove any path components
  const name = filename.split('/').pop().split('\\').pop();
  
  // Replace spaces and special chars with underscores
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than 1 week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Expose to window for global access
window.UploadHandler = {
  handlePaperUpload,
  getUserSubmissions,
  getPendingSubmissions,
  getSubmission,
  formatFileSize,
  formatDate
};
