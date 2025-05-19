import { Logger } from "../types/extension.js"

export class FormFillerService {
  constructor(private logger: Logger) {}

  fillTextbox(textbox: HTMLElement, text: string): void {
    this.logger.debug(`Filling textbox with: ${text.substring(0, 50)}...`)

    if (textbox.contentEditable === "true") {
      // Handle contenteditable elements (like ProseMirror)
      textbox.focus()

      // Clear existing content first
      textbox.textContent = ""

      // Insert plain text using execCommand to ensure formatting is not preserved
      // This mimics paste-without-formatting behavior
      document.execCommand("insertText", false, text)

      // If execCommand is deprecated in your environment, use this alternative:
      if (!textbox.textContent) {
        // Fallback approach
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(textbox)
        range.collapse(true)
        sel?.removeAllRanges()
        sel?.addRange(range)

        // Insert the plain text
        textbox.textContent = text
      }

      // Trigger input events
      const inputEvent = new Event("input", { bubbles: true })
      textbox.dispatchEvent(inputEvent)

      const changeEvent = new Event("change", { bubbles: true })
      textbox.dispatchEvent(changeEvent)
    } else if (textbox instanceof HTMLInputElement || textbox instanceof HTMLTextAreaElement) {
      // Handle input/textarea elements
      textbox.focus()

      // For input/textarea, simply setting the value already strips formatting
      textbox.value = text

      // Trigger events
      const inputEvent = new Event("input", { bubbles: true })
      textbox.dispatchEvent(inputEvent)

      const changeEvent = new Event("change", { bubbles: true })
      textbox.dispatchEvent(changeEvent)
    }

    this.logger.info("Text filled successfully")
  }

  // Add a specific method for paste-without-formatting
  pasteWithoutFormatting(textbox: HTMLElement, text: string): void {
    this.logger.debug(`Pasting text without formatting: ${text.substring(0, 50)}...`)

    // Save selection state if element is focused
    const activeElement = document.activeElement
    const wasActive = activeElement === textbox

    if (textbox.contentEditable === "true") {
      textbox.focus()

      // Use clipboard API if available
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        // Modern approach using clipboard API
        navigator.clipboard
          .writeText(text)
          .then(() => {
            // Execute paste as plain text using execCommand
            document.execCommand("insertText", false, text)
          })
          .catch((err) => {
            this.logger.error(`Clipboard API error: ${err}`)
            // Fallback to direct insertion
            textbox.textContent = text
          })
      } else {
        // Fallback for browsers without clipboard API support
        document.execCommand("insertText", false, text)
      }

      const inputEvent = new Event("input", { bubbles: true })
      textbox.dispatchEvent(inputEvent)
    } else if (textbox instanceof HTMLInputElement || textbox instanceof HTMLTextAreaElement) {
      textbox.focus()

      // Basic form elements store plain text only
      const selStart = textbox.selectionStart || 0
      const selEnd = textbox.selectionEnd || 0
      const textBefore = textbox.value.substring(0, selStart)
      const textAfter = textbox.value.substring(selEnd)

      // Insert plain text at cursor position
      textbox.value = textBefore + text + textAfter

      // Reset cursor position after the inserted text
      textbox.selectionStart = textbox.selectionEnd = selStart + text.length

      const inputEvent = new Event("input", { bubbles: true })
      textbox.dispatchEvent(inputEvent)
    }

    // Restore focus if element was not previously focused
    if (!wasActive && activeElement instanceof HTMLElement) {
      activeElement.focus()
    }

    this.logger.info("Text pasted without formatting successfully")
  }

  submitForm(submitButton: HTMLElement): void {
    this.logger.debug("Submitting form")

    // Add a small delay to ensure the text is processed
    setTimeout(() => {
      submitButton.click()
      this.logger.info("Form submitted successfully")
    }, 500)
  }
}
