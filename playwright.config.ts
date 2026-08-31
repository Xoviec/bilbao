import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

// W tym środowisku Chromium jest preinstalowany; w CI używana jest wersja zarządzana.
const PREINSTALLED = "/opt/pw-browsers/chromium";
const executablePath = existsSync(PREINSTALLED) ? PREINSTALLED : undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: true,
  reporter: "list",
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: "http://localhost:4173",
    launchOptions: {
      executablePath,
      // SwiftShader dla WebGL (MapLibre) w headless.
      args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
    },
  },
});
