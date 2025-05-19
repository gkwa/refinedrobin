import { ConsoleLogger } from "./services/logger.js"
import { ContentBuilderService } from "./services/content-builder.js"
import { FormFinderService } from "./services/form-finder.js"
import { FormFillerService } from "./services/form-filler.js"
import { PageExtractorService } from "./services/page-extractor.js"
import { PageData } from "./types/extension.js"
import { DEFAULT_PROMPT } from "./config/prompt-templates.js"

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

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "execute") {
      const config = { ...DEFAULT_CONFIG, ...message.config }
      const pageData = message.pageData as PageData | null

      // If we're in custom mode and have predefined text from config, use it
      if (config.mode === "custom" && config.predefinedText) {
        config.predefinedText = config.predefinedText
      } else {
        // Otherwise, use default prompt from constants
        config.predefinedText = DEFAULT_PROMPT
      }

      executeDirectly(config, pageData, logger)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }))

      return true // Indicates we will send a response asynchronously
    }
  })
}

async function executeDirectly(
  config: any,
  pageData: PageData | null,
  logger: ConsoleLogger,
): Promise<void> {
  try {
    // Wait for elements to be ready
    await waitForElements(logger)

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

    // Build the content to fill into the form
    let contentToFill: string

    if (pageData) {
      // If we have page data, include URL and content (HTML or text)
      contentToFill = contentBuilder.buildFormContentWithHTML(
        config.predefinedText,
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
          config.predefinedText,
          currentPageData,
          config.preferHTML,
        )
        logger.info(
          `Extracted content from current page using ${pageExtractor.getCurrentStrategy()} strategy`,
        )
      } catch (error) {
        logger.error(`Failed to extract from current page: ${error}`)
        contentToFill = config.predefinedText
        logger.info("Using predefined text only")
      }
    }

    formFiller.fillTextbox(textbox, contentToFill)
    formFiller.submitForm(submitButton)
  } catch (error) {
    logger.error(`Execution failed: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
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
