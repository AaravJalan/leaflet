import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { createAnnouncement } from '../services/announcements'
import { getOrganization } from '../services/organizations'
import type { Organization } from '../types'

export function CreateAnnouncement() {
  const { orgId = '' } = useParams()
  const { user, configured } = useAuth()
  const navigate = useNavigate()
  const [org, setOrg] = useState<Organization | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!configured || !orgId) {
      setLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const next = await getOrganization(orgId)
        if (!cancelled) setOrg(next)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load organization')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [configured, orgId])

  if (!user) return <Navigate to="/auth" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !org) return
    setBusy(true)
    setError('')
    try {
      const id = await createAnnouncement({
        org,
        title,
        description,
        location,
        startsAt: startsAt ? new Date(startsAt).getTime() : null,
        link,
        createdBy: user.uid,
      })
      navigate(`/a/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create announcement')
    } finally {
      setBusy(false)
    }
  }

  const unauthorized = org && user && org.ownerId !== user.uid

  return (
    <div className="page page--narrow">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && !org ? <p className="empty">Organization not found.</p> : null}
      {unauthorized ? (
        <p className="error">Only the organization owner can post announcements.</p>
      ) : null}

      {org && !unauthorized ? (
        <section className="panel">
          <p className="eyebrow">{org.name}</p>
          <h1>New announcement</h1>
          <p className="lede lede--tight">Time, place, and why it matters.</p>

          <form className="form" onSubmit={onSubmit}>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Neighborhood Cleanup"
                required
              />
            </label>
            <label>
              Details
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Bring gloves. Meet at the park entrance."
                required
              />
            </label>
            <label>
              When
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </label>
            <label>
              Where
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Church St & Benson Ave, Evanston"
              />
            </label>
            <label>
              Link (optional)
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <div className="hero__actions">
              <button className="btn" type="submit" disabled={busy || !configured}>
                {busy ? 'Publishing…' : 'Publish'}
              </button>
              <Link className="btn btn--ghost" to={`/org/${org.id}`}>
                Cancel
              </Link>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  )
}
