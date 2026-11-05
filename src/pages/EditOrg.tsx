import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { slugify } from '../lib/slug'
import { loadOrganization } from '../services/catalog'
import { updateOrganization } from '../services/organizations'
import { ORG_TYPES, type Organization, type OrgType } from '../types'

export function EditOrg() {
  const { orgId = '' } = useParams()
  const { user, profile } = useAuth()
  const demo = useDemo()
  const navigate = useNavigate()
  const [org, setOrg] = useState<Organization | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<OrgType>('Neighborhood')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void loadOrganization(orgId, user?.uid ?? null, profile?.displayName || user?.displayName || 'You').then(
      (next) => {
        if (cancelled) return
        setOrg(next)
        if (next) {
          setName(next.name)
          setDescription(next.description)
          setType(next.type)
          setLocation(next.location || '')
        }
        setLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [orgId, user, profile])

  if (!user) return <Navigate to="/auth" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!org || !user || org.ownerId !== user.uid) return
    setBusy(true)
    setError('')
    try {
      const edit = {
        name: name.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        slug: slugify(name),
      }
      if (org.mock) demo.saveOrg(org.id, edit)
      else await updateOrganization(org.id, edit)
      navigate(`/org/${org.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save organization')
    } finally {
      setBusy(false)
    }
  }

  const blocked = org && user && org.ownerId !== user.uid

  return (
    <div className="page page--narrow">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && !org ? <p className="empty">Organization not found.</p> : null}
      {blocked ? <p className="error">Only the creator can edit this org.</p> : null}
      {org && !blocked ? (
        <section className="panel">
          <h1>Edit organization</h1>
          <form className="form" onSubmit={onSubmit}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Type
              <select value={type} onChange={(e) => setType(e.target.value as OrgType)}>
                {ORG_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              About
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </label>
            <label>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Neighborhood, campus, or meeting area"
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <div className="hero__actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
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
