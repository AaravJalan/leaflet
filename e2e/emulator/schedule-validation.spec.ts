import { expect, test } from '@playwright/test'
import { chooseAccountType, createOrg, signUp } from './helpers'

// Acceptance test: when a user creates an announcement,
// they cannot set an end time/date that is before the start time/date.
//
// Covers both schedule modes:
//   "One time" — datetime-local inputs for Starts / Ends
//   "Weekly"   — time inputs for Start time / End time

// ---------------------------------------------------------------------------
// Given: a signed-in organizer on the New Announcement form (one-time mode).
// When:  they set an end date/time that is before the start date/time
//        and try to publish.
// Then:  the form shows an error and does NOT navigate away.
// ---------------------------------------------------------------------------
test('one-time announcement rejects an end date before the start date', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  // Given: a signed-in organizer who owns an org.
  await signUp(page, 'Test Organizer')
  await chooseAccountType(page, 'Organizer')
  const orgUrl = await createOrg(page, `Schedule Test Org ${Date.now()}`)

  // Navigate to the New Announcement form.
  await page.goto(orgUrl)
  await page.getByRole('link', { name: 'New announcement' }).click()
  await expect(page.getByRole('heading', { name: 'New announcement' })).toBeVisible()

  // Fill in a title so the form is otherwise valid.
  await page.getByLabel('Title').fill('End Before Start Test')
  await page.getByLabel('Details').fill('This post should not be saved.')

  // When: set Ends before Starts (end is 1 hour before start).
  await page.getByLabel('Starts').fill('2027-06-15T14:00')
  await page.getByLabel('Ends').fill('2027-06-15T13:00')
  await page.getByRole('button', { name: 'Publish' }).click()

  // Then: an error message appears and we are still on the create page.
  await expect(page.getByText(/end.*after.*start|start.*before.*end/i)).toBeVisible()
  await expect(page).not.toHaveURL(/\/a\/[^/]+$/)

  await context.close()
})

// ---------------------------------------------------------------------------
// Given: a signed-in organizer on the New Announcement form (one-time mode).
// When:  they set the end date/time equal to the start date/time
//        and try to publish.
// Then:  the form shows an error and does NOT navigate away.
// ---------------------------------------------------------------------------
test('one-time announcement rejects an end date equal to the start date', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  await signUp(page, 'Test Organizer')
  await chooseAccountType(page, 'Organizer')
  const orgUrl = await createOrg(page, `Schedule Test Org ${Date.now()}`)

  await page.goto(orgUrl)
  await page.getByRole('link', { name: 'New announcement' }).click()

  await page.getByLabel('Title').fill('Same Start and End Test')
  await page.getByLabel('Details').fill('This post should not be saved.')

  // When: set Ends equal to Starts.
  await page.getByLabel('Starts').fill('2027-06-15T14:00')
  await page.getByLabel('Ends').fill('2027-06-15T14:00')
  await page.getByRole('button', { name: 'Publish' }).click()

  // Then: error appears and we stay on the create page.
  await expect(page.getByText(/end.*after.*start|start.*before.*end/i)).toBeVisible()
  await expect(page).not.toHaveURL(/\/a\/[^/]+$/)

  await context.close()
})

// ---------------------------------------------------------------------------
// Given: a signed-in organizer on the New Announcement form (one-time mode).
// When:  they set an end date/time that is after the start date/time
//        and publish.
// Then:  the announcement is created successfully (no error).
// ---------------------------------------------------------------------------
test('one-time announcement accepts a valid end date after the start date', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  await signUp(page, 'Test Organizer')
  await chooseAccountType(page, 'Organizer')
  const orgUrl = await createOrg(page, `Schedule Test Org ${Date.now()}`)

  await page.goto(orgUrl)
  await page.getByRole('link', { name: 'New announcement' }).click()

  await page.getByLabel('Title').fill('Valid Schedule Test')
  await page.getByLabel('Details').fill('End is after start — this should save.')

  // When: set a valid Starts / Ends range.
  await page.getByLabel('Starts').fill('2027-06-15T14:00')
  await page.getByLabel('Ends').fill('2027-06-15T16:00')
  await page.getByRole('button', { name: 'Publish' }).click()

  // Then: form submits and we land on the new announcement's page.
  await expect(page).toHaveURL(/\/a\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Valid Schedule Test' })).toBeVisible()

  await context.close()
})

// ---------------------------------------------------------------------------
// Given: a signed-in organizer on the New Announcement form (weekly mode).
// When:  they set an end time before the start time and try to publish.
// Then:  the form shows an error and does NOT navigate away.
// ---------------------------------------------------------------------------
test('weekly announcement rejects an end time before the start time', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  await signUp(page, 'Test Organizer')
  await chooseAccountType(page, 'Organizer')
  const orgUrl = await createOrg(page, `Schedule Test Org ${Date.now()}`)

  await page.goto(orgUrl)
  await page.getByRole('link', { name: 'New announcement' }).click()

  await page.getByLabel('Title').fill('Weekly End Before Start Test')
  await page.getByLabel('Details').fill('This post should not be saved.')

  // Switch to weekly mode.
  await page.getByRole('button', { name: 'Weekly' }).click()
  await expect(page.getByLabel('Week of')).toBeVisible()

  // Fill week and days.
  await page.getByLabel('Week of').fill('2027-06-14')
  await page.getByLabel('Mon').check()

  // When: set End time before Start time.
  await page.getByLabel('Start time').fill('15:00')
  await page.getByLabel('End time').fill('13:00')
  await page.getByRole('button', { name: 'Publish' }).click()

  // Then: error appears and we stay on the create page.
  await expect(page.getByText(/end.*after.*start|start.*before.*end/i)).toBeVisible()
  await expect(page).not.toHaveURL(/\/a\/[^/]+$/)

  await context.close()
})
