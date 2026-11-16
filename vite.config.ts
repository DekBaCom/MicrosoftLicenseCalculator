import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change REPO_NAME to match your GitHub repository name for GitHub Pages deployment.
// e.g. if your repo is https://github.com/<user>/MicrosoftLicenseCalculator
// then REPO_NAME = "MicrosoftLicenseCalculator".
const REPO_NAME = "MicrosoftLicenseCalculator";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? `/${REPO_NAME}/` : "/",
  build: {
    outDir: "dist",
    sourcemap: false,
    // Broad browser support: Chrome/Edge 79+, Firefox 72+, Safari/iOS 13+.
    target: ["es2019", "chrome79", "edge79", "firefox72", "safari13"],
    chunkSizeWarningLimit: 900,
    cssCodeSplit: true,
  },
  server: {
    port: 5173,
    host: true,
  },
}));
