import { expect, test } from '@playwright/test'
import { chooseAccountType, createOrg, signUp } from './helpers'

// These run against the local Firebase emulators (see playwright.config.ts).
// Each test signs up a brand-new account, so tests never share data.

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
