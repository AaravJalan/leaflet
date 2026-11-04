import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Announcement, Organization } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

function mapAnnouncement(id: string, data: Record<string, unknown>): Announcement {
  return { id, ...(data as Omit<Announcement, 'id'>) }
}

export async function createAnnouncement(input: {
  org: Organization
  title: string
  description: string
  location: string
  startsAt: number | null
  link: string
  createdBy: string
}): Promise<string> {
  const database = requireDb()
  const ref = await addDoc(collection(database, 'announcements'), {
    orgId: input.org.id,
    orgName: input.org.name,
    orgType: input.org.type,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    startsAt: input.startsAt,
    link: input.link.trim(),
    createdAt: Date.now(),
    createdBy: input.createdBy,
  })
  return ref.id
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'announcements', id))
  return snap.exists() ? mapAnnouncement(snap.id, snap.data()) : null
}

export async function listRecentAnnouncements(limitCount = 40): Promise<Announcement[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'announcements'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.slice(0, limitCount).map((d) => mapAnnouncement(d.id, d.data()))
}

export async function listAnnouncementsByOrg(orgId: string): Promise<Announcement[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'announcements'),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapAnnouncement(d.id, d.data()))
}

export async function listAnnouncementsForOrgs(orgIds: string[]): Promise<Announcement[]> {
  if (orgIds.length === 0) return []
  const all = await listRecentAnnouncements(200)
  const set = new Set(orgIds)
  return all.filter((a) => set.has(a.orgId))
}
