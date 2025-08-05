import { Logger } from "../types/extension.js"

export class ResponseMonitorService {
  private observer: MutationObserver | null = null
  private isMonitoring = false

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

      this.observer = new MutationObserver((mutations) => {
        if (this.detectRetryText(mutations)) {
          this.logger.info("Retry button detected - Claude has finished responding")
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
          this.logger.debug("Response monitoring timeout reached")
          this.stopMonitoring()
          resolve()
        }
      }, 300000)
    })
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
