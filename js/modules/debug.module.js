// js/modules/debug.module.js
// ============================================
// DEBUG MODULE - Phase 1.0
// Redesigned mobile-friendly debug panel with
// slide-up UI, tabs, human-readable messages
// ============================================

import { supabase } from "../supabase.js";

// Debug force enable flag
const DEBUG_FORCE_ENABLE = true;

// Debug deduplication window (ms)
const DEBUG_DEDUPE_WINDOW_MS = 800;

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
 * Make messages human-readable
 */
function friendlyMessage(module, level, message) {
  // Already human-readable (multi-line with Reason/Check)
  if (message.includes('\nReason:') || message.includes('\nCheck:')) {
    return message;
  }
  
  // Add clear separation markers for storage vs submission (avoid double-prefix)
  if (!message.startsWith('[STORAGE]') && (message.includes('[STORAGE]') || message.includes('📤 Storage'))) {
    return `[STORAGE] ${message}`;
  }
  if (!message.startsWith('[SUBMISSION]') && (message.includes('[SUBMISSION]') || message.includes('📝 Submission'))) {
    return `[SUBMISSION] ${message}`;
  }
  
  // Storage errors
  if (module === 'storage' && level === 'error') {
    if (message.includes('permission') || message.includes('denied')) {
      return `[STORAGE] Storage Access Denied\nReason: Permission denied in storage bucket.\nCheck: Is the user authenticated?`;
    }
    if (message.includes('not found')) {
      return `[STORAGE] Storage Bucket Not Found\nReason: The requested bucket does not exist.\nCheck: Contact the administrator.`;
    }
  }
  
  // Auth errors
  if (module === 'auth' && level === 'error') {
    if (message.includes('JWT') || message.includes('expired')) {
      return `Session Expired\nReason: Your authentication token has expired.\nCheck: Sign in again.`;
    }
  }
  return message;
}

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
    this.lastLogMessage = null;
    this.lastLogTime = 0;
    this.dedupeWindowMs = DEBUG_DEDUPE_WINDOW_MS; // Configurable deduplication window
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

    // Handle case when supabase is not available
    if (!supabase) {
      console.warn('[DEBUG-LOGGER] Supabase not available - debug disabled');
      this.enabled = false;
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

    // Deduplicate identical messages within 800ms window
    const now = Date.now();
    const messageKey = `${module}:${level}:${message}`;
    
    if (this.lastLogMessage === messageKey && (now - this.lastLogTime) < this.dedupeWindowMs) {
      // Ignore duplicate message
      return;
    }
    
    this.lastLogMessage = messageKey;
    this.lastLogTime = now;

    const entry = {
      timestamp: new Date().toISOString(),
      module,
      level,
      message: friendlyMessage(module, level, message),
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
 * Debug Panel Class — Mobile-friendly slide-up panel
 */
class DebugPanel {
  constructor(logger) {
    this.logger = logger;
    this.panel = null;
    this.logContainer = null;
    this.isCollapsed = true;
    this.activeTab = 'all';
  }

  /**
   * Print auth status to debug panel
   */
  async printAuthStatus() {
    try {
      const supabase = window.supabase || (await window.waitForSupabase?.());
      if (!supabase) {
        this.logger.log(DebugModule.AUTH, DebugLevel.WARN, '[AUTH] No active session.');
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.logger.log(DebugModule.AUTH, DebugLevel.WARN, '[AUTH] No active session.');
        return;
      }

      // Get role level if available
      let roleLevel = 'unknown';
      try {
        const { data: roleLevelData } = await supabase.rpc('get_current_user_role_level');
        if (roleLevelData !== null) {
          roleLevel = roleLevelData;
        }
      } catch (err) {
        console.error('[DEBUG-PANEL] Error getting role level:', err);
      }

      this.logger.log(DebugModule.AUTH, DebugLevel.INFO, `[AUTH] Session Status: Logged In\n[AUTH] User ID: ${user.id}\n[AUTH] Role Level: ${roleLevel}`);
    } catch (err) {
      console.error('[DEBUG-PANEL] Error printing auth status:', err);
      this.logger.log(DebugModule.AUTH, DebugLevel.ERROR, `[AUTH] Error checking session: ${err.message}`);
    }
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
          <span class="debug-panel-text">Debug</span>
          <span class="debug-panel-badge" id="debug-log-count">0</span>
        </div>
        <div class="debug-panel-actions">
          <button class="debug-panel-btn" id="debug-clear-btn" title="Clear logs">🗑️</button>
          <button class="debug-panel-btn" id="debug-toggle-btn" title="Expand/Collapse">▲</button>
          <button class="debug-panel-btn" id="debug-close-btn" title="Close panel">✕</button>
        </div>
      </div>
      <div class="debug-panel-body">
        <div class="debug-panel-tabs">
          <button class="debug-tab-btn active" data-tab="all">All</button>
          <button class="debug-tab-btn" data-tab="info">Info</button>
          <button class="debug-tab-btn" data-tab="warning">Warnings</button>
          <button class="debug-tab-btn" data-tab="error">Errors</button>
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
        left: 0;
        right: 0;
        max-height: 60vh;
        background: var(--surface, #fff);
        border-top: 1px solid var(--border, #e0e0e0);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
        z-index: 9999;
        display: none;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        border-radius: 12px 12px 0 0;
        transition: transform 0.3s ease;
      }
      .debug-panel.visible { display: flex; }
      .debug-panel.collapsed .debug-panel-body { display: none; }
      .debug-panel.collapsed { max-height: auto; }
      .debug-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        background: var(--bg-soft, #f5f5f5);
        border-bottom: 1px solid var(--border, #e0e0e0);
        cursor: pointer;
        user-select: none;
        border-radius: 12px 12px 0 0;
        min-height: 44px;
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
        padding: 2px 8px;
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
        padding: 6px 10px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 14px;
        opacity: 0.7;
        transition: all 0.2s;
        min-width: 36px;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
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
      .debug-panel-tabs {
        display: flex;
        gap: 0;
        background: var(--bg, #fff);
        border-bottom: 1px solid var(--border, #e0e0e0);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .debug-tab-btn {
        flex: 1;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        transition: all 0.2s;
        color: var(--text-muted, #666);
        min-height: 40px;
      }
      .debug-tab-btn:hover { background: var(--bg-soft, #f5f5f5); }
      .debug-tab-btn.active {
        color: var(--red, #d32f2f);
        border-bottom-color: var(--red, #d32f2f);
        font-weight: 600;
      }
      .debug-panel-logs {
        flex: 1;
        overflow-y: auto;
        padding: 8px 12px;
        background: var(--bg, #fff);
        -webkit-overflow-scrolling: touch;
      }
      .debug-log-entry {
        padding: 8px 10px;
        margin-bottom: 6px;
        border-left: 3px solid #2196F3;
        background: var(--bg-soft, #f5f5f5);
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.5;
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
        white-space: pre-line;
      }
      .debug-log-empty {
        padding: 24px;
        text-align: center;
        color: var(--text-muted, #666);
        font-size: 0.85rem;
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

    const tabBtns = this.panel.querySelectorAll('.debug-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeTab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.render(this.activeTab);
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
      this.render(this.activeTab);
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
      this.logContainer.innerHTML = '<div class="debug-log-empty">No logs to display</div>';
      return;
    }

    this.logContainer.innerHTML = logs
      .slice(-50)
      .reverse()
      .map(log => this.renderLogEntry(log))
      .join('');

    // Auto-scroll to newest (top, since reversed)
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
    // Print auth status when panel is opened
    this.printAuthStatus();
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
      toggleBtn.textContent = this.isCollapsed ? '▲' : '▼';
    }

    if (!this.isCollapsed) {
      this.render(this.activeTab);
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
    printAuthStatus: () => debugPanel.printAuthStatus(),
    DebugLevel: DebugLevel,
    DebugModule: DebugModule
  };
  
  console.log('[DEBUG-MODULE] Debug system initialized');
}
