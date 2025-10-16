import { Logger } from "../types/extension.js"

export class InteractionService {
  constructor(
    private logger: Logger,
    private interactionIntervalMs: number = 2000,
  ) {}

  /**
   * Simulate focus without keeping focus
   * Finds an interactive element, focuses it, then blurs it immediately
   * This should trigger Claude's focus handlers without stealing tab focus
   */
  simulateFocusPulse(): void {
    try {
      this.logger.info("Simulating focus pulse...")

      // Try to find an interactive element in Claude's interface
      const element = this.findInteractiveElement()

      if (!element) {
        this.logger.debug("No interactive element found for focus pulse")
        return
      }

      // Store the currently focused element so we can restore if needed
      const previouslyFocused = document.activeElement as HTMLElement

      this.logger.debug(`Focusing element: ${element.tagName}`)
      element.focus()

      // Immediately blur after a tiny delay
      setTimeout(() => {
        this.logger.debug("Blurring element")
        element.blur()

        // Try to restore previous focus if something had focus
        if (previouslyFocused && previouslyFocused !== document.body) {
          try {
            previouslyFocused.focus()
            this.logger.debug("Restored previous focus")
          } catch (error) {
            this.logger.debug(
              `Could not restore previous focus: ${error instanceof Error ? error.message : String(error)}`,
            )
          }
        }
      }, 50)

      this.logger.info("Focus pulse completed")
    } catch (error) {
      this.logger.error(
        `Focus pulse failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Simulate a click in the response area
   * This might trigger interaction handlers that signal "user is engaged"
   */
  simulateClickInResponseArea(): void {
    try {
      this.logger.info("Simulating click in response area...")

      const responseElement = this.findResponseContainer()

      if (!responseElement) {
        this.logger.debug("No response container found for click simulation")
        return
      }

      // Create and dispatch a click event
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })

      this.logger.debug(
        `Dispatching click event on response container: ${responseElement.tagName}`,
      )
      responseElement.dispatchEvent(clickEvent)

      this.logger.info("Click simulation completed")
    } catch (error) {
      this.logger.error(
        `Click simulation failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Run repeated focus pulses and clicks
   * These are less aggressive than forcing tab focus but may trigger Claude's completion
   */
  startInteractionSimulation(intervalMs: number = this.interactionIntervalMs): NodeJS.Timeout {
    this.logger.info(
      `Starting interaction simulation with ${intervalMs}ms interval (alternating focus and clicks)`,
    )

    let cycle = 0

    const interval = setInterval(() => {
      cycle++

      if (cycle % 2 === 1) {
        // Odd cycles: focus pulse
        this.simulateFocusPulse()
      } else {
        // Even cycles: click simulation
        this.simulateClickInResponseArea()
      }
    }, intervalMs)

    return interval
  }

  /**
   * Find an interactive element in Claude's interface
   * Prioritizes input/textarea but falls back to other elements
   */
  private findInteractiveElement(): HTMLElement | null {
    const selectors = [
      // Claude's message input
      '[contenteditable="true"]',
      ".ProseMirror",
      'textarea[placeholder*="message"]',
      "textarea",
      'input[type="text"]',
      // General interactive elements
      "button",
      "a",
    ]

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector)
      for (const element of elements) {
        if (element instanceof HTMLElement && this.isVisible(element)) {
          this.logger.debug(`Found interactive element with selector: ${selector}`)
          return element
        }
      }
    }

    this.logger.debug("No interactive element found")
    return null
  }

  /**
   * Find Claude's response container
   */
  private findResponseContainer(): HTMLElement | null {
    const selectors = [
      // Claude's response/message area
      '[data-testid="conversation"]',
      '[data-testid="messages"]',
      'div[role="region"]',
      "main",
      // Fallback
      "article",
      ".message-group",
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element instanceof HTMLElement && this.isVisible(element)) {
        this.logger.debug(`Found response container with selector: ${selector}`)
        return element
      }
    }

    // Fall back to body
    if (document.body && this.isVisible(document.body)) {
      this.logger.debug("Using document.body as response container")
      return document.body
    }

    return null
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return (
      style.display !== "none" && style.visibility !== "hidden" && element.offsetParent !== null
    )
  }
}
