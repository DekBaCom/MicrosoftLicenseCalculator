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
    target: "es2020",
    chunkSizeWarningLimit: 900,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split large libraries into separate chunks so the initial load stays small.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("react-router")) return "router";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("xlsx")) return "xlsx";
          if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("dompurify")) return "pdf";
          if (id.includes("react") || id.includes("scheduler")) return "react";
          return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
}));
