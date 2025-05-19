export interface ExtractionStrategy {
  name: string
  description: string
  extract(document: Document): { text: string; html?: string } | string
}

export interface ExtractionResult {
  strategy: string
  textContent: string
  htmlContent?: string | null
  metadata?: Record<string, any>
}
