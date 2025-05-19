import { Logger } from "../types/extension.js"

export class NavigationService {
  constructor(private logger: Logger) {}

  async navigateTo(url: string): Promise<void> {
    this.logger.debug(`Navigating to: ${url}`)

    // Only navigate if we're in a content script context (has window object)
    if (typeof window !== "undefined" && window.location) {
      if (window.location.href !== url) {
        window.location.href = url
        await this.waitForLoad()
      }
    } else {
      // We're in a service worker context, navigation should be handled differently
      this.logger.debug("Navigation called from service worker context")
    }
  }

  private waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve()
        return
      }

      if (document.readyState === "complete") {
        resolve()
      } else {
        window.addEventListener("load", () => resolve(), { once: true })
      }
    })
  }
}
