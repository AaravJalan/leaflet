import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { createOrganization } from '../services/organizations'
import { ORG_TYPES, type OrgType } from '../types'

export function CreateOrg() {
  const { user, configured } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<OrgType>('Neighborhood')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return <Navigate to="/auth" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')
    try {
      const id = await createOrganization({
        name,
        description,
        type,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Organizer',
      })
      navigate(`/org/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create organization')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow">
      <SetupBanner />
      <section className="panel">
        <h1>New organization</h1>
        <p className="lede lede--tight">Then post announcements and share one link.</p>

        <form className="form" onSubmit={onSubmit}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Evanston Neighborhood Cleanup"
              required
            />
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as OrgType)}>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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
              placeholder="What this org posts about"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="hero__actions">
            <button className="btn" type="submit" disabled={busy || !configured}>
              {busy ? 'Creating…' : 'Create'}
            </button>
            <Link className="btn btn--ghost" to="/me">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
