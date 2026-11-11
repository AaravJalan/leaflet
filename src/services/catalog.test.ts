import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hideOrg, hidePost, saveOrgEdit, savePostEdit } from '../lib/edits'
import type { Announcement, Organization, OrgType } from '../types'
import { getAnnouncement, listAnnouncementsByOrg, listRecentAnnouncements } from './announcements'
import {
  loadAnnouncement,
  loadAnnouncements,
  loadAnnouncementsForOrg,
  loadOrganization,
  loadOrganizations,
} from './catalog'
import { getOrganization, listOrganizations } from './organizations'

vi.mock('./announcements', () => ({
  getAnnouncement: vi.fn(),
  listAnnouncementsByOrg: vi.fn(),
  listRecentAnnouncements: vi.fn(),
}))

vi.mock('./organizations', () => ({
  getOrganization: vi.fn(),
  listOrganizations: vi.fn(),
}))

vi.mock('../data/mock', () => ({
  mockOrganizations: () => [
    {
      id: 'mock-org',
      name: 'Middle Sample',
      description: 'Sample description',
      type: 'Campus',
      ownerId: 'mock-jordan',
      ownerName: 'Jordan Lee',
      createdAt: 7,
      mock: true,
    },
  ],
  mockAnnouncements: () => [
    {
      id: 'mock-post',
      orgId: 'mock-org',
      orgName: 'Middle Sample',
      createdAt: 50,
      createdBy: 'mock-jordan',
      createdByName: 'Jordan Lee',
      mock: true,
    },
  ],
}))

function org(id: string, name: string, type: OrgType = 'Other', description = ''): Organization {
  return { id, name, type, description, ownerId: `owner-${id}`, createdAt: 3 } as Organization
}

function post(id: string, createdAt: number, overrides: Partial<Announcement> = {}): Announcement {
  return { id, createdAt, orgId: 'remote', orgName: 'Remote', title: id, ...overrides } as Announcement
}

const names = (orgs: Organization[]) => orgs.map((item) => item.name)
const ids = (posts: Announcement[]) => posts.map((item) => item.id)

beforeEach(() => {
  vi.mocked(listOrganizations).mockResolvedValue([])
  vi.mocked(getOrganization).mockResolvedValue(null)
  vi.mocked(listRecentAnnouncements).mockResolvedValue([])
  vi.mocked(listAnnouncementsByOrg).mockResolvedValue([])
  vi.mocked(getAnnouncement).mockResolvedValue(null)
})

describe('loadOrganizations', () => {
  it('merges remote and shared sample orgs, sorted by name', async () => {
    vi.mocked(listOrganizations).mockResolvedValue([org('z', 'Zebra'), org('a', 'Apple')])
    expect(names(await loadOrganizations())).toEqual(['Apple', 'Middle Sample', 'Zebra'])
  })

  it('still shows shared samples when Firestore fails', async () => {
    vi.mocked(listOrganizations).mockRejectedValue(new Error('offline'))
    expect(names(await loadOrganizations())).toEqual(['Middle Sample'])
  })

  it('filters by type', async () => {
    vi.mocked(listOrganizations).mockResolvedValue([org('a', 'Apple', 'Volunteer')])
    expect(names(await loadOrganizations({ type: 'Campus' }))).toEqual(['Middle Sample'])
  })

  it('treats type All as no filter', async () => {
    vi.mocked(listOrganizations).mockResolvedValue([org('a', 'Apple', 'Volunteer')])
    expect(names(await loadOrganizations({ type: 'All' }))).toEqual(['Apple', 'Middle Sample'])
  })

  it('searches names and descriptions, ignoring case', async () => {
    vi.mocked(listOrganizations).mockResolvedValue([
      org('a', 'Apple', 'Other', 'fruit stand'),
      org('b', 'FRUIT Co', 'Other', ''),
      org('c', 'Cherry', 'Other', 'tree'),
    ])
    expect(names(await loadOrganizations({ search: '  fruit ' }))).toEqual(['Apple', 'FRUIT Co'])
  })

  it('applies hidden orgs and saved edits', async () => {
    vi.mocked(listOrganizations).mockResolvedValue([org('a', 'Apple'), org('b', 'Banana')])
    hideOrg('a')
    saveOrgEdit('b', { name: 'Blueberry' })
    expect(names(await loadOrganizations())).toEqual(['Blueberry', 'Middle Sample'])
  })
})

describe('loadOrganization', () => {
  it('finds a shared sample without calling Firestore', async () => {
    expect((await loadOrganization('mock-org', 'me', 'Me'))?.ownerId).toBe('mock-jordan')
    expect(getOrganization).not.toHaveBeenCalled()
  })

  it('returns null for a hidden org without calling Firestore', async () => {
    hideOrg('a')
    expect(await loadOrganization('a', 'me', 'Me')).toBeNull()
    expect(getOrganization).not.toHaveBeenCalled()
  })

  it('applies edits to a remote org', async () => {
    vi.mocked(getOrganization).mockResolvedValue(org('a', 'Apple'))
    saveOrgEdit('a', { name: 'Avocado' })
    expect((await loadOrganization('a', 'me', 'Me'))?.name).toBe('Avocado')
  })

  it('returns null for missing or failed lookups', async () => {
    expect(await loadOrganization('a', 'me', 'Me')).toBeNull()
    vi.mocked(getOrganization).mockRejectedValue(new Error('offline'))
    expect(await loadOrganization('a', 'me', 'Me')).toBeNull()
  })
})

describe('loadAnnouncements', () => {
  it('merges local, remote, and shared sample posts newest first', async () => {
    vi.mocked(listRecentAnnouncements).mockResolvedValue([post('r', 100)])
    expect(ids(await loadAnnouncements('me', [post('l', 200)]))).toEqual(['l', 'r', 'mock-post'])
  })

  it('keeps one copy of a repeated id, preferring the newer', async () => {
    vi.mocked(listRecentAnnouncements).mockResolvedValue([post('x', 100, { title: 'remote' })])
    const result = await loadAnnouncements('me', [post('x', 200, { title: 'local' })])
    expect(result.filter((item) => item.id === 'x').map((item) => item.title)).toEqual(['local'])
  })

  it('adds owner details from the matching org', async () => {
    const [sample] = await loadAnnouncements('me')
    expect(sample).toMatchObject({ orgOwnerId: 'mock-jordan', orgCreatedAt: 7 })
  })

  it('still shows shared samples when Firestore fails', async () => {
    vi.mocked(listRecentAnnouncements).mockRejectedValue(new Error('offline'))
    expect(ids(await loadAnnouncements('me'))).toEqual(['mock-post'])
  })

  it('applies hidden posts and saved edits', async () => {
    vi.mocked(listRecentAnnouncements).mockResolvedValue([post('a', 100), post('b', 90)])
    hidePost('a')
    savePostEdit('b', { title: 'Edited' })
    const result = await loadAnnouncements('me')
    expect(ids(result)).toEqual(['b', 'mock-post'])
    expect(result[0].title).toBe('Edited')
  })
})

describe('loadAnnouncementsForOrg', () => {
  it('does not call Firestore for a sample org', async () => {
    const result = await loadAnnouncementsForOrg('mock-org', 'me', [
      post('l', 60, { orgId: 'mock-org' }),
      post('other', 70, { orgId: 'elsewhere' }),
    ])
    expect(ids(result)).toEqual(['l', 'mock-post'])
    expect(result[0]).toMatchObject({ orgOwnerId: 'mock-jordan', orgCreatedAt: 7 })
    expect(listAnnouncementsByOrg).not.toHaveBeenCalled()
  })

  it('merges local and remote posts for a real org', async () => {
    vi.mocked(listAnnouncementsByOrg).mockResolvedValue([post('r', 100)])
    const result = await loadAnnouncementsForOrg('remote', 'me', [post('l', 200)])
    expect(ids(result)).toEqual(['l', 'r'])
    expect(listAnnouncementsByOrg).toHaveBeenCalledWith('remote')
  })

  it('keeps local posts when Firestore fails', async () => {
    vi.mocked(listAnnouncementsByOrg).mockRejectedValue(new Error('offline'))
    expect(ids(await loadAnnouncementsForOrg('remote', 'me', [post('l', 200)]))).toEqual(['l'])
  })
})

describe('loadAnnouncement', () => {
  it('prefers a local post over Firestore', async () => {
    expect((await loadAnnouncement('l', 'me', [post('l', 1)]))?.id).toBe('l')
    expect(getAnnouncement).not.toHaveBeenCalled()
  })

  it('finds a shared sample post without calling Firestore', async () => {
    expect((await loadAnnouncement('mock-post', 'me'))?.id).toBe('mock-post')
    expect(getAnnouncement).not.toHaveBeenCalled()
  })

  it('falls back to Firestore and applies edits', async () => {
    vi.mocked(getAnnouncement).mockResolvedValue(post('r', 1))
    savePostEdit('r', { title: 'Edited' })
    expect((await loadAnnouncement('r', 'me'))?.title).toBe('Edited')
  })

  it('returns null for hidden, missing, or failed lookups', async () => {
    vi.mocked(getAnnouncement).mockResolvedValue(post('r', 1))
    hidePost('r')
    expect(await loadAnnouncement('r', 'me')).toBeNull()

    vi.mocked(getAnnouncement).mockResolvedValue(null)
    expect(await loadAnnouncement('none', 'me')).toBeNull()

    vi.mocked(getAnnouncement).mockRejectedValue(new Error('offline'))
    expect(await loadAnnouncement('none', 'me')).toBeNull()
  })
})
