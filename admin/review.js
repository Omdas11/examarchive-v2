// admin/review.js
// ============================================
// REVIEW PANEL
// Phase 6: File storage migrated to Appwrite.
// Approve/reject only updates Supabase DB status.
// Reject deletes Appwrite file via appwrite_file_id.
// ============================================

let pendingSubmissions = [];

// Wait for auth:ready then check role
window.addEventListener('auth:ready', async (e) => {
  const loadingState = document.getElementById('loading-state');
  const accessDenied = document.getElementById('access-denied');
  const reviewContent = document.getElementById('review-content');

  try {
    // Require reviewer or admin role
    if (!window.AuthController?.requireRole) {
      loadingState.style.display = 'none';
      accessDenied.style.display = 'flex';
      return;
    }

    const session = await window.AuthController.requireRole(['admin', 'reviewer']);
    loadingState.style.display = 'none';

    if (!session) {
      accessDenied.style.display = 'flex';
      return;
    }

    reviewContent.style.display = 'block';
    await loadPendingSubmissions();
  } catch (err) {
    console.error('[REVIEW] Error:', err);
    loadingState.style.display = 'none';
    accessDenied.style.display = 'flex';
  }
});

/**
 * Load pending submissions
 */
async function loadPendingSubmissions() {
  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) return;

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[REVIEW] Error loading submissions:', error);
      return;
    }

    pendingSubmissions = data || [];
    renderPendingList();
  } catch (err) {
    console.error('[REVIEW] Error loading submissions:', err);
  }
}

/**
 * Render pending submissions list
 */
function renderPendingList() {
  const list = document.getElementById('pending-list');
  const emptyState = document.getElementById('empty-state');

  if (pendingSubmissions.length === 0) {
    list.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  list.innerHTML = pendingSubmissions.map(s => `
    <div class="submission-card" data-id="${s?.id || ''}" style="
      padding: 1.25rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 1rem;
      background: var(--surface);
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <div>
          <strong>${s?.paper_code || 'Unknown'}</strong>
          <span style="color: var(--text-muted); margin-left: 0.5rem;">${s?.year || ''}</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--color-warning);">⏳ Pending</span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
        Submitted ${s?.created_at ? new Date(s.created_at).toLocaleString() : 'Unknown date'}
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-red" onclick="approveSubmission('${s?.id || ''}')" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
          ✓ Approve
        </button>
        <button class="btn" onclick="rejectSubmission('${s?.id || ''}')" style="font-size: 0.85rem; padding: 0.5rem 1rem; color: var(--color-error); border-color: var(--color-error);">
          ✗ Reject
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Approve a submission
 * Phase 6: No file movement needed — file is already in Appwrite.
 * Sets status to 'approved' and stores file_url as approved_path for compatibility.
 */
async function approveSubmission(submissionId) {
  const supabase = window.getSupabase ? window.getSupabase() : null;
  if (!supabase) return;

  const submission = pendingSubmissions.find(s => s.id === submissionId);
  if (!submission) return;

  try {
    showReviewMessage('Processing approval...', 'info');

    // Update submission status — file stays in Appwrite, no movement needed
    const { error: updateErr } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        // Store file_url in approved_path for backwards compatibility
        approved_path: submission.file_url || submission.approved_path || null
      })
      .eq('id', submissionId);

    if (updateErr) throw new Error('Failed to update submission status: ' + updateErr.message);

    showReviewMessage('Submission approved! Awaiting publish.', 'success');
    await loadPendingSubmissions();

  } catch (error) {
    console.error('[REVIEW] Approve error:', error);
    showReviewMessage('Failed to approve: ' + error.message, 'error');
  }
}

/**
 * Reject a submission
 * Phase 6: Deletes the Appwrite file via appwrite_file_id, then updates DB status.
 */
async function rejectSubmission(submissionId) {
  const supabase = window.getSupabase ? window.getSupabase() : null;
  if (!supabase) return;

  const submission = pendingSubmissions.find(s => s.id === submissionId);
  if (!submission) return;

  try {
    showReviewMessage('Processing rejection...', 'info');

    // Delete file from Appwrite if we have the file ID
    if (submission.appwrite_file_id) {
      try {
        const appwrite = window.getAppwrite ? window.getAppwrite() : null;
        if (appwrite) {
          const bucketId = window.APPWRITE_PAPERS_BUCKET_ID || 'papers';
          await appwrite.storage.deleteFile(bucketId, submission.appwrite_file_id);
        }
      } catch (deleteErr) {
        console.warn('[REVIEW] Could not delete Appwrite file:', deleteErr.message);
        // Continue — the DB update is more important
      }
    }

    // Update submission status
    const { error: updateErr } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);

    if (updateErr) throw new Error('Failed to update submission status: ' + updateErr.message);

    showReviewMessage('Submission rejected.', 'success');
    await loadPendingSubmissions();

  } catch (error) {
    console.error('[REVIEW] Reject error:', error);
    showReviewMessage('Failed to reject: ' + error.message, 'error');
  }
}

/**
 * Show a toast message
 */
function showReviewMessage(message, type = 'info') {
  let el = document.getElementById('review-message');
  if (!el) {
    el = document.createElement('div');
    el.id = 'review-message';
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      padding: 1rem 1.5rem; border-radius: 8px;
      background: var(--surface); border: 1px solid var(--border);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 9999; max-width: 400px;
    `;
    document.body.appendChild(el);
  }

  const colors = { success: 'var(--color-success)', error: 'var(--color-error)', info: 'var(--color-info)' };
  el.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
  el.textContent = message;

  setTimeout(() => { if (el.parentNode) el.remove(); }, 5000);
}
