// Runs once before the tests (after the web servers start). The Firebase CLI starts
// Auth and Firestore separately, so wait until both answer. The Firestore URL is a
// real read: the emulator's first query is slow (it loads firestore.rules), and doing
// it here keeps the first tests from timing out and dropping the app into offline mode.
const EMULATORS = [
  'http://127.0.0.1:9099',
  'http://127.0.0.1:8085/v1/projects/demo-leaflet/databases/(default)/documents/organizations',
]

export default async function waitForEmulators() {
  const deadline = Date.now() + 60_000
  for (const url of EMULATORS) {
    for (;;) {
      try {
        if ((await fetch(url)).ok) break
      } catch {
        // Not up yet.
      }
      if (Date.now() > deadline) throw new Error(`Firebase emulator at ${url} did not start`)
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
}
