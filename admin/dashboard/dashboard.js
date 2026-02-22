// admin/dashboard/dashboard.js
// ============================================
// ADMIN DASHBOARD - Phase 8.3 (Backend-First)
// Phase 9.2.3 - Converted to Classic JS (NO IMPORTS)
// ============================================

let currentTab = 'pending';
let currentSubmission = null;
let allSubmissions = [];
let userPrimaryRoleGlobal = null;

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Check admin access when page loads
document.addEventListener("DOMContentLoaded", async () => {
  const loadingState = document.getElementById('loading-state');
  const accessDenied = document.getElementById('access-denied');
  const dashboardContent = document.getElementById('dashboard-content');

  try {
    // Use RPC-based admin access check
    const hasAdminAccess = await window.AdminAuth.isCurrentUserAdmin();
    
    // Hide loading state
    loadingState.style.display = 'none';

    // Get primary_role for UI decisions
    const supabase = window.getSupabase ? window.getSupabase() : null;
    let userPrimaryRole = null;
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roleData } = await supabase
            .from('roles')
            .select('primary_role')
            .eq('user_id', session.user.id)
            .single();
          if (roleData) {
            userPrimaryRole = roleData.primary_role;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    if (!hasAdminAccess) {
      accessDenied.style.display = 'flex';
      return;
    }

    dashboardContent.style.display = 'block';

    // Store primary role globally for UI checks
    userPrimaryRoleGlobal = userPrimaryRole;

    // Initialize dashboard
    initializeDashboard(userPrimaryRole);
  } catch (err) {
    console.error('[ADMIN-DASHBOARD] Error checking access:', err);
    loadingState.style.display = 'none';
    accessDenied.style.display = 'flex';
  }
});

/**
 * Initialize dashboard
 */
async function initializeDashboard(primaryRole) {
  // Setup tab switching
  setupTabs();
  
  // Setup modal
  setupModal();
  
  // Load submissions
  await loadSubmissions();
  
  // Setup real-time subscriptions
  setupRealtimeSubscriptions();

  // Setup role management panel (Founder/Admin only via primary_role)
  if (primaryRole === 'Founder' || primaryRole === 'Admin') {
    setupRoleManagement();
    setupUsersTable();
    setupDemoReset();
  }
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

    if (error) {
      if (window.Debug) window.Debug.logError('admin', 'Failed to load submissions', { code: error.code, details: error.details, hint: error.hint, message: error.message });
      throw error;
    }

    allSubmissions = data || [];

    if (window.Debug) window.Debug.logInfo('admin', 'Loaded submissions', { count: allSubmissions.length });

    updateStats();
    renderSubmissions();

  } catch (err) {
    console.error('Dashboard load error:', err);
    if (window.Debug) window.Debug.logError('admin', 'Dashboard load error', { code: err.code, details: err.details, hint: err.hint, message: err.message });
    showMessage('Failed to load submissions: ' + (err.message || 'Unknown error'), 'error');
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
  
  const SI = window.SvgIcons;
  const statusLabels = {
    pending: (SI ? SI.inline('hourglass') : '') + ' Pending Review',
    approved: (SI ? SI.inline('check') : '') + ' Approved',
    rejected: (SI ? SI.inline('x_mark') : '') + ' Rejected',
    published: (SI ? SI.inline('globe') : '') + ' Published'
  };

  const safeFileSize = (submission?.file_size ?? 0);
  const safeFilename = escapeHtml(submission?.original_filename || 'Unknown');
  const safePaperCode = escapeHtml(submission?.paper_code || 'Unknown Code');
  const safeYear = escapeHtml(submission?.year || 'N/A');
  const safeStatus = (submission?.status || 'pending');
  const safeCreatedAt = submission?.created_at
    ? escapeHtml(new Date(submission.created_at).toLocaleString())
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
          <span>${window.UploadHandler?.formatFileSize ? window.UploadHandler.formatFileSize(safeFileSize) : '0 B'}</span>
        </div>
        <div class="detail-item">
          <strong>Paper Name</strong>
          <span>${escapeHtml(submission?.paper_name || '-')}</span>
        </div>
        ${submission?.storage_path ? `
        <div class="detail-item">
          <strong>Storage Path</strong>
          <span style="font-size:0.75rem;word-break:break-all;">${escapeHtml(submission.storage_path)}</span>
        </div>
        ` : ''}
        ${submission?.approved_path ? `
        <div class="detail-item">
          <strong>Approved Path</strong>
          <span style="font-size:0.75rem;word-break:break-all;">${escapeHtml(submission.approved_path)}</span>
        </div>
        ` : ''}
        ${submission?.reviewed_at ? `
        <div class="detail-item">
          <strong>Reviewed</strong>
          <span>${escapeHtml(new Date(submission.reviewed_at).toLocaleString())}</span>
        </div>
        ` : ''}
        ${submission?.public_url ? `
        <div class="detail-item">
          <strong>Public URL</strong>
          <span><a href="${escapeHtml(submission.public_url)}" target="_blank" rel="noopener">View PDF</a></span>
        </div>
        ` : ''}
      </div>

      ${submission?.review_notes ? `
      <div style="padding: 0.75rem; background: var(--bg-soft); border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;">
        <strong>Review Notes:</strong> ${escapeHtml(submission.review_notes)}
      </div>
      ` : ''}

      <div class="submission-actions">
        ${safeStatus === 'pending' ? `
          <button class="btn btn-outline" data-action="view" data-id="${submission?.id || ''}">
            View Details
          </button>
          ${['Founder', 'Admin', 'Senior Moderator', 'Moderator', 'Reviewer'].includes(userPrimaryRoleGlobal) ? `
          <button class="btn btn-danger" data-action="reject" data-id="${submission?.id || ''}">
            Reject
          </button>
          <button class="btn btn-success" data-action="approve" data-id="${submission?.id || ''}">
            Approve
          </button>
          ` : ''}
        ` : safeStatus === 'approved' ? `
          ${['Founder', 'Admin', 'Senior Moderator'].includes(userPrimaryRoleGlobal) ? `
          <button class="btn btn-view" data-action="publish" data-id="${submission?.id || ''}">
            Publish Now
          </button>
          ` : ''}
        ` : ''}
        ${submission?.storage_path || submission?.approved_path ? `
          <button class="btn btn-outline" data-action="preview" data-id="${submission?.id || ''}">
            Preview File
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
      } else if (action === 'preview') {
        await previewFile(submission);
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
        <strong>File:</strong> ${submission?.original_filename || 'Unknown'} (${window.UploadHandler?.formatFileSize ? window.UploadHandler.formatFileSize(submission?.file_size ?? 0) : '0 B'})
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
 * Approve submission (move file, set status to approved)
 * Reviewer+ (via primary_role) can approve
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

    // Update submission status to approved (not published)
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

    showMessage('Submission approved! Awaiting publish by Senior Moderator+ admin.', 'success');
    
    // Reload submissions
    await loadSubmissions();

  } catch (error) {
    console.error('Error approving submission:', error);
    showMessage('Failed to approve submission: ' + error.message, 'error');
  }
}

/**
 * Approve and publish in one step
 * Senior Moderator+ (via primary_role) can approve & publish
 */
async function approveAndPublishSubmission(submission, notes = '') {
  try {
    showMessage('Processing approval & publish...', 'info');

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

    // Update submission status directly to published
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'published',
        approved_path: approvedPath,
        reviewer_id: reviewerId,
        review_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    // Clean up temp file
    await supabase.storage.from('uploads-temp').remove([submission.storage_path]);

    showMessage('Submission approved & published!', 'success');
    
    // Reload submissions
    await loadSubmissions();

  } catch (error) {
    console.error('Error approving & publishing submission:', error);
    showMessage('Failed to approve & publish: ' + error.message, 'error');
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
 * Preview file in a new tab
 */
async function previewFile(submission) {
  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');

    const bucket = submission.approved_path ? 'uploads-approved' : 'uploads-temp';
    const path = submission.approved_path || submission.storage_path;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 300); // 5 min URL

    if (error) throw error;
    window.open(data.signedUrl, '_blank');
  } catch (err) {
    showMessage('Preview failed: ' + err.message, 'error');
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
  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        (payload) => {
          loadSubmissions();
        }
      )
      .subscribe();
  } catch (err) {
    console.error('[ADMIN-DASHBOARD] Realtime subscription error:', err);
  }
}

/**
 * Setup demo data reset button (Founder/Admin only)
 */
function setupDemoReset() {
  const panel = document.getElementById('demo-reset-panel');
  if (!panel) return;
  panel.style.display = 'block';

  const resetBtn = document.getElementById('resetDemoDataBtn');
  resetBtn?.addEventListener('click', async () => {
    const confirmed = confirm(
      'Are you sure you want to reset all demo data? This will delete all demo submissions. This action cannot be undone.'
    );
    if (!confirmed) return;

    const doubleConfirm = confirm(
      'FINAL CONFIRMATION: This will permanently delete demo submissions. Click OK to proceed.'
    );
    if (!doubleConfirm) return;

    try {
      const supabase = window.getSupabase ? window.getSupabase() : null;
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('upload_type', 'demo-paper');

      if (error) throw error;

      showMessage('Demo data reset successfully!', 'success');
      await loadSubmissions();
    } catch (err) {
      showMessage('Failed to reset demo data: ' + (err.message || 'Unknown error'), 'error');
    }
  });
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
    info: '#d32f2f'
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

/**
 * Setup role management panel (Founder/Admin only)
 */
function setupRoleManagement() {
  const panel = document.getElementById('role-management-panel');
  if (!panel) return;

  panel.style.display = 'block';

  const searchBtn = document.getElementById('roleSearchBtn');
  const searchInput = document.getElementById('roleSearchInput');
  const cancelBtn = document.getElementById('roleEditCancel');
  const saveBtn = document.getElementById('roleEditSave');

  searchBtn?.addEventListener('click', () => searchUsers());
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchUsers();
  });
  cancelBtn?.addEventListener('click', () => {
    document.getElementById('roleEditPanel').style.display = 'none';
  });
  saveBtn?.addEventListener('click', () => saveRoleChanges());
}

/**
 * Search users by username, email, or UUID
 */
async function searchUsers() {
  const query = document.getElementById('roleSearchInput')?.value.trim();
  if (!query) return;

  const resultsEl = document.getElementById('roleSearchResults');
  if (!resultsEl) return;

  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');

    let results = [];

    // Check if it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(query)) {
      const { data, error } = await supabase.rpc('get_user_role_by_id', {
        target_user_id: query
      });
      if (!error && data) results = Array.isArray(data) ? data : [data];
    } else {
      // Search by username or email
      const { data, error } = await supabase.rpc('search_users_by_username', {
        search_username: query
      });
      if (!error && data) results = data;

      // Fallback to email search if no results
      if (results.length === 0) {
        const { data: emailData, error: emailErr } = await supabase.rpc('search_users_by_email', {
          search_email: query
        });
        if (!emailErr && emailData) results = emailData;
      }
    }

    if (results.length === 0) {
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '<p class="text-muted">No users found.</p>';
      return;
    }

    resultsEl.style.display = 'block';

    // Escape function to prevent XSS
    function esc(str) {
      const div = document.createElement('div');
      div.textContent = str || '';
      return div.innerHTML;
    }

    resultsEl.innerHTML = '';
    results.forEach(u => {
      const row = document.createElement('div');
      row.className = 'role-search-result';
      row.dataset.userId = u.user_id;

      const infoDiv = document.createElement('div');
      const nameStrong = document.createElement('strong');
      nameStrong.textContent = u.display_name || u.email;
      infoDiv.appendChild(nameStrong);

      if (u.username) {
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'text-muted';
        usernameSpan.style.cssText = 'font-size:0.8rem;margin-left:0.5rem;';
        usernameSpan.textContent = `@${u.username}`;
        infoDiv.appendChild(usernameSpan);
      }

      const emailSpan = document.createElement('span');
      emailSpan.className = 'text-muted';
      emailSpan.style.cssText = 'font-size:0.8rem;margin-left:0.5rem;';
      emailSpan.textContent = u.email;
      infoDiv.appendChild(emailSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';

      const levelSpan = document.createElement('span');
      levelSpan.className = 'text-muted';
      levelSpan.style.fontSize = '0.8rem';
      levelSpan.textContent = `Level: ${u.level} · XP: ${u.xp || 0}`;
      actionsDiv.appendChild(levelSpan);

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-outline';
      editBtn.style.cssText = 'padding:0.3rem 0.6rem;font-size:0.8rem;';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openRoleEditor(u));
      actionsDiv.appendChild(editBtn);

      row.appendChild(infoDiv);
      row.appendChild(actionsDiv);
      resultsEl.appendChild(row);
    });

  } catch (err) {
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = `<p class="text-muted">Error: ${err.message}</p>`;
  }
}

/**
 * Open role editor for a user
 */
function openRoleEditor(userData) {
  const editPanel = document.getElementById('roleEditPanel');
  if (!editPanel) return;

  document.getElementById('roleEditName').textContent = `Edit: ${userData.display_name || userData.email}`;
  document.getElementById('roleEditUserId').value = userData.user_id;
  document.getElementById('roleEditLevel').value = userData.level || 0;
  document.getElementById('roleEditPrimary').value = userData.primary_role || '';
  document.getElementById('roleEditSecondary').value = userData.secondary_role || '';
  document.getElementById('roleEditTertiary').value = userData.tertiary_role || '';

  // XP field
  const xpField = document.getElementById('roleEditXP');
  if (xpField) xpField.value = userData.xp || 0;

  const badges = userData.custom_badges || [];
  document.getElementById('roleEditBadges').value = Array.isArray(badges) ? badges.join(', ') : '';

  // Enforce promotion hierarchy in dropdown
  const roleSelect = document.getElementById('roleEditPrimary');
  if (roleSelect) {
    const founderOption = roleSelect.querySelector('option[value="Founder"]');
    const adminOption = roleSelect.querySelector('option[value="Admin"]');

    // Only Founder can promote to Founder or Admin
    if (userPrimaryRoleGlobal !== 'Founder') {
      if (founderOption) founderOption.disabled = true;
      if (adminOption) adminOption.disabled = true;
    } else {
      if (founderOption) founderOption.disabled = false;
      if (adminOption) adminOption.disabled = false;
    }
  }

  editPanel.style.display = 'block';
}

/**
 * Save role changes (via update_user_role RPC — Founder/Admin required by backend)
 */
async function saveRoleChanges() {
  const userId = document.getElementById('roleEditUserId')?.value;
  if (!userId) return;

  const level = parseInt(document.getElementById('roleEditLevel')?.value);
  const xp = parseInt(document.getElementById('roleEditXP')?.value);
  const primaryRole = document.getElementById('roleEditPrimary')?.value.trim() || null;

  // Warn before assigning Founder role
  if (primaryRole === 'Founder') {
    const confirmFounder = confirm(
      'WARNING: There can only be one Founder. If another Founder already exists, this will fail. Continue?'
    );
    if (!confirmFounder) return;
  }

  // Enforce: only Founder can promote to Admin
  if (primaryRole === 'Admin' && userPrimaryRoleGlobal !== 'Founder') {
    showMessage('Only the Founder can promote users to Admin.', 'error');
    return;
  }

  const secondaryRole = document.getElementById('roleEditSecondary')?.value.trim() || null;
  const tertiaryRole = document.getElementById('roleEditTertiary')?.value.trim() || null;
  const badgesStr = document.getElementById('roleEditBadges')?.value.trim();
  const customBadges = badgesStr ? badgesStr.split(',').map(b => b.trim()).filter(Boolean) : [];

  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');

    // Update role metadata via privileged RPC
    const { error } = await supabase.rpc('update_user_role', {
      target_user_id: userId,
      new_level: isNaN(level) ? null : level,
      new_primary_role: primaryRole,
      new_secondary_role: secondaryRole,
      new_tertiary_role: tertiaryRole,
      new_custom_badges: customBadges
    });

    if (error) throw error;

    showMessage('Role updated successfully!', 'success');
    document.getElementById('roleEditPanel').style.display = 'none';

    // Refresh search results and users table
    await searchUsers();
    if (document.getElementById('users-table-panel')?.style.display !== 'none') {
      await loadUsersTable();
    }
  } catch (err) {
    showMessage('Failed to update role: ' + err.message, 'error');
  }
}

/**
 * Setup admin users table (Founder/Admin only)
 */
function setupUsersTable() {
  const panel = document.getElementById('users-table-panel');
  if (!panel) return;

  panel.style.display = 'block';
  loadUsersTable();

  const searchInput = document.getElementById('usersSearchInput');
  const searchBtn = document.getElementById('usersSearchBtn');

  searchBtn?.addEventListener('click', () => loadUsersTable(1, searchInput?.value.trim()));
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadUsersTable(1, searchInput?.value.trim());
  });

  // Sort handlers
  document.querySelectorAll('.users-table th[data-sort]').forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (usersSortBy === field) {
        usersSortDir = usersSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        usersSortBy = field;
        usersSortDir = 'desc';
      }
      // Update aria-sort attributes
      document.querySelectorAll('.users-table th[data-sort]').forEach(h => {
        h.setAttribute('aria-sort', h.dataset.sort === usersSortBy ? (usersSortDir === 'asc' ? 'ascending' : 'descending') : 'none');
      });
      loadUsersTable(1, document.getElementById('usersSearchInput')?.value.trim());
    });
  });
}

let usersCurrentPage = 1;
let usersSortBy = 'created_at';
let usersSortDir = 'desc';

/**
 * Load users table from database
 */
async function loadUsersTable(page, searchQuery) {
  page = page || usersCurrentPage;
  usersCurrentPage = page;

  const tbody = document.getElementById('usersTableBody');
  const paginationEl = document.getElementById('usersPagination');
  if (!tbody) return;

  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase.rpc('list_all_users', {
      page_number: page,
      page_size: 25,
      search_query: searchQuery || null,
      sort_by: usersSortBy,
      sort_dir: usersSortDir
    });

    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--text-muted);">No users found</td></tr>';
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    const totalCount = data[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / 25);

    tbody.innerHTML = '';
    data.forEach(u => {
      const tr = document.createElement('tr');

      const cells = [
        { text: u.user_id ? u.user_id.substring(0, 8) + '…' : '—', title: u.user_id || '', style: 'font-size:0.7rem;font-family:monospace;' },
        { text: u.username || '—' },
        { text: u.display_name || '—' },
        { text: String(u.xp ?? 0) },
        { text: String(u.level ?? 0) },
        { text: u.primary_role || '—' },
        { text: u.secondary_role || '—' },
        { text: u.tertiary_role || '—' },
        { text: String(u.streak_count ?? 0) },
        { text: u.last_login_date ? new Date(u.last_login_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—', style: 'font-size:0.75rem;' },
        { text: u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—', style: 'font-size:0.75rem;' }
      ];

      cells.forEach(cell => {
        const td = document.createElement('td');
        if (typeof cell === 'string') {
          td.textContent = cell;
        } else {
          td.textContent = cell.text;
          if (cell.title) td.title = cell.title;
          if (cell.style) td.style.cssText = cell.style;
        }
        tr.appendChild(td);
      });

      // Actions cell
      const actionsTd = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-outline';
      editBtn.style.cssText = 'padding:0.2rem 0.5rem;font-size:0.75rem;';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openRoleEditor(u));
      actionsTd.appendChild(editBtn);
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);
    });

    // Pagination
    if (paginationEl && totalPages > 1) {
      paginationEl.innerHTML = '';
      for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline' + (i === page ? ' active' : '');
        btn.style.cssText = 'padding:0.2rem 0.5rem;font-size:0.75rem;margin:0 0.15rem;';
        btn.textContent = String(i);
        btn.addEventListener('click', () => loadUsersTable(i, searchQuery));
        paginationEl.appendChild(btn);
      }
    }

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="12" style="color:var(--color-error);">Error: ${err.message}</td></tr>`;
  }
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
