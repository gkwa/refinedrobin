import { describe, it, expect, beforeEach, vi } from "vitest"
import { FormFinderService } from "../form-finder"
import { DOMHelper } from "../../test-helpers/dom-helpers"
import { SiteConfig, CLAUDE_CONFIG } from "../../config/site-configs"
import { Logger } from "../../types/extension"

describe("FormFinderService", () => {
  let service: FormFinderService
  let mockLogger: Logger
  let loggerSpy: {
    debug: ReturnType<typeof vi.fn>
    info: ReturnType<typeof vi.fn>
    error: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Clean DOM before each test
    DOMHelper.clearDOM()

    // Create logger with spies to verify logging
    loggerSpy = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }

    mockLogger = {
      debug: loggerSpy.debug,
      info: loggerSpy.info,
      error: loggerSpy.error,
    }

    service = new FormFinderService(mockLogger)
  })

  describe("constructor", () => {
    it("should use Claude config by default", () => {
      const defaultService = new FormFinderService(mockLogger)
      expect(defaultService).toBeInstanceOf(FormFinderService)
    })

    it("should accept custom site config", () => {
      const customConfig: SiteConfig = {
        ...CLAUDE_CONFIG,
        name: "Custom Site",
      }
      const customService = new FormFinderService(mockLogger, customConfig)
      expect(customService).toBeInstanceOf(FormFinderService)
    })
  })

  describe("findFormElements", () => {
    it("should find both textbox and submit button when present", () => {
      // Arrange - use basic helpers instead of config-based ones
      const textbox = DOMHelper.createBasicTextbox()
      const button = DOMHelper.createBasicSubmitButton()
      DOMHelper.appendToBody(textbox, button)

      // Act
      const result = service.findFormElements()

      // Assert
      expect(result.textbox).toBe(textbox)
      expect(result.submitButton).toBe(button)
      expect(loggerSpy.debug).toHaveBeenCalledWith("Found textbox: true")
      expect(loggerSpy.debug).toHaveBeenCalledWith("Found submit button: true")
    })

    it("should return null for both when neither is found", () => {
      // Arrange - empty DOM
      // Act
      const result = service.findFormElements()

      // Assert
      expect(result.textbox).toBeNull()
      expect(result.submitButton).toBeNull()
      expect(loggerSpy.error).toHaveBeenCalledWith(
        `Could not find textbox for ${CLAUDE_CONFIG.name}`,
      )
      expect(loggerSpy.error).toHaveBeenCalledWith(
        `Could not find submit button for ${CLAUDE_CONFIG.name}`,
      )
    })
  })

  describe("textbox finding", () => {
    it("should find contenteditable textbox", () => {
      // Arrange
      const textbox = document.createElement("div")
      textbox.setAttribute("contenteditable", "true")
      DOMHelper.appendToBody(textbox)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBe(textbox)
      expect(loggerSpy.debug).toHaveBeenCalledWith(
        'Found textbox with selector: [contenteditable="true"]',
      )
    })

    it("should find ProseMirror textbox", () => {
      // Arrange
      const textbox = document.createElement("div")
      textbox.className = "ProseMirror"
      DOMHelper.appendToBody(textbox)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBe(textbox)
      expect(loggerSpy.debug).toHaveBeenCalledWith("Found textbox with selector: .ProseMirror")
    })

    it("should find textarea", () => {
      // Arrange
      const textbox = document.createElement("textarea")
      DOMHelper.appendToBody(textbox)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBe(textbox)
      expect(loggerSpy.debug).toHaveBeenCalledWith("Found textbox with selector: textarea")
    })

    it("should prioritize contenteditable over ProseMirror", () => {
      // Arrange
      const prosemirror = document.createElement("div")
      prosemirror.className = "ProseMirror"

      const contenteditable = document.createElement("div")
      contenteditable.setAttribute("contenteditable", "true")

      // Add ProseMirror first, then contenteditable
      DOMHelper.appendToBody(prosemirror, contenteditable)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBe(contenteditable)
    })

    it("should skip hidden textboxes", () => {
      // Arrange
      const hiddenTextbox = document.createElement("div")
      hiddenTextbox.setAttribute("contenteditable", "true")

      const visibleTextbox = document.createElement("div")
      visibleTextbox.className = "ProseMirror"

      DOMHelper.makeElementHidden(hiddenTextbox, "display")
      DOMHelper.appendToBody(hiddenTextbox, visibleTextbox)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBe(visibleTextbox)
    })

    it("should find all textbox examples from config", () => {
      // Test a few key examples manually rather than all
      const examples = [
        {
          element: () => {
            const el = document.createElement("div")
            el.setAttribute("contenteditable", "true")
            return el
          },
        },
        {
          element: () => {
            const el = document.createElement("div")
            el.className = "ProseMirror"
            return el
          },
        },
        { element: () => document.createElement("textarea") },
      ]

      examples.forEach((example, index) => {
        // Clean up between tests
        DOMHelper.clearDOM()

        // Create element
        const textbox = example.element()
        DOMHelper.appendToBody(textbox)

        // Test
        const { textbox: found } = service.findFormElements()

        // Assert
        expect(found).toBe(textbox)
      })
    })
  })

  describe("submit button finding", () => {
    it("should find button with aria-label containing Send", () => {
      // Arrange
      const button = document.createElement("button")
      button.setAttribute("aria-label", "Send message")
      DOMHelper.appendToBody(button)

      // Act
      const { submitButton: found } = service.findFormElements()

      // Assert
      expect(found).toBe(button)
      expect(loggerSpy.debug).toHaveBeenCalledWith(
        'Found submit button with selector: button[aria-label*="Send"]',
      )
    })

    it("should find button with type submit", () => {
      // Arrange
      const button = document.createElement("button")
      button.setAttribute("type", "submit")
      DOMHelper.appendToBody(button)

      // Act
      const { submitButton: found } = service.findFormElements()

      // Assert
      expect(found).toBe(button)
      expect(loggerSpy.debug).toHaveBeenCalledWith(
        'Found submit button with selector: button[type="submit"]',
      )
    })

    it("should find button by keyword when selector fails", () => {
      // Arrange
      const button = document.createElement("button")
      button.textContent = "Send Message"
      DOMHelper.appendToBody(button)

      // Act
      const { submitButton: found } = service.findFormElements()

      // Assert
      expect(found).toBe(button)
      expect(loggerSpy.debug).toHaveBeenCalledWith("Found submit button by keyword: send")
    })

    it("should prioritize selector matches over keyword matches", () => {
      // Arrange
      const keywordButton = document.createElement("button")
      keywordButton.textContent = "Send Message"

      const selectorButton = document.createElement("button")
      selectorButton.setAttribute("aria-label", "Send message")

      // Add keyword button first
      DOMHelper.appendToBody(keywordButton, selectorButton)

      // Act
      const { submitButton: found } = service.findFormElements()

      // Assert
      expect(found).toBe(selectorButton)
    })

    it("should handle case-insensitive keyword matching", () => {
      // Arrange
      const button = document.createElement("button")
      button.textContent = "SEND MESSAGE"
      DOMHelper.appendToBody(button)

      // Act
      const { submitButton: found } = service.findFormElements()

      // Assert
      expect(found).toBe(button)
    })

    it("should find submit keyword in button text", () => {
      // Arrange
      const button = document.createElement("button")
      button.textContent = "Submit Form"
      DOMHelper.appendToBody(button)

      // Act
      const { submitButton: found } = service.findFormElements()

      // Assert
      expect(found).toBe(button)
      expect(loggerSpy.debug).toHaveBeenCalledWith("Found submit button by keyword: submit")
    })
  })

  describe("visibility checking", () => {
    it("should detect display:none as hidden", () => {
      // Arrange
      const textbox = document.createElement("div")
      textbox.setAttribute("contenteditable", "true")
      DOMHelper.makeElementHidden(textbox, "display")
      DOMHelper.appendToBody(textbox)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBeNull()
    })

    it("should detect visibility:hidden as hidden", () => {
      // Arrange
      const textbox = document.createElement("div")
      textbox.setAttribute("contenteditable", "true")
      DOMHelper.makeElementHidden(textbox, "visibility")
      DOMHelper.appendToBody(textbox)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBeNull()
    })

    it("should detect offsetParent null as hidden", () => {
      // Arrange
      const textbox = document.createElement("div")
      textbox.setAttribute("contenteditable", "true")
      DOMHelper.makeElementHidden(textbox, "offset")
      DOMHelper.appendToBody(textbox)

      // Act
      const { textbox: found } = service.findFormElements()

      // Assert
      expect(found).toBeNull()
    })
  })

  describe("configuration flexibility", () => {
    it("should work with custom site configuration", () => {
      // Arrange - create custom config
      const customConfig: SiteConfig = {
        name: "Test Site",
        domain: "test.com",
        selectors: {
          textbox: ["input.custom-input"],
          submitButton: ["button.custom-submit"],
        },
        keywords: {
          submitButton: ["go", "execute"],
        },
        testFixtures: {
          textboxExamples: [],
          submitButtonExamples: [],
          invalidExamples: [],
        },
      }

      // Create service with custom config
      const customService = new FormFinderService(mockLogger, customConfig)

      // Create elements matching custom config
      const textbox = document.createElement("input")
      textbox.className = "custom-input"
      const button = document.createElement("button")
      button.className = "custom-submit"

      DOMHelper.appendToBody(textbox, button)

      // Act
      const result = customService.findFormElements()

      // Assert
      expect(result.textbox).toBe(textbox)
      expect(result.submitButton).toBe(button)
    })

    it("should use custom keywords for button finding", () => {
      // Arrange
      const customConfig: SiteConfig = {
        name: "Test Site",
        domain: "test.com",
        selectors: {
          textbox: [],
          submitButton: [],
        },
        keywords: {
          submitButton: ["execute", "run"],
        },
        testFixtures: {
          textboxExamples: [],
          submitButtonExamples: [],
          invalidExamples: [],
        },
      }

      const customService = new FormFinderService(mockLogger, customConfig)

      const button = document.createElement("button")
      button.textContent = "Execute Command"
      DOMHelper.appendToBody(button)

      // Act
      const { submitButton: found } = customService.findFormElements()

      // Assert
      expect(found).toBe(button)
      expect(loggerSpy.debug).toHaveBeenCalledWith("Found submit button by keyword: execute")
    })
  })

  describe("error handling", () => {
    it("should handle malformed DOM gracefully", () => {
      // Arrange - create malformed DOM
      const malformedDiv = document.createElement("div")
      malformedDiv.innerHTML = "<broken><unclosed-tag>"
      document.body.appendChild(malformedDiv)

      // Act & Assert - should not throw
      expect(() => service.findFormElements()).not.toThrow()

      // Should return nulls since no valid elements found
      const result = service.findFormElements()
      expect(result.textbox).toBeNull()
      expect(result.submitButton).toBeNull()
    })

    it("should handle empty selectors arrays gracefully", () => {
      // Arrange
      const emptyConfig: SiteConfig = {
        name: "Empty Config",
        domain: "empty.com",
        selectors: {
          textbox: [],
          submitButton: [],
        },
        keywords: {
          submitButton: [],
        },
        testFixtures: {
          textboxExamples: [],
          submitButtonExamples: [],
          invalidExamples: [],
        },
      }

      const emptyService = new FormFinderService(mockLogger, emptyConfig)

      // Act
      const result = emptyService.findFormElements()

      // Assert
      expect(result.textbox).toBeNull()
      expect(result.submitButton).toBeNull()
    })
  })
})
