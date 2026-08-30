import { defineConfig } from '@playwright/test'

const port = Number(process.env.MOBILE_QA_PORT || 4173)

export default defineConfig({
  testDir: './tests',
  outputDir: 'artifacts/mobile-qa',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    channel: 'chrome',
    colorScheme: 'dark',
    locale: 'he-IL',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'compact-phone',
      use: {
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true
      }
    },
    {
      name: 'standard-phone',
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true
      }
    }
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NUXT_TELEMETRY_DISABLED: '1'
    }
  }
})
