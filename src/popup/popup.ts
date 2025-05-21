document.addEventListener("DOMContentLoaded", () => {
  const executeBtn = document.getElementById("executeBtn") as HTMLButtonElement
  const promptMode = document.getElementById("promptMode") as HTMLSelectElement
  const promptEditor = document.getElementById("promptEditor") as HTMLTextAreaElement
  const savePromptBtn = document.getElementById("savePromptBtn") as HTMLButtonElement
  const resetPromptBtn = document.getElementById("resetPromptBtn") as HTMLButtonElement
  const editorContainer = document.getElementById("editorContainer") as HTMLDivElement
  const preferHTMLCheckbox = document.getElementById("preferHTML") as HTMLInputElement
  const autoCloseEnabledCheckbox = document.getElementById("autoCloseEnabled") as HTMLInputElement
  const autoCloseDelayInput = document.getElementById("autoCloseDelay") as HTMLInputElement
  const status = document.getElementById("status") as HTMLDivElement

  // Load custom prompt from storage or use the default
  const loadSavedPrompt = (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.storage.local.get("customPrompt", (result) => {
        if (result.customPrompt) {
          resolve(result.customPrompt)
        } else {
          // If no saved prompt, load default
          loadDefaultPrompt().then(resolve)
        }
      })
    })
  }

  // Save prompt to storage
  const savePrompt = (prompt: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ customPrompt: prompt }, resolve)
    })
  }

  // Save prompt mode to storage
  const savePromptMode = (mode: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ promptMode: mode }, resolve)
    })
  }

  // Save preferHTML setting to storage
  const savePreferHTML = (preferHTML: boolean): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ preferHTML: preferHTML }, resolve)
    })
  }

  // Save auto-close settings to storage
  const saveAutoCloseSettings = (): Promise<void> => {
    const enabled = autoCloseEnabledCheckbox.checked
    // Convert minutes to milliseconds
    const delayMinutes = parseInt(autoCloseDelayInput.value) || 3
    const delayMilliseconds = delayMinutes * 60 * 1000

    return new Promise((resolve) => {
      chrome.storage.local.set(
        {
          autoCloseEnabled: enabled,
          autoCloseDelay: delayMilliseconds,
        },
        resolve,
      )
    })
  }

  // Fetch the default prompt from config
  const loadDefaultPrompt = async (): Promise<string> => {
    try {
      const response = await fetch(chrome.runtime.getURL("config/prompt-templates.js"))
      const text = await response.text()

      // Simple regex to extract the default prompt template
      const match = text.match(/TLDR_SUMMARY_PROMPT\s*=\s*`([\s\S]*?)`/)
      if (match && match[1]) {
        return match[1].trim()
      }

      return "Error loading default prompt"
    } catch (error) {
      console.error("Failed to load default prompt:", error)
      return "Error loading default prompt"
    }
  }

  // Initialize the editor
  const initEditor = async () => {
    const defaultPrompt = await loadDefaultPrompt()
    chrome.storage.local.set({ defaultPrompt: defaultPrompt })

    const savedPrompt = await loadSavedPrompt()
    promptEditor.value = savedPrompt
  }

  // Initialize the UI
  const init = async () => {
    await initEditor()

    // Set initial UI state based on saved settings
    chrome.storage.local.get(
      ["promptMode", "preferHTML", "autoCloseEnabled", "autoCloseDelay"],
      (result) => {
        // Set prompt mode
        const savedMode = result.promptMode || "tldr"
        promptMode.value = savedMode

        if (savedMode === "custom") {
          editorContainer.classList.add("active")
        }

        // Set preferHTML checkbox state from storage
        preferHTMLCheckbox.checked = result.preferHTML === true

        // Set auto-close settings
        autoCloseEnabledCheckbox.checked = result.autoCloseEnabled === true

        if (result.autoCloseDelay) {
          // Convert milliseconds back to minutes for display
          const delayMinutes = Math.round(result.autoCloseDelay / (60 * 1000))
          autoCloseDelayInput.value = delayMinutes.toString()
        } else {
          autoCloseDelayInput.value = "3" // Default 3 minutes
        }
      },
    )
  }

  // Call init function
  init()

  // Handle prompt mode change
  promptMode.addEventListener("change", () => {
    const isCustomMode = promptMode.value === "custom"

    if (isCustomMode) {
      editorContainer.classList.add("active")
    } else {
      editorContainer.classList.remove("active")
    }

    // Save the selected mode
    savePromptMode(promptMode.value)
  })

  // Handle preferHTML checkbox change
  preferHTMLCheckbox.addEventListener("change", () => {
    savePreferHTML(preferHTMLCheckbox.checked)
  })

  // Handle auto-close checkbox change
  autoCloseEnabledCheckbox.addEventListener("change", () => {
    saveAutoCloseSettings()
  })

  // Handle auto-close delay input change
  autoCloseDelayInput.addEventListener("change", () => {
    // Ensure the value is between 1 and 60
    const value = parseInt(autoCloseDelayInput.value)
    if (value < 1) autoCloseDelayInput.value = "1"
    if (value > 60) autoCloseDelayInput.value = "60"

    saveAutoCloseSettings()
  })

  // Handle save prompt
  savePromptBtn.addEventListener("click", async () => {
    await savePrompt(promptEditor.value)
    showStatus("Custom prompt saved", "success")
  })

  // Handle reset prompt
  resetPromptBtn.addEventListener("click", async () => {
    chrome.storage.local.get("defaultPrompt", async (result) => {
      const defaultPrompt = result.defaultPrompt || (await loadDefaultPrompt())
      promptEditor.value = defaultPrompt
      await savePrompt(defaultPrompt)
      showStatus("Prompt reset to default", "success")
    })
  })

  // Handle execute button
  executeBtn.addEventListener("click", async () => {
    executeBtn.disabled = true
    executeBtn.textContent = "Executing..."

    // Save all settings first
    await saveAutoCloseSettings()

    // Get the appropriate prompt text
    let promptText = ""
    if (promptMode.value === "custom") {
      promptText = promptEditor.value
      // Save the current prompt and mode
      await savePrompt(promptText)
      await savePromptMode(promptMode.value)
    }

    try {
      // Send the selected prompt mode and text to the background script
      chrome.runtime.sendMessage(
        {
          action: "popup_execute",
          config: {
            mode: promptMode.value,
            predefinedText: promptText,
            preferHTML: preferHTMLCheckbox.checked,
            autoCloseEnabled: autoCloseEnabledCheckbox.checked,
            autoCloseDelay: parseInt(autoCloseDelayInput.value) * 60 * 1000, // Convert to milliseconds
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            showStatus("Automation started! Check the new Claude.ai tab.", "success")
          } else {
            showStatus("Automation started! Check the new Claude.ai tab.", "success")
          }
          // Close the popup after a brief delay
          setTimeout(() => {
            window.close()
          }, 1500)
        },
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      showStatus(`Error: ${errorMessage}`, "error")
    } finally {
      executeBtn.disabled = false
      executeBtn.textContent = "Execute Automation"
    }
  })

  function showStatus(message: string, type: "success" | "error"): void {
    status.textContent = message
    status.className = `status ${type}`
    status.style.display = "block"
    setTimeout(() => {
      status.style.display = "none"
    }, 3000)
  }
})
