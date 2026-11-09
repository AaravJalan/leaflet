import { addDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Organization } from '../types'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncementsForOrgs,
  listRecentAnnouncements,
  updateAnnouncement,
} from './announcements'

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
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}))

function snapshot(id: string, data: Record<string, unknown>) {
  return { id, data: () => data, exists: () => true }
}

function mockDocs(docs: ReturnType<typeof snapshot>[]) {
  vi.mocked(getDocs).mockResolvedValue({ docs } as never)
}

const input = {
  title: '  Title ',
  description: ' Details ',
  location: ' Park ',
  startsAt: 10,
  endsAt: null,
  link: ' https://x.co ',
  schedule: 'weekly' as const,
  repeatDays: [1, 3],
  weekOf: 5,
}

beforeEach(() => {
  firebase.db = {}
})

describe('without Firebase configured', () => {
  it('rejects every call', async () => {
    firebase.db = null
    await expect(getAnnouncement('a')).rejects.toThrow('Firebase is not configured.')
    await expect(deleteAnnouncement('a')).rejects.toThrow('Firebase is not configured.')
  })
})

describe('reading documents', () => {
  it('returns null for a missing document', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)
    expect(await getAnnouncement('a')).toBeNull()
  })

  it('fills in defaults for a sparse document', async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot('a', {}) as never)
    expect(await getAnnouncement('a')).toEqual({
      id: 'a',
      orgId: '',
      orgName: '',
      orgType: 'Other',
      title: '',
      description: '',
      location: '',
      startsAt: null,
      endsAt: null,
      link: '',
      createdAt: 0,
      createdBy: '',
      createdByName: '',
      schedule: 'once',
      repeatDays: [],
      weekOf: null,
      imageUrl: undefined,
    })
  })

  it('keeps weekly fields and coerces numbers', async () => {
    vi.mocked(getDoc).mockResolvedValue(
      snapshot('a', { schedule: 'weekly', repeatDays: ['1', 3], weekOf: '100', startsAt: '200', endsAt: 300 }) as never,
    )
    expect(await getAnnouncement('a')).toMatchObject({
      schedule: 'weekly',
      repeatDays: [1, 3],
      weekOf: 100,
      startsAt: 200,
      endsAt: 300,
    })
  })

  it('keeps a real timestamp of zero', async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot('a', { startsAt: 0 }) as never)
    expect((await getAnnouncement('a'))?.startsAt).toBe(0)
  })

  it('treats an unknown schedule or malformed days as one time', async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot('a', { schedule: 'daily', repeatDays: 'nope' }) as never)
    expect(await getAnnouncement('a')).toMatchObject({ schedule: 'once', repeatDays: [] })
  })
})

describe('listing', () => {
  it('applies the limit', async () => {
    mockDocs([snapshot('a', {}), snapshot('b', {}), snapshot('c', {})])
    expect((await listRecentAnnouncements(2)).map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('filters to the requested orgs', async () => {
    mockDocs([snapshot('a', { orgId: 'x' }), snapshot('b', { orgId: 'y' })])
    expect((await listAnnouncementsForOrgs(['y'])).map((item) => item.id)).toEqual(['b'])
  })

  it('skips the query with no orgs', async () => {
    expect(await listAnnouncementsForOrgs([])).toEqual([])
    expect(getDocs).not.toHaveBeenCalled()
  })
})

describe('writing', () => {
  it('trims text and copies org details on create', async () => {
    vi.mocked(addDoc).mockResolvedValue({ id: 'new' } as never)
    const org = { id: 'o', name: 'Org', type: 'Campus' } as Organization
    vi.spyOn(Date, 'now').mockReturnValue(1234)

    const id = await createAnnouncement({ ...input, org, createdBy: 'u', createdByName: 'User' })

    expect(id).toBe('new')
    expect(vi.mocked(addDoc).mock.calls.at(-1)?.[1]).toEqual({
      orgId: 'o',
      orgName: 'Org',
      orgType: 'Campus',
      title: 'Title',
      description: 'Details',
      location: 'Park',
      startsAt: 10,
      endsAt: null,
      link: 'https://x.co',
      createdAt: 1234,
      createdBy: 'u',
      createdByName: 'User',
      schedule: 'weekly',
      repeatDays: [1, 3],
      weekOf: 5,
      imageUrl: '',
    })
  })

  it('trims text and clears a removed image on update', async () => {
    await updateAnnouncement('a', input)
    expect(vi.mocked(updateDoc).mock.calls.at(-1)?.[1]).toEqual({
      title: 'Title',
      description: 'Details',
      location: 'Park',
      startsAt: 10,
      endsAt: null,
      link: 'https://x.co',
      schedule: 'weekly',
      repeatDays: [1, 3],
      weekOf: 5,
      imageUrl: '',
    })
  })
})
