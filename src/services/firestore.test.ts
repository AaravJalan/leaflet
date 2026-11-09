import { addDoc, doc, getDoc, getDocs, setDoc, where } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PermissionEvent } from '../types'
import { listPermissionEvents, recordPermissionEvent } from './activity'
import { canUserPost, upsertOrgMember } from './members'
import { createOrganization, getOrganization, listOrganizations } from './organizations'
import { isSubscribed, subscribeToOrg } from './subscriptions'
import { findUserByEmail, getUserProfile } from './users'

const firebase = vi.hoisted(() => ({ db: {} as object | null }))

vi.mock('../lib/firebase', () => ({
  get db() {
    return firebase.db
  },
}))

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  // Return the path so tests can see which document was addressed.
  doc: vi.fn((_db: unknown, ...path: string[]) => path.join('/')),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}))

function snapshot(id: string, data: Record<string, unknown>) {
  return { id, data: () => data, exists: () => true }
}

function mockDocs(docs: ReturnType<typeof snapshot>[]) {
  vi.mocked(getDocs).mockResolvedValue({ docs, empty: docs.length === 0 } as never)
}

beforeEach(() => {
  firebase.db = {}
})

describe('organizations', () => {
  it('fills in defaults for a sparse document', async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot('o', {}) as never)
    expect(await getOrganization('o')).toEqual({
      id: 'o',
      name: '',
      slug: '',
      description: '',
      type: 'Other',
      ownerId: '',
      ownerName: '',
      location: '',
      link: '',
      createdAt: 0,
    })
  })

  it('trims fields and derives the slug on create', async () => {
    vi.mocked(addDoc).mockResolvedValue({ id: 'new' } as never)
    await createOrganization({
      name: '  Arts & Culture Club ',
      description: ' d ',
      type: 'Campus',
      ownerId: 'u',
      ownerName: 'U',
    })
    expect(vi.mocked(addDoc).mock.calls.at(-1)?.[1]).toMatchObject({
      name: 'Arts & Culture Club',
      slug: 'arts-culture-club',
      description: 'd',
      location: '',
      link: '',
    })
  })

  it('filters search results by name or description', async () => {
    mockDocs([
      snapshot('a', { name: 'Garden Club', description: '' }),
      snapshot('b', { name: 'Chess', description: 'Board games in the GARDEN' }),
      snapshot('c', { name: 'Choir', description: 'Singing' }),
    ])
    expect((await listOrganizations({ search: ' garden ' })).map((org) => org.id)).toEqual(['a', 'b'])
  })

  it('only adds a type filter for a specific type', async () => {
    mockDocs([])
    await listOrganizations({ type: 'All' })
    expect(where).not.toHaveBeenCalled()
    await listOrganizations({ type: 'Campus' })
    expect(where).toHaveBeenCalledWith('type', '==', 'Campus')
  })

  it('rejects without Firebase configured', async () => {
    firebase.db = null
    await expect(listOrganizations()).rejects.toThrow('Firebase is not configured.')
  })
})

describe('members', () => {
  it('lets the owner post without a lookup, even offline', async () => {
    firebase.db = null
    expect(await canUserPost('o', 'u', 'u')).toBe(true)
    expect(getDoc).not.toHaveBeenCalled()
  })

  it('checks the member document for everyone else', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)
    expect(await canUserPost('o', 'u', 'owner')).toBe(false)
    expect(getDoc).toHaveBeenCalledWith('organizations/o/members/u')
  })

  it('stores a member under their user id', async () => {
    await upsertOrgMember({
      orgId: 'o',
      userId: 'u',
      email: 'u@x.co',
      displayName: 'U',
      addedBy: 'owner',
      createdAt: 1,
    })
    expect(setDoc).toHaveBeenCalledWith('organizations/o/members/u', expect.objectContaining({ id: 'u' }))
  })
})

describe('subscriptions', () => {
  it('uses one document per user and org', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(99)
    await subscribeToOrg({ userId: 'u', orgId: 'o', orgName: 'Org' })
    expect(setDoc).toHaveBeenCalledWith('subscriptions/u_o', {
      id: 'u_o',
      userId: 'u',
      orgId: 'o',
      orgName: 'Org',
      createdAt: 99,
    })
  })

  it('checks the same document', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as never)
    expect(await isSubscribed('u', 'o')).toBe(true)
    expect(getDoc).toHaveBeenCalledWith('subscriptions/u_o')
  })
})

describe('users', () => {
  it('normalizes the email before searching', async () => {
    mockDocs([snapshot('u', { email: 'sam@x.co' })])
    expect((await findUserByEmail('  Sam@X.co '))?.uid).toBe('u')
    expect(where).toHaveBeenCalledWith('email', '==', 'sam@x.co')
  })

  it('returns null when no user matches', async () => {
    mockDocs([])
    expect(await findUserByEmail('none@x.co')).toBeNull()
  })

  it.each([
    ['organizer', 'organizer'],
    ['both', 'both'],
    ['admin', null],
    [undefined, null],
  ])('maps account type %j to %j', async (accountType, expected) => {
    vi.mocked(getDoc).mockResolvedValue(snapshot('u', { accountType, createdAt: 5 }) as never)
    expect(await getUserProfile('u')).toMatchObject({ accountType: expected, createdAt: 5 })
  })
})

describe('activity', () => {
  const event: PermissionEvent = {
    id: 'e',
    type: 'allowed',
    orgId: 'o',
    orgName: 'Org',
    actorId: 'a',
    actorName: 'A',
    targetUserId: 'u',
    createdAt: 1,
  }

  it('writes to the target user activity feed', async () => {
    await recordPermissionEvent(event)
    expect(setDoc).toHaveBeenCalledWith('users/u/activity/e', event)
  })

  it('skips sample users entirely', async () => {
    firebase.db = null
    await recordPermissionEvent({ ...event, targetUserId: 'mock-priya' })
    expect(doc).not.toHaveBeenCalled()
  })

  it('fills in defaults when reading', async () => {
    mockDocs([snapshot('e', { type: 'weird' })])
    expect(await listPermissionEvents('u')).toEqual([
      {
        id: 'e',
        type: 'allowed',
        orgId: '',
        orgName: '',
        actorId: '',
        actorName: 'Someone',
        targetUserId: 'u',
        createdAt: 0,
      },
    ])
  })
})
