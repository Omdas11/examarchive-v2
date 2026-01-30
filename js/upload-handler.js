// js/upload-handler.js
// ============================================
// UPLOAD HANDLER - Supabase Storage Integration
// ============================================

import { supabase } from "./supabase.js";
import { uploadFile, BUCKETS } from "./supabase-client.js";

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
export async function handlePaperUpload(file, metadata, onProgress) {
  try {
    // Validate file
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File size must be less than 50MB');
    }

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be signed in to upload');
    }

    const userId = session.user.id;
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(file.name);
    
    // Generate storage path: {userId}/{timestamp}-{filename}
    const storagePath = `${userId}/${timestamp}-${sanitizedFilename}`;

    // Upload to temp bucket
    const { data: uploadData, error: uploadError } = await uploadFile(
      file,
      {
        bucket: BUCKETS.TEMP,
        path: storagePath,
        onProgress
      }
    );

    if (uploadError) {
      throw uploadError;
    }

    // Create submission record
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
      // Try to clean up uploaded file
      await supabase.storage
        .from(BUCKETS.TEMP)
        .remove([storagePath]);
      
      throw submissionError;
    }

    return {
      success: true,
      submissionId: submission.id,
      message: 'Upload successful! Your submission is pending review.',
      error: null
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      submissionId: null,
      message: error.message || 'Upload failed',
      error
    };
  }
}

/**
 * Get user's submissions
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} List of submissions
 */
export async function getUserSubmissions(status = null) {
  try {
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
export async function getPendingSubmissions() {
  try {
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
export async function getSubmission(submissionId) {
  try {
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
export function formatFileSize(bytes) {
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
export function formatDate(timestamp) {
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
