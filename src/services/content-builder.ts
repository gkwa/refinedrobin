import { Logger, PageData } from "../types/extension.js"

export class ContentBuilderService {
  constructor(private logger: Logger) {}

  private buildContentTemplate(url: string, predefinedText: string, content: string): string {
    return `
    <my_initial_request>
    <source_url>${url}</source_url>
    <boilerplate_text>
${predefinedText}
    </boilerplate_text>
<page_content>
${content}
</page_content>
</my_initial_request>

`
  }

  buildFormContent(predefinedText: string, pageData: PageData): string {
    this.logger.debug("Building form content with page data")
    // Construct the new string buffer containing:
    // 1. The URL
    // 2. The predefined message
    // 3. The text of the page
    const content = this.buildContentTemplate(pageData.url, predefinedText, pageData.textContent)
    this.logger.debug(`Built content with total length: ${content.length} characters`)
    return content
  }

  // Method to build content with better formatting
  buildFormattedContent(predefinedText: string, pageData: PageData): string {
    this.logger.debug("Building formatted form content")
    const content = this.buildContentTemplate(pageData.url, predefinedText, pageData.textContent)
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
    const content = this.buildContentTemplate(pageData.url, predefinedText, contentToUse)
    this.logger.debug(`Built content with total length: ${content.length} characters`)
    return content
  }
}
