import { DocumentSaveStrategy } from "../types/document-save-strategy.js"
import { Logger } from "../types/extension.js"

export class ClaudeExporterStrategy implements DocumentSaveStrategy {
  constructor(private logger: Logger) {}

  getName(): string {
    return "ClaudeExporter Extension"
  }

  isAvailable(): boolean {
    // Check if ClaudeExporter extension is available by looking for its UI elements
    const selectButton = this.findButton("Select", ".css-v9fu0n")
    return selectButton !== null
  }

  async save(): Promise<void> {
    this.logger.info("Using ClaudeExporter extension to save document")

    if (!this.isAvailable()) {
      throw new Error("ClaudeExporter extension is not available")
    }

    // Step 1: Click Select button
    const selectButton = this.findButton("Select", ".css-v9fu0n")
    if (!selectButton) throw new Error("Select button not found")

    this.logger.info("Clicking Select button...")
    selectButton.click()

    // Step 2: Try to find and click Export button (graceful degradation)
    try {
      const exportButton = await this.waitForButton("Export", 5000) // Shorter timeout
      this.logger.info("ClaudeExporter detected - clicking Export button...")
      exportButton.click()

      // Step 3: Wait 5 seconds, then click Cancel
      this.logger.info("Waiting 5 seconds before clicking Cancel...")
      await this.delay(5000)

      const cancelButton = this.findButton("Cancel", ".css-1m5ga1e")
      if (cancelButton) {
        this.logger.info("Clicking Cancel button...")
        cancelButton.click()
      } else {
        this.logger.info("Cancel button not found - export may have completed")
      }
    } catch (error) {
      this.logger.info("Export button not found - ClaudeExporter plugin may not be fully installed")
      this.logger.info("Document save completed (Select button clicked)")
    }
  }

  private findButton(text: string, cssClass?: string): HTMLElement | null {
    // Try CSS class first if provided
    if (cssClass) {
      const button = document.querySelector(cssClass) as HTMLElement
      if (button) return button
    }

    // Fallback to text search
    const buttons = Array.from(document.querySelectorAll("button"))
    return (buttons.find((btn) => btn.textContent?.trim() === text) as HTMLElement) || null
  }

  private waitForButton(text: string, timeout = 15000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      // Check if button already exists
      const existingButton = this.findButton(text)
      if (existingButton) {
        resolve(existingButton)
        return
      }

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
        reject(new Error(`${text} button not found within timeout`))
      }, timeout)
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
