import { defineConfig } from "vite"
import { resolve } from "path"
import { copyFileSync, mkdirSync } from "fs"

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
        popup: resolve(__dirname, "src/popup/popup.ts"),
        injectable: resolve(__dirname, "src/injectable/extract-page-data.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        // Use ES modules for Chrome extension
        format: "es",
        // Ensure all modules are bundled together to avoid dynamic import issues
        inlineDynamicImports: false,
        manualChunks: undefined,
        // Disable code splitting for simpler extension loading
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    copyPublicDir: false,
    // Ensure proper module handling
    target: "esnext",
    minify: false,
    // Prevent module splitting issues
    lib: undefined,
  },
  publicDir: false,
  plugins: [
    {
      name: "copy-files",
      writeBundle() {
        // Copy manifest.json and popup.html to dist
        copyFileSync("src/manifest.json", "dist/manifest.json")
        copyFileSync("src/popup/popup.html", "dist/popup.html")

        // Create config directory and copy markdown file
        try {
          mkdirSync("dist/config", { recursive: true })
          copyFileSync("src/config/prompt-templates.md", "dist/config/prompt-templates.md")
        } catch (err) {
          console.error("Error copying config files:", err)
        }
      },
    },
  ],
})
