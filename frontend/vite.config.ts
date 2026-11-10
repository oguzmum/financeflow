import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The production build lands in Spring Boot's static resources, so one container serves UI + API (ADR-0006).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../target/classes/static",
    emptyOutDir: true,
  },
  server: {
    // `npm run dev` with the backend running on :8080
    proxy: { "/api": "http://localhost:8080" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
