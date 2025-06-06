import { Logger } from "../types/extension.js"

export class ButtonSequenceService {
  constructor(private logger: Logger) {}

  async clickButtonsSequentially(): Promise<void> {
    try {
      // Step 1: Find and click Select button
      const selectButton = this.findSelectButton()

      if (!selectButton) {
        throw new Error("Select button not found")
      }

      this.logger.info("Step 1: Clicking Select button...")
      selectButton.click()

      // Step 2: Wait for Export button and click it
      try {
        const exportButton = await this.waitForElement(
          "button",
          (btn) => btn.textContent?.includes("Export") || false,
        )
        this.logger.info("Step 2: Clicking Export button...")
        exportButton.click()

        // Step 3: Wait 5 seconds, then find and click Cancel button
        this.logger.info("Step 3: Waiting 5 seconds before clicking Cancel...")
        await this.delay(5000)

        const cancelButton = this.findCancelButton()
        if (cancelButton) {
          this.logger.info("Step 3: Clicking Cancel button...")
          cancelButton.click()
        } else {
          throw new Error("Cancel button not found")
        }
      } catch (error) {
        this.logger.error(
          `Export button not found: ${error instanceof Error ? error.message : String(error)}`,
        )
        throw error
      }
    } catch (error) {
      this.logger.error(
        `Button sequence failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }

  private findSelectButton(): HTMLElement | null {
    // Try CSS class selector first
    let button = document.querySelector(".css-v9fu0n") as HTMLElement
    if (button) return button

    // Fallback to text content search
    const buttons = Array.from(document.querySelectorAll("button"))
    return (buttons.find((btn) => btn.textContent?.trim() === "Select") as HTMLElement) || null
  }

  private findCancelButton(): HTMLElement | null {
    // Try CSS class selector first
    let button = document.querySelector(".css-1m5ga1e") as HTMLElement
    if (button) return button

    // Fallback to text content search
    const buttons = Array.from(document.querySelectorAll("button"))
    return (buttons.find((btn) => btn.textContent?.trim() === "Cancel") as HTMLElement) || null
  }

  private waitForElement(
    selector: string,
    condition: (element: Element) => boolean,
    timeout: number = 15000,
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      // Check if element already exists
      const elements = document.querySelectorAll(selector)
      for (const element of elements) {
        if (condition(element)) {
          resolve(element as HTMLElement)
          return
        }
      }

      const observer = new MutationObserver(() => {
        const elements = document.querySelectorAll(selector)
        for (const element of elements) {
          if (condition(element)) {
            observer.disconnect()
            resolve(element as HTMLElement)
            return
          }
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      setTimeout(() => {
        observer.disconnect()
        reject(new Error("Element not found within timeout"))
      }, timeout)
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
