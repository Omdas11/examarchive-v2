// js/upload-handler.js
// ============================================
// UPLOAD HANDLER - Supabase Storage Integration
// Phase 1.0: Clean Architecture Reset
// ============================================

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
  try {
    console.log('[UPLOAD] Starting paper upload', { filename: file?.name });

    // Validate file
    if (!file || file.type !== 'application/pdf') {
      console.error('[UPLOAD] Invalid file type', { type: file?.type });
      throw new Error('Only PDF files are allowed');
    }

    if (file.size > 50 * 1024 * 1024) {
      console.error('[UPLOAD] File too large', { size: file.size });
      throw new Error('File size must be less than 50MB');
    }

    // Wait for Supabase
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      throw new Error('Failed to initialize upload service. Please refresh and try again.');
    }

    // Refresh session to ensure token is fresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    let session;
    if (refreshError || !refreshData?.session) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        throw new Error('You must be signed in to upload');
      }
      session = sessionData.session;
    } else {
      session = refreshData.session;
    }

    // Validate metadata
    if (!metadata || !metadata.paperCode || !metadata.examYear) {
      throw new Error('Paper code and examination year are required');
    }

    const userId = session.user.id;
    const sanitizedFilename = sanitizeFilename(file.name);
    const storagePath = `${userId}/${metadata.paperCode}/${metadata.examYear}/${sanitizedFilename}`;
    const TEMP_BUCKET = 'uploads-temp';
    const isDemo = metadata.uploadType === 'demo-paper';

    // Upload to temp bucket
    console.log('[UPLOAD] Uploading to storage...', { bucket: TEMP_BUCKET, path: storagePath });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(TEMP_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[UPLOAD][STORAGE ERROR]', uploadError);
      const statusCode = uploadError.statusCode || uploadError.status;
      if (statusCode === 404) {
        throw new Error(`Storage bucket "${TEMP_BUCKET}" not found. Please contact the administrator.`);
      } else if (statusCode === 403) {
        throw new Error('Storage permission denied. Please ensure you are signed in.');
      }
      throw uploadError;
    }

    if (onProgress) onProgress(100);
    console.log('[UPLOAD SUCCESS]', uploadData?.path || storagePath);

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: userId,
        paper_code: metadata.paperCode,
        exam_year: metadata.examYear,
        temp_path: storagePath,
        status: isDemo ? 'approved' : 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('[UPLOAD] Submission record failed', submissionError);
      // Clean up uploaded file
      await supabase.storage.from(TEMP_BUCKET).remove([storagePath]);
      throw submissionError;
    }

    // Demo paper: immediately insert into approved_papers
    if (isDemo) {
      const approvedPath = `demo/${metadata.paperCode}/${metadata.examYear}/${sanitizedFilename}`;

      // Copy file to approved bucket
      const { data: tempFile, error: downloadErr } = await supabase.storage
        .from(TEMP_BUCKET)
        .download(storagePath);

      if (!downloadErr && tempFile) {
        await supabase.storage
          .from('uploads-approved')
          .upload(approvedPath, tempFile, { cacheControl: '3600', upsert: false });
      }

      // Insert approved_papers row
      await supabase
        .from('approved_papers')
        .insert({
          paper_code: metadata.paperCode,
          exam_year: metadata.examYear,
          file_path: approvedPath,
          uploaded_by: userId,
          is_demo: true
        });

      return {
        success: true,
        submissionId: submission.id,
        message: 'Demo paper uploaded! It is now visible in Browse.',
        error: null
      };
    }

    return {
      success: true,
      submissionId: submission.id,
      message: 'Upload successful! Your submission is pending review.',
      error: null
    };

  } catch (error) {
    console.error('[UPLOAD] Upload failed:', error);

    let userMessage = 'Upload failed. Please try again.';
    if (error.message?.includes('JWT') || error.message?.includes('jwt')) {
      userMessage = 'Your session has expired. Please sign in again.';
    } else if (error.message?.includes('policy') || error.message?.includes('permission')) {
      userMessage = 'Permission denied. Please ensure you are signed in and try again.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      const friendlyErrors = ['PDF', 'size', 'signed in', 'allowed', 'refresh', 'bucket'];
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
    const supabase = await window.waitForSupabase();
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
    const supabase = await window.waitForSupabase();
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
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format timestamp for display
 */
function formatDate(timestamp) {
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
