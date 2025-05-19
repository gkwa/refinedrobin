import { Logger, PageData } from "../../types/extension.js"
import { ExtractionStrategy, ExtractionResult } from "../../types/extraction.js"
import { PlainTextExtractionStrategy } from "./plain-text-strategy.js"
import { TreeWalkerExtractionStrategy } from "./tree-walker-strategy.js"
import { ReadabilityExtractionStrategy } from "./readability-strategy.js"

export class ExtractionService {
  private strategies: Map<string, ExtractionStrategy> = new Map()
  private currentStrategy: ExtractionStrategy

  constructor(
    private logger: Logger,
    strategyName?: string,
  ) {
    // Register available strategies
    this.registerStrategy(new PlainTextExtractionStrategy())
    this.registerStrategy(new TreeWalkerExtractionStrategy())
    this.registerStrategy(new ReadabilityExtractionStrategy())

    // Set default strategy
    const defaultStrategyName = strategyName || "readability"
    const strategy = this.strategies.get(defaultStrategyName)
    if (!strategy) {
      this.logger.error(`Strategy '${defaultStrategyName}' not found, falling back to plain-text`)
      this.currentStrategy = this.strategies.get("readability")!
    } else {
      this.currentStrategy = strategy
    }

    this.logger.debug(`Using extraction strategy: ${this.currentStrategy.name}`)
  }

  private registerStrategy(strategy: ExtractionStrategy): void {
    this.strategies.set(strategy.name, strategy)
    this.logger.debug(`Registered extraction strategy: ${strategy.name}`)
  }

  setStrategy(strategyName: string): boolean {
    const strategy = this.strategies.get(strategyName)
    if (strategy) {
      this.currentStrategy = strategy
      this.logger.debug(`Switched to extraction strategy: ${strategyName}`)
      return true
    } else {
      this.logger.error(`Strategy '${strategyName}' not found`)
      return false
    }
  }

  getAvailableStrategies(): { name: string; description: string }[] {
    return Array.from(this.strategies.values()).map((strategy) => ({
      name: strategy.name,
      description: strategy.description,
    }))
  }

  getCurrentStrategy(): string {
    return this.currentStrategy.name
  }

  extractPageData(document?: Document): PageData {
    const doc = document || window.document
    const url = doc.location?.href || window.location.href

    this.logger.debug(`Extracting page data using ${this.currentStrategy.name} strategy`)

    const result = this.currentStrategy.extract(doc)

    let textContent: string
    let htmlContent: string | null = null

    if (typeof result === "string") {
      textContent = result
    } else {
      textContent = result.text
      htmlContent = result.html || null
    }

    this.logger.debug(`Extracted ${textContent.length} characters from: ${url}`)
    if (htmlContent) {
      this.logger.debug(`Also extracted HTML content: ${htmlContent.length} characters`)
    }

    return { url, textContent, htmlContent }
  }

  extractPageDataWithResult(document?: Document): ExtractionResult & PageData {
    const doc = document || window.document
    const url = doc.location?.href || window.location.href

    this.logger.debug(`Extracting page data using ${this.currentStrategy.name} strategy`)

    const result = this.currentStrategy.extract(doc)

    let textContent: string
    let htmlContent: string | null = null

    if (typeof result === "string") {
      textContent = result
    } else {
      textContent = result.text
      htmlContent = result.html || null
    }

    this.logger.debug(`Extracted ${textContent.length} characters from: ${url}`)

    return {
      url,
      textContent,
      htmlContent,
      strategy: this.currentStrategy.name,
      metadata: {
        extractedAt: new Date().toISOString(),
        contentLength: textContent.length,
        htmlContentLength: htmlContent ? htmlContent.length : 0,
        strategyDescription: this.currentStrategy.description,
      },
    }
  }
}
