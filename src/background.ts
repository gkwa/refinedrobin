// Simple background script with proper error handling
const logger = {
  info: (message: string): void => console.log(`[INFO] ${message}`),
  error: (message: string): void => console.error(`[ERROR] ${message}`),
  debug: (message: string): void => console.log(`[DEBUG] ${message}`),
}
chrome.runtime.onInstalled.addListener((): void => {
  logger.info("RefinedRobin extension installed")
})
// Get saved prompt and mode from localStorage
async function getSavedPromptConfig(): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["promptMode", "customPrompt", "preferHTML"], (result) => {
      const config: any = {
        mode: result.promptMode || "tldr",
        preferHTML: result.preferHTML === true,
      }

      if (result.promptMode === "custom" && result.customPrompt) {
        config.predefinedText = result.customPrompt
      }

      resolve(config)
    })
  })
}
// Function to execute the automation
async function executeAutomation(currentTab?: chrome.tabs.Tab, config?: any): Promise<void> {
  try {
    // If no config was provided, get saved config from storage
    if (!config) {
      config = await getSavedPromptConfig()
    }

    let pageData = null
    // If we have a current tab, extract its page data first
    if (currentTab && currentTab.id && currentTab.url && !currentTab.url.includes("claude.ai")) {
      try {
        logger.debug(`Extracting page data from: ${currentTab.url}`)
        // Inject our injectable script
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ["injectable.js"],
        })
        // Now execute the extractPageData function from the injected script
        const results = await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: () => {
            // The extractPageData function is now available on the window
            return (window as any).extractPageData("readability")
          },
        })
        if (results && results[0] && results[0].result) {
          pageData = results[0].result
          logger.debug(`Extracted page data from: ${pageData.url}`)
        }
      } catch (error) {
        logger.error(
          `Failed to extract page data: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
        // Continue with automation even if page extraction fails
      }
    }
    // Create a new tab with Claude.ai but without stealing focus
    const newTab = await chrome.tabs.create({
      url: "https://claude.ai/new",
      active: false, // This prevents the new tab from stealing focus
    })
    // Wait for the tab to load, then execute the automation
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === newTab.id && changeInfo.status === "complete") {
        // Remove this listener to avoid memory leaks
        chrome.tabs.onUpdated.removeListener(listener)
        // Execute the content script automation with the page data
        if (newTab.id) {
          chrome.tabs
            .sendMessage(newTab.id, {
              action: "execute",
              pageData: pageData,
              config: config,
            })
            .then((response) => {
              if (response?.success) {
                logger.info("Extension executed successfully")
              } else {
                logger.error(`Execution failed: ${response?.error || "Unknown error"}`)
              }
            })
            .catch((error) => {
              logger.error(`Failed to send message to content script: ${error.message}`)
            })
        }
      }
    })
  } catch (error) {
    logger.error(
      `Failed to create tab: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}
// Handle browser action click (when user clicks the extension icon)
chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab): Promise<void> => {
  await executeAutomation(tab)
})
// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command: string): Promise<void> => {
  logger.debug(`Command received: ${command}`)
  if (command === "execute-automation") {
    // Get the current active tab for page extraction
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]
    logger.info("Keyboard shortcut triggered automation")
    await executeAutomation(currentTab)
  }
})
// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "popup_execute") {
    // Get the current active tab for page extraction
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0]
      executeAutomation(currentTab, message.config)
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          logger.error(`Popup execution failed: ${error.message}`)
          sendResponse({ success: false, error: error.message })
        })
    })
    return true // Indicates we will send a response asynchronously
  }
})
