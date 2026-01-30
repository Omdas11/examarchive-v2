// ===============================
// Upload Page - Auth Guard & Upload Handler
// ===============================

import { requireAuth } from "./common.js";
import { handlePaperUpload, getUserSubmissions, formatFileSize, formatDate } from "./upload-handler.js";

console.log("📤 upload.js loaded");

let selectedFile = null;

// Check auth when page loads
document.addEventListener("DOMContentLoaded", async () => {
  const isAuthenticated = await requireAuth({
    showMessage: true,
    redirectToLogin: false
  });
  
  if (!isAuthenticated) {
    console.log("🔒 Upload page access denied - user not authenticated");
    // UI is already updated by requireAuth
  } else {
    console.log("✅ User authenticated, upload page ready");
    initializeUploadForm();
    loadUserSubmissions();
  }
});

/**
 * Initialize upload form
 */
function initializeUploadForm() {
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
