import { Logger } from "../types/extension.js"
import { PageOverlayService } from "../services/page-overlay.js"
import { TitleChangeHandler, TimeoutHandler, UrlChangeHandler } from "../types/page-monitoring.js"

// Title Change Handlers
export class OverlayTitleChangeHandler implements TitleChangeHandler {
  readonly name = "overlay-title-change"

  constructor(
    private logger: Logger,
    private overlayService: PageOverlayService,
    private autoHideDelay: number = 10000,
  ) {}

  handle(newTitle: string, oldTitle: string): void {
    this.logger.info(`Title changed: "${oldTitle}" -> "${newTitle}"`)
    this.overlayService.showUrl(window.location.href, "Page Updated")

    setTimeout(() => {
      this.overlayService.hide()
    }, this.autoHideDelay)
  }
}

export class LogTitleChangeHandler implements TitleChangeHandler {
  readonly name = "log-title-change"

  constructor(private logger: Logger) {}

  handle(newTitle: string, oldTitle: string): void {
    this.logger.info(`[LOG HANDLER] Title changed: "${oldTitle}" -> "${newTitle}"`)
  }
}

export class VisualFeedbackTitleChangeHandler implements TitleChangeHandler {
  readonly name = "visual-feedback-title-change"

  constructor(private logger: Logger) {}

  handle(newTitle: string, oldTitle: string): void {
    this.logger.info(`[VISUAL] Title changed - showing visual feedback`)
    this.showVisualFeedback(`📄 Title changed to: ${newTitle}`, "#4CAF50")
  }

  private showVisualFeedback(message: string, color: string): void {
    const indicator = document.createElement("div")
    indicator.textContent = message
    indicator.style.cssText = `
     position: fixed;
     top: 20px;
     left: 20px;
     background: ${color};
     color: white;
     padding: 8px 12px;
     border-radius: 20px;
     font-family: Arial, sans-serif;
     font-size: 14px;
     font-weight: bold;
     z-index: 2147483647;
     box-shadow: 0 4px 12px rgba(0,0,0,0.2);
     animation: refinedrobin-bounce 0.6s ease-out;
     pointer-events: none;
     max-width: 400px;
     word-wrap: break-word;
   `

    // Add CSS animation
    if (!document.getElementById("refinedrobin-animations")) {
      const style = document.createElement("style")
      style.id = "refinedrobin-animations"
      style.textContent = `
       @keyframes refinedrobin-bounce {
         0% { transform: scale(0.3) translateY(-20px); opacity: 0; }
         50% { transform: scale(1.1) translateY(0); opacity: 1; }
         100% { transform: scale(1) translateY(0); opacity: 1; }
       }
       @keyframes refinedrobin-pulse {
         0%, 100% { transform: scale(1); }
         50% { transform: scale(1.05); }
       }
       @keyframes refinedrobin-fadeout {
         0% { opacity: 1; transform: scale(1); }
         100% { opacity: 0; transform: scale(0.8); }
       }
     `
      document.head.appendChild(style)
    }

    document.body.appendChild(indicator)

    // Auto-remove after animation
    setTimeout(() => {
      indicator.style.animation = "refinedrobin-fadeout 0.3s ease-in forwards"
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator)
        }
      }, 300)
    }, 2000)
  }
}

// Timeout Handlers
export class OverlayTimeoutHandler implements TimeoutHandler {
  readonly name = "overlay-timeout"

  constructor(
    private logger: Logger,
    private overlayService: PageOverlayService,
    private autoHideDelay: number = 5000,
  ) {}

  handle(): void {
    this.logger.info("Page monitoring timeout reached")
    this.overlayService.showUrl(window.location.href, "Monitoring Timeout")

    setTimeout(() => {
      this.overlayService.hide()
    }, this.autoHideDelay)
  }
}

export class AlertTimeoutHandler implements TimeoutHandler {
  readonly name = "alert-timeout"

  constructor(private logger: Logger) {}

  handle(): void {
    this.logger.info("Timeout reached - showing alert")
    alert("Page monitoring timeout reached!")
  }
}

export class VisualFeedbackTimeoutHandler implements TimeoutHandler {
  readonly name = "visual-feedback-timeout"

  constructor(private logger: Logger) {}

  handle(): void {
    this.logger.info(`[VISUAL] Timeout reached - showing visual feedback`)
    this.showVisualFeedback("⏰ Monitoring Timeout", "#FF9800")
  }

  private showVisualFeedback(message: string, color: string): void {
    const indicator = document.createElement("div")
    indicator.textContent = message
    indicator.style.cssText = `
     position: fixed;
     top: 20px;
     left: 20px;
     background: ${color};
     color: white;
     padding: 8px 12px;
     border-radius: 20px;
     font-family: Arial, sans-serif;
     font-size: 14px;
     font-weight: bold;
     z-index: 2147483647;
     box-shadow: 0 4px 12px rgba(0,0,0,0.2);
     animation: refinedrobin-bounce 0.6s ease-out;
     pointer-events: none;
     max-width: 400px;
     word-wrap: break-word;
   `

    // Add CSS animation (reuse the same styles as title change handler)
    if (!document.getElementById("refinedrobin-animations")) {
      const style = document.createElement("style")
      style.id = "refinedrobin-animations"
      style.textContent = `
       @keyframes refinedrobin-bounce {
         0% { transform: scale(0.3) translateY(-20px); opacity: 0; }
         50% { transform: scale(1.1) translateY(0); opacity: 1; }
         100% { transform: scale(1) translateY(0); opacity: 1; }
       }
       @keyframes refinedrobin-pulse {
         0%, 100% { transform: scale(1); }
         50% { transform: scale(1.05); }
       }
       @keyframes refinedrobin-fadeout {
         0% { opacity: 1; transform: scale(1); }
         100% { opacity: 0; transform: scale(0.8); }
       }
     `
      document.head.appendChild(style)
    }

    document.body.appendChild(indicator)

    // Auto-remove after animation
    setTimeout(() => {
      indicator.style.animation = "refinedrobin-fadeout 0.3s ease-in forwards"
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator)
        }
      }, 300)
    }, 3000) // Show timeout indicator a bit longer
  }
}

// URL Change Handlers
export class OverlayUrlChangeHandler implements UrlChangeHandler {
  readonly name = "overlay-url-change"

  constructor(
    private logger: Logger,
    private overlayService: PageOverlayService,
  ) {}

  handle(newUrl: string, oldUrl: string): void {
    this.logger.info(`URL changed: ${oldUrl} -> ${newUrl}`)
    this.overlayService.showUrl(newUrl, "URL Changed")
  }
}

export class NavigationTrackingHandler implements UrlChangeHandler {
  readonly name = "navigation-tracking"

  constructor(private logger: Logger) {}

  handle(newUrl: string, oldUrl: string): void {
    this.logger.info(`[TRACKING] Navigation: ${oldUrl} -> ${newUrl}`)
    // Could send analytics, etc.
  }
}

export class VisualFeedbackUrlChangeHandler implements UrlChangeHandler {
  readonly name = "visual-feedback-url-change"

  constructor(private logger: Logger) {}

  handle(newUrl: string, oldUrl: string): void {
    this.logger.info(`[VISUAL] URL changed - showing visual feedback`)
    this.showVisualFeedback("🔗 URL Changed", "#2196F3")
  }

  private showVisualFeedback(message: string, color: string): void {
    const indicator = document.createElement("div")
    indicator.textContent = message
    indicator.style.cssText = `
     position: fixed;
     top: 70px;
     left: 20px;
     background: ${color};
     color: white;
     padding: 8px 12px;
     border-radius: 20px;
     font-family: Arial, sans-serif;
     font-size: 14px;
     font-weight: bold;
     z-index: 2147483647;
     box-shadow: 0 4px 12px rgba(0,0,0,0.2);
     animation: refinedrobin-bounce 0.6s ease-out;
     pointer-events: none;
     max-width: 400px;
     word-wrap: break-word;
   `

    // Add CSS animation (reuse the same styles)
    if (!document.getElementById("refinedrobin-animations")) {
      const style = document.createElement("style")
      style.id = "refinedrobin-animations"
      style.textContent = `
       @keyframes refinedrobin-bounce {
         0% { transform: scale(0.3) translateY(-20px); opacity: 0; }
         50% { transform: scale(1.1) translateY(0); opacity: 1; }
         100% { transform: scale(1) translateY(0); opacity: 1; }
       }
       @keyframes refinedrobin-pulse {
         0%, 100% { transform: scale(1); }
         50% { transform: scale(1.05); }
       }
       @keyframes refinedrobin-fadeout {
         0% { opacity: 1; transform: scale(1); }
         100% { opacity: 0; transform: scale(0.8); }
       }
     `
      document.head.appendChild(style)
    }

    document.body.appendChild(indicator)

    // Auto-remove after animation
    setTimeout(() => {
      indicator.style.animation = "refinedrobin-fadeout 0.3s ease-in forwards"
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator)
        }
      }, 300)
    }, 2000)
  }
}
