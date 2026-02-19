// admin/review.js
// ============================================
// REVIEW PANEL
// Shows pending submissions, allows approve/reject
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
 * Moves file from uploads-temp → uploads-approved, creates approved_papers row
 */
async function approveSubmission(submissionId) {
  const supabase = window.getSupabase ? window.getSupabase() : null;
  if (!supabase) return;

  const submission = pendingSubmissions.find(s => s.id === submissionId);
  if (!submission) return;

  try {
    showReviewMessage('Processing approval...', 'info');

    // Download file from temp
    const { data: tempFile, error: downloadErr } = await supabase.storage
      .from('uploads-temp')
      .download(submission.storage_path);

    if (downloadErr) throw new Error('Failed to download temp file: ' + downloadErr.message);

    // Upload to approved bucket
    const approvedPath = `approved/${submission.paper_code}/${submission.year}/${submission.id}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from('uploads-approved')
      .upload(approvedPath, tempFile, { cacheControl: '3600', upsert: false });

    if (uploadErr) throw new Error('Failed to upload to approved bucket: ' + uploadErr.message);

    // Insert into approved_papers
    const { error: insertErr } = await supabase
      .from('approved_papers')
      .insert({
        paper_code: submission.paper_code,
        year: submission.year,
        file_path: approvedPath,
        uploaded_by: submission.user_id,
        is_demo: false
      });

    if (insertErr) throw new Error('Failed to create approved paper record: ' + insertErr.message);

    // Update submission status
    const { error: updateErr } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId);

    if (updateErr) throw new Error('Failed to update submission status: ' + updateErr.message);

    // Clean up temp file
    await supabase.storage.from('uploads-temp').remove([submission.storage_path]);

    showReviewMessage('Submission approved! Paper is now visible in Browse.', 'success');
    await loadPendingSubmissions();

  } catch (error) {
    console.error('[REVIEW] Approve error:', error);
    showReviewMessage('Failed to approve: ' + error.message, 'error');
  }
}

/**
 * Reject a submission
 * Deletes temp file and marks as rejected
 */
async function rejectSubmission(submissionId) {
  const supabase = window.getSupabase ? window.getSupabase() : null;
  if (!supabase) return;

  const submission = pendingSubmissions.find(s => s.id === submissionId);
  if (!submission) return;

  try {
    showReviewMessage('Processing rejection...', 'info');

    // Delete temp file
    await supabase.storage.from('uploads-temp').remove([submission.storage_path]);

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
