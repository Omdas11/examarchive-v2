// js/levelup.js
// ============================================
// LEVEL UP ANIMATION
// Shows modal + confetti when XP increases and level changes
// ============================================

(function () {
  const AUTO_CLOSE_MS = 5000;
  const FADE_DURATION_MS = 300;
  const CONFETTI_COUNT = 40;

  /**
   * Show level up animation
   * @param {number} newLevel - The new level achieved
   */
  function showLevelUp(newLevel) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'levelup-modal';
    modal.innerHTML = `
      <div class="levelup-content">
        <div class="levelup-title">LEVEL UP!</div>
        <div class="levelup-subtitle">You reached a new level</div>
        <div class="levelup-level">${newLevel}</div>
        <button class="levelup-close">Continue</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Trigger show animation
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });

    // Spawn confetti
    spawnConfetti();

    // Close handlers
    const closeBtn = modal.querySelector('.levelup-close');
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), FADE_DURATION_MS);
    });

    // Auto-close
    setTimeout(() => {
      if (modal.parentNode) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), FADE_DURATION_MS);
      }
    }, AUTO_CLOSE_MS);
  }

  /**
   * Spawn confetti particles
   */
  function spawnConfetti() {
    const colors = ['#FFD700', '#FF6F00', '#E040FB', '#00E676', '#2196F3', '#FF1744'];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = Math.random() * 100 + 'vw';
      particle.style.top = '-10px';
      particle.style.animationDelay = Math.random() * 0.5 + 's';
      particle.style.animationDuration = (1.5 + Math.random()) + 's';
      particle.style.width = (6 + Math.random() * 6) + 'px';
      particle.style.height = (6 + Math.random() * 6) + 'px';

      document.body.appendChild(particle);

      // Clean up after animation
      setTimeout(() => particle.remove(), 3000);
    }
  }

  // Expose to window
  window.LevelUp = { show: showLevelUp };
})();
