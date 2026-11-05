import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { loadAnnouncements } from '../services/catalog'
import type { Announcement } from '../types'

export function Home() {
  const { user } = useAuth()
  const demo = useDemo()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void loadAnnouncements(user?.uid ?? null, demo.localPosts).then((next) => {
      if (!cancelled) {
        setItems(next)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user, demo.localPosts, demo.revision])

  return (
    <div className="page">
      <SetupBanner />
      <section className="hero">
        <h1>Leaflet</h1>
        <p className="lede">
          Public announcements from every org. Follow the ones you care about. They land in your inbox.
        </p>
        <div className="hero__actions">
          <Link className="btn" to="/orgs">
            Browse orgs
          </Link>
          <Link className="btn btn--ghost" to="/announcements">
            Browse announcements
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Latest</h2>
        </div>
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && items.length === 0 ? <p className="empty">No announcements yet.</p> : null}
        <div className="stack">
          {items.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
