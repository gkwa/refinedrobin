import { ExtractionStrategy } from "../../types/extraction.js"

export abstract class BaseExtractionStrategy implements ExtractionStrategy {
  abstract readonly name: string
  abstract readonly description: string

  abstract extract(document: Document): { text: string; html?: string } | string

  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ") // Replace multiple whitespace with single spaces
      .trim() // Remove leading/trailing whitespace
      .replace(/\n\s*\n/g, "\n") // Remove excessive line breaks
      .replace(/\r\n/g, "\n") // Normalize line breaks
  }

  protected removeElements(doc: Document, selectors: string[]): void {
    selectors.forEach((selector) => {
      const elements = doc.querySelectorAll(selector)
      elements.forEach((element) => element.remove())
    })
  }
}
