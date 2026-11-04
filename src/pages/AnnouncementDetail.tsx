import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { getAnnouncement } from '../services/announcements'
import type { Announcement } from '../types'

export function AnnouncementDetail() {
  const { announcementId = '' } = useParams()
  const { configured } = useAuth()
  const [item, setItem] = useState<Announcement | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!configured || !announcementId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const next = await getAnnouncement(announcementId)
        if (!cancelled) setItem(next)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load announcement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [configured, announcementId])

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="page page--narrow">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !item ? <p className="empty">Announcement not found.</p> : null}

      {item ? (
        <article className="panel">
          <div className="org-hero__meta">
            <Link className="pill" to={`/org/${item.orgId}`}>
              {item.orgName}
            </Link>
            <span className="muted">{item.orgType}</span>
          </div>
          <h1>{item.title}</h1>
          <p className="lede">{item.description}</p>

          <dl className="facts">
            {item.startsAt ? (
              <>
                <dt>When</dt>
                <dd>{format(item.startsAt, 'EEE, MMM d · h:mm a')}</dd>
              </>
            ) : null}
            {item.location ? (
              <>
                <dt>Where</dt>
                <dd>{item.location}</dd>
              </>
            ) : null}
            {item.link ? (
              <>
                <dt>Link</dt>
                <dd>
                  <a href={item.link} target="_blank" rel="noreferrer">
                    {item.link}
                  </a>
                </dd>
              </>
            ) : null}
          </dl>

          <div className="hero__actions">
            <button type="button" className="btn" onClick={() => void copyLink()}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <Link className="btn btn--ghost" to={`/org/${item.orgId}`}>
              View org
            </Link>
          </div>
        </article>
      ) : null}
    </div>
  )
}
