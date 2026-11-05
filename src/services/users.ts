import { doc, getDoc, getDocs, query, collection, setDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AccountType, UserProfile } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

function asAccountType(value: unknown): AccountType | null {
  if (value === 'organizer' || value === 'volunteer' || value === 'both') return value
  return null
}

function mapUser(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: id,
    email: String(data.email || ''),
    displayName: String(data.displayName || ''),
    createdAt: Number(data.createdAt || Date.now()),
    accountType: asAccountType(data.accountType),
  }
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
  return snap.exists() ? mapUser(snap.id, snap.data()) : null
}

export async function listUsers(): Promise<UserProfile[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'users'))
  return snap.docs.map((item) => mapUser(item.id, item.data()))
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const database = requireDb()
  const q = query(
    collection(database, 'users'),
    where('email', '==', email.trim().toLowerCase()),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return mapUser(snap.docs[0].id, snap.docs[0].data())
}

export async function setAccountType(uid: string, accountType: AccountType): Promise<void> {
  await upsertUserProfile({ uid, accountType })
}
