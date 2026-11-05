import { mockAnnouncements, mockOrganizations, RETIRED_SAMPLE_NAMES } from '../data/mock'
import { applyOrgs, applyPosts, readHiddenOrgs } from '../lib/edits'
import { listRecentAnnouncements, listAnnouncementsByOrg, getAnnouncement } from './announcements'
import { getOrganization, listOrganizations } from './organizations'
import type { Announcement, Organization, OrgType } from '../types'

function byNewest<T extends { createdAt: number }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt)
}

const RETIRED = new Set(RETIRED_SAMPLE_NAMES)

function retiredName(name: string) {
  return RETIRED.has(name.trim().toLowerCase())
}

export async function loadOrganizations(filters?: {
  type?: OrgType | 'All'
  search?: string
  userId?: string | null
  displayName?: string
}): Promise<Organization[]> {
  const mocks = mockOrganizations(filters?.userId ?? null, filters?.displayName || 'You')
  let remote: Organization[] = []
  try {
    remote = await listOrganizations({ type: filters?.type, search: filters?.search })
  } catch {
    remote = []
  }
  let orgs = [...remote.filter((org) => !retiredName(org.name)), ...mocks]
  if (filters?.type && filters.type !== 'All') {
    orgs = orgs.filter((org) => org.type === filters.type)
  }
  const search = filters?.search?.trim().toLowerCase()
  if (search) {
    orgs = orgs.filter(
      (org) =>
        org.name.toLowerCase().includes(search) ||
        org.description.toLowerCase().includes(search),
    )
  }
  return applyOrgs(orgs.sort((a, b) => a.name.localeCompare(b.name)))
}

export async function loadOrganization(
  id: string,
  userId: string | null,
  displayName: string,
): Promise<Organization | null> {
  const mock = applyOrgs(mockOrganizations(userId, displayName)).find((org) => org.id === id)
  if (mock) return mock
  if (readHiddenOrgs().includes(id)) return null
  try {
    const remote = await getOrganization(id)
    return remote ? applyOrgs([remote])[0] ?? null : null
  } catch {
    return null
  }
}

export async function loadAnnouncements(
  userId: string | null,
  localPosts: Announcement[] = [],
): Promise<Announcement[]> {
  let remote: Announcement[] = []
  try {
    remote = await listRecentAnnouncements(80)
  } catch {
    remote = []
  }
  const mocks = mockAnnouncements(userId)
  const orgs = await loadOrganizations({ userId, displayName: 'You' })
  const ids = new Set<string>()
  return applyPosts(
    byNewest([...localPosts, ...remote, ...mocks])
      .filter((item) => !item.mock && retiredName(item.orgName) ? false : true)
      .filter((item) => {
        if (ids.has(item.id)) return false
        ids.add(item.id)
        return true
      })
      .map((item) => {
        const org = orgs.find((entry) => entry.id === item.orgId)
        if (!org) return item
        return { ...item, orgOwnerId: org.ownerId, orgCreatedAt: org.createdAt }
      }),
  )
}

export async function loadAnnouncementsForOrg(
  orgId: string,
  userId: string | null,
  localPosts: Announcement[] = [],
): Promise<Announcement[]> {
  const local = localPosts.filter((post) => post.orgId === orgId)
  const mocks = mockAnnouncements(userId).filter((post) => post.orgId === orgId)
  if (orgId.startsWith('mock-')) {
    const org = mockOrganizations(userId, 'You').find((item) => item.id === orgId)
    return applyPosts(byNewest([...local, ...mocks])).map((item) =>
      org ? { ...item, orgOwnerId: org.ownerId, orgCreatedAt: org.createdAt } : item,
    )
  }
  let remote: Announcement[] = []
  try {
    remote = await listAnnouncementsByOrg(orgId)
  } catch {
    remote = []
  }
  return applyPosts(byNewest([...local, ...remote]))
}

export async function loadAnnouncement(
  id: string,
  userId: string | null,
  localPosts: Announcement[] = [],
): Promise<Announcement | null> {
  const local = localPosts.find((post) => post.id === id)
  const mock = mockAnnouncements(userId).find((post) => post.id === id)
  let found = local || mock
  if (!found) {
    try {
      found = (await getAnnouncement(id)) || undefined
    } catch {
      found = undefined
    }
  }
  if (!found) return null
  return applyPosts([found])[0] ?? null
}
