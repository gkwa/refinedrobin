import { Logger } from "../types/extension.js"
import { ButtonSequenceService } from "./button-sequence.js"

export class AutomationOrchestratorService {
  private buttonSequence: ButtonSequenceService

  constructor(private logger: Logger) {
    this.buttonSequence = new ButtonSequenceService(logger)
  }

  async executeAutomationSequence(): Promise<void> {
    this.logger.info("Starting automation sequence")

    const automationSteps = [this.buttonSequence.clickButtonsSequentially.bind(this.buttonSequence)]

    try {
      for (let i = 0; i < automationSteps.length; i++) {
        this.logger.debug(`Executing automation step ${i + 1}/${automationSteps.length}`)
        await automationSteps[i]()
        this.logger.debug(`Completed automation step ${i + 1}`)
      }

      this.logger.info("Automation sequence completed successfully")
    } catch (error) {
      this.logger.error(
        `Automation sequence failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }

  // Method to add more automation steps in the future
  addAutomationStep(step: () => Promise<void>): void {
    // This could be implemented to dynamically add steps
    this.logger.debug("Additional automation steps can be added here")
  }
}
