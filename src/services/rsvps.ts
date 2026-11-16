import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Rsvp } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

export function rsvpId(userId: string, announcementId: string) {
  return `${userId}_${announcementId}`
}

export async function addRsvp(input: {
  userId: string
  userName: string
  announcementId: string
}): Promise<void> {
  const database = requireDb()
  const id = rsvpId(input.userId, input.announcementId)
  await setDoc(doc(database, 'rsvps', id), {
    id,
    userId: input.userId,
    userName: input.userName,
    announcementId: input.announcementId,
    createdAt: Date.now(),
  })
}

export async function removeRsvp(userId: string, announcementId: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'rsvps', rsvpId(userId, announcementId)))
}

export async function listRsvps(announcementId: string): Promise<Rsvp[]> {
  const database = requireDb()
  const q = query(collection(database, 'rsvps'), where('announcementId', '==', announcementId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Rsvp)
}
