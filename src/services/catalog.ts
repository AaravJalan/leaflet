import { mockAnnouncements, mockOrganizations } from '../data/mock'
import { applyOrgs, applyPosts, readHiddenOrgs } from '../lib/edits'
import { listRecentAnnouncements, listAnnouncementsByOrg, getAnnouncement } from './announcements'
import { getOrganization, listOrganizations } from './organizations'
import type { Announcement, Organization, OrgType } from '../types'

function byNewest<T extends { createdAt: number }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt)
}

export async function loadOrganizations(filters?: {
  type?: OrgType | 'All'
  search?: string
  userId?: string | null
  displayName?: string
}): Promise<Organization[]> {
  const samples = mockOrganizations(filters?.userId ?? null, filters?.displayName || '')
  let remote: Organization[] = []
  try {
    remote = await listOrganizations({ type: filters?.type, search: filters?.search })
  } catch {
    remote = []
  }
  let orgs = [...remote, ...samples]
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
  const sample = applyOrgs(mockOrganizations(userId, displayName)).find((org) => org.id === id)
  if (sample) return sample
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
  const samples = mockAnnouncements(userId)
  const orgs = await loadOrganizations({ userId, displayName: '' })
  const ids = new Set<string>()
  return applyPosts(
    byNewest([...localPosts, ...remote, ...samples])
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
  const samples = mockAnnouncements(userId).filter((post) => post.orgId === orgId)
  if (orgId.startsWith('mock-')) {
    const org = mockOrganizations(userId, '').find((item) => item.id === orgId)
    return applyPosts(byNewest([...local, ...samples])).map((item) =>
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
  const sample = mockAnnouncements(userId).find((post) => post.id === id)
  let found = local || sample
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
