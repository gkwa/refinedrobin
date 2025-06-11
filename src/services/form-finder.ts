import { FormElements, Logger } from "../types/extension.js"
import { SiteConfig, DEFAULT_SITE_CONFIG } from "../config/site-configs.js"

export class FormFinderService {
  constructor(
    private logger: Logger,
    private config: SiteConfig = DEFAULT_SITE_CONFIG,
  ) {}

  findFormElements(): FormElements {
    const textbox = this.findTextbox()
    const submitButton = this.findSubmitButton()

    this.logger.debug(`Found textbox: ${!!textbox}`)
    this.logger.debug(`Found submit button: ${!!submitButton}`)

    return { textbox, submitButton }
  }

  findAllTextboxes(): HTMLElement[] {
    const textboxes: HTMLElement[] = []

    // Try each selector from config in order
    for (const selector of this.config.selectors.textbox) {
      const elements = document.querySelectorAll(selector)
      elements.forEach((element) => {
        if (element instanceof HTMLElement && this.isVisible(element)) {
          textboxes.push(element)
        }
      })
    }

    this.logger.debug(`Found ${textboxes.length} textboxes total`)
    return textboxes
  }

  private findTextbox(): HTMLElement | null {
    // Try each selector from config in order
    for (const selector of this.config.selectors.textbox) {
      const element = document.querySelector(selector)
      if (element instanceof HTMLElement && this.isVisible(element)) {
        this.logger.debug(`Found textbox with selector: ${selector}`)
        return element
      }
    }

    this.logger.error(`Could not find textbox for ${this.config.name}`)
    return null
  }

  private findSubmitButton(): HTMLElement | null {
    // Try selector-based finding first
    for (const selector of this.config.selectors.submitButton) {
      const element = document.querySelector(selector)
      if (element instanceof HTMLElement && this.isVisible(element)) {
        this.logger.debug(`Found submit button with selector: ${selector}`)
        return element
      }
    }

    // Fallback: try keyword-based finding
    const buttons = document.querySelectorAll("button")
    for (const button of buttons) {
      if (button instanceof HTMLElement && this.isVisible(button)) {
        const text = button.textContent?.toLowerCase() || ""

        for (const keyword of this.config.keywords.submitButton) {
          if (text.includes(keyword)) {
            this.logger.debug(`Found submit button by keyword: ${keyword}`)
            return button
          }
        }
      }
    }

    this.logger.error(`Could not find submit button for ${this.config.name}`)
    return null
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return (
      style.display !== "none" && style.visibility !== "hidden" && element.offsetParent !== null
    )
  }
}
