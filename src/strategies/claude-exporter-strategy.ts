import { DocumentSaveStrategy } from "../types/document-save-strategy.js"
import { Logger } from "../types/extension.js"
import { CLAUDE_EXPORTER_CONFIG } from "../config/claude-exporter-config.js"

export class ClaudeExporterStrategy implements DocumentSaveStrategy {
  constructor(private logger: Logger) {}

  getName(): string {
    return CLAUDE_EXPORTER_CONFIG.name
  }

  isAvailable(): boolean {
    const selectButton = this.findSelectButton()
    const isAvailable = selectButton !== null

    if (!isAvailable) {
      this.logger.debug(
        `Claude Exporter not detected - Select button with CSS selector '${CLAUDE_EXPORTER_CONFIG.selectors.selectButton}' not found`,
      )
    }

    return isAvailable
  }

  async save(): Promise<void> {
    this.logger.info(`Using ${CLAUDE_EXPORTER_CONFIG.name} extension to save document`)

    // Perform detailed availability check with diagnostics
    const availabilityCheck = this.performDetailedAvailabilityCheck()
    if (!availabilityCheck.isAvailable) {
      const errorMessage = `${CLAUDE_EXPORTER_CONFIG.name} extension is not available. ${availabilityCheck.reason}`
      this.logger.error(errorMessage)
      this.logger.info(`Install from: ${CLAUDE_EXPORTER_CONFIG.chromeStoreUrl}`)
      throw new Error(errorMessage)
    }

    // Step 1: Click Select button
    const selectButton = this.findSelectButton()
    if (!selectButton) {
      throw new Error(`${CLAUDE_EXPORTER_CONFIG.name} Select button not found`)
    }

    this.logger.info(`Clicking ${CLAUDE_EXPORTER_CONFIG.name} Select button...`)
    selectButton.click()

    // Give extra time for the selection to register and include our injected URL
    await this.delay(1000)

    // Step 2: Try to find and click Export button (graceful degradation)
    try {
      const exportButton = await this.waitForButton(
        CLAUDE_EXPORTER_CONFIG.buttonText.export,
        CLAUDE_EXPORTER_CONFIG.timeouts.exportButtonWait,
      )
      this.logger.info(`${CLAUDE_EXPORTER_CONFIG.name} Export button detected - clicking...`)
      exportButton.click()

      // Step 3: Wait, then click Cancel
      this.logger.info(
        `Waiting ${CLAUDE_EXPORTER_CONFIG.timeouts.cancelDelay}ms before clicking Cancel...`,
      )
      await this.delay(CLAUDE_EXPORTER_CONFIG.timeouts.cancelDelay)

      const cancelButton = this.findCancelButton()
      if (cancelButton) {
        this.logger.info(`Clicking ${CLAUDE_EXPORTER_CONFIG.name} Cancel button...`)
        cancelButton.click()
      } else {
        this.logger.info(
          `${CLAUDE_EXPORTER_CONFIG.name} Cancel button not found - export may have completed`,
        )
      }
    } catch (error) {
      this.logger.info(
        `${CLAUDE_EXPORTER_CONFIG.name} Export button not found - plugin may not be fully installed`,
      )
      this.logger.info("Document save completed (Select button clicked)")
    }
  }

  private performDetailedAvailabilityCheck(): { isAvailable: boolean; reason: string } {
    // Check for Select button (primary indicator)
    const selectButton = this.findSelectButton()
    if (!selectButton) {
      return {
        isAvailable: false,
        reason: `Select button not found using CSS selector '${CLAUDE_EXPORTER_CONFIG.selectors.selectButton}' or text '${CLAUDE_EXPORTER_CONFIG.buttonText.select}'. This suggests the Claude Exporter extension is not installed or not active on this page.`,
      }
    }

    // Additional checks could go here (e.g., check for extension-specific DOM elements)

    return {
      isAvailable: true,
      reason: "Claude Exporter extension detected and available",
    }
  }

  private findSelectButton(): HTMLElement | null {
    return this.findButton(
      CLAUDE_EXPORTER_CONFIG.buttonText.select,
      CLAUDE_EXPORTER_CONFIG.selectors.selectButton,
    )
  }

  private findCancelButton(): HTMLElement | null {
    return this.findButton(
      CLAUDE_EXPORTER_CONFIG.buttonText.cancel,
      CLAUDE_EXPORTER_CONFIG.selectors.cancelButton,
    )
  }

  private findButton(text: string, cssClass?: string): HTMLElement | null {
    // Try CSS class first if provided
    if (cssClass) {
      const button = document.querySelector(cssClass) as HTMLElement
      if (button) {
        this.logger.debug(`Found button using CSS selector: ${cssClass}`)
        return button
      } else {
        this.logger.debug(`Button not found using CSS selector: ${cssClass}`)
      }
    }

    // Fallback to text search
    const buttons = Array.from(document.querySelectorAll("button"))
    const foundButton = buttons.find((btn) => btn.textContent?.trim() === text) as HTMLElement

    if (foundButton) {
      this.logger.debug(`Found button using text content: "${text}"`)
    } else {
      this.logger.debug(`Button not found using text content: "${text}"`)
    }

    return foundButton || null
  }

  private waitForButton(text: string, timeout: number): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      // Check if button already exists
      const existingButton = this.findButton(text)
      if (existingButton) {
        resolve(existingButton)
        return
      }

      this.logger.debug(`Waiting up to ${timeout}ms for button with text: "${text}"`)

      const observer = new MutationObserver(() => {
        const button = this.findButton(text)
        if (button) {
          observer.disconnect()
          resolve(button)
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })

      setTimeout(() => {
        observer.disconnect()
        reject(
          new Error(
            `${CLAUDE_EXPORTER_CONFIG.name} ${text} button not found within ${timeout}ms timeout`,
          ),
        )
      }, timeout)
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
