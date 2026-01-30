// admin/dashboard.js
// ============================================
// ADMIN DASHBOARD - Phase 8
// ============================================

import { supabase } from "../js/supabase.js";
import { waitForRole } from "../js/roles.js";
import { moveFile, copyFile, deleteFile, getPublicUrl, BUCKETS } from "../js/supabase-client.js";
import { formatFileSize, formatDate } from "../js/upload-handler.js";

console.log("🎛️ dashboard.js loaded");

let currentTab = 'pending';
let currentSubmission = null;
let allSubmissions = [];

// Check admin access when page loads
document.addEventListener("DOMContentLoaded", async () => {
  console.log('[ADMIN-DASHBOARD] DOMContentLoaded - Checking admin access...');
  
  const loadingState = document.getElementById('loading-state');
  const accessDenied = document.getElementById('access-denied');
  const dashboardContent = document.getElementById('dashboard-content');

  try {
    // CRITICAL: Wait for role to be ready before checking access
    console.log('[ADMIN-DASHBOARD] Waiting for role:ready event...');
    const roleState = await waitForRole();
    console.log('[ADMIN-DASHBOARD] Role state received:', roleState);
    console.log('[ROLE] resolved:', roleState.status);
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    // Check if user has admin role - ONLY use global role state
    const hasAdminAccess = roleState.status === 'admin';
    console.log('[ADMIN-DASHBOARD] Admin access check:', hasAdminAccess ? 'GRANTED' : 'DENIED');
    
    if (!hasAdminAccess) {
      accessDenied.style.display = 'flex';
      console.log("🔒 Admin dashboard access denied - user role is:", roleState.status);
      return;
    }

    console.log("✅ Admin access granted");
    console.log('[ADMIN] dashboard access granted');
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
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:user_id (email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    allSubmissions = data || [];
    
    // Update stats
    updateStats();
    
    // Render submissions for current tab
    renderSubmissions();
    
  } catch (error) {
    console.error('Error loading submissions:', error);
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
  const userEmail = submission.profiles?.email || 'Unknown user';
  const statusClass = `status-${submission.status}`;
  
  const statusLabels = {
    pending: '⏳ Pending Review',
    approved: '✓ Approved',
    rejected: '✗ Rejected',
    published: '🌐 Published'
  };

  return `
    <div class="submission-card" data-id="${submission.id}">
      <div class="submission-header">
        <div class="submission-meta">
          <h3>${submission.paper_code || 'Unknown Code'} - ${submission.exam_year || 'N/A'}</h3>
          <div class="meta-row">
            <strong>Submitted by:</strong> ${userEmail}
          </div>
          <div class="meta-row">
            <strong>File:</strong> ${submission.original_filename}
          </div>
          <div class="meta-row">
            ${formatDate(submission.created_at)}
          </div>
        </div>
        <span class="status-badge ${statusClass}">
          ${statusLabels[submission.status]}
        </span>
      </div>

      <div class="submission-details">
        <div class="detail-item">
          <strong>File Size</strong>
          <span>${formatFileSize(submission.file_size)}</span>
        </div>
        <div class="detail-item">
          <strong>Paper Name</strong>
          <span>${submission.paper_name || '-'}</span>
        </div>
        ${submission.reviewed_at ? `
        <div class="detail-item">
          <strong>Reviewed</strong>
          <span>${formatDate(submission.reviewed_at)}</span>
        </div>
        ` : ''}
        ${submission.public_url ? `
        <div class="detail-item">
          <strong>Public URL</strong>
          <span><a href="${submission.public_url}" target="_blank" rel="noopener">View PDF</a></span>
        </div>
        ` : ''}
      </div>

      ${submission.review_notes ? `
      <div style="padding: 0.75rem; background: var(--bg-soft); border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;">
        <strong>Review Notes:</strong> ${submission.review_notes}
      </div>
      ` : ''}

      <div class="submission-actions">
        ${submission.status === 'pending' ? `
          <button class="btn btn-outline" data-action="view" data-id="${submission.id}">
            View Details
          </button>
          <button class="btn btn-danger" data-action="reject" data-id="${submission.id}">
            Reject
          </button>
          <button class="btn btn-success" data-action="approve" data-id="${submission.id}">
            Approve & Publish
          </button>
        ` : submission.status === 'approved' ? `
          <button class="btn btn-view" data-action="publish" data-id="${submission.id}">
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
      <h4 style="margin: 0 0 0.5rem 0;">${submission.paper_code} - ${submission.exam_year}</h4>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-muted);">
        <strong>File:</strong> ${submission.original_filename} (${formatFileSize(submission.file_size)})
      </p>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-muted);">
        <strong>Submitted:</strong> ${formatDate(submission.created_at)}
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
      <h4 style="margin: 0 0 0.5rem 0;">${submission.paper_code} - ${submission.exam_year}</h4>
      <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--text-muted);">
        <strong>File:</strong> ${submission.original_filename}
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

    const { data: { session } } = await supabase.auth.getSession();
    const reviewerId = session.user.id;

    // Move file from temp to approved to public
    const timestamp = Date.now();
    const filename = `${submission.paper_code}_${submission.exam_year}_${timestamp}.pdf`;
    const publicPath = `papers/${filename}`;

    const moved = await moveFile(
      BUCKETS.TEMP,
      submission.temp_path,
      BUCKETS.PUBLIC,
      publicPath
    );

    if (!moved) {
      throw new Error('Failed to move file to public storage');
    }

    // Get public URL
    const publicUrl = getPublicUrl(publicPath);

    // Update submission
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'published',
        reviewer_id: reviewerId,
        review_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        public_path: publicPath,
        public_url: publicUrl
      })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    showMessage('Submission approved and published!', 'success');
    
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

    const { data: { session } } = await supabase.auth.getSession();
    const reviewerId = session.user.id;

    // Delete file from temp storage
    await deleteFile(BUCKETS.TEMP, submission.temp_path);

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

    // Move from approved to public
    const timestamp = Date.now();
    const filename = `${submission.paper_code}_${submission.exam_year}_${timestamp}.pdf`;
    const publicPath = `papers/${filename}`;

    const moved = await moveFile(
      BUCKETS.APPROVED,
      submission.approved_path,
      BUCKETS.PUBLIC,
      publicPath
    );

    if (!moved) {
      throw new Error('Failed to move file to public storage');
    }

    // Get public URL
    const publicUrl = getPublicUrl(publicPath);

    // Update submission
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        public_path: publicPath,
        public_url: publicUrl
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
