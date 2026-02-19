// admin/dashboard.js
// ============================================
// ADMIN DASHBOARD
// ============================================

console.log("🎛️ dashboard.js loaded");

let currentTab = 'pending';
let currentSubmission = null;
let allSubmissions = [];

/**
 * Get Supabase client safely
 * After requireRole passes, Supabase should be available
 */
function getSupabase() {
  const supabase = window.getSupabase ? window.getSupabase() : (window.App?.supabase || null);
  if (!supabase) {
    console.error('[ADMIN-DASHBOARD] Supabase not available');
  }
  return supabase;
}

// Wait for auth:ready event to check admin access
window.addEventListener("auth:ready", async (e) => {
  console.log('[ADMIN-DASHBOARD] auth:ready event received');
  
  const loadingState = document.getElementById('loading-state');
  const accessDenied = document.getElementById('access-denied');
  const dashboardContent = document.getElementById('dashboard-content');

  try {
    // Use auth controller to require admin or reviewer role
    if (!window.AuthController?.requireRole) {
      console.error('[ADMIN-DASHBOARD] AuthController not available');
      loadingState.style.display = 'none';
      showAccessDenied('Auth system not initialized. Please refresh the page.');
      return;
    }
    
    const { requireRole } = window.AuthController;
    const session = await requireRole(['admin', 'reviewer']);
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    if (!session) {
      // Check if user is signed in at all
      const { getSession } = window.AuthController;
      const userSession = getSession();
      
      if (!userSession) {
        console.log('[ADMIN-DASHBOARD] User not signed in');
        showAccessDenied(
          'You need to sign in to access the admin dashboard.',
          true // Show sign-in button
        );
      } else {
        console.error('[ADMIN-DASHBOARD] Access denied - insufficient permissions');
        showAccessDenied(
          'You don\'t have admin or reviewer permissions. Contact an administrator to request access.',
          false
        );
      }
      return;
    }

    console.log('[ADMIN-DASHBOARD] Admin access granted - initializing dashboard');
    dashboardContent.style.display = 'block';

    // Initialize dashboard
    initializeDashboard();
  } catch (err) {
    console.error('[ADMIN-DASHBOARD] Error checking admin access:', err);
    loadingState.style.display = 'none';
    showAccessDenied('An error occurred while checking permissions. Please try again.');
  }
});

/**
 * Show access denied message with optional sign-in button
 */
function showAccessDenied(message, showSignInButton = false) {
  const accessDenied = document.getElementById('access-denied');
  if (!accessDenied) return;
  
  const messageEl = accessDenied.querySelector('.text-muted');
  if (messageEl) {
    messageEl.textContent = message;
  }
  
  // Add sign-in button if requested
  if (showSignInButton) {
    const existingBtn = accessDenied.querySelector('.btn-red');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    const signInBtn = document.createElement('button');
    signInBtn.className = 'btn btn-red';
    signInBtn.textContent = 'Sign In';
    signInBtn.style.marginTop = '1rem';
    signInBtn.onclick = () => {
      // Trigger sign in via avatar popup
      const avatarTrigger = document.getElementById('avatarTrigger');
      if (avatarTrigger) {
        avatarTrigger.click();
      } else {
        // Fallback: redirect to home
        window.location.href = '../index.html';
      }
    };
    
    accessDenied.appendChild(signInBtn);
  }
  
  accessDenied.style.display = 'flex';
}

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
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[ADMIN-DASHBOARD] Cannot load submissions - Supabase not ready');
      allSubmissions = [];
      updateStats();
      renderSubmissions();
      return;
    }
    
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Log full error details for debugging
      console.error('[ADMIN-DASHBOARD] Error loading submissions:', error);
      showMessage('Failed to load submissions: ' + error.message, 'error');
      
      // Set empty array and continue rendering graceful empty state
      allSubmissions = [];
    } else {
      allSubmissions = data || [];
    }
    
    // Update stats
    updateStats();
    
    // Render submissions for current tab
    renderSubmissions();
    
  } catch (error) {
    console.error('Unexpected error loading submissions:', error);
    // Only show message for unexpected errors
    allSubmissions = [];
    updateStats();
    renderSubmissions();
  }
}

/**
 * Update dashboard stats
 */
function updateStats() {
  const pending = allSubmissions.filter(s => s.status === 'pending').length;
  const approved = allSubmissions.filter(s => s.status === 'approved').length;
  const rejected = allSubmissions.filter(s => s.status === 'rejected').length;

  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-approved').textContent = approved;
  document.getElementById('stat-published').textContent = 0;
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
  const statusClass = `status-${submission.status}`;
  
  const statusLabels = {
    pending: '⏳ Pending Review',
    approved: '✓ Approved',
    rejected: '✗ Rejected'
  };

  return `
    <div class="submission-card" data-id="${submission.id}">
      <div class="submission-header">
        <div class="submission-meta">
          <h3>${submission.paper_code || 'Unknown Code'} - ${submission.year || 'N/A'}</h3>
          <div class="meta-row">
            ${window.UploadHandler.formatDate(submission.created_at)}
          </div>
        </div>
        <span class="status-badge ${statusClass}">
          ${statusLabels[submission.status] || submission.status}
        </span>
      </div>

      <div class="submission-actions">
        ${submission.status === 'pending' ? `
          <button class="btn btn-danger" data-action="reject" data-id="${submission.id}">
            Reject
          </button>
          <button class="btn btn-success" data-action="approve" data-id="${submission.id}">
            Approve
          </button>
          <button class="btn btn-outline" data-action="delete" data-id="${submission.id}" style="color: var(--color-error);">
            Delete
          </button>
        ` : `
          <button class="btn btn-outline" data-action="delete" data-id="${submission.id}" style="color: var(--color-error);">
            Delete
          </button>
        `}
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
      } else if (action === 'delete') {
        await deleteSubmission(submission);
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
      <h4 style="margin: 0 0 0.5rem 0;">${submission.paper_code} - ${submission.year}</h4>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-muted);">
        <strong>Submitted:</strong> ${window.UploadHandler.formatDate(submission.created_at)}
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
      <h4 style="margin: 0 0 0.5rem 0;">${submission.paper_code} - ${submission.year}</h4>
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

    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    // Move file from temp to approved bucket
    const approvedPath = `approved/${submission.paper_code}/${submission.year}/${Date.now()}.pdf`;

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

    // Insert into approved_papers
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
      .update({ status: 'approved', approved_path: approvedPath })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    // Clean up temp file
    await supabase.storage.from('uploads-temp').remove([submission.storage_path]);

    showMessage('Submission approved!', 'success');
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

    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    // Delete file from temp storage
    await supabase.storage.from('uploads-temp').remove([submission.storage_path]);

    // Update submission status
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    showMessage('Submission rejected', 'success');
    await loadSubmissions();

  } catch (error) {
    console.error('Error rejecting submission:', error);
    showMessage('Failed to reject submission: ' + error.message, 'error');
  }
}

/**
 * Delete submission (admin only)
 */
async function deleteSubmission(submission) {
  if (!confirm(`Delete submission ${submission.paper_code} - ${submission.year}?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    showMessage('Deleting submission...', 'info');

    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    // Delete file from temp storage if present
    if (submission.storage_path) {
      await supabase.storage.from('uploads-temp').remove([submission.storage_path]);
    }

    // Delete submission record
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submission.id);

    if (deleteError) throw deleteError;

    showMessage('Submission deleted', 'success');
    await loadSubmissions();

  } catch (error) {
    console.error('Error deleting submission:', error);
    showMessage('Failed to delete submission: ' + error.message, 'error');
  }
}

/**
 * Setup real-time subscriptions for live updates
 */
function setupRealtimeSubscriptions() {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('[ADMIN-DASHBOARD] Cannot setup realtime - Supabase not available');
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
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-info)'
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
