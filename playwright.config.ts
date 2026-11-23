import { defineConfig, devices } from '@playwright/test'

// End-to-end tests: Playwright starts the app and clicks through it in a real
// browser. Unit tests stay in Vitest (`npm test`).
//
// Two setups, each with its own dev server:
//   e2e/demo/      Demo mode: no Firebase at all, sample data only.        Port 5174
//   e2e/emulator/  Local Firebase emulators (fake Auth + Firestore),
//                  for signing up, creating orgs, posting.                Port 5175
// Neither one ever touches the real Firebase project.

const DEMO_URL = 'http://localhost:5174'
const EMULATOR_URL = 'http://localhost:5175'

const blankFirebase = {
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
}

// "demo-" project ids are emulator-only: Firebase refuses to reach real servers with them.
const emulatorFirebase = {
  VITE_FIREBASE_API_KEY: 'fake-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
  VITE_FIREBASE_PROJECT_ID: 'demo-leaflet',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: 'demo-app',
  VITE_USE_EMULATORS: 'true',
}

// WebKit (Safari) crashes on launch on macOS 14.3, so it is left out.
// To re-enable after a macOS update, add ['webkit', devices['Desktop Safari']].
const browsers = [
  ['chromium', devices['Desktop Chrome']],
  ['firefox', devices['Desktop Firefox']],
] as const

export default defineConfig({
  globalSetup: './e2e/wait-for-emulators.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'on-first-retry' },
  projects: browsers.flatMap(([name, device]) => [
    { name: `demo-${name}`, testDir: './e2e/demo', use: { ...device, baseURL: DEMO_URL } },
    { name: `emulator-${name}`, testDir: './e2e/emulator', use: { ...device, baseURL: EMULATOR_URL } },
  ]),
  webServer: [
    {
      command: 'npx vite --port 5174 --strictPort',
      url: DEMO_URL,
      reuseExistingServer: !process.env.CI,
      env: blankFirebase,
    },
    {
      // Needs Java 21+. The first run downloads the emulators, so allow extra time.
      command: 'npx firebase emulators:start --only auth,firestore --project demo-leaflet',
      url: 'http://127.0.0.1:9099', // e2e/wait-for-emulators.ts also waits for Firestore
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      // Let the Firebase CLI shut its Java emulators down; a hard kill leaves them running.
      gracefulShutdown: { signal: 'SIGINT', timeout: 10_000 },
    },
    {
      command: 'npx vite --port 5175 --strictPort',
      url: EMULATOR_URL,
      reuseExistingServer: !process.env.CI,
      env: emulatorFirebase,
    },
  ],
})
