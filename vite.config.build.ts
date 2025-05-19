import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        "popup/popup": resolve(__dirname, "src/popup/popup.html"),
        manifest: resolve(__dirname, "src/manifest.json"),
      },
      output: {
        assetFileNames: "[name].[ext]",
      },
    },
    copyPublicDir: false,
  },
  publicDir: false,
})
