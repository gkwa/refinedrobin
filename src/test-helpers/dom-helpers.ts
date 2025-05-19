import { SiteConfig, CLAUDE_CONFIG } from "../config/site-configs.js"

/**
 * Helper class for creating DOM elements in tests
 */
export class DOMHelper {
  /**
   * Create textbox elements based on site configuration
   */
  static createTextboxFromConfig(
    config: SiteConfig = CLAUDE_CONFIG,
    index: number = 0,
  ): HTMLElement {
    const html = config.testFixtures.textboxExamples[index]
    if (!html) {
      throw new Error(`No textbox example at index ${index} for ${config.name}`)
    }

    // Parse the HTML more carefully
    const container = document.createElement("div")
    container.innerHTML = html.trim()
    const element = container.firstElementChild as HTMLElement

    if (!element) {
      throw new Error(`Failed to create element from HTML: ${html}`)
    }

    // Ensure the element is properly configured for finding
    // This is a workaround for jsdom innerHTML parsing issues
    this.ensureElementMatchesTestCase(element, html)

    return element
  }

  /**
   * Create submit button elements based on site configuration
   */
  static createSubmitButtonFromConfig(
    config: SiteConfig = CLAUDE_CONFIG,
    index: number = 0,
  ): HTMLElement {
    const html = config.testFixtures.submitButtonExamples[index]
    if (!html) {
      throw new Error(`No submit button example at index ${index} for ${config.name}`)
    }

    const container = document.createElement("div")
    container.innerHTML = html.trim()
    const element = container.firstElementChild as HTMLElement

    if (!element) {
      throw new Error(`Failed to create element from HTML: ${html}`)
    }

    // Ensure the element is properly configured for finding
    this.ensureElementMatchesTestCase(element, html)

    return element
  }

  /**
   * Create invalid elements that should NOT be found
   */
  static createInvalidElementFromConfig(
    config: SiteConfig = CLAUDE_CONFIG,
    index: number = 0,
  ): { element: HTMLElement; reason: string } {
    const invalidExample = config.testFixtures.invalidExamples[index]
    if (!invalidExample) {
      throw new Error(`No invalid example at index ${index} for ${config.name}`)
    }

    const container = document.createElement("div")
    container.innerHTML = invalidExample.html.trim()
    const element = container.firstElementChild as HTMLElement

    if (!element) {
      throw new Error(`Failed to create element from HTML: ${invalidExample.html}`)
    }

    return { element, reason: invalidExample.reason }
  }

  /**
   * Ensure element attributes match the test case expectations
   * This helps with jsdom parsing quirks
   */
  private static ensureElementMatchesTestCase(element: HTMLElement, originalHtml: string): void {
    // For contenteditable elements
    if (originalHtml.includes('contenteditable="true"')) {
      element.setAttribute("contenteditable", "true")
    }

    // For aria-label attributes (sometimes innerHTML doesn't preserve them correctly)
    const ariaLabelMatch = originalHtml.match(/aria-label="([^"]*)"/)
    if (ariaLabelMatch) {
      element.setAttribute("aria-label", ariaLabelMatch[1])
    }

    // For data-testid attributes
    const testIdMatch = originalHtml.match(/data-testid="([^"]*)"/)
    if (testIdMatch) {
      element.setAttribute("data-testid", testIdMatch[1])
    }

    // For type attributes on inputs/buttons
    const typeMatch = originalHtml.match(/type="([^"]*)"/)
    if (typeMatch && (element.tagName === "INPUT" || element.tagName === "BUTTON")) {
      element.setAttribute("type", typeMatch[1])
    }
  }

  /**
   * Create a basic contenteditable textbox (for simple tests)
   */
  static createBasicTextbox(): HTMLElement {
    const div = document.createElement("div")
    div.setAttribute("contenteditable", "true")
    return div
  }

  /**
   * Create a basic submit button (for simple tests)
   */
  static createBasicSubmitButton(): HTMLElement {
    const button = document.createElement("button")
    button.setAttribute("aria-label", "Send message")
    return button
  }

  /**
   * Make an element hidden using various methods
   */
  static makeElementHidden(
    element: HTMLElement,
    method: "display" | "visibility" | "offset",
  ): void {
    switch (method) {
      case "display":
        element.style.display = "none"
        break
      case "visibility":
        element.style.visibility = "hidden"
        break
      case "offset":
        // Mock offsetParent to be null
        Object.defineProperty(element, "offsetParent", {
          get: () => null,
          configurable: true,
        })
        break
    }
  }

  /**
   * Append elements to document body
   */
  static appendToBody(...elements: HTMLElement[]): void {
    elements.forEach((el) => document.body.appendChild(el))
  }

  /**
   * Clear the DOM
   */
  static clearDOM(): void {
    document.body.innerHTML = ""
  }

  /**
   * Create all textbox examples from a config for testing
   */
  static createAllTextboxExamples(config: SiteConfig = CLAUDE_CONFIG): HTMLElement[] {
    return config.testFixtures.textboxExamples.map((_, index) =>
      this.createTextboxFromConfig(config, index),
    )
  }

  /**
   * Create all submit button examples from a config for testing
   */
  static createAllSubmitButtonExamples(config: SiteConfig = CLAUDE_CONFIG): HTMLElement[] {
    return config.testFixtures.submitButtonExamples.map((_, index) =>
      this.createSubmitButtonFromConfig(config, index),
    )
  }

  /**
   * Debug helper - log element details for troubleshooting
   */
  static debugElement(element: HTMLElement, label: string = "Element"): void {
    console.log(`${label}:`, {
      tagName: element.tagName,
      contentEditable: element.contentEditable,
      attributes: Array.from(element.attributes).map((attr) => `${attr.name}="${attr.value}"`),
      className: element.className,
      textContent: element.textContent,
      innerHTML: element.innerHTML,
      outerHTML: element.outerHTML,
    })
  }
}
