// js/upload-handler.js
// ============================================
// UPLOAD HANDLER - Appwrite Storage Integration (Phase 6)
// File storage migrated from Supabase to Appwrite.
// Supabase is still used for Auth, DB, RLS, RPC.
// ============================================

/**
 * Log to debug panel if available
 */
function debugLog(level, message, data) {
  if (window.Debug) {
    if (level === 'error') window.Debug.logError('upload', message, data);
    else if (level === 'warn') window.Debug.logWarn('upload', message, data);
    else window.Debug.logInfo('upload', message, data);
  }
}

// Upload-in-progress flag to prevent duplicate submissions
let uploadInProgress = false;

/**
 * Handle file upload to temp storage with submission tracking
 * @param {File} file - PDF file to upload
 * @param {Object} metadata - Paper metadata
 * @param {string} metadata.paperCode - Paper/subject code
 * @param {number} metadata.examYear - Examination year
 * @param {string} metadata.uploadType - 'question-paper' or 'demo-paper'
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<Object>} Result with submissionId and error
 */
async function handlePaperUpload(file, metadata, onProgress) {
  // Prevent duplicate submissions
  if (uploadInProgress) {
    console.warn('[UPLOAD] Upload already in progress — blocking duplicate');
    return {
      success: false,
      submissionId: null,
      message: 'Upload already in progress. Please wait.',
      error: new Error('Duplicate upload blocked')
    };
  }

  uploadInProgress = true;
  let appwriteFileId = null; // track for rollback

  try {
    debugLog('info', 'Starting paper upload (Appwrite)', { filename: file?.name });

    if (window.Debug && window.Debug.printAuthStatus) {
      window.Debug.printAuthStatus();
    }

    // Validate file
    if (!file || file.type !== 'application/pdf') {
      debugLog('error', 'Invalid file type — only PDF files are allowed', { type: file?.type });
      throw new Error('Only PDF files are allowed');
    }
    if (file.size > 50 * 1024 * 1024) {
      debugLog('error', 'File too large — must be less than 50MB', { size: file.size });
      throw new Error('File size must be less than 50MB');
    }

    // Wait for Supabase client (auth + DB only)
    if (window.waitForSupabase) {
      await window.waitForSupabase();
    }
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) {
      debugLog('error', 'Upload service unavailable. Please refresh the page.');
      throw new Error('Failed to initialize upload service. Please refresh and try again.');
    }

    // AUTH LOCK — require authenticated Supabase user before any storage action
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      debugLog('error', '[AUTH] User not authenticated. Blocking upload.');
      throw new Error('Please sign in before uploading.');
    }
    const userId = user.id;
    debugLog('info', `[UPLOAD] Authenticated UID: ${userId}`);

    // Validate metadata
    if (!metadata || !metadata.paperCode || !metadata.examYear) {
      debugLog('error', 'Paper code and examination year are required');
      throw new Error('Paper code and examination year are required');
    }

    // -- Step 1: Upload file to Appwrite (BEFORE DB insert) --
    const appwrite = window.getAppwrite ? window.getAppwrite() : null;
    if (!appwrite) {
      throw new Error('File storage service unavailable. Please refresh and try again.');
    }

    appwriteFileId = window.generateAppwriteId
      ? window.generateAppwriteId()
      : (function() {
          var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          var id = ''; for (var i = 0; i < 20; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
          return id;
        })();
    const bucketId = window.APPWRITE_PAPERS_BUCKET_ID || 'papers';

    debugLog('info', '[UPLOAD] Appwrite upload starting', { bucketId, fileId: appwriteFileId });

    let appwriteResult;
    try {
      appwriteResult = await appwrite.storage.createFile(bucketId, appwriteFileId, file);
    } catch (storageErr) {
      appwriteFileId = null; // not created — no rollback needed
      const msg = storageErr.message || 'Unknown storage error';
      debugLog('error', `[APPWRITE STORAGE ERROR] ${msg}`, storageErr);
      if (msg.includes('401') || msg.includes('unauthorized')) {
        throw new Error('Storage permission denied. Please contact the administrator.');
      }
      if (msg.includes('404') || msg.includes('not found')) {
        throw new Error('Storage bucket not found. Please contact the administrator.');
      }
      throw new Error('File upload failed: ' + msg);
    }

    if (onProgress) onProgress(100);

    const fileUrl = window.getAppwriteFileViewUrl
      ? window.getAppwriteFileViewUrl(bucketId, appwriteResult.$id || appwriteFileId)
      : '#';

    debugLog('info', '[OK] Appwrite upload complete', { fileId: appwriteResult.$id || appwriteFileId, fileUrl });

    const isDemo = metadata.uploadType === 'demo-paper';

    // -- Step 2: Insert submission record into Supabase DB --
    const sanitizedCode = String(metadata.paperCode).replace(/[^a-zA-Z0-9_-]/g, '_');

    var submissionData = {
      user_id: userId,
      paper_code: metadata.paperCode,
      year: metadata.examYear,
      appwrite_file_id: appwriteResult.$id || appwriteFileId,
      file_url: fileUrl,
      original_filename: metadata.fileRename
        ? (metadata.fileRename.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf')
        : file.name,
      file_size: file.size,
      content_type: file.type || 'application/pdf',
      status: isDemo ? 'approved' : 'pending'
    };

    // Optional metadata fields
    if (metadata.university) submissionData.university = metadata.university;
    if (metadata.stream) submissionData.stream = metadata.stream;
    if (metadata.programme) submissionData.programme = metadata.programme;
    if (metadata.subject) submissionData.subject = metadata.subject;
    if (metadata.paperType) submissionData.paper_type = metadata.paperType;
    if (metadata.semester) submissionData.semester = metadata.semester;
    if (metadata.tags && metadata.tags.length) submissionData.tags = metadata.tags;

    debugLog('info', '[SUBMIT] DB insert starting', { paperCode: metadata.paperCode, examYear: metadata.examYear, isDemo });

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      debugLog('error', 'DB insert failed — rolling back Appwrite file', submissionError);
      if (window.debugError) window.debugError('SUBMISSION_INSERT_FAILED', submissionError);

      // -- Rollback: delete the Appwrite file --
      try {
        await appwrite.storage.deleteFile(bucketId, appwriteResult.$id || appwriteFileId);
        debugLog('info', '[ROLLBACK] Appwrite file deleted successfully');
      } catch (rollbackErr) {
        debugLog('error', '[ROLLBACK] Failed to delete Appwrite file — may be orphaned', rollbackErr);
      }
      appwriteFileId = null;

      const errorMsg = submissionError.message?.toLowerCase() || '';
      if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
        debugLog('error', '[RLS] Insert blocked by policy.', submissionError);
      }
      throw submissionError;
    }

    debugLog('info', '[OK] DB insert complete', { submissionId: submission.id, isDemo });

    return {
      success: true,
      submissionId: submission.id,
      message: isDemo
        ? 'Demo paper uploaded! It is now visible in Browse.'
        : 'Upload successful! Your submission is pending review.',
      error: null
    };

  } catch (error) {
    const errorMsg = error.message?.toLowerCase() || '';
    if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
      debugLog('error', '[RLS] Insert blocked by policy.');
      return {
        success: false,
        submissionId: null,
        message: 'Upload blocked by permission policy. Please re-login.',
        error
      };
    }

    debugLog('error', `[UPLOAD] ${error.message || 'Unknown error'}`, error);

    let userMessage = 'Upload failed. Please try again.';
    if (error.message?.includes('JWT') || error.message?.includes('jwt')) {
      userMessage = 'Your session has expired. Please sign in again.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      const friendlyTerms = ['PDF', 'size', 'signed in', 'allowed', 'refresh', 'bucket', 'authenticated', 'storage', 'contact'];
      if (friendlyTerms.some(t => error.message.includes(t))) {
        userMessage = error.message;
      }
    }

    return {
      success: false,
      submissionId: null,
      message: userMessage,
      error
    };
  } finally {
    uploadInProgress = false;
  }
}

/**
 * Get user's submissions
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} List of submissions
 */
async function getUserSubmissions(status = null) {
  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) return [];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

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
      console.error('[UPLOAD-HANDLER] Error fetching submissions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[UPLOAD-HANDLER] Error in getUserSubmissions:', error);
    return [];
  }
}

/**
 * Get all pending submissions (admin/reviewer only)
 * @returns {Promise<Array>} List of pending submissions
 */
async function getPendingSubmissions() {
  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[UPLOAD-HANDLER] Error fetching pending submissions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[UPLOAD-HANDLER] Error in getPendingSubmissions:', error);
    return [];
  }
}

/**
 * Sanitize filename for storage
 */
function sanitizeFilename(filename) {
  const name = filename.split('/').pop().split('\\').pop();
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format timestamp for display
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    return `${m} minute${m > 1 ? 's' : ''} ago`;
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000);
    return `${h} hour${h > 1 ? 's' : ''} ago`;
  }
  if (diff < 604800000) {
    const d = Math.floor(diff / 86400000);
    return `${d} day${d > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Expose to window for global access
window.UploadHandler = {
  handlePaperUpload,
  getUserSubmissions,
  getPendingSubmissions,
  formatFileSize,
  formatDate
};
