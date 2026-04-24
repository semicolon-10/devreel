import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Tauri expects a fixed port
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Tell vite to ignore the rust src
      ignored: ["**/src-tauri/**"],
    },
  },

  // Don't clear the screen so Tauri logs are visible
  clearScreen: false,

  envPrefix: ["VITE_", "TAURI_"],

  build: {
    // Tauri supports es2021
    target: ["es2021", "chrome100", "safari13"],
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
  },
});