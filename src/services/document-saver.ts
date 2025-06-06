import { Logger } from "../types/extension.js"
import { ClaudeExporterStrategy } from "../strategies/claude-exporter-strategy.js"
import { DocumentSaveStrategy } from "../types/document-save-strategy.js"

export class DocumentSaverService {
  private strategy: DocumentSaveStrategy

  constructor(private logger: Logger) {
    // Default to ClaudeExporter strategy
    // In the future, this could be configurable or auto-detected
    this.strategy = new ClaudeExporterStrategy(logger)
  }

  async saveClaudeResponse(): Promise<void> {
    this.logger.info("Starting document save process")

    try {
      await this.strategy.save()
      this.logger.info("Document save completed successfully")
    } catch (error) {
      this.logger.error(
        `Document save failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }

  // Method to switch strategies in the future
  setStrategy(strategy: DocumentSaveStrategy): void {
    this.strategy = strategy
    this.logger.info(`Document save strategy changed to: ${strategy.constructor.name}`)
  }
}
