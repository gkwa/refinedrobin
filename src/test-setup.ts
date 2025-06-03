import { vi } from "vitest"

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    onInstalled: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    create: vi.fn(),
    query: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
}

// Mock window.fs for file operations
Object.defineProperty(window, "fs", {
  value: {
    readFile: vi.fn(),
  },
  writable: true,
})

// Mock window.getComputedStyle for visibility tests
Object.defineProperty(window, "getComputedStyle", {
  value: (element: Element) => ({
    display: element.style?.display || "block",
    visibility: element.style?.visibility || "visible",
    getPropertyValue: (prop: string) => {
      if (prop === "display") return element.style?.display || "block"
      if (prop === "visibility") return element.style?.visibility || "visible"
      return ""
    },
  }),
  writable: true,
})

// Ensure offsetParent works correctly in tests
Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  get: function () {
    if (this.style.display === "none" || this._mockOffsetParent === null) {
      return null
    }
    return this.parentElement || document.body
  },
  configurable: true,
})
