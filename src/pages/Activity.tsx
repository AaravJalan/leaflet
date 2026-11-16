import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { mockPosterIds } from '../data/mock'
import { readPermissionLog } from '../lib/permissionLog'
import { canOrganize } from '../lib/roles'
import { listPermissionEvents } from '../services/activity'
import { loadAnnouncements, loadOrganizations } from '../services/catalog'
import { listOrgMembers } from '../services/members'
import type { Announcement, Organization, PermissionEvent } from '../types'

function orgHue(id: string) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 360
  return hash
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || '?'
  )
}

function OrgAvatar({ org }: { org: Organization }) {
  return (
    <span className="org-avatar" style={{ background: `hsl(${orgHue(org.id)} 45% 42%)` }} aria-hidden="true">
      {initials(org.name)}
    </span>
  )
}

export function Activity() {
  const { user, profile } = useAuth()
  const demo = useDemo()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [mine, setMine] = useState<Announcement[]>([])
  const [allPosts, setAllPosts] = useState<Announcement[]>([])
  const [allOrgs, setAllOrgs] = useState<Organization[]>([])
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('org')
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
      let notes: PermissionEvent[] = []
      if (uid) {
        notes = readPermissionLog().filter((event) => event.targetUserId === uid)
        try {
          notes = [...notes, ...(await listPermissionEvents(uid))]
        } catch {
          // Local notes still show if the activity collection cannot be read.
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
      setAllPosts(posts)
      setAllOrgs(allOrgs)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user, profile, demo.localPosts, demo.extraPosters, demo.removedPosterIds, demo.revision])

  const followedOrgs = allOrgs.filter(
    (org) => demo.follows.includes(org.id) && !orgs.some((mineOrg) => mineOrg.id === org.id),
  )
  const selected = selectedId ? allOrgs.find((org) => org.id === selectedId) ?? null : null
  const selectedPosts = selected ? allPosts.filter((post) => post.orgId === selected.id) : []
  const canPostSelected = selected ? posterOrgIds.includes(selected.id) : false
  const select = (id: string | null) => setParams(id ? { org: id } : {})

  if (!user) {
    return (
      <div className="page">
        <SetupBanner />
        <h1>Home</h1>
        <p className="empty">
          <Link to="/auth">Sign in</Link> to see your orgs.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <SetupBanner />
      <div className="workspace">
        <aside className="workspace__sidebar" aria-label="Your orgs">
          <button
            type="button"
            className={`workspace__item${!selected ? ' is-active' : ''}`}
            onClick={() => select(null)}
          >
            <span className="org-avatar org-avatar--home" aria-hidden="true">⌂</span>
            <span className="workspace__name">Overview</span>
          </button>

          <p className="workspace__group">Your orgs</p>
          {!loading && orgs.length === 0 ? <p className="muted workspace__hint">None yet.</p> : null}
          {orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              className={`workspace__item${selected?.id === org.id ? ' is-active' : ''}`}
              onClick={() => select(org.id)}
            >
              <OrgAvatar org={org} />
              <span className="workspace__name">{org.name}</span>
            </button>
          ))}

          {followedOrgs.length > 0 ? <p className="workspace__group">Following</p> : null}
          {followedOrgs.map((org) => (
            <button
              key={org.id}
              type="button"
              className={`workspace__item${selected?.id === org.id ? ' is-active' : ''}`}
              onClick={() => select(org.id)}
            >
              <OrgAvatar org={org} />
              <span className="workspace__name">{org.name}</span>
            </button>
          ))}

          {canOrganize(profile?.accountType) ? (
            <Link className="quiet-link workspace__new" to="/orgs/new">
              + Start a new org
            </Link>
          ) : null}
        </aside>

        <section className="workspace__main">
          {loading ? <p className="muted">Loading…</p> : null}

          {selected ? (
            <>
              <div className="section__head">
                <div className="workspace__title">
                  <OrgAvatar org={selected} />
                  <div>
                    <h1>{selected.name}</h1>
                    <p className="muted">
                      {selected.type}
                      {selected.location ? ` · ${selected.location}` : ''} ·{' '}
                      <Link to={`/org/${selected.id}`}>Org page</Link>
                    </p>
                  </div>
                </div>
                {canPostSelected ? (
                  <Link className="btn" to={`/org/${selected.id}/new`}>
                    New post
                  </Link>
                ) : null}
              </div>
              {!loading && selectedPosts.length === 0 ? <p className="empty">No posts yet.</p> : null}
              <div className="stack">
                {selectedPosts.map((item) => (
                  <AnnouncementCard key={item.id} announcement={item} />
                ))}
              </div>
            </>
          ) : (
            <>
              <h1>Overview</h1>

              <h2 className="subhead">Editing access</h2>
              {access.length === 0 && !loading ? <p className="empty">No access changes yet.</p> : null}
              <div className="access-list">
                {access.map((event) => (
                  <article key={event.id} className="access-row">
                    <p>
                      <strong>{event.actorName}</strong>{' '}
                      {event.type === 'allowed'
                        ? 'allowed you to edit posts in '
                        : 'removed you from editing posts in '}
                      <button type="button" className="link-button" onClick={() => select(event.orgId)}>
                        {event.orgName}
                      </button>
                      .
                    </p>
                    <span className="muted">{format(event.createdAt, 'MMM d, h:mm a')}</span>
                  </article>
                ))}
              </div>

              <h2 className="subhead">Your posts</h2>
              {mine.length === 0 && !loading ? <p className="empty">No posts yet.</p> : null}
              <div className="stack">
                {mine.map((item) => (
                  <AnnouncementCard key={item.id} announcement={item} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
