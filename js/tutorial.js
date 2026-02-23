// js/tutorial.js
// ============================================
// GUIDED TUTORIAL WALKTHROUGH
// Multi-step walkthrough that highlights UI elements
// Uses localStorage to track completion
// ============================================

(function () {
  const TUTORIAL_KEY = 'examarchive_tutorial_seen';
  const TUTORIAL_VERSION = '2'; // Increment to re-show tutorial on major updates

  try {
    if (localStorage.getItem(TUTORIAL_KEY) === TUTORIAL_VERSION) {
      return;
    }
  } catch (e) {
    // localStorage unavailable (private browsing, etc.)
    return;
  }

  var SI = window.SvgIcons;
  var gi = function(n) { return SI ? SI.inline(n) : ''; };

  const steps = [
    {
      title: 'Welcome to ExamArchive!',
      text: 'Let us show you around. This quick guide will help you get started.',
      target: null,
      icon: gi('home')
    },
    {
      title: 'Search for Papers',
      text: 'Use the search bar to find question papers by code, subject, or year. You can also filter by paper type.',
      target: '.home-search',
      icon: gi('search')
    },
    {
      title: 'Quick Access',
      text: 'Jump straight to papers by Subject, University, or Year using these shortcuts.',
      target: '.quick-access',
      icon: gi('lightning')
    },
    {
      title: 'Your Profile',
      text: 'Click your avatar to sign in, view your profile, track XP, and manage your account.',
      target: '#avatarTrigger',
      icon: gi('user')
    },
    {
      title: 'Upload Papers',
      text: 'Go to the Upload page to contribute question papers. Sign in first, then fill in the paper details and upload your PDF.',
      target: 'a[href="upload.html"]',
      icon: gi('upload')
    },
    {
      title: 'Browse Collection',
      text: 'Browse all available papers, filter by stream, and download what you need. Start exploring!',
      target: 'a[href="browse.html"]',
      icon: gi('books')
    }
  ];

  let currentStep = 0;
  let currentTargetEl = null;

  function updateHighlightPosition() {
    const clone = document.getElementById('tutorial-highlight-clone');
    if (!clone || !currentTargetEl) return;
    const rect = currentTargetEl.getBoundingClientRect();
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
  }

  function createTutorialUI() {
    // Create styles
    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      .tutorial-overlay {
        position: fixed;
        inset: 0;
        z-index: 99998;
        background: rgba(0, 0, 0, 0.45);
        animation: tutorialFadeIn 0.3s ease;
        pointer-events: auto;
      }
      @keyframes tutorialFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .tutorial-tooltip {
        position: fixed;
        z-index: 100000;
        background: var(--surface, #fff);
        border-radius: 14px;
        max-width: 360px;
        width: calc(100vw - 2rem);
        padding: 1.25rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        color: var(--text, #333);
        animation: tooltipPop 0.3s ease;
      }
      @keyframes tooltipPop {
        from { opacity: 0; transform: translateY(10px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .tutorial-tooltip-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.6rem;
      }
      .tutorial-tooltip-icon {
        font-size: 1.3rem;
        flex-shrink: 0;
      }
      .tutorial-tooltip-title {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
      }
      .tutorial-tooltip-text {
        font-size: 0.85rem;
        color: var(--text-muted, #666);
        line-height: 1.5;
        margin-bottom: 1rem;
      }
      .tutorial-tooltip-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .tutorial-tooltip-progress {
        font-size: 0.75rem;
        color: var(--text-muted, #999);
      }
      .tutorial-tooltip-actions {
        display: flex;
        gap: 0.5rem;
      }
      .tutorial-highlight-clone {
        position: fixed;
        z-index: 99999;
        box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.4), 0 0 20px rgba(211, 47, 47, 0.15);
        border-radius: 8px;
        pointer-events: none;
        transition: box-shadow 0.3s ease;
      }
    `;
    document.head.appendChild(style);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.id = 'tutorial-overlay';
    document.body.appendChild(overlay);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.id = 'tutorial-tooltip';
    tooltip.setAttribute('role', 'dialog');
    tooltip.setAttribute('aria-modal', 'true');
    document.body.appendChild(tooltip);

    overlay.addEventListener('click', dismiss);

    window.addEventListener('scroll', updateHighlightPosition, true);
    window.addEventListener('resize', updateHighlightPosition);

    showStep(0);
  }

  function showStep(index) {
    currentStep = index;
    const step = steps[index];
    const tooltip = document.getElementById('tutorial-tooltip');
    if (!tooltip) return;

    // Remove previous highlight clone
    const oldClone = document.getElementById('tutorial-highlight-clone');
    if (oldClone) oldClone.remove();

    // Highlight target element using a clone overlay on body
    let targetEl = null;
    currentTargetEl = null;
    if (step.target) {
      targetEl = document.querySelector(step.target);
      if (targetEl) {
        currentTargetEl = targetEl;
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Create a fixed-position highlight overlay matching the target's rect
        const clone = document.createElement('div');
        clone.id = 'tutorial-highlight-clone';
        clone.className = 'tutorial-highlight-clone';
        const rect = targetEl.getBoundingClientRect();
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        document.body.appendChild(clone);
      }
    }

    // Build tooltip content using DOM APIs
    tooltip.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'tutorial-tooltip-header';
    const icon = document.createElement('span');
    icon.className = 'tutorial-tooltip-icon';
    icon.innerHTML = step.icon;
    const title = document.createElement('h3');
    title.className = 'tutorial-tooltip-title';
    title.textContent = step.title;
    header.appendChild(icon);
    header.appendChild(title);

    const text = document.createElement('p');
    text.className = 'tutorial-tooltip-text';
    text.textContent = step.text;

    const footer = document.createElement('div');
    footer.className = 'tutorial-tooltip-footer';

    const progress = document.createElement('span');
    progress.className = 'tutorial-tooltip-progress';
    progress.textContent = (index + 1) + ' of ' + steps.length;

    const actions = document.createElement('div');
    actions.className = 'tutorial-tooltip-actions';

    if (index > 0) {
      const backBtn = document.createElement('button');
      backBtn.className = 'btn btn-outline';
      backBtn.textContent = 'Back';
      backBtn.style.cssText = 'font-size:0.8rem;padding:0.3rem 0.7rem;';
      backBtn.addEventListener('click', () => showStep(index - 1));
      actions.appendChild(backBtn);
    }

    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn btn-outline';
    skipBtn.textContent = 'Skip';
    skipBtn.style.cssText = 'font-size:0.8rem;padding:0.3rem 0.7rem;';
    skipBtn.addEventListener('click', dismiss);
    actions.appendChild(skipBtn);

    if (index < steps.length - 1) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-red';
      nextBtn.textContent = 'Next';
      nextBtn.style.cssText = 'font-size:0.8rem;padding:0.3rem 0.7rem;';
      nextBtn.addEventListener('click', () => showStep(index + 1));
      actions.appendChild(nextBtn);
    } else {
      const doneBtn = document.createElement('button');
      doneBtn.className = 'btn btn-red';
      doneBtn.textContent = "Let's go!";
      doneBtn.style.cssText = 'font-size:0.8rem;padding:0.3rem 0.7rem;';
      doneBtn.addEventListener('click', dismiss);
      actions.appendChild(doneBtn);
    }

    footer.appendChild(progress);
    footer.appendChild(actions);

    tooltip.appendChild(header);
    tooltip.appendChild(text);
    tooltip.appendChild(footer);

    // Position tooltip relative to target
    positionTooltip(tooltip, targetEl);
  }

  function positionTooltip(tooltip, targetEl) {
    if (!targetEl) {
      // Center on screen
      tooltip.style.left = '50%';
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    tooltip.style.transform = '';
    const rect = targetEl.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 12;

    let top = rect.bottom + margin;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // Ensure tooltip stays in viewport
    if (top + tooltipRect.height > window.innerHeight - margin) {
      top = rect.top - tooltipRect.height - margin;
    }
    if (left < margin) left = margin;
    if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function dismiss() {
    try {
      localStorage.setItem(TUTORIAL_KEY, TUTORIAL_VERSION);
    } catch (e) {
      // localStorage unavailable
    }
    window.removeEventListener('scroll', updateHighlightPosition, true);
    window.removeEventListener('resize', updateHighlightPosition);
    currentTargetEl = null;
    const overlay = document.getElementById('tutorial-overlay');
    const tooltip = document.getElementById('tutorial-tooltip');
    const style = document.getElementById('tutorial-styles');
    const highlightClone = document.getElementById('tutorial-highlight-clone');
    if (overlay) overlay.remove();
    if (tooltip) tooltip.remove();
    if (style) style.remove();
    if (highlightClone) highlightClone.remove();
    // Ensure no blur remains on body or main content
    document.body.classList.remove('tutorial-active');
    document.body.style.removeProperty('filter');
    document.body.style.removeProperty('backdrop-filter');
    document.body.style.removeProperty('-webkit-backdrop-filter');
    var mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.style.removeProperty('filter');
      mainEl.style.removeProperty('backdrop-filter');
      mainEl.style.removeProperty('-webkit-backdrop-filter');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTutorialUI);
  } else {
    // Small delay to let page elements render
    setTimeout(createTutorialUI, 500);
  }
})();
