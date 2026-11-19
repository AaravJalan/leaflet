import { defineConfig } from 'vitest/config'

// Firestore security rules tests. They need the Firestore emulator, so they run
// through `npm run test:rules` rather than the default `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    // Every file shares one emulator database, which each test clears.
    fileParallelism: false,
  },
})
