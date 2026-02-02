// js/modules/debug.module.js
// ============================================
// DEBUG MODULE - Phase 9.2.3
// Combined debug logger and panel in a single ES module
// This is the ONLY place that uses ES module imports for debug
// ============================================

import { supabase } from "../supabase.js";

// Debug force enable flag
const DEBUG_FORCE_ENABLE = true;

// Debug levels
const DebugLevel = {
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'error'
};

// Debug modules
const DebugModule = {
  AUTH: 'auth',
  UPLOAD: 'upload',
  ADMIN: 'admin',
  STORAGE: 'storage',
  ROLE: 'role',
  SETTINGS: 'settings',
  SYSTEM: 'system'
};

/**
 * Debug Logger Class
 */
class DebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.enabled = false;
    this.listeners = [];
    this.panelVisible = false;
  }

  async init() {
    await this._checkDebugAccess();
  }

  async _checkDebugAccess() {
    // Force enable for debugging
    if (DEBUG_FORCE_ENABLE) {
      this.enabled = true;
      this.panelVisible = localStorage.getItem('debug-panel-enabled') !== 'false';
      console.log('[DEBUG-LOGGER] Force enabled for debugging');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        this.enabled = false;
        return;
      }

      // Check role via window.Auth if available
      const hasAccess = window.Auth && await window.Auth.isAdmin();
      this.enabled = hasAccess;
      
      if (hasAccess) {
        this.panelVisible = localStorage.getItem('debug-panel-enabled') === 'true';
      }
    } catch (err) {
      console.error('[DEBUG-LOGGER] Error checking access:', err);
      this.enabled = false;
    }
  }

  log(module, level, message, data = null) {
    if (!this.enabled && !this._isSystemMessage(module, level)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      module,
      level,
      message,
      data
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this._logToConsole(entry);
    this._notifyListeners(entry);
  }

  _isSystemMessage(module, level) {
    return level === DebugLevel.ERROR || module === DebugModule.SYSTEM;
  }

  _logToConsole(entry) {
    const icon = this._getIcon(entry.level);
    const color = this._getColor(entry.level);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    console.log(
      `%c${icon} [${entry.module.toUpperCase()}][${entry.level.toUpperCase()}] ${timestamp}`,
      `color: ${color}; font-weight: bold;`,
      entry.message,
      entry.data || ''
    );
  }

  _getIcon(level) {
    switch (level) {
      case DebugLevel.INFO: return 'ℹ️';
      case DebugLevel.WARN: return '⚠️';
      case DebugLevel.ERROR: return '❌';
      default: return '•';
    }
  }

  _getColor(level) {
    switch (level) {
      case DebugLevel.INFO: return '#2196F3';
      case DebugLevel.WARN: return '#FFA726';
      case DebugLevel.ERROR: return '#f44336';
      default: return '#666';
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  _notifyListeners(entry) {
    this.listeners.forEach(callback => {
      try {
        callback(entry);
      } catch (err) {
        console.error('[DEBUG-LOGGER] Error in listener:', err);
      }
    });
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this._notifyListeners({ type: 'clear' });
    this.log(DebugModule.SYSTEM, DebugLevel.INFO, 'Debug logs cleared');
  }

  getLogsByModule(module) {
    return this.logs.filter(log => log.module === module);
  }

  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  enablePanel() {
    this.panelVisible = true;
    localStorage.setItem('debug-panel-enabled', 'true');
    this.log(DebugModule.SYSTEM, DebugLevel.INFO, 'Debug panel enabled');
  }

  disablePanel() {
    this.panelVisible = false;
    localStorage.setItem('debug-panel-enabled', 'false');
    this.log(DebugModule.SYSTEM, DebugLevel.INFO, 'Debug panel disabled');
  }

  isPanelVisible() {
    return this.panelVisible && this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

/**
 * Debug Panel Class
 */
class DebugPanel {
  constructor(logger) {
    this.logger = logger;
    this.panel = null;
    this.logContainer = null;
    this.isCollapsed = true;
  }

  init() {
    // Force enable if DEBUG_FORCE_ENABLE is true
    if (DEBUG_FORCE_ENABLE) {
      console.log('[DEBUG-PANEL] Force enabled - initializing');
      this.createPanel();
      this.attachListeners();
      this.logger.addListener((entry) => this.onLogUpdate(entry));
      this.show();
      return;
    }

    if (!this.logger.isEnabled()) {
      return;
    }

    this.createPanel();
    this.attachListeners();
    this.logger.addListener((entry) => this.onLogUpdate(entry));

    if (this.logger.isPanelVisible()) {
      this.show();
    }
  }

  createPanel() {
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
          <button class="debug-panel-btn" id="debug-clear-btn" title="Clear logs">🗑️</button>
          <button class="debug-panel-btn" id="debug-toggle-btn" title="Expand/Collapse">▼</button>
          <button class="debug-panel-btn" id="debug-close-btn" title="Close panel">✕</button>
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

    document.body.appendChild(this.panel);
    this.logContainer = document.getElementById('debug-panel-logs');
    this.injectStyles();
  }

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
      .debug-panel.visible { display: flex; }
      .debug-panel.collapsed .debug-panel-body { display: none; }
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
      .debug-panel-icon { font-size: 16px; }
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
      .debug-filter-btn:hover { background: var(--bg-soft, #f5f5f5); }
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
      .debug-log-entry.level-warning { border-left-color: #FFA726; }
      .debug-log-entry.level-error { border-left-color: #f44336; }
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
      @media (max-width: 768px) {
        .debug-panel {
          max-width: 100%;
          max-height: 300px;
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  attachListeners() {
    const header = this.panel.querySelector('.debug-panel-header');
    header.addEventListener('click', (e) => {
      if (e.target.closest('.debug-panel-btn')) return;
      this.toggleCollapse();
    });

    document.getElementById('debug-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    document.getElementById('debug-clear-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.logger.clear();
      this.render();
    });

    document.getElementById('debug-toggle-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCollapse();
    });

    const filterBtns = this.panel.querySelectorAll('.debug-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const level = btn.dataset.level;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.render(level);
      });
    });
  }

  onLogUpdate(entry) {
    if (entry.type === 'clear') {
      this.render();
      return;
    }

    const badge = document.getElementById('debug-log-count');
    if (badge) {
      badge.textContent = this.logger.getLogs().length;
    }

    if (!this.isCollapsed) {
      const activeFilter = this.panel.querySelector('.debug-filter-btn.active');
      const level = activeFilter ? activeFilter.dataset.level : 'all';
      this.render(level);
    }
  }

  render(filterLevel = 'all') {
    if (!this.logContainer) return;

    let logs = this.logger.getLogs();

    if (filterLevel !== 'all') {
      logs = logs.filter(log => log.level === filterLevel);
    }

    const badge = document.getElementById('debug-log-count');
    if (badge) {
      badge.textContent = this.logger.getLogs().length;
    }

    if (logs.length === 0) {
      this.logContainer.innerHTML = '<div class="debug-log-empty">No debug logs to display</div>';
      return;
    }

    this.logContainer.innerHTML = logs
      .slice(-50)
      .reverse()
      .map(log => this.renderLogEntry(log))
      .join('');

    this.logContainer.scrollTop = 0;
  }

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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  show() {
    if (!this.panel) return;
    this.panel.classList.add('visible');
    this.render();
    this.logger.enablePanel();
  }

  hide() {
    if (!this.panel) return;
    this.panel.classList.remove('visible');
    this.logger.disablePanel();
  }

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

  toggle() {
    if (this.panel.classList.contains('visible')) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Create instances
const debugLogger = new DebugLogger();
const debugPanel = new DebugPanel(debugLogger);

/**
 * Initialize debug system
 */
export async function initDebug() {
  console.log('[DEBUG-MODULE] Initializing debug system...');
  
  await debugLogger.init();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => debugPanel.init());
  } else {
    debugPanel.init();
  }
  
  // Expose to window for classic scripts
  window.Debug = {
    log: (module, level, message, data) => debugLogger.log(module, level, message, data),
    logInfo: (module, message, data) => debugLogger.log(module, DebugLevel.INFO, message, data),
    logWarn: (module, message, data) => debugLogger.log(module, DebugLevel.WARN, message, data),
    logError: (module, message, data) => debugLogger.log(module, DebugLevel.ERROR, message, data),
    clear: () => debugLogger.clear(),
    getLogs: () => debugLogger.getLogs(),
    showPanel: () => debugPanel.show(),
    hidePanel: () => debugPanel.hide(),
    togglePanel: () => debugPanel.toggle(),
    DebugLevel: DebugLevel,
    DebugModule: DebugModule
  };
  
  console.log('[DEBUG-MODULE] Debug system initialized');
}
