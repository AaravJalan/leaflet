import { expect, test, type Page } from '@playwright/test'

// Acceptance test: when a user hits Subscribe on an organization's page,
//   1. the org's posts show up in the Subscribed tab of their feed, and
//   2. the org shows up in the Subscribed tab of the Orgs page.
//
// Runs against the local Firebase emulators (see playwright.config.ts).
// Two separate browser contexts stand in for two people: an organizer who
// creates the org and posts, and a volunteer who subscribes. A user's own
// orgs and posts are left out of their Subscribed tabs, so one account
// can't cover both sides.

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

async function postAnnouncement(page: Page, title: string) {
  await page.getByRole('link', { name: 'New announcement' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Details').fill('Posted by a Playwright test.')
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page).toHaveURL(/\/a\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

async function openSubscribedTab(page: Page, path: '/' | '/orgs') {
  await page.goto(path)
  const tab = page.getByRole('tab', { name: 'Subscribed' })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Loading…')).toHaveCount(0)
}

test('subscribing to an org adds its posts to the feed and the org to the Orgs page', async ({ browser }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const orgName = `Subscribe Test Org ${stamp}`
  const postTitle = `Subscribe test post ${stamp}`

  // Organizer: create an org and post an announcement to it.
  const organizerContext = await browser.newContext()
  const organizer = await organizerContext.newPage()
  await signUp(organizer, 'Test Organizer')
  await chooseAccountType(organizer, 'Organizer')
  await createOrg(organizer, orgName)
  const orgUrl = organizer.url()
  await postAnnouncement(organizer, postTitle)
  await organizerContext.close()

  // Volunteer: a separate browser session with its own account.
  const volunteerContext = await browser.newContext()
  const page = await volunteerContext.newPage()
  await signUp(page, 'Test Subscriber')
  await chooseAccountType(page, 'Volunteer')

  // Before subscribing, neither the post nor the org is in a Subscribed tab.
  await openSubscribedTab(page, '/')
  await expect(page.getByRole('link', { name: postTitle })).toHaveCount(0)
  await openSubscribedTab(page, '/orgs')
  await expect(page.getByRole('link', { name: orgName })).toHaveCount(0)

  // Hit Subscribe on the organization's page.
  await page.goto(orgUrl)
  await expect(page.getByRole('heading', { level: 1, name: orgName })).toBeVisible()
  await page.getByRole('button', { name: 'Subscribe' }).click()
  await expect(page.getByRole('button', { name: 'Unsubscribe' })).toBeVisible()

  // 1. The org's post shows up in the Subscribed tab of the feed.
  await openSubscribedTab(page, '/')
  await expect(page.getByRole('link', { name: postTitle })).toBeVisible()

  // 2. The org shows up in the Subscribed tab of the Orgs page.
  await openSubscribedTab(page, '/orgs')
  await expect(page.getByRole('link', { name: orgName })).toBeVisible()

  await volunteerContext.close()
})
