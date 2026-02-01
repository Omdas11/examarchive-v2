// js/debug/panel.js
// ============================================
// DEBUG PANEL UI - Phase 9.2
// Mobile-friendly debug panel for admin/reviewer
// ============================================

import { debugLogger, DebugLevel, DebugModule } from './logger.js';

class DebugPanel {
  constructor() {
    this.panel = null;
    this.logContainer = null;
    this.isCollapsed = true;
    
    // Initialize panel on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize debug panel
   */
  init() {
    if (!debugLogger.isEnabled()) {
      return;
    }

    // Create panel HTML
    this.createPanel();

    // Attach event listeners
    this.attachListeners();

    // Subscribe to log updates
    debugLogger.addListener((entry) => this.onLogUpdate(entry));

    // Show panel if enabled
    if (debugLogger.isPanelVisible()) {
      this.show();
    }
  }

  /**
   * Create panel DOM elements
   */
  createPanel() {
    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'debug-panel';
    this.panel.className = 'debug-panel collapsed';
    this.panel.innerHTML = `
      <div class="debug-panel-header">
        <div class="debug-panel-title">
          <span class="debug-panel-icon">🐛</span>
          <span class="debug-panel-text">Debug Panel</span>
          <span class="debug-panel-badge" id="debug-log-count">0</span>
        </div>
        <div class="debug-panel-actions">
          <button class="debug-panel-btn" id="debug-clear-btn" title="Clear logs">
            🗑️
          </button>
          <button class="debug-panel-btn" id="debug-toggle-btn" title="Expand/Collapse">
            ▼
          </button>
          <button class="debug-panel-btn" id="debug-close-btn" title="Close panel">
            ✕
          </button>
        </div>
      </div>
      <div class="debug-panel-body">
        <div class="debug-panel-filters">
          <button class="debug-filter-btn active" data-level="all">All</button>
          <button class="debug-filter-btn" data-level="info">Info</button>
          <button class="debug-filter-btn" data-level="warning">Warnings</button>
          <button class="debug-filter-btn" data-level="error">Errors</button>
        </div>
        <div class="debug-panel-logs" id="debug-panel-logs"></div>
      </div>
    `;

    // Add to body
    document.body.appendChild(this.panel);
    this.logContainer = document.getElementById('debug-panel-logs');

    // Add styles
    this.injectStyles();
  }

  /**
   * Inject CSS styles for debug panel
   */
  injectStyles() {
    if (document.getElementById('debug-panel-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'debug-panel-styles';
    style.textContent = `
      .debug-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 100%;
        max-width: 500px;
        max-height: 400px;
        background: var(--surface, #fff);
        border: 1px solid var(--border, #e0e0e0);
        border-bottom: none;
        border-right: none;
        border-radius: 8px 0 0 0;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: none;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
      }

      .debug-panel.visible {
        display: flex;
      }

      .debug-panel.collapsed .debug-panel-body {
        display: none;
      }

      .debug-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--bg-soft, #f5f5f5);
        border-bottom: 1px solid var(--border, #e0e0e0);
        cursor: pointer;
        user-select: none;
      }

      .debug-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: var(--text, #333);
      }

      .debug-panel-icon {
        font-size: 16px;
      }

      .debug-panel-badge {
        display: inline-block;
        padding: 2px 6px;
        background: #2196F3;
        color: white;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 500;
        min-width: 20px;
        text-align: center;
      }

      .debug-panel-actions {
        display: flex;
        gap: 4px;
      }

      .debug-panel-btn {
        background: transparent;
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        opacity: 0.7;
        transition: all 0.2s;
      }

      .debug-panel-btn:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.05);
      }

      .debug-panel-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      }

      .debug-panel-filters {
        display: flex;
        gap: 4px;
        padding: 8px 12px;
        background: var(--bg, #fff);
        border-bottom: 1px solid var(--border, #e0e0e0);
        overflow-x: auto;
      }

      .debug-filter-btn {
        padding: 4px 12px;
        background: transparent;
        border: 1px solid var(--border, #e0e0e0);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
        transition: all 0.2s;
      }

      .debug-filter-btn:hover {
        background: var(--bg-soft, #f5f5f5);
      }

      .debug-filter-btn.active {
        background: #2196F3;
        color: white;
        border-color: #2196F3;
      }

      .debug-panel-logs {
        flex: 1;
        overflow-y: auto;
        padding: 8px 12px;
        background: var(--bg, #fff);
      }

      .debug-log-entry {
        padding: 6px 8px;
        margin-bottom: 4px;
        border-left: 3px solid #2196F3;
        background: var(--bg-soft, #f5f5f5);
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
      }

      .debug-log-entry.level-warning {
        border-left-color: #FFA726;
      }

      .debug-log-entry.level-error {
        border-left-color: #f44336;
      }

      .debug-log-entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        gap: 8px;
      }

      .debug-log-entry-module {
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text, #333);
        font-size: 11px;
      }

      .debug-log-entry-time {
        color: var(--text-muted, #666);
        font-size: 11px;
      }

      .debug-log-entry-message {
        color: var(--text, #333);
        word-wrap: break-word;
      }

      .debug-log-empty {
        padding: 20px;
        text-align: center;
        color: var(--text-muted, #666);
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .debug-panel {
          max-width: 100%;
          max-height: 300px;
          border-radius: 0;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .debug-panel, .debug-panel-btn, .debug-filter-btn {
          transition: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    // Header click to toggle collapse
    const header = this.panel.querySelector('.debug-panel-header');
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking action buttons
      if (e.target.closest('.debug-panel-btn')) {
        return;
      }
      this.toggleCollapse();
    });

    // Close button
    const closeBtn = document.getElementById('debug-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    // Clear button
    const clearBtn = document.getElementById('debug-clear-btn');
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      debugLogger.clear();
      this.render();
    });

    // Toggle button
    const toggleBtn = document.getElementById('debug-toggle-btn');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCollapse();
    });

    // Filter buttons
    const filterBtns = this.panel.querySelectorAll('.debug-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const level = btn.dataset.level;
        
        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Render filtered logs
        this.render(level);
      });
    });
  }

  /**
   * Handle log update
   */
  onLogUpdate(entry) {
    if (entry.type === 'clear') {
      this.render();
      return;
    }

    // Update log count badge
    const badge = document.getElementById('debug-log-count');
    if (badge) {
      badge.textContent = debugLogger.getLogs().length;
    }

    // Re-render if panel is visible
    if (!this.isCollapsed) {
      const activeFilter = this.panel.querySelector('.debug-filter-btn.active');
      const level = activeFilter ? activeFilter.dataset.level : 'all';
      this.render(level);
    }
  }

  /**
   * Render logs
   */
  render(filterLevel = 'all') {
    if (!this.logContainer) return;

    let logs = debugLogger.getLogs();

    // Apply filter
    if (filterLevel !== 'all') {
      logs = logs.filter(log => log.level === filterLevel);
    }

    // Update count badge
    const badge = document.getElementById('debug-log-count');
    if (badge) {
      badge.textContent = debugLogger.getLogs().length;
    }

    // Render logs
    if (logs.length === 0) {
      this.logContainer.innerHTML = `
        <div class="debug-log-empty">
          No debug logs to display
        </div>
      `;
      return;
    }

    this.logContainer.innerHTML = logs
      .slice(-50) // Show last 50 logs
      .reverse()
      .map(log => this.renderLogEntry(log))
      .join('');

    // Scroll to top (newest logs)
    this.logContainer.scrollTop = 0;
  }

  /**
   * Render a single log entry
   */
  renderLogEntry(log) {
    const time = new Date(log.timestamp).toLocaleTimeString();
    return `
      <div class="debug-log-entry level-${log.level}">
        <div class="debug-log-entry-header">
          <span class="debug-log-entry-module">[${log.module}]</span>
          <span class="debug-log-entry-time">${time}</span>
        </div>
        <div class="debug-log-entry-message">${this.escapeHtml(log.message)}</div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show panel
   */
  show() {
    if (!this.panel) return;
    this.panel.classList.add('visible');
    this.render();
    debugLogger.enablePanel();
  }

  /**
   * Hide panel
   */
  hide() {
    if (!this.panel) return;
    this.panel.classList.remove('visible');
    debugLogger.disablePanel();
  }

  /**
   * Toggle collapse state
   */
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.panel.classList.toggle('collapsed', this.isCollapsed);
    
    const toggleBtn = document.getElementById('debug-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = this.isCollapsed ? '▼' : '▲';
    }

    if (!this.isCollapsed) {
      this.render();
    }
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this.panel.classList.contains('visible')) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Create singleton instance
export const debugPanel = new DebugPanel();

// Export for external use
export function showDebugPanel() {
  debugPanel.show();
}

export function hideDebugPanel() {
  debugPanel.hide();
}

export function toggleDebugPanel() {
  debugPanel.toggle();
}
