import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PosterPicker } from '../components/PosterPicker'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { rememberPermission } from '../lib/permissionLog'
import { canOrganize } from '../lib/roles'
import { recordPermissionEvent } from '../services/activity'
import { upsertOrgMember } from '../services/members'
import { createOrganization } from '../services/organizations'
import { ORG_TYPES, type OrgType, type UserProfile } from '../types'

export function CreateOrg() {
  const { user, profile, configured, loading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState<OrgType>('Neighborhood')
  const [posters, setPosters] = useState<UserProfile[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="muted">Loading…</p>
  if (!user) return <Navigate to="/auth" replace />
  if (!canOrganize(profile?.accountType)) {
    return (
      <div className="page page--narrow">
        <section className="panel">
          <h1>Organizers only</h1>
          <p className="lede">
            Choose Organizer or Both in Settings before you create an org. Volunteers can still be
            added as posters.
          </p>
          <Link className="btn" to="/settings">
            Open settings
          </Link>
        </section>
      </div>
    )
  }

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
        location,
      })
      const actorName = profile?.displayName || user.displayName || 'Someone'
      for (const person of posters) {
        await upsertOrgMember({
          orgId: id,
          userId: person.uid,
          email: person.email,
          displayName: person.displayName,
          addedBy: user.uid,
          createdAt: Date.now(),
        })
        const event = {
          id: `allowed-${id}-${person.uid}`,
          type: 'allowed' as const,
          orgId: id,
          orgName: name.trim(),
          actorId: user.uid,
          actorName,
          targetUserId: person.uid,
          createdAt: Date.now(),
        }
        rememberPermission(event)
        try {
          await recordPermissionEvent(event)
        } catch {
          // Membership is saved even if the activity note is not.
        }
      }
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
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where this group usually meets"
            />
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
          <div>
            <h2>Who can post</h2>
            <p className="lede lede--tight">You can always post. Add other Leaflet accounts.</p>
            <PosterPicker
              selected={posters}
              excludeIds={[user.uid]}
              onPick={(person) =>
                setPosters((current) =>
                  current.some((item) => item.uid === person.uid) ? current : [...current, person],
                )
              }
              onRemove={(person) => setPosters((current) => current.filter((item) => item.uid !== person.uid))}
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <div className="hero__actions">
            <button className="btn" type="submit" disabled={busy || !configured}>
              {busy ? 'Creating…' : 'Create'}
            </button>
            <Link className="btn btn--ghost" to="/orgs">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
