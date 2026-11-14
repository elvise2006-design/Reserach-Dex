/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const target = process.env.VITE_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    port: 5173,
    proxy: {
      "/api": { target, changeOrigin: true },
      "/ws": { target, ws: true, changeOrigin: true },
      "/ready": { target, changeOrigin: true },
    },
  },
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"], globals: true, css: false },
});
