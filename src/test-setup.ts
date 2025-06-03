import { vi } from "vitest"

// Create a more complete Chrome API mock that satisfies TypeScript
const createEventMock = () => ({
  addListener: vi.fn(),
  removeListener: vi.fn(),
  getRules: vi.fn(),
  hasListener: vi.fn(),
  removeRules: vi.fn(),
  addRules: vi.fn(),
  hasListeners: vi.fn(),
})

// Mock Chrome APIs with proper typing
global.chrome = {
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
    // Add other required properties as empty functions
    executeScript: vi.fn(),
    getAllInWindow: vi.fn(),
    getCurrent: vi.fn(),
    duplicate: vi.fn(),
    highlight: vi.fn(),
    move: vi.fn(),
    reload: vi.fn(),
    update: vi.fn(),
    captureVisibleTab: vi.fn(),
    detectLanguage: vi.fn(),
    insertCSS: vi.fn(),
    removeCSS: vi.fn(),
    connect: vi.fn(),
    discard: vi.fn(),
    group: vi.fn(),
    ungroup: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    zoom: vi.fn(),
    setZoom: vi.fn(),
    getZoom: vi.fn(),
    setZoomSettings: vi.fn(),
    getZoomSettings: vi.fn(),
    onActivated: createEventMock(),
    onActiveChanged: createEventMock(),
    onAttached: createEventMock(),
    onCreated: createEventMock(),
    onDetached: createEventMock(),
    onHighlightChanged: createEventMock(),
    onHighlighted: createEventMock(),
    onMoved: createEventMock(),
    onRemoved: createEventMock(),
    onReplaced: createEventMock(),
    onSelectionChanged: createEventMock(),
    onZoomChange: createEventMock(),
    MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND: 2,
    TAB_ID_NONE: -1,
  },
  scripting: {
    executeScript: vi.fn(),
    insertCSS: vi.fn(),
    removeCSS: vi.fn(),
    registerContentScripts: vi.fn(),
    unregisterContentScripts: vi.fn(),
    getRegisteredContentScripts: vi.fn(),
    updateContentScripts: vi.fn(),
  },
  action: {
    onClicked: createEventMock(),
    setTitle: vi.fn(),
    getTitle: vi.fn(),
    setIcon: vi.fn(),
    setPopup: vi.fn(),
    getPopup: vi.fn(),
    setBadgeText: vi.fn(),
    getBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    getBadgeBackgroundColor: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  },
  commands: {
    onCommand: createEventMock(),
    getAll: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    clearAll: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    onAlarm: createEventMock(),
  },
} as any // Use 'as any' to bypass strict type checking for the mock

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
    display: (element as HTMLElement).style?.display || "block",
    visibility: (element as HTMLElement).style?.visibility || "visible",
    getPropertyValue: (prop: string) => {
      if (prop === "display") return (element as HTMLElement).style?.display || "block"
      if (prop === "visibility") return (element as HTMLElement).style?.visibility || "visible"
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
