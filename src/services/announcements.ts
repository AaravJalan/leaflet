import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Announcement, Organization } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

function mapAnnouncement(id: string, data: Record<string, unknown>): Announcement {
  return {
    id,
    orgId: String(data.orgId || ''),
    orgName: String(data.orgName || ''),
    orgType: (data.orgType as Announcement['orgType']) || 'Other',
    title: String(data.title || ''),
    description: String(data.description || ''),
    location: String(data.location || ''),
    startsAt: data.startsAt == null ? null : Number(data.startsAt),
    endsAt: data.endsAt == null ? null : Number(data.endsAt),
    link: String(data.link || ''),
    createdAt: Number(data.createdAt || 0),
    createdBy: String(data.createdBy || ''),
    createdByName: String(data.createdByName || ''),
    schedule: data.schedule === 'weekly' ? 'weekly' : 'once',
    repeatDays: Array.isArray(data.repeatDays) ? data.repeatDays.map(Number) : [],
    weekOf: data.weekOf == null ? null : Number(data.weekOf),
  }
}

export async function createAnnouncement(input: {
  org: Organization
  title: string
  description: string
  location: string
  startsAt: number | null
  endsAt: number | null
  link: string
  createdBy: string
  createdByName: string
  schedule: 'once' | 'weekly'
  repeatDays: number[]
  weekOf: number | null
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
    endsAt: input.endsAt,
    link: input.link.trim(),
    createdAt: Date.now(),
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    schedule: input.schedule,
    repeatDays: input.repeatDays,
    weekOf: input.weekOf,
  })
  return ref.id
}

export async function updateAnnouncement(
  id: string,
  input: {
    title: string
    description: string
    location: string
    startsAt: number | null
    endsAt: number | null
    link: string
    schedule: 'once' | 'weekly'
    repeatDays: number[]
    weekOf: number | null
  },
): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'announcements', id), {
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    link: input.link.trim(),
    schedule: input.schedule,
    repeatDays: input.repeatDays,
    weekOf: input.weekOf,
  })
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'announcements', id))
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
