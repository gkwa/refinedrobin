import { Logger } from "../types/extension.js"
import {
  PageMonitoringConfig,
  TitleChangeHandler,
  TimeoutHandler,
  UrlChangeHandler,
} from "../types/page-monitoring.js"

export class PageMonitorService {
  private titleObserver: MutationObserver | null = null
  private timeoutId: number | null = null
  private isMonitoring = false
  private currentTitle: string
  private currentUrl: string
  private config: PageMonitoringConfig

  constructor(
    private logger: Logger,
    config: Partial<PageMonitoringConfig> = {},
  ) {
    this.currentTitle = document.title
    this.currentUrl = window.location.href
    this.config = {
      timeoutMs: 3 * 60 * 1000, // 3 minutes default
      stopOnFirstTitleChange: true, // Default to original behavior
      stopOnFirstUrlChange: false, // URL changes are usually continuous in SPAs
      enabledHandlers: {
        titleChange: true,
        timeout: true,
        urlChange: true,
      },
      handlers: {
        titleChange: [],
        timeout: [],
        urlChange: [],
      },
      ...config,
    }
  }

  // Methods to add/remove handlers
  addTitleChangeHandler(handler: TitleChangeHandler): void {
    this.config.handlers.titleChange.push(handler)
    this.logger.debug(`Added title change handler: ${handler.name}`)
  }

  addTimeoutHandler(handler: TimeoutHandler): void {
    this.config.handlers.timeout.push(handler)
    this.logger.debug(`Added timeout handler: ${handler.name}`)
  }

  addUrlChangeHandler(handler: UrlChangeHandler): void {
    this.config.handlers.urlChange.push(handler)
    this.logger.debug(`Added URL change handler: ${handler.name}`)
  }

  // Methods to remove handlers
  removeTitleChangeHandler(handlerName: string): void {
    this.config.handlers.titleChange = this.config.handlers.titleChange.filter(
      (h) => h.name !== handlerName,
    )
    this.logger.debug(`Removed title change handler: ${handlerName}`)
  }

  removeTimeoutHandler(handlerName: string): void {
    this.config.handlers.timeout = this.config.handlers.timeout.filter(
      (h) => h.name !== handlerName,
    )
    this.logger.debug(`Removed timeout handler: ${handlerName}`)
  }

  removeUrlChangeHandler(handlerName: string): void {
    this.config.handlers.urlChange = this.config.handlers.urlChange.filter(
      (h) => h.name !== handlerName,
    )
    this.logger.debug(`Removed URL change handler: ${handlerName}`)
  }

  // Methods to enable/disable handler types
  enableTitleChangeHandlers(): void {
    this.config.enabledHandlers.titleChange = true
    this.logger.debug("Title change handlers enabled")
  }

  disableTitleChangeHandlers(): void {
    this.config.enabledHandlers.titleChange = false
    this.logger.debug("Title change handlers disabled")
  }

  enableTimeoutHandlers(): void {
    this.config.enabledHandlers.timeout = true
    this.logger.debug("Timeout handlers enabled")
  }

  disableTimeoutHandlers(): void {
    this.config.enabledHandlers.timeout = false
    this.logger.debug("Timeout handlers disabled")
  }

  enableUrlChangeHandlers(): void {
    this.config.enabledHandlers.urlChange = true
    this.logger.debug("URL change handlers enabled")
  }

  disableUrlChangeHandlers(): void {
    this.config.enabledHandlers.urlChange = false
    this.logger.debug("URL change handlers disabled")
  }

  // Configuration methods for stop behavior
  setStopOnFirstTitleChange(stop: boolean): void {
    this.config.stopOnFirstTitleChange = stop
    this.logger.debug(`Stop on first title change: ${stop}`)
  }

  setStopOnFirstUrlChange(stop: boolean): void {
    this.config.stopOnFirstUrlChange = stop
    this.logger.debug(`Stop on first URL change: ${stop}`)
  }

  start(): void {
    if (this.isMonitoring) {
      this.logger.debug("Page monitor already running")
      return
    }

    this.logger.info("Starting page monitor")
    this.isMonitoring = true

    // Start title observation
    this.startTitleObserver()

    // Start URL monitoring
    this.startUrlMonitoring()

    // Start timeout
    this.startTimeout()
  }

  stop(): void {
    if (!this.isMonitoring) {
      return
    }

    this.logger.info("Stopping page monitor")
    this.isMonitoring = false

    // Clean up title observer
    if (this.titleObserver) {
      this.titleObserver.disconnect()
      this.titleObserver = null
    }

    // Clean up timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  private startTitleObserver(): void {
    this.titleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.target === document.head) {
          // Check if title element was added/removed/modified
          const titleElement = document.querySelector("title")
          if (titleElement) {
            const newTitle = titleElement.textContent || ""
            if (newTitle !== this.currentTitle) {
              this.handleTitleChange(newTitle)
            }
          }
        } else if (
          mutation.type === "characterData" &&
          mutation.target.parentNode === document.querySelector("title")
        ) {
          // Direct title text change
          const newTitle = document.title
          if (newTitle !== this.currentTitle) {
            this.handleTitleChange(newTitle)
          }
        }
      })
    })

    // Observe changes to the document head and title element
    this.titleObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    // Also observe title element directly if it exists
    const titleElement = document.querySelector("title")
    if (titleElement) {
      this.titleObserver.observe(titleElement, {
        childList: true,
        characterData: true,
      })
    }

    this.logger.debug("Title observer started")
  }

  private startUrlMonitoring(): void {
    // Monitor for URL changes (for SPAs)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      this.checkUrlChange()
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      this.checkUrlChange()
    }

    // Also listen for popstate events
    window.addEventListener("popstate", () => {
      this.checkUrlChange()
    })

    this.logger.debug("URL monitoring started")
  }

  private startTimeout(): void {
    this.timeoutId = window.setTimeout(() => {
      this.logger.info("Page monitor timeout reached")
      this.handleTimeout()
    }, this.config.timeoutMs)

    this.logger.debug(`Timeout set for ${this.config.timeoutMs}ms`)
  }

  private handleTitleChange(newTitle: string): void {
    if (!this.config.enabledHandlers.titleChange) {
      this.logger.debug("Title change handlers disabled, skipping")
      return
    }

    const oldTitle = this.currentTitle
    this.currentTitle = newTitle

    this.logger.info(`Title changed: "${oldTitle}" -> "${newTitle}"`)

    // Execute all registered title change handlers
    this.config.handlers.titleChange.forEach((handler) => {
      try {
        handler.handle(newTitle, oldTitle)
        this.logger.debug(`Executed title change handler: ${handler.name}`)
      } catch (error) {
        this.logger.error(`Error in title change handler ${handler.name}: ${error}`)
      }
    })

    // Stop monitoring only if configured to do so
    if (this.config.stopOnFirstTitleChange) {
      this.logger.debug("Configured to stop on first title change - stopping monitor")
      this.stop()
    } else {
      this.logger.debug("Configured to continue monitoring after title change")
    }
  }

  private handleTimeout(): void {
    if (!this.config.enabledHandlers.timeout) {
      this.logger.debug("Timeout handlers disabled, skipping")
      return
    }

    this.logger.info("Page monitor timeout triggered")

    // Execute all registered timeout handlers
    this.config.handlers.timeout.forEach((handler) => {
      try {
        handler.handle()
        this.logger.debug(`Executed timeout handler: ${handler.name}`)
      } catch (error) {
        this.logger.error(`Error in timeout handler ${handler.name}: ${error}`)
      }
    })

    // Stop monitoring (timeout always stops)
    this.stop()
  }

  private checkUrlChange(): void {
    const newUrl = window.location.href
    if (newUrl !== this.currentUrl) {
      if (!this.config.enabledHandlers.urlChange) {
        this.logger.debug("URL change handlers disabled, skipping")
        this.currentUrl = newUrl // Still update the URL
        return
      }

      const oldUrl = this.currentUrl
      this.currentUrl = newUrl

      this.logger.info(`URL changed: "${oldUrl}" -> "${newUrl}"`)

      // Execute all registered URL change handlers
      this.config.handlers.urlChange.forEach((handler) => {
        try {
          handler.handle(newUrl, oldUrl)
          this.logger.debug(`Executed URL change handler: ${handler.name}`)
        } catch (error) {
          this.logger.error(`Error in URL change handler ${handler.name}: ${error}`)
        }
      })

      // Stop monitoring only if configured to do so
      if (this.config.stopOnFirstUrlChange) {
        this.logger.debug("Configured to stop on first URL change - stopping monitor")
        this.stop()
      } else {
        this.logger.debug("Configured to continue monitoring after URL change")
      }
    }
  }

  // Public methods for external control
  getCurrentTitle(): string {
    return this.currentTitle
  }

  getCurrentUrl(): string {
    return this.currentUrl
  }

  isRunning(): boolean {
    return this.isMonitoring
  }

  getHandlerCount(): { titleChange: number; timeout: number; urlChange: number } {
    return {
      titleChange: this.config.handlers.titleChange.length,
      timeout: this.config.handlers.timeout.length,
      urlChange: this.config.handlers.urlChange.length,
    }
  }

  getEnabledHandlers(): { titleChange: boolean; timeout: boolean; urlChange: boolean } {
    return { ...this.config.enabledHandlers }
  }

  getStopBehavior(): { stopOnFirstTitleChange: boolean; stopOnFirstUrlChange: boolean } {
    return {
      stopOnFirstTitleChange: this.config.stopOnFirstTitleChange,
      stopOnFirstUrlChange: this.config.stopOnFirstUrlChange,
    }
  }
}
