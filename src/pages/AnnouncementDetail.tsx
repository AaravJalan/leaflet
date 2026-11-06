import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { useOrgAccess } from '../lib/orgAccess'
import { formatWhen } from '../lib/schedule'
import { OrgMarks } from '../components/OrgMarks'
import { loadAnnouncement } from '../services/catalog'
import { deleteAnnouncement } from '../services/announcements'
import type { Announcement } from '../types'
import { coverImage } from '../lib/images'

export function AnnouncementDetail() {
  const { announcementId = '' } = useParams()
  const { user, profile } = useAuth()
  const demo = useDemo()
  const navigate = useNavigate()
  const [item, setItem] = useState<Announcement | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!announcementId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const next = await loadAnnouncement(
          announcementId,
          user?.uid ?? null,
          demo.localPosts,
        )
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
  }, [announcementId, user, profile, demo.localPosts, demo.revision])

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function onDelete() {
    if (!item || item.createdBy !== user?.uid) return
    if (!window.confirm('Delete this announcement?')) return
    setError('')
    try {
      if (item.mock || item.id.startsWith('mock-') || item.id.startsWith('local-')) demo.removePost(item.id)
      else await deleteAnnouncement(item.id)
      navigate(`/org/${item.orgId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete announcement')
    }
  }

  const access = useOrgAccess(item?.orgId ?? '', item?.orgOwnerId)
  const canEdit = Boolean(user && item && item.createdBy === user.uid)

  return (
    <div className="page page--narrow">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !item ? <p className="empty">Announcement not found.</p> : null}

      {item ? (
        <article className="panel">
          <img className="announcement-cover" src={coverImage(item, 1200, 500)} alt="" />
          <div className="org-hero__meta">
            {user ? (
              <span className="pill">
                {item.createdBy === user.uid
                  ? profile?.displayName || user.displayName || item.createdByName || 'You'
                  : item.createdByName || 'Someone'}
              </span>
            ) : null}
            <Link className="name-link" to={`/org/${item.orgId}`}>
              {item.orgName}
            </Link>
            <OrgMarks
              createdByYou={access.yours}
              canPost={access.canPost}
              following={access.following}
              createdAt={item.orgCreatedAt ?? 0}
            />
            <span className="muted">{item.orgType}</span>
          </div>
          <h1>{item.title}</h1>
          <p className="lede" style={{ whiteSpace: "pre-line" }}>{item.description}</p>

          <dl className="facts">
            {formatWhen(item) ? (
              <>
                <dt>When</dt>
                <dd>{formatWhen(item)}</dd>
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
            {canEdit ? (
              <Link className="btn btn--ghost" to={`/a/${item.id}/edit`}>
                Edit
              </Link>
            ) : null}
            {canEdit ? (
              <button type="button" className="btn btn--ghost" onClick={() => void onDelete()}>
                Delete
              </button>
            ) : null}
            <Link className="btn btn--ghost" to={`/org/${item.orgId}`}>
              View org
            </Link>
          </div>
        </article>
      ) : null}
    </div>
  )
}
