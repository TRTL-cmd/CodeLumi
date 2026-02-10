import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
