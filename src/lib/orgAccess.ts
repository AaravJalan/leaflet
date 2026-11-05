import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { mockPosterIds } from '../data/mock'

export function useOrgAccess(orgId: string, ownerId?: string) {
  const { user } = useAuth()
  const demo = useDemo()
  const uid = user?.uid ?? null
  const yours = Boolean(uid && ownerId && ownerId === uid)
  const removed = Boolean(uid && (demo.removedPosterIds[orgId] ?? []).includes(uid))
  const extra = Boolean(uid && (demo.extraPosters[orgId] ?? []).some((member) => member.userId === uid))
  const canPost = Boolean(uid && (yours || (!removed && (extra || mockPosterIds(orgId, uid).includes(uid)))))
  return {
    yours,
    canPost,
    following: Boolean(uid && demo.isFollowing(orgId)),
  }
}
