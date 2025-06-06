import { Logger } from "../types/extension.js"

export class ResponseMonitorService {
  private observer: MutationObserver | null = null
  private isMonitoring = false
  private foundStrings = new Set<string>()

  constructor(private logger: Logger) {}

  startMonitoring(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMonitoring) {
        this.logger.debug("Response monitoring already in progress")
        return
      }

      this.isMonitoring = true
      this.logger.debug("Starting response monitoring for retry button")

      // Create mutation observer using the exact same logic as cosykoala
      this.observer = new MutationObserver((mutations) => {
        this.handleMutations(mutations, resolve)
      })

      // Start observing with the same configuration as cosykoala StringObserver
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      this.logger.debug("Started monitoring document.body for retry text")

      // Set a timeout as fallback
      setTimeout(() => {
        if (this.isMonitoring) {
          this.logger.debug("Response monitoring timeout reached")
          this.stopMonitoring()
          resolve()
        }
      }, 300000) // 5 minute timeout
    })
  }

  private handleMutations(mutations: MutationRecord[], resolve: () => void): void {
    for (const mutation of mutations) {
      this.checkForStrings(mutation, resolve)
    }
  }

  private checkForStrings(mutation: MutationRecord, resolve: () => void): void {
    let textContent = ""

    if (mutation.type === "characterData") {
      textContent = mutation.target.textContent || ""
    } else if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        textContent += node.textContent || ""
      })
    }

    if (textContent) {
      this.checkTextContent(textContent, resolve)
    }
  }

  private checkTextContent(text: string, resolve: () => void): void {
    // Use the exact same pattern as cosykoala
    const retryPattern = /Retry/i
    const matches = this.findMatches(text, retryPattern)

    matches.forEach((match) => {
      const matchKey = `retry-button-${match}`

      // Allow duplicates like cosykoala does (allowDuplicates: true)
      this.logger.debug(`String appeared: retry-button - "${match}"`)
      this.logger.info("Retry button detected - Claude has finished responding")
      this.stopMonitoring()
      resolve()
    })
  }

  private findMatches(text: string, pattern: RegExp): string[] {
    const matches = text.match(pattern)
    return matches ? Array.from(new Set(matches)) : []
  }

  private stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.isMonitoring = false
    this.foundStrings.clear()
    this.logger.debug("Stopped response monitoring")
  }

  // Public method to stop monitoring if needed
  public stop(): void {
    this.stopMonitoring()
  }

  // Check if currently monitoring
  public isCurrentlyMonitoring(): boolean {
    return this.isMonitoring
  }
}
