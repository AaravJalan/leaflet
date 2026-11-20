import { defineConfig, devices } from '@playwright/test'

// End-to-end tests: Playwright starts the Vite dev server and clicks through
// the real app in a browser. Unit tests stay in Vitest (`npm test`).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // WebKit (Safari) crashes on launch on macOS 14.3. Re-enable after a macOS update.
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // Separate port so it never collides with your own `npm run dev` on 5173.
    command: 'npx vite --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    // Blank Firebase keys put the app in demo mode (sample data, no network),
    // so tests never read or write the real Firestore database.
    env: {
      VITE_FIREBASE_API_KEY: '',
      VITE_FIREBASE_AUTH_DOMAIN: '',
      VITE_FIREBASE_PROJECT_ID: '',
      VITE_FIREBASE_STORAGE_BUCKET: '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '',
      VITE_FIREBASE_APP_ID: '',
    },
  },
})
