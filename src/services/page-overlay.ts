import { Logger } from "../types/extension.js"

export interface OverlayConfig {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  autoHide?: boolean
  autoHideDelay?: number
  className?: string
}

export class PageOverlayService {
  private overlay: HTMLElement | null = null
  private autoHideTimeout: number | null = null

  constructor(
    private logger: Logger,
    private config: OverlayConfig = { position: "top-right" },
  ) {}

  show(content: string, options?: Partial<OverlayConfig>): void {
    this.logger.debug(`Showing overlay with content: ${content.substring(0, 50)}...`)

    // Remove existing overlay if present
    this.hide()

    // Merge options with config
    const finalConfig = { ...this.config, ...options }

    // Create overlay element
    this.overlay = this.createOverlayElement(content, finalConfig)

    // Add to DOM
    document.body.appendChild(this.overlay)

    // Set up auto-hide if configured
    if (finalConfig.autoHide && finalConfig.autoHideDelay) {
      this.autoHideTimeout = window.setTimeout(() => {
        this.hide()
      }, finalConfig.autoHideDelay)
    }

    this.logger.info("Page overlay displayed")
  }

  hide(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
      this.overlay = null
      this.logger.debug("Page overlay hidden")
    }

    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout)
      this.autoHideTimeout = null
    }
  }

  update(content: string): void {
    if (this.overlay) {
      const contentElement = this.overlay.querySelector(".refinedrobin-overlay-content")
      if (contentElement) {
        contentElement.textContent = content
        this.logger.debug("Page overlay content updated")
      }
    }
  }

  isVisible(): boolean {
    return this.overlay !== null && document.body.contains(this.overlay)
  }

  private createOverlayElement(content: string, config: OverlayConfig): HTMLElement {
    const overlay = document.createElement("div")
    overlay.className = `refinedrobin-overlay ${config.className || ""}`

    // Base styles
    const baseStyles = {
      position: "fixed",
      "z-index": "2147483647", // Maximum z-index
      "background-color": "rgba(0, 0, 0, 0.8)",
      color: "white",
      padding: "12px 16px",
      "border-radius": "6px",
      "font-family": "monospace",
      "font-size": "12px",
      "max-width": "300px",
      "word-wrap": "break-word",
      "box-shadow": "0 2px 10px rgba(0, 0, 0, 0.3)",
      "backdrop-filter": "blur(4px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    }

    // Position-specific styles
    const positionStyles = this.getPositionStyles(config.position)

    // Apply all styles
    Object.assign(overlay.style, baseStyles, positionStyles)

    // Create content container
    const contentDiv = document.createElement("div")
    contentDiv.className = "refinedrobin-overlay-content"
    contentDiv.textContent = content

    overlay.appendChild(contentDiv)

    return overlay
  }

  private getPositionStyles(position: OverlayConfig["position"]): Record<string, string> {
    switch (position) {
      case "top-left":
        return { top: "20px", left: "20px" }
      case "top-right":
        return { top: "20px", right: "20px" }
      case "bottom-left":
        return { bottom: "20px", left: "20px" }
      case "bottom-right":
        return { bottom: "20px", right: "20px" }
      default:
        return { top: "20px", right: "20px" }
    }
  }

  // Utility method to show URL specifically
  showUrl(url: string, label: string = "Current URL"): void {
    const content = `${label}:\n${url}`
    this.show(content, {
      position: "top-right",
      autoHide: false, // Keep visible until manually hidden
    })
  }

  // Utility method to show status updates
  showStatus(status: string, type: "info" | "success" | "error" = "info"): void {
    const colors = {
      info: "rgba(33, 150, 243, 0.9)",
      success: "rgba(76, 175, 80, 0.9)",
      error: "rgba(244, 67, 54, 0.9)",
    }

    this.show(status, {
      className: `refinedrobin-overlay-${type}`,
    })

    // Override background color based on type
    if (this.overlay) {
      this.overlay.style.backgroundColor = colors[type]
    }
  }
}
