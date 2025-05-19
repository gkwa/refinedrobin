document.addEventListener("DOMContentLoaded", () => {
  const executeBtn = document.getElementById("executeBtn") as HTMLButtonElement
  const promptMode = document.getElementById("promptMode") as HTMLSelectElement
  const promptEditor = document.getElementById("promptEditor") as HTMLTextAreaElement
  const savePromptBtn = document.getElementById("savePromptBtn") as HTMLButtonElement
  const resetPromptBtn = document.getElementById("resetPromptBtn") as HTMLButtonElement
  const editorContainer = document.getElementById("editorContainer") as HTMLDivElement
  const status = document.getElementById("status") as HTMLDivElement

  // Load custom prompt from storage or use the default
  const loadSavedPrompt = (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.storage.local.get("customPrompt", (result) => {
        if (result.customPrompt) {
          resolve(result.customPrompt);
        } else {
          // If no saved prompt, load default
          loadDefaultPrompt().then(resolve);
        }
      });
    });
  }

  // Save prompt to storage
  const savePrompt = (prompt: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ "customPrompt": prompt }, resolve);
    });
  }

  // Save prompt mode to storage
  const savePromptMode = (mode: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ "promptMode": mode }, resolve);
    });
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
    chrome.storage.local.set({ "defaultPrompt": defaultPrompt });
    
    const savedPrompt = await loadSavedPrompt();
    promptEditor.value = savedPrompt;
  }

  // Initialize the UI
  const init = async () => {
    await initEditor()
    
    // Set initial UI state based on saved mode
    chrome.storage.local.get("promptMode", (result) => {
      const savedMode = result.promptMode || "tldr";
      promptMode.value = savedMode;
      
      if (savedMode === "custom") {
        editorContainer.classList.add("active");
      }
    });
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
    savePromptMode(promptMode.value);
  })

  // Handle save prompt
  savePromptBtn.addEventListener("click", async () => {
    await savePrompt(promptEditor.value);
    showStatus("Custom prompt saved", "success")
  })

  // Handle reset prompt
  resetPromptBtn.addEventListener("click", async () => {
    chrome.storage.local.get("defaultPrompt", async (result) => {
      const defaultPrompt = result.defaultPrompt || await loadDefaultPrompt();
      promptEditor.value = defaultPrompt;
      await savePrompt(defaultPrompt);
      showStatus("Prompt reset to default", "success");
    });
  })

  // Handle execute button
  executeBtn.addEventListener("click", async () => {
    executeBtn.disabled = true
    executeBtn.textContent = "Executing..."

    // Get the appropriate prompt text
    let promptText = ""
    if (promptMode.value === "custom") {
      promptText = promptEditor.value;
      // Save the current prompt and mode
      await savePrompt(promptText);
      await savePromptMode(promptMode.value);
    }

    try {
      // Send the selected prompt mode and text to the background script
      chrome.runtime.sendMessage(
        {
          action: "popup_execute",
          config: {
            mode: promptMode.value,
            predefinedText: promptText,
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
