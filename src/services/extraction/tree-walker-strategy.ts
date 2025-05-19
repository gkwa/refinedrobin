import { BaseExtractionStrategy } from "./base-extraction-strategy.js"

export class TreeWalkerExtractionStrategy extends BaseExtractionStrategy {
  readonly name = "tree-walker"
  readonly description = "Uses TreeWalker for more precise text node extraction"

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
