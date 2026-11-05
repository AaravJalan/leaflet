import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PermissionEvent } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

export async function recordPermissionEvent(event: PermissionEvent): Promise<void> {
  if (event.targetUserId.startsWith('mock-')) return
  const database = requireDb()
  await setDoc(doc(database, 'users', event.targetUserId, 'activity', event.id), event)
}

export async function listPermissionEvents(userId: string): Promise<PermissionEvent[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'users', userId, 'activity'))
  return snap.docs.map((item) => {
    const data = item.data()
    return {
      id: item.id,
      type: data.type === 'removed' ? 'removed' : 'allowed',
      orgId: String(data.orgId || ''),
      orgName: String(data.orgName || ''),
      actorId: String(data.actorId || ''),
      actorName: String(data.actorName || 'Someone'),
      targetUserId: String(data.targetUserId || userId),
      createdAt: Number(data.createdAt || 0),
    }
  })
}
