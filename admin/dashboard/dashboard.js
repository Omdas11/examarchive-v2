// admin/dashboard/dashboard.js
// ============================================
// ADMIN DASHBOARD - Phase 8.3 (Backend-First)
// Phase 9.2.3 - Converted to Classic JS (NO IMPORTS)
// ============================================

let currentTab = 'pending';
let currentSubmission = null;
let allSubmissions = [];

// Check admin access when page loads
document.addEventListener("DOMContentLoaded", async () => {
  const loadingState = document.getElementById('loading-state');
  const accessDenied = document.getElementById('access-denied');
  const dashboardContent = document.getElementById('dashboard-content');

  try {
    const hasAdminAccess = await window.AdminAuth.isCurrentUserAdmin();
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    if (!hasAdminAccess) {
      accessDenied.style.display = 'flex';
      return;
    }

    dashboardContent.style.display = 'block';

    // Initialize dashboard
    initializeDashboard();
  } catch (err) {
    console.error('[ADMIN-DASHBOARD] Error checking access:', err);
    loadingState.style.display = 'none';
    accessDenied.style.display = 'flex';
  }
});

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
  // Setup tab switching
  setupTabs();
  
  // Setup modal
  setupModal();
  
  // Load submissions
  await loadSubmissions();
  
  // Setup real-time subscriptions
  setupRealtimeSubscriptions();
}

/**
 * Setup tab switching
 */
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active tab
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update current tab
      currentTab = tab;
      
      // Render filtered submissions
      renderSubmissions();
    });
  });
}

/**
 * Load all submissions from database
 */
async function loadSubmissions() {
  try {
    const session = window.waitForSession ? await window.waitForSession() : null;
    if (!session) {
      console.warn('[ADMIN-DASHBOARD] No session — skipping load');
      return;
    }

    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allSubmissions = data || [];

    updateStats();
    renderSubmissions();

  } catch (err) {
    console.error('Dashboard load error:', err);
    showMessage('Failed to load submissions', 'error');
  }
}

/**
 * Update dashboard stats
 */
function updateStats() {
  const pending = allSubmissions.filter(s => s.status === 'pending').length;
  const approved = allSubmissions.filter(s => s.status === 'approved').length;
  const published = allSubmissions.filter(s => s.status === 'published').length;
  const rejected = allSubmissions.filter(s => s.status === 'rejected').length;

  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-approved').textContent = approved;
  document.getElementById('stat-published').textContent = published;
  document.getElementById('stat-rejected').textContent = rejected;

  document.getElementById('badge-pending').textContent = pending;
  document.getElementById('badge-approved').textContent = approved;
}

/**
 * Render submissions for current tab
 */
function renderSubmissions() {
  const submissionsList = document.getElementById('submissions-list');
  const emptyState = document.getElementById('empty-state');

  // Filter submissions based on current tab
  let filtered = [];
  if (currentTab === 'pending') {
    filtered = allSubmissions.filter(s => s.status === 'pending');
  } else if (currentTab === 'approved') {
    filtered = allSubmissions.filter(s => s.status === 'approved' || s.status === 'published');
  } else {
    filtered = allSubmissions;
  }

  // Show/hide empty state
  if (filtered.length === 0) {
    submissionsList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Render submissions
  submissionsList.innerHTML = filtered.map(submission => renderSubmissionCard(submission)).join('');

  // Attach event listeners
  attachSubmissionListeners();
}

/**
 * Render a single submission card
 */
function renderSubmissionCard(submission) {
  const statusClass = `status-${submission?.status || 'pending'}`;
  
  const statusLabels = {
    pending: '⏳ Pending Review',
    approved: '✓ Approved',
    rejected: '✗ Rejected',
    published: '🌐 Published'
  };

  const safeFileSize = (submission?.file_size ?? 0);
  const safeFilename = (submission?.original_filename || 'Unknown');
  const safePaperCode = (submission?.paper_code || 'Unknown Code');
  const safeYear = (submission?.year || 'N/A');
  const safeStatus = (submission?.status || 'pending');
  const safeCreatedAt = submission?.created_at
    ? new Date(submission.created_at).toLocaleString()
    : 'Unknown date';

  return `
    <div class="submission-card" data-id="${submission?.id || ''}">
      <div class="submission-header">
        <div class="submission-meta">
          <h3>${safePaperCode} - ${safeYear}</h3>
          <div class="meta-row">
            <strong>File:</strong> ${safeFilename}
          </div>
          <div class="meta-row">
            ${safeCreatedAt}
          </div>
        </div>
        <span class="status-badge ${statusClass}">
          ${statusLabels[safeStatus] || '⏳ Pending Review'}
        </span>
      </div>

      <div class="submission-details">
        <div class="detail-item">
          <strong>File Size</strong>
          <span>${window.UploadHandler ? window.UploadHandler.formatFileSize(safeFileSize) : safeFileSize + ' B'}</span>
        </div>
        <div class="detail-item">
          <strong>Paper Name</strong>
          <span>${submission?.paper_name || '-'}</span>
        </div>
        ${submission?.reviewed_at ? `
        <div class="detail-item">
          <strong>Reviewed</strong>
          <span>${new Date(submission.reviewed_at).toLocaleString()}</span>
        </div>
        ` : ''}
        ${submission?.public_url ? `
        <div class="detail-item">
          <strong>Public URL</strong>
          <span><a href="${submission.public_url}" target="_blank" rel="noopener">View PDF</a></span>
        </div>
        ` : ''}
      </div>

      ${submission?.review_notes ? `
      <div style="padding: 0.75rem; background: var(--bg-soft); border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;">
        <strong>Review Notes:</strong> ${submission.review_notes}
      </div>
      ` : ''}

      <div class="submission-actions">
        ${safeStatus === 'pending' ? `
          <button class="btn btn-outline" data-action="view" data-id="${submission?.id || ''}">
            View Details
          </button>
          <button class="btn btn-danger" data-action="reject" data-id="${submission?.id || ''}">
            Reject
          </button>
          <button class="btn btn-success" data-action="approve" data-id="${submission?.id || ''}">
            Approve & Publish
          </button>
        ` : safeStatus === 'approved' ? `
          <button class="btn btn-view" data-action="publish" data-id="${submission?.id || ''}">
            Publish Now
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Attach event listeners to submission cards
 */
function attachSubmissionListeners() {
  const actionBtns = document.querySelectorAll('[data-action]');
  
  actionBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const submission = allSubmissions.find(s => s.id === id);
      
      if (!submission) return;

      if (action === 'view') {
        showReviewModal(submission);
      } else if (action === 'approve') {
        await approveSubmission(submission);
      } else if (action === 'reject') {
        showRejectModal(submission);
      } else if (action === 'publish') {
        await publishSubmission(submission);
      }
    });
  });
}

/**
 * Setup modal
 */
function setupModal() {
  const modal = document.getElementById('review-modal');
  const closeElements = modal.querySelectorAll('[data-close-modal]');
  const approveBtn = document.getElementById('approve-btn');
  const rejectBtn = document.getElementById('reject-btn');

  // Close modal
  closeElements.forEach(el => {
    el.addEventListener('click', () => {
      modal.style.display = 'none';
      currentSubmission = null;
    });
  });

  // Approve button
  approveBtn.addEventListener('click', async () => {
    if (currentSubmission) {
      const notes = document.getElementById('review-notes').value.trim();
      await approveSubmission(currentSubmission, notes);
      modal.style.display = 'none';
    }
  });

  // Reject button
  rejectBtn.addEventListener('click', async () => {
    if (currentSubmission) {
      const notes = document.getElementById('review-notes').value.trim();
      await rejectSubmission(currentSubmission, notes);
      modal.style.display = 'none';
    }
  });
}

/**
 * Show review modal
 */
function showReviewModal(submission) {
  currentSubmission = submission;
  const modal = document.getElementById('review-modal');
  const modalInfo = document.getElementById('modal-submission-info');
  const reviewNotes = document.getElementById('review-notes');

  reviewNotes.value = '';

  modalInfo.innerHTML = `
    <div style="padding: 1rem; background: var(--bg-soft); border-radius: 8px; margin-bottom: 1rem;">
      <h4 style="margin: 0 0 0.5rem 0;">${submission?.paper_code || 'Unknown'} - ${submission?.year || 'N/A'}</h4>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-muted);">
        <strong>File:</strong> ${submission?.original_filename || 'Unknown'} (${window.UploadHandler ? window.UploadHandler.formatFileSize(submission?.file_size ?? 0) : (submission?.file_size ?? 0) + ' B'})
      </p>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-muted);">
        <strong>Submitted:</strong> ${submission?.created_at ? new Date(submission.created_at).toLocaleString() : 'Unknown'}
      </p>
    </div>
  `;

  modal.style.display = 'flex';
}

/**
 * Show reject modal
 */
function showRejectModal(submission) {
  currentSubmission = submission;
  const modal = document.getElementById('review-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalInfo = document.getElementById('modal-submission-info');
  const reviewNotes = document.getElementById('review-notes');
  const approveBtn = document.getElementById('approve-btn');

  modalTitle.textContent = 'Reject Submission';
  approveBtn.style.display = 'none';
  reviewNotes.value = '';
  reviewNotes.placeholder = 'Reason for rejection (optional)...';

  modalInfo.innerHTML = `
    <div style="padding: 1rem; background: var(--bg-soft); border-radius: 8px; margin-bottom: 1rem;">
      <h4 style="margin: 0 0 0.5rem 0;">${submission?.paper_code || 'Unknown'} - ${submission?.year || 'N/A'}</h4>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-muted);">
        <strong>File:</strong> ${submission?.original_filename || 'Unknown'}
      </p>
    </div>
  `;

  modal.style.display = 'flex';
}

/**
 * Approve submission and publish
 */
async function approveSubmission(submission, notes = '') {
  try {
    showMessage('Processing approval...', 'info');

    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { session } } = await supabase.auth.getSession();
    const reviewerId = session.user.id;

    // Move file from temp to approved bucket
    const timestamp = Date.now();
    const approvedPath = `approved/${submission.paper_code}/${submission.year}/${timestamp}.pdf`;

    // Download from temp
    const { data: tempFile, error: dlErr } = await supabase.storage
      .from('uploads-temp')
      .download(submission.storage_path);

    if (dlErr) throw new Error('Failed to download temp file: ' + dlErr.message);

    // Upload to approved
    const { error: ulErr } = await supabase.storage
      .from('uploads-approved')
      .upload(approvedPath, tempFile, { cacheControl: '3600', upsert: false });

    if (ulErr) throw new Error('Failed to upload to approved: ' + ulErr.message);

    // Insert into approved_papers table
    await supabase.from('approved_papers').insert({
      paper_code: submission.paper_code,
      year: submission.year,
      file_path: approvedPath,
      uploaded_by: submission.user_id,
      is_demo: false
    });

    // Update submission status and approved_path
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        approved_path: approvedPath,
        reviewer_id: reviewerId,
        review_notes: notes || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    // Clean up temp file
    await supabase.storage.from('uploads-temp').remove([submission.storage_path]);

    showMessage('Submission approved!', 'success');
    
    // Reload submissions
    await loadSubmissions();

  } catch (error) {
    console.error('Error approving submission:', error);
    showMessage('Failed to approve submission: ' + error.message, 'error');
  }
}

/**
 * Reject submission
 */
async function rejectSubmission(submission, notes = '') {
  try {
    showMessage('Processing rejection...', 'info');

    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { session } } = await supabase.auth.getSession();
    const reviewerId = session.user.id;

    // Delete file from temp storage
    await supabase.storage.from('uploads-temp').remove([submission.storage_path]);

    // Update submission
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        reviewer_id: reviewerId,
        rejection_reason: notes || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    showMessage('Submission rejected', 'success');
    
    // Reload submissions
    await loadSubmissions();

  } catch (error) {
    console.error('Error rejecting submission:', error);
    showMessage('Failed to reject submission: ' + error.message, 'error');
  }
}

/**
 * Publish approved submission
 */
async function publishSubmission(submission) {
  try {
    showMessage('Publishing...', 'info');

    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');

    // File is already in uploads-approved; just update status
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    showMessage('Submission published!', 'success');
    
    // Reload submissions
    await loadSubmissions();

  } catch (error) {
    console.error('Error publishing submission:', error);
    showMessage('Failed to publish submission: ' + error.message, 'error');
  }
}

/**
 * Setup real-time subscriptions for live updates
 */
function setupRealtimeSubscriptions() {
  const supabase = window.getSupabase ? window.getSupabase() : null;
  if (!supabase) {
    console.warn('Supabase not initialized - realtime disabled');
    return;
  }

  const channel = supabase
    .channel('submissions-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'submissions' },
      (payload) => {
        console.log('Submission change detected:', payload);
        loadSubmissions();
      }
    )
    .subscribe();
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
  let messageEl = document.getElementById('dashboard-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'dashboard-message';
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(messageEl);
  }

  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3'
  };
  messageEl.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
  messageEl.textContent = message;

  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => messageEl.remove(), 300);
    }
  }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
