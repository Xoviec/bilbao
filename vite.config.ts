import { defineConfig } from "vite";

// Ustaw base na "/<repo>/" jeśli hostujesz na GitHub Pages w podkatalogu.
export default defineConfig({
  base: "./",
  build: {
    target: "es2021",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
