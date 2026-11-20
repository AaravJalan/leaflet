import { expect, test } from '@playwright/test'

// These run against demo mode (see playwright.config.ts), so the sample
// orgs and posts from src/data/mock.ts are always there.

test('feed lists sample events and opens one', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Newest events' })).toBeVisible()

  await page.getByText('Saturday riverbank sweep').first().click()
  await expect(page).toHaveURL(/\/a\/mock-post-sweep$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Saturday riverbank sweep' })).toBeVisible()
})

test('orgs page search narrows the list', async ({ page }) => {
  await page.goto('/orgs')
  await expect(page.getByRole('link', { name: 'NU Mutual Aid' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lakeside Volunteers' })).toBeVisible()

  await page.getByPlaceholder('Organization name').fill('lakeside')
  await expect(page.getByRole('link', { name: 'Lakeside Volunteers' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'NU Mutual Aid' })).toHaveCount(0)
})

test('orgs page type filter and empty state', async ({ page }) => {
  await page.goto('/orgs')
  await page.getByLabel('Organization type').selectOption('Neighborhood')
  await expect(page.getByRole('link', { name: 'Evanston Neighborhood Cleanup' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'NU Mutual Aid' })).toHaveCount(0)

  await page.getByPlaceholder('Organization name').fill('zzz no such org')
  await expect(page.getByText('No organizations in this view.')).toBeVisible()
})

test('clicking an org opens its detail page', async ({ page }) => {
  await page.goto('/orgs')
  await page.getByRole('link', { name: 'Rogers Park Arts Collective' }).click()
  await expect(page).toHaveURL(/\/org\/mock-arts$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Rogers Park Arts Collective' })).toBeVisible()
})

test('unknown URLs redirect to the feed', async ({ page }) => {
  await page.goto('/this-page-does-not-exist')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Newest events' })).toBeVisible()
})

// Guard: if this fails, the tests are talking to the real Firebase project.
test('tests run in demo mode, not against real Firebase', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Missing .env')).toBeVisible()
})
