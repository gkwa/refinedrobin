/**
 * Configuration constants for Claude Exporter extension integration
 * These CSS selectors are specific to the Claude Exporter extension UI
 * and may need to be updated if the extension changes its implementation
 */
export const CLAUDE_EXPORTER_CONFIG = {
  name: "Claude Exporter",
  chromeStoreUrl:
    "https://chromewebstore.google.com/detail/claude-exporter-save-clau/elhmfakncmnghlnabnolalcjkdpfjnin",

  // CSS selectors used by Claude Exporter extension
  selectors: {
    selectButton: ".css-v9fu0n",
    exportButton: "button", // Will be found by text content "Export"
    cancelButton: ".css-1m5ga1e",
  },

  // Button text content (more stable than CSS classes)
  buttonText: {
    select: "Select",
    export: "Export",
    cancel: "Cancel",
  },

  // Timeouts for various operations
  timeouts: {
    exportButtonWait: 5000, // ms to wait for Export button to appear
    cancelDelay: 5000, // ms to wait before clicking Cancel
  },
} as const

/**
 * Export individual selectors for convenience
 */
export const CLAUDE_EXPORTER_SELECTORS = CLAUDE_EXPORTER_CONFIG.selectors
export const CLAUDE_EXPORTER_TIMEOUTS = CLAUDE_EXPORTER_CONFIG.timeouts
