import { defineConfig } from '@playwright/test'

const remote = process.env.REVIEW_BASE_URL
export default defineConfig({
  testDir: './tests/invoice-review',
  fullyParallel: true,
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  outputDir: remote ? 'review-test-results/deployed' : 'review-test-results/local',
  reporter: [['line'], ['html', { outputFolder: 'review-playwright-report', open: 'never' }]],
  use: {
    baseURL: remote || 'http://127.0.0.1:4201',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: remote ? undefined : {
    command: 'npm run start -- --host 127.0.0.1 --port 4201',
    url: 'http://127.0.0.1:4201/login',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'minimum-mobile', use: { viewport: { width: 320, height: 720 } } },
  ],
})
