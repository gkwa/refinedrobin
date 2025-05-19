export interface ExtensionConfig {
  targetUrl: string
  predefinedText: string
  extractionStrategy?: string
  preferHTML?: boolean
}

export interface FormElements {
  textbox: HTMLElement | null
  submitButton: HTMLElement | null
}

export interface Logger {
  debug(message: string): void
  info(message: string): void
  error(message: string): void
}

export interface PageData {
  url: string
  textContent: string
  htmlContent?: string | null
}
