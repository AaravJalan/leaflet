import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { OrgMember } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

export async function upsertOrgMember(member: Omit<OrgMember, 'id'> & { userId: string }) {
  const database = requireDb()
  const id = member.userId
  await setDoc(doc(database, 'organizations', member.orgId, 'members', id), {
    ...member,
    id,
  })
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'organizations', orgId, 'members'))
  return snap.docs.map((d) => d.data() as OrgMember)
}

export async function canUserPost(orgId: string, userId: string, ownerId: string): Promise<boolean> {
  if (userId === ownerId) return true
  const database = requireDb()
  const snap = await getDoc(doc(database, 'organizations', orgId, 'members', userId))
  return snap.exists()
}

export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'organizations', orgId, 'members', userId))
}
