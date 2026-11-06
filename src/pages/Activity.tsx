import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { OrgCard } from '../components/OrgCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { mockPermissionEvents, mockPosterIds } from '../data/mock'
import { readPermissionLog } from '../lib/permissionLog'
import { listPermissionEvents } from '../services/activity'
import { loadAnnouncements, loadOrganizations } from '../services/catalog'
import { listOrgMembers } from '../services/members'
import type { Announcement, Organization, PermissionEvent } from '../types'

export function Activity() {
  const { user, profile } = useAuth()
  const demo = useDemo()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [mine, setMine] = useState<Announcement[]>([])
  const [inOrgs, setInOrgs] = useState<Announcement[]>([])
  const [posterOrgIds, setPosterOrgIds] = useState<string[]>([])
  const [access, setAccess] = useState<PermissionEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const uid = user?.uid ?? null
      const name = profile?.displayName || user?.displayName || 'You'
      const allOrgs = await loadOrganizations({ userId: uid, displayName: name })
      const posts = await loadAnnouncements(uid, demo.localPosts)
      const canPostIds = new Set<string>()
      if (uid) {
        for (const org of allOrgs) {
          if (org.ownerId === uid) canPostIds.add(org.id)
          if (org.mock && mockPosterIds(org.id, uid).includes(uid)) canPostIds.add(org.id)
          if ((demo.extraPosters[org.id] ?? []).some((member) => member.userId === uid)) {
            canPostIds.add(org.id)
          }
          if ((demo.removedPosterIds[org.id] ?? []).includes(uid) && org.ownerId !== uid) {
            canPostIds.delete(org.id)
          }
        }
        await Promise.all(
          allOrgs
            .filter((org) => !org.mock && org.ownerId !== uid)
            .map(async (org) => {
              try {
                const members = await listOrgMembers(org.id)
                if (members.some((member) => member.userId === uid)) canPostIds.add(org.id)
              } catch {
                // Ignore orgs we cannot inspect.
              }
            }),
        )
      }
      let notes: PermissionEvent[] = uid ? mockPermissionEvents(uid) : []
      if (uid) {
        notes = [
          ...notes,
          ...readPermissionLog().filter((event) => event.targetUserId === uid),
        ]
        try {
          notes = [...notes, ...(await listPermissionEvents(uid))]
        } catch {
          // Sample and local notes still show if the activity collection cannot be read.
        }
      }
      const seen = new Set<string>()
      notes = notes
        .filter((event) => {
          if (seen.has(event.id)) return false
          seen.add(event.id)
          return true
        })
        .sort((a, b) => b.createdAt - a.createdAt)
      if (cancelled) return
      setAccess(notes)
      setOrgs(allOrgs.filter((org) => uid && (org.ownerId === uid || canPostIds.has(org.id))))
      setPosterOrgIds([...canPostIds])
      setMine(uid ? posts.filter((post) => post.createdBy === uid) : [])
      setInOrgs(posts.filter((post) => canPostIds.has(post.orgId)))
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user, profile, demo.localPosts, demo.extraPosters, demo.removedPosterIds, demo.revision])

  return (
    <div className="page">
      <SetupBanner />
      <section className="section">
        <div className="section__head">
          <div>
            <h1>Account</h1>
            <p className="lede lede--tight">
              {user
                ? 'Who allowed editing, who removed it, and what can be posted.'
                : 'Sign in to see account activity.'}
            </p>
          </div>
        </div>
        {!user ? (
          <p className="empty">
            <Link to="/auth">Sign in</Link> to see account activity.
          </p>
        ) : null}
        {loading ? <p className="muted">Loading…</p> : null}

        {user ? <h2 className="subhead">Editing access</h2> : null}
        {user && access.length === 0 && !loading ? <p className="empty">No access changes yet.</p> : null}
        <div className="access-list">
          {access.map((event) => (
            <article key={event.id} className="access-row">
              <p>
                <strong>{event.actorName}</strong>{' '}
                {event.type === 'allowed'
                  ? 'allowed you to edit posts in '
                  : 'removed you from editing posts in '}
                <Link to={`/org/${event.orgId}`}>{event.orgName}</Link>.
              </p>
              <span className="muted">{format(event.createdAt, 'MMM d, h:mm a')}</span>
            </article>
          ))}
        </div>

        {user ? <h2 className="subhead">Orgs on this account</h2> : null}
        {user && orgs.length === 0 && !loading ? <p className="empty">None yet.</p> : null}
        <div className="grid">
          {orgs.map((org) => (
            <OrgCard key={org.id} org={org} canPost={posterOrgIds.includes(org.id)} />
          ))}
        </div>

        {user ? <h2 className="subhead">Posts from this account</h2> : null}
        {user && mine.length === 0 && !loading ? <p className="empty">No posts yet.</p> : null}
        <div className="stack">
          {mine.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>

        {user ? <h2 className="subhead">In those orgs</h2> : null}
        {user && inOrgs.length === 0 && !loading ? <p className="empty">No announcements yet.</p> : null}
        <div className="stack">
          {inOrgs.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
