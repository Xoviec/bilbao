import { defineConfig } from "vitest/config";

// Testy jednostkowe: tylko test/**/*.test.ts (e2e Playwright leży w e2e/ i jest wykluczone).
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
