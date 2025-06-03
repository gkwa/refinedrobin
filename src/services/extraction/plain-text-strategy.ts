import { BaseExtractionStrategy } from "./base-extraction-strategy.js"

export class PlainTextExtractionStrategy extends BaseExtractionStrategy {
  readonly name = "plain-text"
  readonly description = "Extracts all visible text content, similar to lynx -dump"

  extract(document: Document): { text: string; html?: string } {
    // Create a clone to avoid modifying the original
    const docClone = document.cloneNode(true) as Document

    // Remove script and style elements
    this.removeElements(docClone, ["script", "style", "noscript", "template"])

    // Get text content from body or document element
    const bodyElement = docClone.body || docClone.documentElement
    const textContent = bodyElement.textContent || bodyElement.innerText || ""

    return {
      text: this.cleanText(textContent),
      html: undefined,
    }
  }
}
