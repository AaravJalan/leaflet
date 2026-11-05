import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { canFollow } from '../lib/roles'
import { loadAnnouncements, loadOrganizations } from '../services/catalog'
import { listSubscriptions } from '../services/subscriptions'
import type { Announcement } from '../types'

export function Inbox() {
  const { user, profile } = useAuth()
  const demo = useDemo()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const orgs = await loadOrganizations({
        userId: user?.uid ?? null,
        displayName: profile?.displayName || user?.displayName || 'You',
      })
      const followed = new Set(demo.follows)
      if (user) {
        try {
          const subs = await listSubscriptions(user.uid)
          for (const sub of subs) followed.add(sub.orgId)
        } catch {
          // Inbox still shows sample follows.
        }
      }
      const posts = await loadAnnouncements(user?.uid ?? null, demo.localPosts)
      const names = new Map(orgs.map((org) => [org.id, org.name]))
      const mine = new Set(orgs.filter((org) => user && org.ownerId === user.uid).map((org) => org.id))
      const next = posts.filter(
        (post) =>
          followed.has(post.orgId) &&
          names.has(post.orgId) &&
          !mine.has(post.orgId) &&
          post.createdBy !== user?.uid,
      )
      if (!cancelled) {
        setItems(next)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user, profile, demo.follows, demo.localPosts])

  const allowed = !user || canFollow(profile?.accountType)

  return (
    <div className="page">
      <SetupBanner />
      <section className="section">
        <div className="section__head">
          <div>
            <h1>Inbox</h1>
            <p className="lede lede--tight">Announcements from orgs you follow.</p>
          </div>
        </div>
        {!user ? (
          <p className="empty">
            <Link to="/auth">Sign in</Link> to keep a follow list. Sample follows still show below.
          </p>
        ) : null}
        {user && !profile?.accountType ? (
          <p className="empty">
            Pick an account type in <Link to="/settings">Settings</Link>. Volunteers and both can
            subscribe.
          </p>
        ) : null}
        {user && profile?.accountType === 'organizer' ? (
          <p className="empty">
            Organizer-only accounts can’t subscribe. Sample mail is still shown below. Switch to
            Volunteer or Both in <Link to="/settings">Settings</Link> to follow orgs.
          </p>
        ) : null}
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && items.length === 0 && allowed ? (
          <p className="empty">
            Nothing here yet. <Link to="/browse">Follow an org</Link> you didn’t create.
          </p>
        ) : null}
        <div className="inbox">
          {items.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
