import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { UserProfile } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

export async function upsertUserProfile(
  profile: Partial<UserProfile> & Pick<UserProfile, 'uid'>,
): Promise<void> {
  const database = requireDb()
  await setDoc(doc(database, 'users', profile.uid), profile, { merge: true })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid: snap.id,
    email: String(data.email || ''),
    displayName: String(data.displayName || ''),
    createdAt: Number(data.createdAt || Date.now()),
    isVolunteer: Boolean(data.isVolunteer),
    isOrganizer: Boolean(data.isOrganizer),
  }
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const database = requireDb()
  const q = query(
    collection(database, 'users'),
    where('email', '==', email.trim().toLowerCase()),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  const data = docSnap.data()
  return {
    uid: docSnap.id,
    email: String(data.email || ''),
    displayName: String(data.displayName || ''),
    createdAt: Number(data.createdAt || Date.now()),
    isVolunteer: Boolean(data.isVolunteer),
    isOrganizer: Boolean(data.isOrganizer),
  }
}

export async function updateUserRoles(
  uid: string,
  roles: { isVolunteer: boolean; isOrganizer: boolean },
): Promise<void> {
  await upsertUserProfile({ uid, ...roles })
}
