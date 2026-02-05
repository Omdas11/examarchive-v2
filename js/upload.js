// Phase 9.2.5 - Auth Single Source of Truth
// ===============================
// Upload Page - Auth Guard & Upload Handler
// Phase 9.1: Upload Type Selector
// ===============================

console.log("📤 upload.js loaded");

let selectedFile = null;
let selectedUploadType = 'question-paper';

// Check auth when page loads
document.addEventListener("DOMContentLoaded", async () => {
  const { requireSession } = window.AuthContract;
  const session = await requireSession();
  
  if (!session) {
    console.log("🔒 Upload page access denied - user not authenticated");
    renderSignInRequired();
  } else {
    console.log("✅ User authenticated, upload page ready");
    initializeUploadTypeSelector();
    initializeUploadForm();
    loadUserSubmissions();
  }
});

/**
 * Render sign-in required UI
 */
function renderSignInRequired() {
  const mainContent = document.querySelector("main");
  if (!mainContent) return;
  
  const authRequiredHTML = `
    <div class="auth-required" style="
      max-width: 600px;
      margin: 4rem auto;
      text-align: center;
      padding: 2rem;
    ">
      <svg style="width: 64px; height: 64px; margin: 0 auto 1.5rem; stroke: var(--text-muted);" viewBox="0 0 24 24" fill="none" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <h2 style="color: var(--text); margin-bottom: 0.75rem;">Sign in required</h2>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.95rem;">
        You need to be signed in to upload papers.
      </p>
      <button class="btn btn-red" id="auth-required-signin-btn" style="
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
      ">
        Sign in
      </button>
    </div>
  `;
  
  mainContent.innerHTML = authRequiredHTML;
  
  // Attach event listener
  const signInBtn = document.getElementById("auth-required-signin-btn");
  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      document.getElementById("avatarTrigger")?.click();
    });
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

    // Disable button and show progress
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';

    // Upload file
    const result = await handlePaperUpload(
      selectedFile,
      {
        paperCode,
        examYear
      },
      (progress) => {
        uploadButton.textContent = `Uploading ${progress}%`;
      }
    );

    // Handle result
    if (result.success) {
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
      showMessage(result.message, 'error');
    }

    // Re-enable button
    uploadButton.disabled = false;
    uploadButton.textContent = 'Upload Paper';
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
  const formatFileSize = window.UploadHandler.formatFileSize;
  const formatDate = window.UploadHandler.formatDate;
  
  const statusColors = {
    pending: '#FFA726',
    approved: '#4CAF50',
    rejected: '#f44336',
    published: '#2196F3'
  };

  const statusText = {
    pending: '⏳ Pending Review',
    approved: '✓ Approved',
    rejected: '✗ Rejected',
    published: '🌐 Published'
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
          background: ${statusColors[submission.status]}22;
          color: ${statusColors[submission.status]};
          font-weight: 500;
        ">
          ${statusText[submission.status]}
        </span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        ${submission.original_filename} · ${formatFileSize(submission.file_size)}
      </div>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
        ${formatDate(submission.created_at)}
      </div>
      ${submission.review_notes ? `
        <div style="margin-top: 0.5rem; font-size: 0.8rem; padding: 0.5rem; background: var(--surface); border-radius: 4px;">
          <strong>Review notes:</strong> ${submission.review_notes}
        </div>
      ` : ''}
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
