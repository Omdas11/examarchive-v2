// ===============================
// Upload Page - Auth Guard & Upload Handler
// Phase 1.0: Clean Architecture Reset
// ===============================

console.log("📤 upload.js loaded");

let selectedFile = null;
let selectedUploadType = 'question-paper';
let isUploading = false; // UPLOAD LOCK - prevents multiple uploads
let uploadFormInitialized = false; // Prevents multiple initializations

// Wrap everything in DOMContentLoaded to ensure page is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[UPLOAD] DOMContentLoaded - page ready');
  
  // Wait for auth:ready event before checking auth
  window.addEventListener("auth:ready", async (e) => {
    console.log('[UPLOAD] auth:ready event received - initializing upload page');
    const session = e.detail.session;
    
    if (!session) {
      console.log("🔒 User not authenticated — upload form disabled");
      disableUploadForm();
    } else {
      console.log("✅ User authenticated, upload page ready");
      enableUploadForm();
      initializeUploadTypeSelector();
      // Only initialize form once
      if (!uploadFormInitialized) {
        initializeUploadForm();
        uploadFormInitialized = true;
      }
      loadUserSubmissions();
    }
  });

  // Listen for auth changes (e.g. user signs in via popup)
  window.addEventListener("auth-state-changed", (e) => {
    console.log('[UPLOAD] auth-state-changed event received');
    const session = e.detail.session;
    if (session) {
      console.log("✅ Auth changed — enabling upload form");
      enableUploadForm();
      initializeUploadTypeSelector();
      // Only initialize form once
      if (!uploadFormInitialized) {
        initializeUploadForm();
        uploadFormInitialized = true;
      }
      loadUserSubmissions();
    } else {
      disableUploadForm();
    }
  });
});

/**
 * Disable the upload form for unauthenticated users.
 * Shows the form but disables inputs; upload button triggers sign-in popup.
 */
function disableUploadForm() {
  // Disable all form inputs
  document.querySelectorAll('.upload-card input, .upload-card select').forEach(el => {
    el.disabled = true;
  });
  
  // Disable type selector inputs
  document.querySelectorAll('.upload-type-selector input').forEach(el => {
    el.disabled = true;
  });
  
  // Replace upload button behavior
  const uploadButton = document.querySelector('.upload-submit .btn-red');
  if (uploadButton) {
    uploadButton.textContent = 'Sign in to Upload';
    uploadButton.addEventListener('click', handleSignInClick);
  }
}

/**
 * Enable the upload form for authenticated users.
 */
function enableUploadForm() {
  // Enable all form inputs
  document.querySelectorAll('.upload-card input').forEach(el => {
    el.disabled = false;
  });
  
  // Enable type selector inputs (except Notes/Resources which is always disabled)
  document.querySelectorAll('.upload-type-selector input').forEach(el => {
    if (el.value !== 'notes-resources') {
      el.disabled = false;
    }
  });
  
  // Restore upload button
  const uploadButton = document.querySelector('.upload-submit .btn-red');
  if (uploadButton) {
    uploadButton.textContent = 'Upload Paper';
    uploadButton.removeEventListener('click', handleSignInClick);
  }
}

/**
 * Handle sign-in click — trigger profile sign-in popup (no redirect)
 */
function handleSignInClick(e) {
  e.preventDefault();
  const avatarTrigger = document.getElementById("avatarTrigger");
  if (avatarTrigger) {
    avatarTrigger.click();
  }
}

/**
 * Initialize upload type selector
 */
function initializeUploadTypeSelector() {
  const typeOptions = document.querySelectorAll('.type-option');
  
  typeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const input = option.querySelector('input[type="radio"]');
      
      // Don't allow selecting disabled options
      if (option.classList.contains('disabled') || input.disabled) {
        e.preventDefault();
        showMessage('This upload type is coming in a future phase', 'info');
        return;
      }
      
      // Update active state
      typeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      // Update selected type
      selectedUploadType = input.value;
      console.log('Selected upload type:', selectedUploadType);
    });
  });
}

/**
 * Initialize upload form
 */
function initializeUploadForm() {
  const handlePaperUpload = window.UploadHandler.handlePaperUpload;
  
  const fileInput = document.querySelector('input[type="file"]');
  const fileLabel = document.querySelector('.file-drop');
  const fileUI = document.querySelector('.file-ui');
  const uploadButton = document.querySelector('.btn-red');
  const paperCodeInput = document.querySelector('input[type="text"]');
  const examYearInput = document.querySelector('input[type="number"]');

  if (!fileInput || !fileLabel || !uploadButton) {
    console.error('Upload form elements not found');
    return;
  }

  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      updateFileUI(file, fileUI);
    }
  });

  // Handle drag and drop
  fileLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUI.style.borderColor = 'var(--red)';
  });

  fileLabel.addEventListener('dragleave', () => {
    fileUI.style.borderColor = 'var(--border)';
  });

  fileLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUI.style.borderColor = 'var(--border)';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      selectedFile = file;
      fileInput.files = e.dataTransfer.files;
      updateFileUI(file, fileUI);
    } else {
      showMessage('Please select a PDF file', 'error');
    }
  });

  // Handle upload button click
  uploadButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    console.log('[UPLOAD] Upload button clicked - checking upload lock');
    
    // UPLOAD LOCK - prevent multiple uploads
    if (isUploading) {
      console.warn('[UPLOAD] Upload already in progress - ignoring click');
      showMessage('Upload already in progress', 'info');
      return;
    }
    
    const paperCode = paperCodeInput.value.trim();
    const examYear = parseInt(examYearInput.value);

    // Validate inputs
    if (!paperCode) {
      showMessage('Please enter a paper code', 'error');
      paperCodeInput.focus();
      return;
    }

    if (!examYear || examYear < 1990 || examYear > 2099) {
      showMessage('Please enter a valid examination year', 'error');
      examYearInput.focus();
      return;
    }

    if (!selectedFile) {
      showMessage('Please select a PDF file', 'error');
      fileInput.click();
      return;
    }

    // Set upload lock
    isUploading = true;
    console.log('[UPLOAD] Upload lock acquired - starting upload');
    
    // Disable button and show progress
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';

    try {
      // Upload file — pass uploadType for demo handling
      console.log('[UPLOAD] Calling handlePaperUpload...', { paperCode, examYear, uploadType: selectedUploadType });
      const result = await handlePaperUpload(
        selectedFile,
        {
          paperCode,
          examYear,
          uploadType: selectedUploadType
        },
        (progress) => {
          uploadButton.textContent = `Uploading ${progress}%`;
        }
      );

      // Handle result
      if (result.success) {
        console.log('[UPLOAD] Upload successful - submission ID:', result.submissionId);
        showMessage(result.message, 'success');
        
        // Reset form
        paperCodeInput.value = '';
        examYearInput.value = '';
        fileInput.value = '';
        selectedFile = null;
        resetFileUI(fileUI);
        
        // Reload submissions
        setTimeout(() => {
          loadUserSubmissions();
        }, 500);
      } else {
        console.error('[UPLOAD] Upload failed:', result.message);
        showMessage(result.message, 'error');
      }
    } catch (err) {
      console.error('[UPLOAD] Unexpected error:', err);
      showMessage('Upload failed. Please try again.', 'error');
    }

    // Always re-enable button and release lock
    uploadButton.disabled = false;
    uploadButton.textContent = 'Upload Paper';
    isUploading = false;
    console.log('[UPLOAD] Upload lock released');
  });
}

/**
 * Update file UI with selected file info
 */
function updateFileUI(file, fileUI) {
  const formatFileSize = window.UploadHandler.formatFileSize;
  const size = formatFileSize(file.size);
  fileUI.innerHTML = `
    <strong>✓ ${file.name}</strong>
    <p class="text-muted">${size} · Ready to upload</p>
  `;
}

/**
 * Reset file UI to default state
 */
function resetFileUI(fileUI) {
  fileUI.innerHTML = `
    <strong>Select PDF file</strong>
    <p class="text-muted">
      Only PDF files · Clear scan preferred · Max size limits may apply
    </p>
  `;
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
  // Create or update message element
  let messageEl = document.getElementById('upload-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'upload-message';
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 9999;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(messageEl);
  }

  // Set color based on type
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3'
  };
  messageEl.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
  messageEl.textContent = message;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => messageEl.remove(), 300);
    }
  }, 5000);
}

/**
 * Load and display user's submissions
 */
async function loadUserSubmissions() {
  const getUserSubmissions = window.UploadHandler.getUserSubmissions;
  const submissions = await getUserSubmissions();
  
  if (submissions.length === 0) {
    return;
  }

  // Create submissions section if it doesn't exist
  let submissionsSection = document.getElementById('submissions-section');
  if (!submissionsSection) {
    submissionsSection = document.createElement('section');
    submissionsSection.id = 'submissions-section';
    submissionsSection.className = 'upload-info card';
    submissionsSection.style.marginTop = '2rem';
    
    const uploadCard = document.querySelector('.upload-card');
    uploadCard.insertAdjacentElement('afterend', submissionsSection);
  }

  // Render submissions
  submissionsSection.innerHTML = `
    <h2>Your Submissions</h2>
    <div class="submissions-list">
      ${submissions.map(submission => renderSubmission(submission)).join('')}
    </div>
  `;
}

/**
 * Render a single submission
 */
function renderSubmission(submission) {
  const formatDate = window.UploadHandler.formatDate;
  
  const statusColors = {
    pending: '#FFA726',
    approved: '#4CAF50',
    rejected: '#f44336'
  };

  const statusText = {
    pending: '⏳ Pending Review',
    approved: '✓ Approved',
    rejected: '✗ Rejected'
  };

  return `
    <div class="submission-item" style="
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-bottom: 0.75rem;
      background: var(--bg-soft);
    ">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <div>
          <strong style="font-size: 0.9rem;">${submission.paper_code || 'Unknown'}</strong>
          <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">
            ${submission.exam_year || ''}
          </span>
        </div>
        <span style="
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background: ${statusColors[submission.status] || '#9E9E9E'}22;
          color: ${statusColors[submission.status] || '#9E9E9E'};
          font-weight: 500;
        ">
          ${statusText[submission.status] || submission.status}
        </span>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
        ${formatDate(submission.created_at)}
      </div>
    </div>
  `;
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
