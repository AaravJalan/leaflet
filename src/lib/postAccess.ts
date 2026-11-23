import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { canUserPost } from '../services/members'
import { getOrganization } from '../services/organizations'
import type { Announcement } from '../types'
import { isFirebaseConfigured } from './firebase'
import { useOrgAccess } from './orgAccess'

function isLocalPost(item: Announcement) {
  return Boolean(item.mock || item.id.startsWith('mock-') || item.id.startsWith('local-'))
}

/**
 * Who can edit a post: its author, the org's owner, and anyone the owner added
 * under "Who can post". Matches the announcements update rule in firestore.rules.
 */
export function usePostEditAccess(item: Announcement | null) {
  const { user } = useAuth()
  const access = useOrgAccess(item?.orgId ?? '', item?.orgOwnerId)
  const uid = user?.uid ?? null
  const knownNow = Boolean(uid && item && (item.createdBy === uid || access.canPost))
  // Real orgs keep their owner and posters in Firestore, so look them up there.
  // (A single post loaded on its own does not carry orgOwnerId.)
  const lookupKey =
    uid && item && !knownNow && isFirebaseConfigured && !isLocalPost(item) ? `${item.orgId}:${uid}` : ''
  const [result, setResult] = useState<{ key: string; allowed: boolean }>({ key: '', allowed: false })

  useEffect(() => {
    if (!lookupKey || !item || !uid) return
    let cancelled = false
    const orgId = item.orgId
    Promise.resolve(item.orgOwnerId || getOrganization(orgId).then((org) => org?.ownerId ?? ''))
      .then((ownerId) => canUserPost(orgId, uid, ownerId))
      .then((allowed) => {
        if (!cancelled) setResult({ key: lookupKey, allowed })
      })
      .catch(() => {
        if (!cancelled) setResult({ key: lookupKey, allowed: false })
      })
    return () => {
      cancelled = true
    }
  }, [lookupKey, item, uid])

  const answered = result.key === lookupKey
  return {
    canEdit: knownNow || (Boolean(lookupKey) && answered && result.allowed),
    checking: Boolean(lookupKey) && !answered,
  }
}
