// js/debug/logger.js
// ============================================
// DEBUG LOGGER - Phase 9.2
// Human-readable diagnostic system for admin/reviewer
// ============================================

import { getUserRoleBackend } from "../admin-auth.js";
import { supabase } from "../supabase.js";

/**
 * Debug severity levels
 */
export const DebugLevel = {
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'error'
};

/**
 * Debug modules
 */
export const DebugModule = {
  AUTH: 'auth',
  UPLOAD: 'upload',
  ADMIN: 'admin',
  STORAGE: 'storage',
  ROLE: 'role',
  SETTINGS: 'settings',
  SYSTEM: 'system'
};

/**
 * Debug log entry structure
 * @typedef {Object} DebugEntry
 * @property {string} timestamp - ISO timestamp
 * @property {string} module - Module name (auth/upload/admin/storage)
 * @property {string} level - Severity level (info/warning/error)
 * @property {string} message - Human-readable message
 * @property {Object} [data] - Optional additional data
 */

class DebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Keep last 100 logs in memory
    this.enabled = false;
    this.listeners = [];
    this.panelVisible = false;
    
    // Check if debug should be enabled (admin/reviewer only)
    this._checkDebugAccess();
  }

  /**
   * Check if current user has debug access
   */
  async _checkDebugAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        this.enabled = false;
        return;
      }

      const roleInfo = await getUserRoleBackend(session.user.id);
      const hasAccess = roleInfo && (roleInfo.name === 'admin' || roleInfo.name === 'reviewer');
      
      this.enabled = hasAccess;
      
      // Check if debug panel should be visible
      if (hasAccess) {
        this.panelVisible = localStorage.getItem('debug-panel-enabled') === 'true';
      }
    } catch (err) {
      console.error('[DEBUG-LOGGER] Error checking access:', err);
      this.enabled = false;
    }
  }

  /**
   * Log a debug message
   * @param {string} module - Module name
   * @param {string} level - Severity level
   * @param {string} message - Human-readable message
   * @param {Object} [data] - Optional additional data
   */
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

    // Add to logs array
    this.logs.push(entry);

    // Trim if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console with color
    this._logToConsole(entry);

    // Notify listeners (for UI updates)
    this._notifyListeners(entry);
  }

  /**
   * Check if message should always be logged (system-level)
   */
  _isSystemMessage(module, level) {
    return level === DebugLevel.ERROR || module === DebugModule.SYSTEM;
  }

  /**
   * Log to console with appropriate styling
   */
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

  /**
   * Get icon for severity level
   */
  _getIcon(level) {
    switch (level) {
      case DebugLevel.INFO:
        return 'ℹ️';
      case DebugLevel.WARN:
        return '⚠️';
      case DebugLevel.ERROR:
        return '❌';
      default:
        return '•';
    }
  }

  /**
   * Get color for severity level
   */
  _getColor(level) {
    switch (level) {
      case DebugLevel.INFO:
        return '#2196F3';
      case DebugLevel.WARN:
        return '#FFA726';
      case DebugLevel.ERROR:
        return '#f44336';
      default:
        return '#666';
    }
  }

  /**
   * Add listener for log updates
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   * @param {Function} callback - Callback function
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notify all listeners
   */
  _notifyListeners(entry) {
    this.listeners.forEach(callback => {
      try {
        callback(entry);
      } catch (err) {
        console.error('[DEBUG-LOGGER] Error in listener:', err);
      }
    });
  }

  /**
   * Get all logs
   * @returns {Array<DebugEntry>}
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this._notifyListeners({ type: 'clear' });
    this.log(DebugModule.SYSTEM, DebugLevel.INFO, 'Debug logs cleared');
  }

  /**
   * Get logs filtered by module
   * @param {string} module - Module name
   * @returns {Array<DebugEntry>}
   */
  getLogsByModule(module) {
    return this.logs.filter(log => log.module === module);
  }

  /**
   * Get logs filtered by level
   * @param {string} level - Severity level
   * @returns {Array<DebugEntry>}
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Enable debug panel
   */
  enablePanel() {
    this.panelVisible = true;
    localStorage.setItem('debug-panel-enabled', 'true');
    this.log(DebugModule.SYSTEM, DebugLevel.INFO, 'Debug panel enabled');
  }

  /**
   * Disable debug panel
   */
  disablePanel() {
    this.panelVisible = false;
    localStorage.setItem('debug-panel-enabled', 'false');
    this.log(DebugModule.SYSTEM, DebugLevel.INFO, 'Debug panel disabled');
  }

  /**
   * Check if panel is visible
   * @returns {boolean}
   */
  isPanelVisible() {
    return this.panelVisible && this.enabled;
  }

  /**
   * Check if debug is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// Convenience functions
export function logInfo(module, message, data) {
  debugLogger.log(module, DebugLevel.INFO, message, data);
}

export function logWarn(module, message, data) {
  debugLogger.log(module, DebugLevel.WARN, message, data);
}

export function logError(module, message, data) {
  debugLogger.log(module, DebugLevel.ERROR, message, data);
}

// Initialize on auth state change
supabase.auth.onAuthStateChange(() => {
  debugLogger._checkDebugAccess();
});
