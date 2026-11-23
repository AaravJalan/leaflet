import { expect, test, type Browser } from '@playwright/test'
import { chooseAccountType, createOrg, postAnnouncement, signUp } from './helpers'

// Workflow: an org owner adds someone to "Who can post" (editing access).
// That person should get an Edit button on every post in the org, and it
// should open the edit page with the post's fields ready to change and save.
//
// Two separate browser contexts = two different people, each with their own login.

async function newPerson(browser: Browser, name: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const email = await signUp(page, name)
  return { context, page, email }
}

test('someone given editing access can edit every post in the org', async ({ browser }) => {
  const stamp = Date.now()
  const titles = [`Riverbank sweep ${stamp}`, `Tool drive ${stamp}`]

  // The editor needs an account before the owner can add them.
  const editor = await newPerson(browser, 'Test Editor')
  await chooseAccountType(editor.page, 'Volunteer')

  // Owner creates the org and two posts.
  const owner = await newPerson(browser, 'Test Owner')
  await chooseAccountType(owner.page, 'Organizer')
  const orgUrl = await createOrg(owner.page, `Editors Org ${stamp}`)
  const postUrls = []
  for (const title of titles) postUrls.push(await postAnnouncement(owner.page, orgUrl, title))

  // Owner adds the editor under "Who can post".
  await owner.page.goto(orgUrl)
  const posters = owner.page.locator('section', { has: owner.page.getByRole('heading', { name: 'Who can post' }) })
  await posters.getByPlaceholder('person@email.com').fill(editor.email)
  await posters.getByRole('button', { name: 'Add' }).click()
  await expect(posters.getByText(editor.email)).toBeVisible()

  // The editor sees Edit on each post, and it opens that post's edit page.
  for (const [i, postUrl] of postUrls.entries()) {
    await editor.page.goto(postUrl)
    await expect(editor.page.getByRole('heading', { level: 1, name: titles[i] })).toBeVisible()

    const edit = editor.page.getByRole('link', { name: 'Edit', exact: true })
    await expect(edit, `Edit button on "${titles[i]}"`).toBeVisible()
    await edit.click()

    await expect(editor.page).toHaveURL(`${postUrl}/edit`)
    await expect(editor.page.getByRole('heading', { name: 'Edit announcement' })).toBeVisible()
    const title = editor.page.getByLabel('Title')
    await expect(title).toHaveValue(titles[i])
    await expect(title).toBeEditable()
    await expect(editor.page.getByLabel('Details')).toBeEditable()

    // ...and the change actually saves (the database rules allow it).
    await title.fill(`${titles[i]} (edited)`)
    await editor.page.getByRole('button', { name: 'Save' }).click()
    await expect(editor.page).toHaveURL(postUrl)
    await expect(editor.page.getByRole('heading', { level: 1, name: `${titles[i]} (edited)` })).toBeVisible()
  }

  // The owner sees the edits too.
  await owner.page.goto(postUrls[0])
  await expect(owner.page.getByRole('heading', { level: 1, name: `${titles[0]} (edited)` })).toBeVisible()

  await editor.context.close()
  await owner.context.close()
})

test('someone without editing access sees no Edit button', async ({ browser }) => {
  const stamp = Date.now()
  const owner = await newPerson(browser, 'Test Owner')
  await chooseAccountType(owner.page, 'Organizer')
  const orgUrl = await createOrg(owner.page, `Closed Org ${stamp}`)
  const postUrl = await postAnnouncement(owner.page, orgUrl, `Members only ${stamp}`)

  const stranger = await newPerson(browser, 'Test Stranger')
  await stranger.page.goto(postUrl)
  await expect(stranger.page.getByRole('heading', { level: 1, name: `Members only ${stamp}` })).toBeVisible()
  await expect(stranger.page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0)

  await stranger.context.close()
  await owner.context.close()
})
