import { ConsoleLogger } from "./services/logger.js"
import { ContentBuilderService } from "./services/content-builder.js"
import { FormFinderService } from "./services/form-finder.js"
import { FormFillerService } from "./services/form-filler.js"
import { PageExtractorService } from "./services/page-extractor.js"
import { PageMonitorService } from "./services/page-monitor.js"
import { PageOverlayService } from "./services/page-overlay.js"
import { PageData } from "./types/extension.js"
import { loadTLDRSummaryPrompt, DEFAULT_PROMPT } from "./config/prompt-templates.js"
import {
  OverlayTitleChangeHandler,
  LogTitleChangeHandler,
  VisualFeedbackTitleChangeHandler,
  OverlayTimeoutHandler,
  AlertTimeoutHandler,
  VisualFeedbackTimeoutHandler,
  OverlayUrlChangeHandler,
  NavigationTrackingHandler,
  VisualFeedbackUrlChangeHandler,
} from "./strategies/monitoring-handlers.js"

const DEFAULT_CONFIG = {
  targetUrl: "https://claude.ai/new",
  extractionStrategy: "readability",
  preferHTML: false,
  predefinedText: DEFAULT_PROMPT,
}

async function initializeExtension(): Promise<void> {
  const verboseLevel = 0 // Default verbose level
  const logger = new ConsoleLogger(verboseLevel)

  logger.debug("Content script loaded")

  // Initialize overlay service for status updates
  const overlayService = new PageOverlayService(logger, { position: "top-right" })

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "execute") {
      const config = { ...DEFAULT_CONFIG, ...message.config }
      const pageData = message.pageData as PageData | null

      // If we're in custom mode and have predefined text from config, use it
      if (config.mode === "custom" && config.predefinedText) {
        config.predefinedText = config.predefinedText
      } else {
        // Otherwise, use default prompt - will be loaded in executeDirectly
        config.predefinedText = DEFAULT_PROMPT
      }

      executeDirectly(config, pageData, logger, overlayService)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }))

      return true // Indicates we will send a response asynchronously
    }

    // Return false for unhandled messages
    return false
  })
}

async function executeDirectly(
  config: any,
  pageData: PageData | null,
  logger: ConsoleLogger,
  overlayService: PageOverlayService,
): Promise<void> {
  try {
    // Show initial status
    overlayService.showUrl(window.location.href, "Starting automation")

    // Wait for elements to be ready
    await waitForElements(logger)

    // Show status update
    overlayService.showStatus("Form elements found", "success")

    // Initialize services with strategy configuration
    const pageExtractor = new PageExtractorService(logger, config.extractionStrategy)
    const formFinder = new FormFinderService(logger)
    const formFiller = new FormFillerService(logger)
    const contentBuilder = new ContentBuilderService(logger)
    const { textbox, submitButton } = formFinder.findFormElements()

    if (!textbox) {
      throw new Error("Textbox not found")
    }

    if (!submitButton) {
      throw new Error("Submit button not found")
    }

    // Load the appropriate prompt
    let promptText = config.predefinedText
    if (config.mode === "tldr") {
      try {
        promptText = await loadTLDRSummaryPrompt()
        logger.debug("Loaded TLDR prompt from markdown file")
      } catch (error) {
        logger.error(`Failed to load TLDR prompt: ${error}`)
        promptText = DEFAULT_PROMPT
      }
    }

    // Build the content to fill into the form
    let contentToFill: string

    if (pageData) {
      // If we have page data, include URL and content (HTML or text)
      contentToFill = contentBuilder.buildFormContentWithHTML(
        promptText,
        pageData,
        config.preferHTML,
      )
      logger.info(`Including page data from: ${pageData.url}`)
      logger.debug(`Page text length: ${pageData.textContent.length} characters`)

      if (pageData.htmlContent) {
        logger.debug(`Page HTML length: ${pageData.htmlContent.length} characters`)
      }
    } else {
      // Fallback: extract from current page if possible, otherwise use predefined text only
      try {
        const currentPageData = pageExtractor.extractPageData()

        contentToFill = contentBuilder.buildFormContentWithHTML(
          promptText,
          currentPageData,
          config.preferHTML,
        )
        logger.info(
          `Extracted content from current page using ${pageExtractor.getCurrentStrategy()} strategy`,
        )
      } catch (error) {
        logger.error(`Failed to extract from current page: ${error}`)
        contentToFill = promptText
        logger.info("Using predefined text only")
      }
    }

    // Show status before filling form
    overlayService.showStatus("Filling form...", "info")

    formFiller.fillTextbox(textbox, contentToFill)

    // Show status before submitting
    overlayService.showStatus("Submitting form...", "info")

    formFiller.submitForm(submitButton)

    // Start monitoring for page changes after submission
    startPageMonitoring(logger, overlayService)
  } catch (error) {
    logger.error(`Execution failed: ${error instanceof Error ? error.message : String(error)}`)
    overlayService.showStatus(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    )
    throw error
  }
}

function startPageMonitoring(logger: ConsoleLogger, overlayService: PageOverlayService): void {
  logger.info("Starting page monitoring for changes")

  // Configuration for visual feedback and monitoring behavior
  const ENABLE_BOUNCY_BALLS = true // Change to false to disable bouncy balls
  const STOP_ON_FIRST_TITLE_CHANGE = false // Set to true for original behavior
  const STOP_ON_FIRST_URL_CHANGE = false // Set to true to stop on first URL change

  // Create the monitor service with configurable behavior
  const monitor = new PageMonitorService(logger, {
    timeoutMs: 3 * 60 * 1000, // 3 minutes
    stopOnFirstTitleChange: STOP_ON_FIRST_TITLE_CHANGE,
    stopOnFirstUrlChange: STOP_ON_FIRST_URL_CHANGE,
    enabledHandlers: {
      titleChange: true,
      timeout: true,
      urlChange: true,
    },
  })

  // Add handlers for different events
  monitor.addTitleChangeHandler(new OverlayTitleChangeHandler(logger, overlayService))
  monitor.addTitleChangeHandler(new LogTitleChangeHandler(logger))
  if (ENABLE_BOUNCY_BALLS) {
    monitor.addTitleChangeHandler(new VisualFeedbackTitleChangeHandler(logger))
  }

  monitor.addTimeoutHandler(new OverlayTimeoutHandler(logger, overlayService))
  if (ENABLE_BOUNCY_BALLS) {
    monitor.addTimeoutHandler(new VisualFeedbackTimeoutHandler(logger))
  }

  monitor.addUrlChangeHandler(new OverlayUrlChangeHandler(logger, overlayService))
  monitor.addUrlChangeHandler(new NavigationTrackingHandler(logger))
  if (ENABLE_BOUNCY_BALLS) {
    monitor.addUrlChangeHandler(new VisualFeedbackUrlChangeHandler(logger))
  }

  // Start the monitoring
  monitor.start()

  // Show initial monitoring status
  overlayService.showStatus("Monitoring page changes...", "info")

  // Update overlay to show current URL after a brief delay
  setTimeout(() => {
    overlayService.showUrl(window.location.href, "Monitoring Active")
  }, 2000)

  // Test the bouncy ball immediately so you can see it works!
  if (ENABLE_BOUNCY_BALLS) {
    setTimeout(() => {
      logger.info("Showing test bouncy ball...")
      const testHandler = new VisualFeedbackTitleChangeHandler(logger)
      testHandler.handle("Test - Extension Working!", "Previous Title")
    }, 3000) // Show test bouncy ball 3 seconds after monitoring starts
  }

  // Log the current configuration for debugging
  logger.info(
    `Monitor configuration: stopOnFirstTitleChange=${STOP_ON_FIRST_TITLE_CHANGE}, stopOnFirstUrlChange=${STOP_ON_FIRST_URL_CHANGE}`,
  )
}

async function waitForElements(logger: ConsoleLogger): Promise<void> {
  const maxAttempts = 10
  const delay = 1000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.debug(`Waiting for elements, attempt ${attempt}/${maxAttempts}`)
    // Check if the main textbox is available

    const textbox =
      document.querySelector('[contenteditable="true"]') ||
      document.querySelector(".ProseMirror") ||
      document.querySelector('[data-placeholder*="help"]')

    if (textbox) {
      logger.debug("Elements found, ready to proceed")
      return
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error("Elements not found after maximum attempts")
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeExtension)
} else {
  initializeExtension()
}
