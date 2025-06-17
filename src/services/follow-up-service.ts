import { Logger } from "../types/extension.js"
import { FormFinderService } from "./form-finder.js"
import { FormFillerService } from "./form-filler.js"

export class FollowUpService {
  constructor(private logger: Logger) {}

  async sendUrlFollowUp(): Promise<void> {
    this.logger.info("Starting URL follow-up process")

    try {
      // Get the current URL
      const currentUrl = window.location.href
      this.logger.debug(`Current URL: ${currentUrl}`)

      // Create the follow-up message with better context
      const followUpMessage = `This URL is for my reference since I will be printing this page - I want to know the URL of this Claude discussion: ${currentUrl}`
      this.logger.debug(`Follow-up message: ${followUpMessage}`)

      // Wait a bit for the UI to be ready for new input
      await this.delay(2000)

      // Find form elements
      const formFinder = new FormFinderService(this.logger)
      const formFiller = new FormFillerService(this.logger)

      const { textbox, submitButton } = formFinder.findFormElements()

      if (!textbox) {
        throw new Error("Textbox not found for follow-up message")
      }

      if (!submitButton) {
        throw new Error("Submit button not found for follow-up message")
      }

      // Fill and submit the follow-up message
      this.logger.info("Filling follow-up message with current URL")
      formFiller.fillTextbox(textbox, followUpMessage)

      // Add a small delay before submitting
      await this.delay(1000)

      this.logger.info("Submitting follow-up message")
      formFiller.submitForm(submitButton)

      this.logger.info("URL follow-up completed successfully")
    } catch (error) {
      this.logger.error(
        `Failed to send URL follow-up: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
