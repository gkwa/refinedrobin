import { vi } from "vitest"

// Create focused mock types for what we actually use
interface MockChromeEvent {
  addListener: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
}

interface MockChrome {
  runtime: {
    onMessage: MockChromeEvent
    sendMessage: ReturnType<typeof vi.fn>
    onInstalled: MockChromeEvent
    getURL: ReturnType<typeof vi.fn>
    lastError?: { message: string }
  }
  tabs: {
    create: ReturnType<typeof vi.fn>
    query: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    onUpdated: MockChromeEvent
    sendMessage: ReturnType<typeof vi.fn>
  }
  scripting: {
    executeScript: ReturnType<typeof vi.fn>
  }
  action: {
    onClicked: MockChromeEvent
  }
  commands: {
    onCommand: MockChromeEvent
  }
  storage: {
    local: {
      get: ReturnType<typeof vi.fn>
      set: ReturnType<typeof vi.fn>
      remove: ReturnType<typeof vi.fn>
      clear: ReturnType<typeof vi.fn>
    }
  }
  alarms: {
    create: ReturnType<typeof vi.fn>
    clear: ReturnType<typeof vi.fn>
    onAlarm: MockChromeEvent
  }
}

const createEventMock = (): MockChromeEvent => ({
  addListener: vi.fn(),
  removeListener: vi.fn(),
})

// Use type assertion to override the existing chrome types
;(globalThis as any).chrome = {
  runtime: {
    onMessage: createEventMock(),
    sendMessage: vi.fn(),
    onInstalled: createEventMock(),
    getURL: vi.fn(),
    lastError: undefined,
  },
  tabs: {
    create: vi.fn(),
    query: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    onUpdated: createEventMock(),
    sendMessage: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  action: {
    onClicked: createEventMock(),
  },
  commands: {
    onCommand: createEventMock(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: createEventMock(),
  },
} satisfies MockChrome

// Mock window.fs for file operations
Object.defineProperty(window, "fs", {
  value: {
    readFile: vi.fn(),
  },
  writable: true,
})

// Mock window.getComputedStyle for visibility tests
Object.defineProperty(window, "getComputedStyle", {
  value: (element: HTMLElement) => ({
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
  get: function (this: HTMLElement) {
    if ((this as any).style.display === "none" || (this as any)._mockOffsetParent === null) {
      return null
    }
    return this.parentElement || document.body
  },
  configurable: true,
})
