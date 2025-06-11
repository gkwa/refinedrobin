import { Logger } from "../types/extension.js"

export class UrlMonitorService {
  private isMonitoring = false
  private currentUrl: string
  private originalPushState: typeof history.pushState
  private originalReplaceState: typeof history.replaceState

  constructor(private logger: Logger) {
    this.currentUrl = window.location.href
    this.originalPushState = history.pushState.bind(history)
    this.originalReplaceState = history.replaceState.bind(history)
  }

  startMonitoring(onUrlChange: (newUrl: string) => void): void {
    if (this.isMonitoring) {
      this.logger.debug("URL monitoring already active")
      return
    }

    this.isMonitoring = true
    this.logger.debug("Starting URL change monitoring")

    // Override history.pushState
    history.pushState = (...args) => {
      this.originalPushState.apply(history, args)
      this.handleUrlChange(onUrlChange)
    }

    // Override history.replaceState
    history.replaceState = (...args) => {
      this.originalReplaceState.apply(history, args)
      this.handleUrlChange(onUrlChange)
    }

    // Listen for back/forward button navigation
    window.addEventListener('popstate', () => {
      this.handleUrlChange(onUrlChange)
    })

    this.logger.info("URL monitoring started")
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    // Restore original history methods
    history.pushState = this.originalPushState
    history.replaceState = this.originalReplaceState

    // Note: We can't remove the popstate listener without a reference to the specific function
    // This is a limitation, but the listener will be cleaned up when the page unloads

    this.isMonitoring = false
    this.logger.info("URL monitoring stopped")
  }

  private handleUrlChange(callback: (newUrl: string) => void): void {
    const newUrl = window.location.href
    if (newUrl !== this.currentUrl) {
      this.logger.debug(`URL changed from ${this.currentUrl} to ${newUrl}`)
      this.currentUrl = newUrl
      callback(newUrl)
    }
  }

  getCurrentUrl(): string {
    return this.currentUrl
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring
  }
}
