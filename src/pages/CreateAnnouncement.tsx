import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ScheduleFields } from '../components/ScheduleFields'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { mockPosterIds } from '../data/mock'
import { buildWhen } from '../lib/schedule'
import { createAnnouncement } from '../services/announcements'
import { loadOrganization } from '../services/catalog'
import { listOrgMembers } from '../services/members'
import type { Organization } from '../types'

export function CreateAnnouncement() {
  const { orgId = '' } = useParams()
  const { user, profile } = useAuth()
  const demo = useDemo()
  const navigate = useNavigate()
  const [org, setOrg] = useState<Organization | null>(null)
  const [allowed, setAllowed] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [link, setLink] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [schedule, setSchedule] = useState<'once' | 'weekly'>('once')
  const [weekOf, setWeekOf] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [days, setDays] = useState<number[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const next = await loadOrganization(
          orgId,
          user?.uid ?? null,
          profile?.displayName || user?.displayName || 'You',
        )
        let can = false
        if (next && user) {
          const removed = (demo.removedPosterIds[next.id] ?? []).includes(user.uid)
          can =
            next.ownerId === user.uid ||
            (!removed &&
              (mockPosterIds(next.id, user.uid).includes(user.uid) ||
                (demo.extraPosters[next.id] ?? []).some((member) => member.userId === user.uid)))
          if (!can && !next.mock) {
            try {
              const members = await listOrgMembers(next.id)
              can = members.some((member) => member.userId === user.uid)
            } catch {
              can = false
            }
          }
        }
        if (!cancelled) {
          setOrg(next)
          setAllowed(can)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load organization')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [orgId, user, profile, demo.extraPosters, demo.removedPosterIds])

  if (!user) return <Navigate to="/auth" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !org) return
    setBusy(true)
    setError('')
    try {
      const when = buildWhen(schedule, startsAt, endsAt, weekOf, startTime, endTime, days)
      const createdByName = profile?.displayName || user.displayName || 'You'
      if (org.mock) {
        const id = `local-${Date.now()}`
        demo.addLocalPost({
          id,
          orgId: org.id,
          orgName: org.name,
          orgType: org.type,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          link: link.trim(),
          createdAt: Date.now(),
          createdBy: user.uid,
          createdByName,
          mock: true,
          ...when,
        })
        navigate(`/a/${id}`)
        return
      }
      const id = await createAnnouncement({
        org,
        title,
        description,
        location,
        link,
        createdBy: user.uid,
        createdByName,
        ...when,
      })
      navigate(`/a/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create announcement')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && !org ? <p className="empty">Organization not found.</p> : null}
      {org && !allowed ? (
        <p className="error">You can post here only if the creator added you.</p>
      ) : null}

      {org && allowed ? (
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
            <ScheduleFields
              schedule={schedule}
              onSchedule={setSchedule}
              startsAt={startsAt}
              onStartsAt={setStartsAt}
              endsAt={endsAt}
              onEndsAt={setEndsAt}
              weekOf={weekOf}
              onWeekOf={setWeekOf}
              startTime={startTime}
              onStartTime={setStartTime}
              endTime={endTime}
              onEndTime={setEndTime}
              days={days}
              onDays={setDays}
            />
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
              <button className="btn" type="submit" disabled={busy}>
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
