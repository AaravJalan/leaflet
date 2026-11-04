import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { listAnnouncementsByOrg } from '../services/announcements'
import { getOrganization } from '../services/organizations'
import {
  isSubscribed,
  subscribeToOrg,
  unsubscribeFromOrg,
} from '../services/subscriptions'
import type { Announcement, Organization } from '../types'

export function OrgDetail() {
  const { orgId = '' } = useParams()
  const { user, configured } = useAuth()
  const [org, setOrg] = useState<Organization | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!configured || !orgId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [nextOrg, nextAnnouncements] = await Promise.all([
          getOrganization(orgId),
          listAnnouncementsByOrg(orgId),
        ])
        if (cancelled) return
        setOrg(nextOrg)
        setAnnouncements(nextAnnouncements)
        if (user && nextOrg) {
          setSubscribed(await isSubscribed(user.uid, nextOrg.id))
        } else {
          setSubscribed(false)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load organization')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [configured, orgId, user])

  async function toggleSubscribe() {
    if (!user || !org) return
    setBusy(true)
    setError('')
    try {
      if (subscribed) {
        await unsubscribeFromOrg(user.uid, org.id)
        setSubscribed(false)
      } else {
        await subscribeToOrg({
          userId: user.uid,
          orgId: org.id,
          orgName: org.name,
        })
        setSubscribed(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update subscription')
    } finally {
      setBusy(false)
    }
  }

  const isOwner = Boolean(user && org && user.uid === org.ownerId)

  return (
    <div className="page">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !org ? <p className="empty">Organization not found.</p> : null}

      {org ? (
        <>
          <section className="org-hero">
            <div className="org-hero__meta">
              <span className="pill">{org.type}</span>
              {org.verified ? <span className="verified">Verified</span> : null}
            </div>
            <h1>{org.name}</h1>
            <p className="lede">{org.description}</p>
            <p className="muted">Organized by {org.ownerName}</p>
            <div className="hero__actions">
              {user ? (
                <button
                  type="button"
                  className={subscribed ? 'btn btn--ghost' : 'btn'}
                  disabled={busy}
                  onClick={() => void toggleSubscribe()}
                >
                  {subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
              ) : (
                <Link className="btn" to="/auth">
                  Sign in to subscribe
                </Link>
              )}
              {isOwner ? (
                <Link className="btn btn--ghost" to={`/org/${org.id}/new`}>
                  New announcement
                </Link>
              ) : null}
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <p className="empty">No announcements yet.</p>
            ) : (
              <div className="stack">
                {announcements.map((item) => (
                  <AnnouncementCard key={item.id} announcement={item} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
