import { Logger } from "../types/extension.js"
import { ButtonSequenceService } from "./button-sequence.js"

export class AutomationOrchestratorService {
  private buttonSequence: ButtonSequenceService

  constructor(private logger: Logger) {
    this.buttonSequence = new ButtonSequenceService(logger)
  }

  async executeAutomationSequence(): Promise<void> {
    this.logger.info("Starting automation sequence")

    try {
      await this.buttonSequence.clickButtonsSequentially()
      this.logger.info("Automation sequence completed successfully")
    } catch (error) {
      this.logger.error(
        `Automation sequence failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }
}
