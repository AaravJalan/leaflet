import { expect, type Page } from '@playwright/test'

export function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

/** Signs up a brand-new account and returns its email. */
export async function signUp(page: Page, name: string) {
  const email = uniqueEmail()
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Sign up' }).click()
  await page.getByLabel('Display name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  return email
}

export async function chooseAccountType(page: Page, type: 'Volunteer' | 'Organizer' | 'Both') {
  // A fresh page load, not a click: right after sign-up the auth page can still
  // fire a late redirect to the feed, which would pull a click-through away.
  await page.goto('/settings')
  await page.getByRole('button', { name: new RegExp(`^.?${type}`) }).click()
  await expect(page.getByText('Saved.')).toBeVisible()
}

/** Creates an org and returns its page URL. */
export async function createOrg(page: Page, name: string) {
  await page.goto('/orgs/new')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('About').fill('Created by a Playwright test.')
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page).toHaveURL(/\/org\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  return page.url()
}

/** From an org page you can post on, publishes an announcement and returns its URL. */
export async function postAnnouncement(page: Page, orgUrl: string, title: string) {
  await page.goto(orgUrl)
  await page.getByRole('link', { name: 'New announcement' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Details').fill('Bring gloves. Meet at the park entrance.')
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page).toHaveURL(/\/a\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  return page.url()
}
