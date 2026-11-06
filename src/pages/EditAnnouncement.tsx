import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ScheduleFields } from '../components/ScheduleFields'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { buildWhen, toDateInput, toDateTimeInput, toTimeInput } from '../lib/schedule'
import { loadAnnouncement } from '../services/catalog'
import { updateAnnouncement } from '../services/announcements'
import { CoverPicker } from '../components/CoverPicker'
import type { Announcement } from '../types'

export function EditAnnouncement() {
  const { announcementId = '' } = useParams()
  const { user } = useAuth()
  const demo = useDemo()
  const navigate = useNavigate()
  const [item, setItem] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [schedule, setSchedule] = useState<'once' | 'weekly'>('once')
  const [weekOf, setWeekOf] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [days, setDays] = useState<number[]>([])
  const [link, setLink] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void loadAnnouncement(announcementId, user?.uid ?? null, demo.localPosts).then((next) => {
      if (cancelled) return
      setItem(next)
      if (next) {
        setTitle(next.title)
        setDescription(next.description)
        setLocation(next.location)
        setStartsAt(toDateTimeInput(next.startsAt))
        setEndsAt(toDateTimeInput(next.endsAt))
        setSchedule(next.schedule === 'weekly' ? 'weekly' : 'once')
        setWeekOf(toDateInput(next.weekOf))
        setStartTime(toTimeInput(next.startsAt))
        setEndTime(toTimeInput(next.endsAt))
        setDays(next.repeatDays ?? [])
        setLink(next.link)
        setImageUrl(next.imageUrl ?? '')
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [announcementId, user, demo.localPosts])

  if (!user) return <Navigate to="/auth" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!item || !user || item.createdBy !== user.uid) return
    setBusy(true)
    setError('')
    const edit = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      link: link.trim(),
      imageUrl,
      ...buildWhen(schedule, startsAt, endsAt, weekOf, startTime, endTime, days),
    }
    try {
      if (item.mock || item.id.startsWith('local-') || item.id.startsWith('mock-')) {
        if (item.id.startsWith('local-')) {
          demo.addLocalPost({ ...item, ...edit })
        }
        demo.savePost(item.id, edit)
      } else {
        await updateAnnouncement(item.id, edit)
      }
      navigate(`/a/${item.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save announcement')
    } finally {
      setBusy(false)
    }
  }

  const blocked = item && user && item.createdBy !== user.uid

  return (
    <div className="page page--narrow">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && !item ? <p className="empty">Announcement not found.</p> : null}
      {blocked ? <p className="error">Only the person who posted this can edit it.</p> : null}
      {item && !blocked ? (
        <section className="panel">
          <p className="eyebrow">{item.orgName}</p>
          <h1>Edit announcement</h1>
          <form className="form" onSubmit={onSubmit}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Details
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
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
              <input value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label>
              Link
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} />
            </label>
            <CoverPicker value={imageUrl} onChange={setImageUrl} />
            {error ? <p className="error">{error}</p> : null}
            <div className="hero__actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <Link className="btn btn--ghost" to={`/a/${item.id}`}>
                Cancel
              </Link>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  )
}
