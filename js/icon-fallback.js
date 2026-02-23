// js/icon-fallback.js
// ============================================
// ICON FALLBACK SYSTEM
// Ensures no empty icon areas across the site.
// If an <img> fails to load, replace with default SVG.
// ============================================

(function() {
  'use strict';

  var DEFAULT_ICON = '/assets/icons/system/default.svg';

  // For static images: add onerror handler
  function applyFallback(img) {
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = 'true';
    img.addEventListener('error', function() {
      if (this.src !== DEFAULT_ICON && !this.src.endsWith('default.svg')) {
        this.src = DEFAULT_ICON;
        this.alt = this.alt || 'Icon';
      }
    });
  }

  // Apply to all existing images with icon-related classes or in icon containers
  function initFallbacks() {
    var selectors = [
      'img[src*="/assets/icons/"]',
      'img[src*="/assets/logos/"]',
      '.icon-img',
      '.brand-logo img',
      '.footer-logo img'
    ];
    var imgs = document.querySelectorAll(selectors.join(','));
    imgs.forEach(applyFallback);
  }

  // Observe DOM for dynamically added images
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'IMG') applyFallback(node);
            var imgs = node.querySelectorAll ? node.querySelectorAll('img') : [];
            imgs.forEach(applyFallback);
          }
        });
      });
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // Init on ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFallbacks);
  } else {
    initFallbacks();
  }

  // Expose globally
  window.IconFallback = {
    apply: applyFallback,
    init: initFallbacks,
    DEFAULT_ICON: DEFAULT_ICON
  };
})();
