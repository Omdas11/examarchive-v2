// js/tutorial.js
// ============================================
// FIRST VISIT TUTORIAL
// Shows welcome modal on first visit
// Uses localStorage to track seen state
// ============================================

(function () {
  const TUTORIAL_KEY = 'examarchive_tutorial_seen';

  if (localStorage.getItem(TUTORIAL_KEY) === 'true') {
    return;
  }

  function createTutorialModal() {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.id = 'tutorial-overlay';

    overlay.innerHTML = `
      <div class="tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <div class="tutorial-header">
          <h2 id="tutorial-title">👋 Welcome to ExamArchive!</h2>
          <button class="tutorial-close" id="tutorial-close" aria-label="Close tutorial">✕</button>
        </div>
        <div class="tutorial-body">
          <div class="tutorial-step">
            <span class="tutorial-step-icon">🔐</span>
            <div>
              <strong>Sign in with Google</strong>
              <p>Sign in to upload papers and track your contributions.</p>
            </div>
          </div>
          <div class="tutorial-step">
            <span class="tutorial-step-icon">📤</span>
            <div>
              <strong>Upload Papers</strong>
              <p>Upload question papers as PDFs. They'll be reviewed before publishing.</p>
            </div>
          </div>
          <div class="tutorial-step">
            <span class="tutorial-step-icon">📚</span>
            <div>
              <strong>Browse Papers</strong>
              <p>Search and filter previous year question papers by subject, year, and stream.</p>
            </div>
          </div>
        </div>
        <div class="tutorial-footer">
          <button class="btn btn-primary" id="tutorial-got-it">Got it!</button>
          <button class="btn btn-outline" id="tutorial-skip">Skip</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      .tutorial-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        animation: tutorialFadeIn 0.3s ease;
      }
      @keyframes tutorialFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .tutorial-modal {
        background: var(--surface, #fff);
        border-radius: 16px;
        max-width: 440px;
        width: 100%;
        padding: 1.5rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        color: var(--text, #333);
      }
      .tutorial-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .tutorial-header h2 {
        font-size: 1.2rem;
        margin: 0;
      }
      .tutorial-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: var(--text-muted, #666);
        padding: 4px 8px;
        border-radius: 6px;
      }
      .tutorial-close:hover {
        background: rgba(0,0,0,0.05);
      }
      .tutorial-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .tutorial-step {
        display: flex;
        gap: 0.8rem;
        align-items: flex-start;
      }
      .tutorial-step-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        width: 2rem;
        text-align: center;
      }
      .tutorial-step strong {
        display: block;
        margin-bottom: 0.2rem;
      }
      .tutorial-step p {
        font-size: 0.85rem;
        color: var(--text-muted, #666);
        margin: 0;
        line-height: 1.4;
      }
      .tutorial-footer {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
    `;
    document.head.appendChild(style);

    function dismiss() {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      overlay.remove();
      style.remove();
    }

    document.getElementById('tutorial-got-it').addEventListener('click', dismiss);
    document.getElementById('tutorial-skip').addEventListener('click', dismiss);
    document.getElementById('tutorial-close').addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) dismiss();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTutorialModal);
  } else {
    createTutorialModal();
  }
})();
