/**
 * Injectable module for page data extraction
 * This script is bundled separately and injected into pages
 */

// Base strategy class for inheritance
class BaseStrategy {
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ") // Replace multiple whitespace with single spaces
      .trim() // Remove leading/trailing whitespace
      .replace(/\n\s*\n/g, "\n") // Remove excessive line breaks
      .replace(/\r\n/g, "\n") // Normalize line breaks
  }

  removeElements(doc: Document, selectors: string[]): void {
    selectors.forEach((selector) => {
      const elements = doc.querySelectorAll(selector)
      elements.forEach((element) => element.remove())
    })
  }
}

// Plain text strategy implementation
class PlainTextStrategy extends BaseStrategy {
  readonly name = "plain-text"

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
    }
  }
}

// TreeWalker strategy implementation
class TreeWalkerStrategy extends BaseStrategy {
  readonly name = "tree-walker"

  extract(document: Document): { text: string; html?: string } {
    // Create a document fragment or div to hold found text nodes
    const container = document.createElement("div")

    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip text nodes inside non-content elements
          const parent = node.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT

          const tagName = parent.tagName.toLowerCase()
          if (["script", "style", "noscript", "template"].includes(tagName)) {
            return NodeFilter.FILTER_REJECT
          }

          // Skip if text is only whitespace
          const text = node.textContent?.trim()
          if (!text) return NodeFilter.FILTER_REJECT

          return NodeFilter.FILTER_ACCEPT
        },
      },
    )

    const textNodes: string[] = []
    let node

    // Clone parent elements for significant text nodes to preserve some structure
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim()
      if (text && text.length > 5) {
        // Only consider meaningful text
        textNodes.push(text)

        // Try to preserve some structure by cloning the parent
        if (
          node.parentElement &&
          !["body", "html", "head"].includes(node.parentElement.tagName.toLowerCase())
        ) {
          const clone = node.parentElement.cloneNode(false) as HTMLElement
          clone.textContent = text
          container.appendChild(clone)
        } else {
          // If no suitable parent, wrap in a paragraph
          const p = document.createElement("p")
          p.textContent = text
          container.appendChild(p)
        }
      }
    }

    return {
      text: this.cleanText(textNodes.join(" ")),
      html: container.innerHTML,
    }
  }
}

// Readability strategy implementation
// This is a simplified version of Readability that finds and extracts main content areas
class ReadabilityStrategy extends BaseStrategy {
  readonly name = "readability"

  extract(document: Document): { text: string; html: string } {
    try {
      // Create a clone to avoid modifying the original
      const docClone = document.cloneNode(true) as Document

      // Remove non-content elements
      this.removeElements(docClone, [
        "script",
        "style",
        "noscript",
        "template",
        "nav",
        "header",
        "footer",
        "aside",
        ".nav",
        ".header",
        ".footer",
        ".sidebar",
        ".menu",
        "[role=banner]",
        "[role=navigation]",
        "[role=complementary]",
      ])

      // Try to find the main content
      const mainContentElement = this.findMainContentElement(docClone)

      if (mainContentElement) {
        // Return both HTML and text content
        return {
          html: mainContentElement.innerHTML,
          text: this.cleanText(mainContentElement.textContent || ""),
        }
      } else {
        // Fallback to plain text extraction
        return this.fallbackExtraction(docClone)
      }
    } catch (error) {
      console.warn(
        `Readability extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return this.fallbackExtraction(document)
    }
  }

  private findMainContentElement(doc: Document): Element | null {
    // Try common selectors for main content
    const contentSelectors = [
      "article",
      "main",
      "[role=main]",
      ".content",
      ".post",
      ".article",
      "#content",
      "#main",
      ".main-content",
      ".post-content",
      ".article-content",
    ]

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector)
      if (element && element.textContent && element.textContent.trim().length > 100) {
        return element
      }
    }

    // If no content found with selectors, create a container for paragraphs
    const paragraphs = Array.from(doc.querySelectorAll("p"))
    if (paragraphs.length > 0) {
      // Create a container element for paragraphs
      const container = doc.createElement("div")
      container.className = "readability-content"

      // Append paragraph elements to container
      paragraphs.forEach((p) => {
        container.appendChild(p.cloneNode(true))
      })

      return container
    }

    return null
  }

  private fallbackExtraction(document: Document): { text: string; html: string } {
    // Create a clone to avoid modifying the original
    const docClone = document.cloneNode(true) as Document

    // Remove non-content elements
    this.removeElements(docClone, ["script", "style", "noscript", "template"])

    // Get body or document element
    const bodyElement = docClone.body || docClone.documentElement

    return {
      html: bodyElement.innerHTML || "",
      text: this.cleanText(bodyElement.textContent || bodyElement.innerText || ""),
    }
  }
}

/**
 * Extract page data using the specified strategy
 * This is the main exported function that will be called after injection
 */
export function extractPageData(strategyName = "readability") {
  const url = window.location.href

  let strategy
  switch (strategyName) {
    case "tree-walker":
      strategy = new TreeWalkerStrategy()
      break
    case "readability":
      strategy = new ReadabilityStrategy()
      break
    case "plain-text":
    default:
      strategy = new PlainTextStrategy()
      break
  }

  const content = strategy.extract(document)

  return {
    url,
    textContent: content.text,
    htmlContent: content.html || null,
    strategy: strategyName,
  }
}

// Export the function to make it available on the window object
// This is necessary for the injection to work properly
;(window as any).extractPageData = extractPageData
