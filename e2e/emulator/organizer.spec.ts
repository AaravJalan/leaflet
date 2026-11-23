import { expect, test, type Page } from '@playwright/test'

// These run against the local Firebase emulators (see playwright.config.ts).
// Each test signs up a brand-new account, so tests never share data.

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function signUp(page: Page, name: string) {
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Sign up' }).click()
  await page.getByLabel('Display name').fill(name)
  await page.getByLabel('Email').fill(uniqueEmail())
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
}

async function chooseAccountType(page: Page, type: 'Volunteer' | 'Organizer' | 'Both') {
  // A fresh page load, not a click: right after sign-up the auth page can still
  // fire a late redirect to the feed, which would pull a click-through away.
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await page.getByRole('button', { name: new RegExp(`^.?${type}`) }).click()
  await expect(page.getByText('Saved.')).toBeVisible()
}

async function createOrg(page: Page, name: string) {
  await page.goto('/orgs/new')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('About').fill('Created by a Playwright test.')
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page).toHaveURL(/\/org\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}

// Guard: if this fails, the tests are talking to real Firebase servers.
test('sign-up and data go to the local emulators, not real Firebase', async ({ page }) => {
  const realFirebase: string[] = []
  page.on('request', (req) => {
    if (/^(identitytoolkit|securetoken|firestore)\.googleapis\.com$/.test(new URL(req.url()).hostname)) realFirebase.push(req.url())
  })
  await signUp(page, 'Guard Check')
  await expect(page.getByText('Missing .env')).toHaveCount(0)
  expect(realFirebase).toEqual([])
})

test('a new user can sign up and log out', async ({ page }) => {
  await signUp(page, 'Test Volunteer')
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
})

test('a new user must pick an account type before creating an org', async ({ page }) => {
  await signUp(page, 'Undecided User')
  await page.goto('/orgs/new')
  await expect(page.getByRole('heading', { name: 'Organizers only' })).toBeVisible()
})

test('an organizer can create an org and post an announcement', async ({ page }) => {
  const orgName = `Test Org ${Date.now()}`
  await signUp(page, 'Test Organizer')
  await chooseAccountType(page, 'Organizer')
  await createOrg(page, orgName)

  await page.getByRole('link', { name: 'New announcement' }).click()
  await page.getByLabel('Title').fill('Playwright park cleanup')
  await page.getByLabel('Details').fill('Bring gloves. Meet at the park entrance.')
  await page.getByRole('button', { name: 'Publish' }).click()

  await expect(page).toHaveURL(/\/a\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Playwright park cleanup' })).toBeVisible()

  // The new post shows up in the main feed.
  await page.goto('/')
  await expect(page.getByText('Playwright park cleanup').first()).toBeVisible()
})

test('a volunteer can subscribe to an org', async ({ page }) => {
  await signUp(page, 'Test Subscriber')
  await chooseAccountType(page, 'Volunteer')
  await page.goto('/orgs')
  await page.getByRole('link', { name: 'NU Mutual Aid' }).click()

  await page.getByRole('button', { name: 'Subscribe' }).click()
  await expect(page.getByRole('button', { name: 'Unsubscribe' })).toBeVisible()

  await page.getByRole('button', { name: 'Unsubscribe' }).click()
  await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible()
})
