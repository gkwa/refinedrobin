import { Logger, PageData } from "../types/extension.js"

export class ContentBuilderService {
  constructor(private logger: Logger) {}

  buildFormContent(predefinedText: string, pageData: PageData): string {
    this.logger.debug("Building form content with page data")

    // Construct the new string buffer containing:
    // 1. The URL
    // 2. The predefined message
    // 3. The text of the page
    const content = `${pageData.url}

${predefinedText}

${pageData.textContent}`

    this.logger.debug(`Built content with total length: ${content.length} characters`)
    return content
  }

  // Method to build content with better formatting
  buildFormattedContent(predefinedText: string, pageData: PageData): string {
    this.logger.debug("Building formatted form content")

    const content = `Source URL: ${pageData.url}

---

${predefinedText}

---

Page Content:

${pageData.textContent}`

    this.logger.debug(`Built formatted content with total length: ${content.length} characters`)
    return content
  }

  // New method that uses HTML content if available
  buildFormContentWithHTML(
    predefinedText: string,
    pageData: PageData,
    preferHTML: boolean = false,
  ): string {
    this.logger.debug(`Building form content with ${preferHTML ? "HTML" : "text"} preference`)

    // Choose content source based on preference and availability
    const contentToUse =
      preferHTML && pageData.htmlContent
        ? `<html-content>${pageData.htmlContent}</html-content>`
        : pageData.textContent

    const content = `${pageData.url}

${predefinedText}

${contentToUse}`

    this.logger.debug(`Built content with total length: ${content.length} characters`)
    return content
  }
}
