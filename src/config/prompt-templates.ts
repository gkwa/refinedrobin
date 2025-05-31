/**
 * Predefined prompt templates for different use cases
 */

/**
 * Load the TLDR Summary prompt template from markdown file
 */
export async function loadTLDRSummaryPrompt(): Promise<string> {
  try {
    const response = await fetch(chrome.runtime.getURL("config/prompt-templates.md"))
    if (!response.ok) {
      throw new Error(`Failed to load prompt template: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error("Failed to load TLDR prompt template:", error)
    // Fallback to a simple default
    return "Please create a TLDR summary of the provided content."
  }
}

/**
 * TLDR Summary prompt template (synchronous fallback)
 * This is used when the async version fails
 */
export const TLDR_SUMMARY_PROMPT_FALLBACK = `Please create a TLDR summary of the provided content.`

/**
 * Default export - currently points to the fallback prompt
 * Use loadTLDRSummaryPrompt() for the full template
 */
export const DEFAULT_PROMPT = TLDR_SUMMARY_PROMPT_FALLBACK
