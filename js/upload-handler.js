// js/upload-handler.js
// ============================================
// UPLOAD HANDLER - Supabase Storage Integration
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
  try {
    debugLog('info', 'Starting paper upload', { filename: file?.name });
    
    // Print auth status on upload start
    if (window.Debug && window.Debug.printAuthStatus) {
      window.Debug.printAuthStatus();
    }

    // Validate file
    if (!file || file.type !== 'application/pdf') {
      debugLog('error', 'Invalid file type — only PDF files are allowed', { type: file?.type });
      console.error('[UPLOAD] Invalid file type', { type: file?.type });
      throw new Error('Only PDF files are allowed');
    }

    if (file.size > 50 * 1024 * 1024) {
      debugLog('error', 'File too large — must be less than 50MB', { size: file.size });
      console.error('[UPLOAD] File too large', { size: file.size });
      throw new Error('File size must be less than 50MB');
    }

    // Wait for Supabase client to be ready
    if (window.waitForSupabase) {
      await window.waitForSupabase();
    }
    
    // Get Supabase client
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) {
      debugLog('error', 'Upload service unavailable. Please refresh the page.');
      throw new Error('Failed to initialize upload service. Please refresh and try again.');
    }

    // AUTH LOCK - HARD REQUIRE USER BEFORE INSERT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      debugLog('error', '[AUTH] User not authenticated. Blocking upload.');
      throw new Error('Please sign in before uploading.');
    }

    const userId = user.id;
    debugLog('info', `[UPLOAD] Inserting submission for UID: ${userId}`);

    // Validate metadata
    if (!metadata || !metadata.paperCode || !metadata.examYear) {
      debugLog('error', 'Paper code and examination year are required');
      throw new Error('Paper code and examination year are required');
    }
    const sanitizedFilename = sanitizeFilename(file.name);
    const timestamp = Date.now();
    // Generate structured filename: {paper_code}-{year}-{timestamp}.pdf
    const sanitizedCode = String(metadata.paperCode).replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedYear = String(metadata.examYear).replace(/[^0-9]/g, '');
    const generatedFilename = `${sanitizedCode}-${sanitizedYear}-${timestamp}.pdf`;
    const storagePath = `${userId}/${generatedFilename}`;
    const TEMP_BUCKET = 'uploads-temp';
    const isDemo = metadata.uploadType === 'demo-paper';

    // Upload to temp bucket
    debugLog('info', '📤 Storage Upload Starting', { bucket: TEMP_BUCKET, path: storagePath });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(TEMP_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      const statusCode = uploadError.statusCode || uploadError.status;
      const errorContext = {
        bucket: TEMP_BUCKET,
        path: storagePath,
        error: uploadError,
        statusCode: statusCode
      };
      
      if (statusCode === 404) {
        debugLog('error', `[STORAGE ERROR]\nBucket: ${TEMP_BUCKET}\nPath: ${storagePath}\nReason: Storage bucket not found.\nCheck: Contact the administrator.`, errorContext);
        throw new Error(`Storage bucket "${TEMP_BUCKET}" not found. Please contact the administrator.`);
      } else if (statusCode === 403) {
        debugLog('error', `[STORAGE ERROR]\nBucket: ${TEMP_BUCKET}\nPath: ${storagePath}\nReason: Permission denied in uploads-temp bucket.\nCheck: User authenticated?`, errorContext);
        throw new Error('Storage permission denied. Please ensure you are signed in.');
      }
      debugLog('error', `[STORAGE ERROR]\nBucket: ${TEMP_BUCKET}\nPath: ${storagePath}\nReason: ${uploadError.message || 'Unknown storage error'}`, errorContext);
      throw uploadError;
    }

    if (onProgress) onProgress(100);
    debugLog('info', '✅ Storage Upload Complete', { path: uploadData?.path || storagePath });

    // Demo paper: upload directly to approved bucket, status = approved
    if (isDemo) {
      const approvedPath = `demo/${metadata.paperCode}/${metadata.examYear}/${generatedFilename}`;

      // Copy file to approved bucket
      const { data: tempFile, error: downloadErr } = await supabase.storage
        .from(TEMP_BUCKET)
        .download(storagePath);

      if (!downloadErr && tempFile) {
        const { error: approvedUploadErr } = await supabase.storage
          .from('uploads-approved')
          .upload(approvedPath, tempFile, { cacheControl: '3600', upsert: false });

        if (approvedUploadErr) {
          const errorContext = {
            bucket: 'uploads-approved',
            path: approvedPath,
            error: approvedUploadErr
          };
          debugLog('error', `[STORAGE ERROR]\nBucket: uploads-approved\nPath: ${approvedPath}\nReason: Failed to copy demo to approved bucket`, errorContext);
        }
      }

      // Create submission record with approved status
      debugLog('info', '📝 Submission Insert Starting (Demo Paper)', { paperCode: metadata.paperCode, examYear: metadata.examYear });
      
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          paper_code: metadata.paperCode,
          year: metadata.examYear,
          storage_path: storagePath,
          original_filename: file.name,
          file_size: file.size,
          content_type: file.type || 'application/pdf',
          status: 'approved'
        })
        .select()
        .single();

      if (submissionError) {
        debugLog('error', 'Submission insert failed:', submissionError);
        if (window.debugError) window.debugError('SUBMISSION_INSERT_FAILED', submissionError);
        
        const errorMsg = submissionError.message?.toLowerCase() || '';
        if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
          debugLog('error', '[RLS] Insert blocked by policy.', submissionError);
        }
        
        await supabase.storage.from(TEMP_BUCKET).remove([storagePath]);
        throw submissionError;
      }

      debugLog('info', '✅ Submission Insert Complete (Demo Paper)', { submissionId: submission.id });

      debugLog('info', 'Demo paper uploaded and approved — visible in Browse');
      return {
        success: true,
        submissionId: submission.id,
        message: 'Demo paper uploaded! It is now visible in Browse.',
        error: null
      };
    }

    // Normal paper: create submission with pending status
    debugLog('info', '📝 Submission Insert Starting (Pending Review)', { paperCode: metadata.paperCode, examYear: metadata.examYear });
    
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        paper_code: metadata.paperCode,
        year: metadata.examYear,
        storage_path: storagePath,
        original_filename: file.name,
        file_size: file.size,
        content_type: file.type || 'application/pdf',
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      debugLog('error', 'Submission insert failed:', submissionError);
      if (window.debugError) window.debugError('SUBMISSION_INSERT_FAILED', submissionError);
      
      const errorMsg = submissionError.message?.toLowerCase() || '';
      if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
        debugLog('error', '[RLS] Insert blocked by policy.', submissionError);
      }
      
      // Clean up uploaded file
      await supabase.storage.from(TEMP_BUCKET).remove([storagePath]);
      throw submissionError;
    }

    debugLog('info', '✅ Submission Insert Complete (Pending Review)', { submissionId: submission.id });

    debugLog('info', 'Upload successful — pending review');
    return {
      success: true,
      submissionId: submission.id,
      message: 'Upload successful! Your submission is pending review.',
      error: null
    };

  } catch (error) {
    // Human-readable RLS error handling (case-insensitive)
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
      const friendlyErrors = ['PDF', 'size', 'signed in', 'allowed', 'refresh', 'bucket', 'authenticated'];
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
