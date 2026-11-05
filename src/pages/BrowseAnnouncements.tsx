import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { ScopeToggle, type Scope } from '../components/ScopeToggle'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { loadAnnouncements, loadOrganizations } from '../services/catalog'
import type { Announcement } from '../types'

function readScope(value: string | null): Scope {
  if (value === 'following' || value === 'mine') return value
  return 'all'
}

export function BrowseAnnouncements() {
  const { user, profile } = useAuth()
  const demo = useDemo()
  const [params, setParams] = useSearchParams()
  const scope = readScope(params.get('scope'))
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [posts, orgs] = await Promise.all([
        loadAnnouncements(user?.uid ?? null, demo.localPosts),
        loadOrganizations({
          userId: user?.uid ?? null,
          displayName: profile?.displayName || user?.displayName || 'You',
        }),
      ])
      const mine = new Set(orgs.filter((org) => user && org.ownerId === user.uid).map((org) => org.id))
      const followed = new Set(demo.follows)
      const next = posts.filter((post) => {
        if (scope === 'following') {
          return followed.has(post.orgId) && !mine.has(post.orgId) && post.createdBy !== user?.uid
        }
        if (scope === 'mine') return mine.has(post.orgId)
        return true
      })
      if (!cancelled) {
        setItems(next)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, profile, demo.localPosts, demo.follows, demo.revision, scope])

  return (
    <div className="page">
      <SetupBanner />
      <section className="section">
        <div className="section__head">
          <div>
            <h1>Announcements</h1>
            <p className="lede lede--tight">
              Filter by everything, followed orgs, or created orgs.
            </p>
          </div>
          <ScopeToggle
            value={scope}
            onChange={(next) => setParams(next === 'all' ? {} : { scope: next })}
          />
        </div>
        {scope !== 'all' && !user ? (
          <p className="empty">Sign in to use Following and My orgs.</p>
        ) : null}
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && items.length === 0 ? <p className="empty">Nothing in this view.</p> : null}
        <div className="stack">
          {items.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
