import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
  collection,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Subscription } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

function subscriptionId(userId: string, orgId: string) {
  return `${userId}_${orgId}`
}

export async function subscribeToOrg(input: {
  userId: string
  orgId: string
  orgName: string
}): Promise<void> {
  const database = requireDb()
  const id = subscriptionId(input.userId, input.orgId)
  await setDoc(doc(database, 'subscriptions', id), {
    id,
    userId: input.userId,
    orgId: input.orgId,
    orgName: input.orgName,
    createdAt: Date.now(),
  })
}

export async function unsubscribeFromOrg(userId: string, orgId: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'subscriptions', subscriptionId(userId, orgId)))
}

export async function isSubscribed(userId: string, orgId: string): Promise<boolean> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'subscriptions', subscriptionId(userId, orgId)))
  return snap.exists()
}

export async function listSubscriptions(userId: string): Promise<Subscription[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'subscriptions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Subscription)
}
