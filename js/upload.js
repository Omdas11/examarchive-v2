// ===============================
// Upload Page - Auth Guard & Upload Handler
// ===============================

let selectedFile = null;
let selectedUploadType = 'question-paper';
let isUploading = false;
let uploadFormInitialized = false;
let authReady = false;

// Wrap everything in DOMContentLoaded to ensure page is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth:ready event before checking auth
  window.addEventListener("auth:ready", async (e) => {
    authReady = true;
    const session = e.detail.session;
    
    if (window.Debug) {
      window.Debug.logInfo('auth', '[AUTH] Auth ready event received.');
      // Print auth status on page load
      window.Debug.printAuthStatus();
    }
    
    if (!session) {
      disableUploadForm();
    } else {
      enableUploadForm();
      initializeUploadTypeSelector();
      if (!uploadFormInitialized) {
        initializeUploadForm();
        uploadFormInitialized = true;
      }
      loadUserSubmissions();
    }
  });

  // Listen for auth changes (e.g. user signs in via popup)
  window.addEventListener("auth-state-changed", (e) => {
    const session = e.detail.session;
    if (session) {
      enableUploadForm();
      initializeUploadTypeSelector();
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
  const fileUI = document.getElementById('fileUI');
  const uploadButton = document.querySelector('.btn-red');
  const paperCodeInput = document.getElementById('paperCode');
  const examYearInput = document.getElementById('examYear');
  const yearValidationIcon = document.getElementById('yearValidationIcon');
  const yearHint = document.getElementById('yearHint');
  const filenamePreview = document.getElementById('filenamePreview');

  if (!fileInput || !fileLabel || !uploadButton) {
    console.error('Upload form elements not found');
    return;
  }

  // --- Year Validation Helper ---
  function isYearValid(val) {
    if (!val || val.length === 0) return null; // empty = neutral
    const year = parseInt(val, 10);
    return val.length === 4 && year >= 1990 && year <= 2099;
  }

  // --- Year Validation ---
  function validateYear() {
    const val = examYearInput.value.trim();
    const valid = isYearValid(val);
    
    if (valid === null) {
      yearValidationIcon.textContent = '';
      yearHint.textContent = '';
      yearHint.className = 'field-hint year-hint';
      examYearInput.classList.remove('input-valid', 'input-invalid');
    } else if (valid) {
      yearValidationIcon.textContent = '✓';
      yearValidationIcon.style.color = 'var(--color-success)';
      yearHint.textContent = '';
      yearHint.className = 'field-hint year-hint valid';
      examYearInput.classList.add('input-valid');
      examYearInput.classList.remove('input-invalid');
    } else {
      yearValidationIcon.textContent = '✗';
      yearValidationIcon.style.color = 'var(--color-error)';
      yearHint.textContent = 'Enter a valid 4-digit year (1990–2099)';
      yearHint.className = 'field-hint year-hint invalid';
      examYearInput.classList.add('input-invalid');
      examYearInput.classList.remove('input-valid');
    }
    updateUploadButtonState();
    updateFilenamePreview();
  }

  examYearInput.addEventListener('input', validateYear);

  // --- Filename Preview ---
  function updateFilenamePreview() {
    const code = paperCodeInput.value.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const year = examYearInput.value.trim();
    
    if (code || year) {
      filenamePreview.style.display = 'block';
      filenamePreview.textContent = (code || '…') + '-' + (year || '…') + '-';
    } else {
      filenamePreview.style.display = 'none';
    }
  }

  paperCodeInput.addEventListener('input', updateFilenamePreview);
  examYearInput.addEventListener('input', updateFilenamePreview);

  // --- Upload button state ---
  function updateUploadButtonState() {
    const val = examYearInput.value.trim();
    const valid = isYearValid(val);
    uploadButton.disabled = valid === false;
  }

  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      updateFileUI(file, fileUI);
      fileLabel.classList.add('file-selected');
    }
  });

  // Handle drag and drop
  let dragCounter = 0;

  fileLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  fileLabel.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    fileLabel.classList.add('drag-over');
  });

  fileLabel.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      fileLabel.classList.remove('drag-over');
    }
  });

  fileLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    fileLabel.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      selectedFile = file;
      fileInput.files = e.dataTransfer.files;
      updateFileUI(file, fileUI);
      fileLabel.classList.add('file-selected');
    } else {
      showMessage('Please select a PDF file', 'error');
    }
  });

  // Handle upload button click
  uploadButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // AUTH READY CHECK
    if (!authReady) {
      if (window.Debug) {
        window.Debug.logWarn('auth', '[AUTH] Upload attempted before auth ready.');
      }
      showMessage('Authentication still loading. Please wait.', 'info');
      return;
    }
    
    // UPLOAD LOCK
    if (isUploading) {
      showMessage('Upload already in progress', 'info');
      return;
    }
    
    const paperCode = paperCodeInput.value.trim();
    const examYear = parseInt(examYearInput.value);
    const university = document.getElementById('university')?.value || '';
    const stream = document.getElementById('stream')?.value || '';
    const paperType = document.getElementById('paperType')?.value || 'main';
    const paperTags = document.getElementById('paperTags')?.value.trim() || '';

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
    
    // Disable button and show progress
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';

    try {
      // Upload file — pass uploadType for demo handling
      const result = await handlePaperUpload(
        selectedFile,
        {
          paperCode,
          examYear,
          uploadType: selectedUploadType,
          university,
          stream,
          paperType,
          tags: paperTags
        },
        (progress) => {
          uploadButton.textContent = `Uploading ${progress}%`;
        }
      );

      // Handle result
      if (result.success) {
        showMessage(result.message, 'success');
        
        // Show success animation
        uploadButton.textContent = '✅ Uploaded!';
        
        // Reset form
        paperCodeInput.value = '';
        examYearInput.value = '';
        fileInput.value = '';
        selectedFile = null;
        resetFileUI(fileUI);
        if (filenamePreview) filenamePreview.style.display = 'none';
        if (yearValidationIcon) yearValidationIcon.textContent = '';
        if (yearHint) { yearHint.textContent = ''; yearHint.className = 'field-hint year-hint'; }
        examYearInput.classList.remove('input-valid', 'input-invalid');
        
        // Reload submissions
        setTimeout(() => {
          loadUserSubmissions();
        }, 500);
      } else {
        showMessage(result.message, 'error');
      }
    } catch (err) {
      showMessage('Upload failed. Please try again.', 'error');
    }

    // Always re-enable button and release lock
    uploadButton.disabled = false;
    uploadButton.textContent = 'Upload Paper';
    isUploading = false;
  });
}

/**
 * Update file UI with selected file info
 */
function updateFileUI(file, fileUI) {
  const formatFileSize = window.UploadHandler.formatFileSize;
  const size = formatFileSize(file.size);
  const fileType = file.type === 'application/pdf' ? 'PDF' : file.type || 'Unknown';
  fileUI.innerHTML = `
    <strong>✓ ${file.name}</strong>
    <p class="text-muted">${size} · ${fileType} · Ready to upload</p>
  `;
}

/**
 * Reset file UI to default state
 */
function resetFileUI(fileUI) {
  const fileLabel = document.querySelector('.file-drop');
  if (fileLabel) fileLabel.classList.remove('file-selected');
  
  fileUI.innerHTML = `
    <svg class="upload-cloud-icon" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 36c-4.42 0-8-3.58-8-8 0-3.7 2.5-6.8 5.9-7.7C12.6 14.5 17.8 10 24 10c7.18 0 13 5.82 13 13 0 .34-.01.67-.04 1H38c3.31 0 6 2.69 6 6s-2.69 6-6 6H14z"/>
      <path d="M24 22v14M18 28l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <strong>Select PDF file</strong>
    <p class="text-muted">
      Drag &amp; drop or click · PDF only · Clear scan preferred
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
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-info)'
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
    pending: 'var(--color-warning)',
    approved: 'var(--color-success)',
    rejected: 'var(--color-error)'
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
            ${submission.year || ''}
          </span>
        </div>
        <span style="
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background: var(--bg-soft);
          color: ${statusColors[submission.status] || 'var(--color-muted)'};
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
