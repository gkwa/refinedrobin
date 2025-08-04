import { Logger } from "../types/extension.js"

export class ResponseMonitorService {
  private observer: MutationObserver | null = null
  private isMonitoring = false
  private retryDetectionTimeout: number | null = null
  private pollingInterval: number | null = null

  constructor(private logger: Logger) {}

  async waitForCompletion(): Promise<void> {
    this.logger.info("Waiting for Claude to finish responding...")

    await this.startMonitoring()

    this.logger.info("Claude has finished responding - waiting 30 seconds before automation")
    await this.delay(30000)
    this.logger.info("30-second delay complete - ready for next pipeline step")
  }

  async waitForCompletionWithCallback(onComplete?: () => Promise<void>): Promise<void> {
    this.logger.info("Waiting for Claude to finish responding...")

    await this.startMonitoring()

    this.logger.info("Claude has finished responding - waiting 30 seconds before follow-up")
    await this.delay(30000)

    if (onComplete) {
      this.logger.info("Executing follow-up callback")
      await onComplete()
    }

    this.logger.info("Response monitoring and follow-up complete")
  }

  private startMonitoring(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMonitoring) {
        this.logger.debug("Response monitoring already in progress")
        return
      }

      this.isMonitoring = true
      this.logger.debug("Starting response monitoring for retry button")

      // Log visibility state
      this.logVisibilityState()

      // Monitor visibility changes
      document.addEventListener("visibilitychange", this.onVisibilityChange.bind(this))
      window.addEventListener("focus", this.onWindowFocus.bind(this))
      window.addEventListener("blur", this.onWindowBlur.bind(this))

      // Start polling for retry buttons every 2 seconds
      this.startPolling(() => {
        this.logger.info("Retry button found via polling - Claude has finished responding")
        this.clearRetryTimeout()
        this.stopMonitoring()
        resolve()
      })

      // Set up 1-minute timeout to check if retry button appeared
      this.retryDetectionTimeout = window.setTimeout(() => {
        this.logger.error("TIMEOUT: Retry button not detected within 1 minute")
        this.logger.error(`Current visibility state: ${document.visibilityState}`)
        this.logger.error(`Document has focus: ${document.hasFocus()}`)
        this.logger.error(`Window has focus: ${window.document.hasFocus()}`)

        // Log current DOM state
        const retryButtons = this.findRetryButtons()
        this.logger.error(`Retry buttons found in DOM: ${retryButtons.length}`)
        retryButtons.forEach((btn, index) => {
          this.logger.error(
            `Retry button ${index}: "${btn.textContent?.trim().substring(0, 100)}..." - visible: ${this.isElementVisible(btn)}`,
          )
        })
      }, 60000) // 1 minute

      this.observer = new MutationObserver((mutations) => {
        if (this.detectRetryText(mutations)) {
          this.logger.info(
            "Retry button detected via MutationObserver - Claude has finished responding",
          )
          this.clearRetryTimeout()
          this.stopMonitoring()
          resolve()
        }
      })

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      // 5 minute timeout fallback
      setTimeout(() => {
        if (this.isMonitoring) {
          this.logger.debug("Response monitoring timeout reached (5 minutes)")
          this.clearRetryTimeout()
          this.stopMonitoring()
          resolve()
        }
      }, 300000)
    })
  }

  private startPolling(onRetryFound: () => void): void {
    this.logger.debug("Starting retry button polling every 2 seconds")

    this.pollingInterval = window.setInterval(() => {
      this.logger.debug("Polling for retry buttons...")
      const retryButtons = this.findClaudeRetryButtons()

      if (retryButtons.length > 0) {
        this.logger.info(`Found ${retryButtons.length} Claude retry buttons via polling`)
        retryButtons.forEach((btn, index) => {
          this.logger.info(
            `Claude retry button ${index}: "${btn.textContent?.trim()}" - visible: ${this.isElementVisible(btn)}`,
          )
        })
        onRetryFound()
      } else {
        this.logger.debug("No Claude retry buttons found in polling cycle")
      }
    }, 2000) // Poll every 2 seconds
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
      this.logger.debug("Stopped retry button polling")
    }
  }

  private logVisibilityState(): void {
    this.logger.info(`=== VISIBILITY STATE DEBUG ===`)
    this.logger.info(`Document visibility state: ${document.visibilityState}`)
    this.logger.info(`Document hidden: ${document.hidden}`)
    this.logger.info(`Document has focus: ${document.hasFocus()}`)
    this.logger.info(`Window has focus: ${window.document.hasFocus()}`)
    this.logger.info(
      `Page is visible: ${!document.hidden && document.visibilityState === "visible"}`,
    )
    this.logger.info(`===============================`)
  }

  private onVisibilityChange(): void {
    this.logger.info(`Visibility changed: ${document.visibilityState} (hidden: ${document.hidden})`)
    this.logVisibilityState()
  }

  private onWindowFocus(): void {
    this.logger.info("Window gained focus")
    this.logVisibilityState()
  }

  private onWindowBlur(): void {
    this.logger.info("Window lost focus")
    this.logVisibilityState()
  }

  private findRetryButtons(): HTMLElement[] {
    const retryButtons: HTMLElement[] = []
    const retryPattern = /Retry/i

    // Find all buttons and elements that might contain "Retry"
    const allElements = document.querySelectorAll('button, [role="button"], .retry, *')

    allElements.forEach((element) => {
      if (element.textContent && retryPattern.test(element.textContent)) {
        retryButtons.push(element as HTMLElement)
      }
    })

    return retryButtons
  }

  private findClaudeRetryButtons(): HTMLElement[] {
    const retryButtons: HTMLElement[] = []
    const retryPattern = /^Retry$/i // Exact match for "Retry"

    // Look specifically for buttons (Claude's retry should be a button)
    const buttons = document.querySelectorAll('button, [role="button"]')

    buttons.forEach((button) => {
      const text = button.textContent?.trim()
      if (text && retryPattern.test(text)) {
        // Additional validation - should be a real button element, not CSS content
        if (button instanceof HTMLElement && button.tagName) {
          retryButtons.push(button)
        }
      }
    })

    return retryButtons
  }

  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    )
  }

  private clearRetryTimeout(): void {
    if (this.retryDetectionTimeout) {
      clearTimeout(this.retryDetectionTimeout)
      this.retryDetectionTimeout = null
    }
  }

  private detectRetryText(mutations: MutationRecord[]): boolean {
    const retryPattern = /Retry/i

    for (const mutation of mutations) {
      let textContent = ""

      if (mutation.type === "characterData") {
        textContent = mutation.target.textContent || ""
      } else if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          textContent += node.textContent || ""
        })
      }

      if (textContent && retryPattern.test(textContent)) {
        this.logger.info(`Retry text detected in mutation: "${textContent.trim()}"`)
        this.logger.info(`Current visibility state when retry found: ${document.visibilityState}`)
        return true
      }
    }
    return false
  }

  private stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    this.stopPolling()

    // Clean up event listeners
    document.removeEventListener("visibilitychange", this.onVisibilityChange.bind(this))
    window.removeEventListener("focus", this.onWindowFocus.bind(this))
    window.removeEventListener("blur", this.onWindowBlur.bind(this))

    this.clearRetryTimeout()
    this.isMonitoring = false
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  public stop(): void {
    this.stopMonitoring()
  }

  public isCurrentlyMonitoring(): boolean {
    return this.isMonitoring
  }
}
