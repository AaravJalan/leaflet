import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

/**
 * Checks that firestore.rules stops people without edit access from posting,
 * changing posts, changing org settings, or granting edit access.
 *
 * Seeded data: org `org1` owned by `owner`, with `editor` added as a poster.
 * `stranger` is a signed-in organizer with no link to the org, so a failure
 * comes from missing access rather than the wrong account type.
 */

const PROJECT_ID = 'demo-leaflet'

let env: RulesTestEnvironment

function as(uid: string | null) {
  return uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore()
}

function post(createdBy: string, orgId = 'org1') {
  return { createdBy, orgId, title: 'Beach cleanup', body: 'Bring gloves.', createdAt: 1 }
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    for (const uid of ['owner', 'editor', 'stranger']) {
      await db.doc(`users/${uid}`).set({ accountType: 'organizer' })
    }
    await db.doc('organizations/org1').set({ ownerId: 'owner', name: 'Shore Club', createdAt: 1 })
    await db.doc('organizations/org1/members/editor').set({ userId: 'editor', orgId: 'org1' })
    await db.doc('announcements/ownerPost').set(post('owner'))
    await db.doc('announcements/editorPost').set(post('editor'))
  })
})

describe('creating announcements', () => {
  it('lets the owner post', async () => {
    await assertSucceeds(as('owner').doc('announcements/new').set(post('owner')))
  })

  it('lets an added editor post', async () => {
    await assertSucceeds(as('editor').doc('announcements/new').set(post('editor')))
  })

  it('stops a signed-in user who is not an editor', async () => {
    await assertFails(as('stranger').doc('announcements/new').set(post('stranger')))
  })

  it('stops a non-editor posting under the owner’s name', async () => {
    await assertFails(as('stranger').doc('announcements/new').set(post('owner')))
  })

  it('stops a signed-out user', async () => {
    await assertFails(as(null).doc('announcements/new').set(post('owner')))
  })

  it('stops an editor whose access was removed', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('organizations/org1/members/editor').delete()
    })
    await assertFails(as('editor').doc('announcements/new').set(post('editor')))
  })
})

describe('changing announcements', () => {
  it('lets the author edit and delete their post', async () => {
    await assertSucceeds(as('editor').doc('announcements/editorPost').update({ title: 'New title' }))
    await assertSucceeds(as('editor').doc('announcements/editorPost').delete())
  })

  it('stops a non-editor editing a post', async () => {
    await assertFails(as('stranger').doc('announcements/ownerPost').update({ title: 'Hacked' }))
  })

  it('stops a non-editor taking over a post by setting themselves as author', async () => {
    await assertFails(as('stranger').doc('announcements/ownerPost').update({ createdBy: 'stranger' }))
  })

  it('stops a non-editor deleting a post', async () => {
    await assertFails(as('stranger').doc('announcements/ownerPost').delete())
  })

  it('stops a signed-out user editing or deleting a post', async () => {
    await assertFails(as(null).doc('announcements/ownerPost').update({ title: 'Hacked' }))
    await assertFails(as(null).doc('announcements/ownerPost').delete())
  })
})

describe('changing org settings', () => {
  it('lets the owner change settings', async () => {
    await assertSucceeds(as('owner').doc('organizations/org1').update({ name: 'Shore Club 2' }))
  })

  it('stops a non-editor changing settings', async () => {
    await assertFails(as('stranger').doc('organizations/org1').update({ name: 'Hacked' }))
  })

  it('stops a non-editor making themselves owner', async () => {
    await assertFails(as('stranger').doc('organizations/org1').update({ ownerId: 'stranger' }))
  })

  it('stops a non-editor deleting the org', async () => {
    await assertFails(as('stranger').doc('organizations/org1').delete())
  })

  it('stops an added editor changing settings', async () => {
    await assertFails(as('editor').doc('organizations/org1').update({ name: 'Hacked' }))
  })

  it('stops a signed-out user changing settings', async () => {
    await assertFails(as(null).doc('organizations/org1').update({ name: 'Hacked' }))
  })
})

describe('granting edit access', () => {
  const member = (userId: string) => ({ userId, orgId: 'org1' })

  it('lets the owner add an editor', async () => {
    await assertSucceeds(as('owner').doc('organizations/org1/members/stranger').set(member('stranger')))
  })

  it('stops a non-editor granting themselves access', async () => {
    await assertFails(as('stranger').doc('organizations/org1/members/stranger').set(member('stranger')))
  })

  it('stops a non-editor granting someone else access', async () => {
    await assertFails(as('stranger').doc('organizations/org1/members/friend').set(member('friend')))
  })

  it('stops a non-editor removing an editor', async () => {
    await assertFails(as('stranger').doc('organizations/org1/members/editor').delete())
  })

  it('stops an added editor granting access to others', async () => {
    await assertFails(as('editor').doc('organizations/org1/members/stranger').set(member('stranger')))
  })

  it('stops a signed-out user granting access', async () => {
    await assertFails(as(null).doc('organizations/org1/members/stranger').set(member('stranger')))
  })
})
