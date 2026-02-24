// js/dropdown.js
// ============================================
// CUSTOM DROPDOWN COMPONENT
// Branded, keyboard accessible, mobile optimized
// Replaces browser default <select> elements
// Fixes: viewport-aware positioning (escapes overflow containers)
// ============================================

(function() {
  'use strict';

  /**
   * Detect if an element is inside a scroll/overflow clipping container
   */
  function isInsideScrollContainer(el) {
    var parent = el.parentElement;
    while (parent && parent !== document.documentElement) {
      var cs = window.getComputedStyle(parent);
      var ov = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY;
      if (/auto|scroll/.test(ov)) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  /**
   * Initialize a custom dropdown from a <select> element
   * @param {HTMLSelectElement} selectEl - The native select to enhance
   * @returns {Object} Dropdown controller with getValue/setValue methods
   */
  function createDropdown(selectEl) {
    if (!selectEl || selectEl.dataset.eaDropdown === 'true') return null;
    selectEl.dataset.eaDropdown = 'true';
    ensureGlobalListener();

    var options = Array.from(selectEl.options);
    var wrapper = document.createElement('div');
    wrapper.className = 'ea-dropdown';

    // Build trigger button
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ea-dropdown-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var textSpan = document.createElement('span');
    textSpan.className = 'ea-dd-text';
    var arrow = document.createElement('span');
    arrow.className = 'ea-dd-arrow';

    trigger.appendChild(textSpan);
    trigger.appendChild(arrow);

    // Build menu
    var menu = document.createElement('div');
    menu.className = 'ea-dropdown-menu';
    menu.setAttribute('role', 'listbox');

    var highlightedIndex = -1;

    function buildOptions() {
      menu.innerHTML = '';
      options = Array.from(selectEl.options);
      options.forEach(function(opt, idx) {
        var item = document.createElement('div');
        item.className = 'ea-dropdown-option';
        item.setAttribute('role', 'option');
        item.dataset.value = opt.value;
        item.textContent = opt.textContent;

        if (opt.disabled) item.classList.add('disabled');
        if (opt.selected) item.classList.add('selected');

        item.addEventListener('click', function(e) {
          e.stopPropagation();
          if (opt.disabled) return;
          selectValue(opt.value);
          closeMenu();
        });

        menu.appendChild(item);
      });
    }

    function selectValue(val) {
      selectEl.value = val;
      // Trigger change event on the original select
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      updateDisplay();
    }

    function updateDisplay() {
      var selected = selectEl.options[selectEl.selectedIndex];
      if (selected && selected.value) {
        textSpan.textContent = selected.textContent;
        textSpan.classList.remove('ea-dd-placeholder');
      } else {
        textSpan.textContent = options[0] ? options[0].textContent : 'Select...';
        textSpan.classList.add('ea-dd-placeholder');
      }
      // Update selected styling
      var items = menu.querySelectorAll('.ea-dropdown-option');
      items.forEach(function(item) {
        item.classList.toggle('selected', item.dataset.value === selectEl.value);
      });
    }

    function positionMenuFixed() {
      var rect = trigger.getBoundingClientRect();
      var menuMaxHeight = 240;
      var spaceBelow = window.innerHeight - rect.bottom - 8;
      var spaceAbove = rect.top - 8;

      menu.classList.add('ea-menu-fixed');
      menu.style.left = rect.left + 'px';
      menu.style.width = rect.width + 'px';
      menu.style.right = 'auto';

      if (spaceBelow >= Math.min(menuMaxHeight, 120) || spaceBelow >= spaceAbove) {
        menu.style.top = (rect.bottom + 4) + 'px';
        menu.style.bottom = 'auto';
      } else {
        // Open upward
        menu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
        menu.style.top = 'auto';
      }
    }

    function resetMenuPosition() {
      menu.classList.remove('ea-menu-fixed');
      menu.style.left = '';
      menu.style.top = '';
      menu.style.bottom = '';
      menu.style.width = '';
      menu.style.right = '';
    }

    function openMenu() {
      // Close any other open dropdowns first, then open this one
      closeAllDropdowns();
      wrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      highlightedIndex = -1;
      // Use fixed positioning to escape overflow/scroll containers
      if (isInsideScrollContainer(wrapper)) {
        positionMenuFixed();
      }
    }

    function closeMenu() {
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      highlightedIndex = -1;
      clearHighlight();
      resetMenuPosition();
    }

    function clearHighlight() {
      menu.querySelectorAll('.ea-dropdown-option').forEach(function(el) {
        el.classList.remove('highlighted');
      });
    }

    function highlightItem(idx) {
      var items = menu.querySelectorAll('.ea-dropdown-option:not(.disabled)');
      if (items.length === 0) return;
      highlightedIndex = Math.max(0, Math.min(idx, items.length - 1));
      clearHighlight();
      items[highlightedIndex].classList.add('highlighted');
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }

    // Prevent touchstart on the wrapper from bubbling to the document-level
    // click handler, which would close the dropdown before the tap registers.
    wrapper.addEventListener('touchstart', function(e) {
      e.stopPropagation();
    }, { passive: true });

    // Toggle on click
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (wrapper.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Keyboard navigation
    trigger.addEventListener('keydown', function(e) {
      var items = menu.querySelectorAll('.ea-dropdown-option:not(.disabled)');
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (wrapper.classList.contains('open')) {
          if (highlightedIndex >= 0 && items[highlightedIndex]) {
            selectValue(items[highlightedIndex].dataset.value);
          }
          closeMenu();
        } else {
          openMenu();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!wrapper.classList.contains('open')) openMenu();
        highlightItem(highlightedIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!wrapper.classList.contains('open')) openMenu();
        highlightItem(highlightedIndex - 1);
      } else if (e.key === 'Escape') {
        closeMenu();
        trigger.focus();
      } else if (e.key === 'Tab') {
        closeMenu();
      }
    });

    // Insert DOM
    selectEl.style.display = 'none';
    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    wrapper.appendChild(selectEl);

    // Build and display
    buildOptions();
    updateDisplay();

    // Observe changes to the select
    var observer = new MutationObserver(function() {
      buildOptions();
      updateDisplay();
    });
    observer.observe(selectEl, { childList: true, subtree: true });

    return {
      getValue: function() { return selectEl.value; },
      setValue: function(val) { selectValue(val); },
      refresh: function() { buildOptions(); updateDisplay(); }
    };
  }

  // Single delegated document click listener for all dropdowns
  var globalListenerAttached = false;

  /**
   * Close every open dropdown immediately.
   * Useful for navigation, modals, and programmatic triggers.
   */
  function closeAllDropdowns() {
    document.querySelectorAll('.ea-dropdown.open').forEach(function(dd) {
      dd.classList.remove('open');
      var trig = dd.querySelector('.ea-dropdown-trigger');
      if (trig) trig.setAttribute('aria-expanded', 'false');
      var m = dd.querySelector('.ea-dropdown-menu');
      if (m) {
        m.classList.remove('ea-menu-fixed');
        m.style.left = '';
        m.style.top = '';
        m.style.bottom = '';
        m.style.width = '';
        m.style.right = '';
      }
    });
  }

  function ensureGlobalListener() {
    if (globalListenerAttached) return;
    globalListenerAttached = true;
    document.addEventListener('click', function(e) {
      // Close only the dropdowns that don't contain the clicked element
      document.querySelectorAll('.ea-dropdown.open').forEach(function(dd) {
        if (!dd.contains(e.target)) {
          dd.classList.remove('open');
          var trig = dd.querySelector('.ea-dropdown-trigger');
          if (trig) trig.setAttribute('aria-expanded', 'false');
          var m = dd.querySelector('.ea-dropdown-menu');
          if (m) {
            m.classList.remove('ea-menu-fixed');
            m.style.left = '';
            m.style.top = '';
            m.style.bottom = '';
            m.style.width = '';
            m.style.right = '';
          }
        }
      });
    });
    // Close all dropdowns on scroll — but NOT when scrolling inside a dropdown menu
    // (the menu itself is scrollable for long option lists)
    document.addEventListener('scroll', function(e) {
      if (e.target && typeof e.target.closest === 'function' &&
          e.target.closest('.ea-dropdown-menu')) {
        return;
      }
      closeAllDropdowns();
    }, { passive: true, capture: true });
  }

  /**
   * Auto-initialize all select elements with data-ea-dropdown attribute
   */
  function initAllDropdowns() {
    document.querySelectorAll('select[data-ea-dropdown]').forEach(function(sel) {
      createDropdown(sel);
    });
  }

  // Expose globally
  window.EaDropdown = {
    create: createDropdown,
    initAll: initAllDropdowns,
    closeAll: closeAllDropdowns
  };

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initAllDropdowns);
})();
