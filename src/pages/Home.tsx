import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { listAnnouncementsForOrgs, listRecentAnnouncements } from '../services/announcements'
import { seedDemoData } from '../services/seed'
import { listSubscriptions } from '../services/subscriptions'
import type { Announcement } from '../types'

export function Home() {
  const { user, configured } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  const [mode, setMode] = useState<'all' | 'following'>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedNote, setSeedNote] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        if (mode === 'following' && user) {
          const subs = await listSubscriptions(user.uid)
          const next = await listAnnouncementsForOrgs(subs.map((s) => s.orgId))
          if (!cancelled) setItems(next)
        } else {
          const next = await listRecentAnnouncements()
          if (!cancelled) setItems(next)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load feed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [configured, mode, user, reloadKey])

  async function onSeed() {
    if (!user) return
    setSeeding(true)
    setError('')
    setSeedNote('')
    try {
      const result = await seedDemoData({
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Organizer',
      })
      setSeedNote(`Added ${result.orgCount} orgs and ${result.postCount} posts.`)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample data')
    } finally {
      setSeeding(false)
    }
  }

  const showSeedCard = !loading && mode === 'all'

  return (
    <div className="page">
      <SetupBanner />
      <section className="hero">
        <h1>Leaflet</h1>
        <p className="lede">
          Post a neighborhood announcement, share one link, and let people follow without a
          mailing list.
        </p>
        <div className="hero__actions">
          {user ? (
            <Link className="btn" to="/orgs/new">
              New post
            </Link>
          ) : (
            <Link className="btn" to="/auth">
              Sign in to post
            </Link>
          )}
          <Link className="btn btn--ghost" to="/browse">
            Find orgs
          </Link>
        </div>
      </section>

      {showSeedCard && items.length === 0 ? (
        <section className="panel seed-card">
          <h2>Try it with sample data</h2>
          <p className="lede">
            Load a few Evanston orgs and announcements so the feed isn&apos;t empty.
          </p>
          {user ? (
            <div className="empty-actions">
              <button
                type="button"
                className="btn"
                disabled={seeding}
                onClick={() => void onSeed()}
              >
                {seeding ? 'Loading sample data…' : 'Load sample orgs & posts'}
              </button>
            </div>
          ) : (
            <div className="empty-actions">
              <Link className="btn" to="/auth">
                Sign in to load samples
              </Link>
            </div>
          )}
          {seedNote ? <p className="muted">{seedNote}</p> : null}
        </section>
      ) : null}

      <section className="section">
        <div className="section__head">
          <h2>{mode === 'following' ? 'From orgs you follow' : 'Latest'}</h2>
          {user ? (
            <div className="segmented">
              <button
                type="button"
                className={mode === 'all' ? 'is-active' : ''}
                onClick={() => setMode('all')}
              >
                All
              </button>
              <button
                type="button"
                className={mode === 'following' ? 'is-active' : ''}
                onClick={() => setMode('following')}
              >
                Following
              </button>
            </div>
          ) : null}
        </div>

        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {seedNote && items.length > 0 ? <p className="muted">{seedNote}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="empty">
            {mode === 'following'
              ? 'Follow an organization to fill this feed.'
              : 'No announcements yet.'}
          </p>
        ) : null}

        <div className="stack">
          {items.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
