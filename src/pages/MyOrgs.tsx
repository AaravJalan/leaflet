import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { OrgCard } from '../components/OrgCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { listOrganizationsByOwner } from '../services/organizations'
import { seedDemoData } from '../services/seed'
import { listSubscriptions } from '../services/subscriptions'
import type { Organization, Subscription } from '../types'

export function MyOrgs() {
  const { user, configured } = useAuth()
  const [owned, setOwned] = useState<Organization[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!configured || !user) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [nextOwned, nextSubs] = await Promise.all([
          listOrganizationsByOwner(user!.uid),
          listSubscriptions(user!.uid),
        ])
        if (!cancelled) {
          setOwned(nextOwned)
          setSubs(nextSubs)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load your orgs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [configured, user, reloadKey])

  if (!user) return <Navigate to="/auth" replace />

  async function onSeed() {
    if (!user) return
    setSeeding(true)
    setError('')
    try {
      await seedDemoData({
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Organizer',
      })
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample data')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="page">
      <SetupBanner />
      <section className="section">
        <div className="section__head">
          <div>
            <h1>My organizations</h1>
            <p className="lede lede--tight">What you run and what you follow.</p>
          </div>
          <div className="hero__actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={seeding}
              onClick={() => void onSeed()}
            >
              {seeding ? 'Seeding…' : 'Load sample data'}
            </button>
            <Link className="btn" to="/orgs/new">
              New org
            </Link>
          </div>
        </div>

        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <h2 className="subhead">Organizing</h2>
        {owned.length === 0 && !loading ? (
          <p className="empty">No organizations yet.</p>
        ) : (
          <div className="grid">
            {owned.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        )}

        <h2 className="subhead">Following</h2>
        {subs.length === 0 && !loading ? (
          <p className="empty">
            Nothing yet. <Link to="/browse">Browse organizations</Link>
          </p>
        ) : (
          <ul className="follow-list">
            {subs.map((sub) => (
              <li key={sub.id}>
                <Link to={`/org/${sub.orgId}`}>{sub.orgName}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
