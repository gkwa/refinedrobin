import { Logger } from "../types/extension.js"

export class ScrollService {
  private isScrolling = false
  private scrollInterval: NodeJS.Timeout | null = null
  private scrollCount = 0
  private startTime: number = 0

  constructor(
    private logger: Logger,
    private scrollIntervalMs: number = 1000,
  ) {}

  start(): void {
    if (this.isScrolling) {
      this.logger.debug("Scroll service already running")
      return
    }

    this.isScrolling = true
    this.scrollCount = 0
    this.startTime = Date.now()

    this.logger.info(`Starting scroll service with ${this.scrollIntervalMs}ms interval`)

    this.scrollInterval = setInterval(() => {
      this.performScroll()
    }, this.scrollIntervalMs)
  }

  stop(): void {
    if (!this.isScrolling) {
      return
    }

    if (this.scrollInterval) {
      clearInterval(this.scrollInterval)
      this.scrollInterval = null
    }

    const elapsedSeconds = ((Date.now() - this.startTime) / 1000).toFixed(2)
    this.logger.info(
      `Scroll service stopped - performed ${this.scrollCount} scrolls over ${elapsedSeconds}s`,
    )

    this.isScrolling = false
  }

  private performScroll(): void {
    try {
      const scrollableElement = this.findScrollableContainer()

      if (!scrollableElement) {
        this.logger.debug("No scrollable container found")
        return
      }

      const previousScrollTop = scrollableElement.scrollTop
      const scrollHeight = scrollableElement.scrollHeight
      const clientHeight = scrollableElement.clientHeight

      // Scroll to bottom
      scrollableElement.scrollTop = scrollHeight

      const newScrollTop = scrollableElement.scrollTop
      const isAtBottom = Math.abs(newScrollTop - scrollHeight + clientHeight) < 10

      this.scrollCount++

      this.logger.debug(
        `Scroll #${this.scrollCount}: scrolled from ${previousScrollTop} to ${newScrollTop} (height: ${scrollHeight}, client: ${clientHeight}, at-bottom: ${isAtBottom})`,
      )
    } catch (error) {
      this.logger.error(`Scroll error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private findScrollableContainer(): HTMLElement | null {
    // Try to find Claude's message container - these are common selectors
    const selectors = [
      // Claude's main message area
      '[data-testid="conversation"]',
      '[data-testid="messages"]',
      "main",
      // Fallback to document element
      "html",
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element instanceof HTMLElement) {
        // Check if element is actually scrollable
        const scrollHeight = element.scrollHeight
        const clientHeight = element.clientHeight

        if (scrollHeight > clientHeight) {
          this.logger.debug(`Found scrollable container with selector: ${selector}`)
          return element
        }
      }
    }

    // Last resort: try body
    if (document.body.scrollHeight > document.body.clientHeight) {
      this.logger.debug("Using document.body as scrollable container")
      return document.body
    }

    // Try window scroll as absolute last resort
    if (window.innerHeight < document.documentElement.scrollHeight) {
      this.logger.debug("Using window scroll")
      return document.documentElement
    }

    this.logger.debug("No scrollable container found")
    return null
  }

  isCurrentlyScrolling(): boolean {
    return this.isScrolling
  }

  getScrollCount(): number {
    return this.scrollCount
  }

  getElapsedTime(): number {
    if (!this.isScrolling) {
      return 0
    }
    return Date.now() - this.startTime
  }
}
