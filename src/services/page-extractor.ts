import { Logger, PageData } from "../types/extension.js"
import { ExtractionService } from "./extraction/extraction-service.js"

export class PageExtractorService {
  private extractionService: ExtractionService

  constructor(
    private logger: Logger,
    strategyName?: string,
  ) {
    this.extractionService = new ExtractionService(logger, strategyName)
  }

  extractPageData(): PageData {
    return this.extractionService.extractPageData()
  }

  // Keep this method for backwards compatibility but mark as deprecated
  /** @deprecated Use extractPageData instead */
  extractCleanText(): string {
    const pageData = this.extractionService.extractPageData()
    return pageData.textContent
  }

  // New methods that expose the strategy functionality
  setExtractionStrategy(strategyName: string): boolean {
    return this.extractionService.setStrategy(strategyName)
  }

  getAvailableStrategies(): { name: string; description: string }[] {
    return this.extractionService.getAvailableStrategies()
  }

  getCurrentStrategy(): string {
    return this.extractionService.getCurrentStrategy()
  }
}
