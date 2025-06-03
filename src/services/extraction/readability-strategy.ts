import { BaseExtractionStrategy } from "./base-extraction-strategy.js"
import Readability from "@mozilla/readability"

export class ReadabilityExtractionStrategy extends BaseExtractionStrategy {
  readonly name = "readability"
  readonly description = "Uses Mozilla Readability to extract main content"

  extract(document: Document): { text: string; html: string } {
    try {
      // Create a clone to avoid modifying the original document
      const docClone = document.cloneNode(true) as Document

      // Create a new Readability object with the cloned document
      const reader = new Readability(docClone)

      // Parse the document to extract the main content
      const article = reader.parse()

      if (article) {
        return {
          text: this.cleanText(article.textContent || ""),
          html: article.content || "",
        }
      } else {
        // Fallback if Readability couldn't parse the document
        console.warn("Readability could not parse the document, falling back to plain text")
        return this.fallbackExtraction(document)
      }
    } catch (error) {
      console.warn(
        `Readability extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return this.fallbackExtraction(document)
    }
  }

  private fallbackExtraction(document: Document): { text: string; html: string } {
    // Create a clone to avoid modifying the original
    const docClone = document.cloneNode(true) as Document

    // Remove non-content elements
    this.removeElements(docClone, ["script", "style", "noscript", "template"])

    // Get text content from body or document element
    const bodyElement = docClone.body || docClone.documentElement

    return {
      text: this.cleanText(bodyElement.textContent || bodyElement.innerText || ""),
      html: bodyElement.innerHTML || "",
    }
  }
}
