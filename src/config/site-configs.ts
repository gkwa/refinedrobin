/**
 * Configuration for site-specific DOM selectors and patterns
 */
export interface SiteConfig {
  /** Human-readable name of the site */
  name: string

  /** Domain this config applies to */
  domain: string

  /** CSS selectors for finding form elements */
  selectors: {
    /** Selectors for the main text input area */
    textbox: string[]
    /** Selectors for the submit/send button */
    submitButton: string[]
  }

  /** Keyword patterns for fallback element finding */
  keywords: {
    /** Keywords that might appear in submit button text */
    submitButton: string[]
  }

  /** Test fixtures for this site's DOM structure */
  testFixtures: {
    /** Example HTML for valid textboxes */
    textboxExamples: string[]
    /** Example HTML for valid submit buttons */
    submitButtonExamples: string[]
    /** Example HTML for elements that should NOT be found */
    invalidExamples: {
      html: string
      reason: string
    }[]
  }
}

/**
 * Configuration for Claude.ai form finding
 * This is the single source of truth for Claude's DOM structure
 */
export const CLAUDE_CONFIG: SiteConfig = {
  name: "Claude.ai",
  domain: "claude.ai",

  selectors: {
    textbox: [
      '[contenteditable="true"]',
      ".ProseMirror",
      '[data-placeholder*="help"]',
      'div[role="textbox"]',
      "textarea",
      'input[type="text"]',
    ],
    submitButton: [
      'button[aria-label*="Send"]',
      'button[aria-label*="submit"]',
      'button[type="submit"]',
      "button:has(svg)",
      '[data-testid*="send"]',
      '[data-testid*="submit"]',
    ],
  },

  keywords: {
    submitButton: ["send", "submit"],
  },

  testFixtures: {
    textboxExamples: [
      '<div contenteditable="true" class="prose-mirror"></div>',
      '<div class="ProseMirror" role="textbox"></div>',
      '<div contenteditable="true" data-placeholder="Message Claude..."></div>',
      '<textarea placeholder="Type your message"></textarea>',
      '<div contenteditable="true" data-placeholder="How can Claude help you today?"></div>',
    ],

    submitButtonExamples: [
      '<button aria-label="Send message"><svg>send-icon</svg></button>',
      '<button aria-label="Send message">Send</button>',
      '<button type="submit">Submit</button>',
      '<button data-testid="send-button">→</button>',
      "<button>Send</button>",
      "<button>Submit Form</button>",
    ],

    invalidExamples: [
      {
        html: "<div>Just a div</div>",
        reason: "Not contenteditable or input element",
      },
      {
        html: '<button disabled aria-label="Send message">Send</button>',
        reason: "Button is disabled",
      },
      {
        html: '<button style="display: none;" aria-label="Send">Send</button>',
        reason: "Button is hidden",
      },
      {
        html: '<div contenteditable="false">Text</div>',
        reason: "Contenteditable is false",
      },
      {
        html: '<button aria-label="Cancel">Cancel</button>',
        reason: "Wrong button type (cancel instead of send/submit)",
      },
    ],
  },
}

/**
 * Default configuration - currently points to Claude
 * This can be easily changed to support other sites in the future
 */
export const DEFAULT_SITE_CONFIG = CLAUDE_CONFIG
