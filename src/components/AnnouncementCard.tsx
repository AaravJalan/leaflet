import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrgAccess } from '../lib/orgAccess'
import { formatWhen } from '../lib/schedule'
import type { Announcement } from '../types'
import { OrgMarks } from './OrgMarks'

function authorLabel(announcement: Announcement, uid: string | undefined, displayName: string) {
  if (uid && announcement.createdBy === uid) return displayName || announcement.createdByName || 'You'
  return announcement.createdByName || 'Someone'
}

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const { user, profile } = useAuth()
  const author = authorLabel(
    announcement,
    user?.uid,
    profile?.displayName || user?.displayName || '',
  )
  const when = formatWhen(announcement)
  const access = useOrgAccess(announcement.orgId, announcement.orgOwnerId)

  return (
    <article className="announcement-card">
      <div className="announcement-card__meta">
        {user ? <span className="pill">{author}</span> : null}
        <Link className="name-link" to={`/org/${announcement.orgId}`}>
          {announcement.orgName}
        </Link>
        <span className="muted">{announcement.orgType}</span>
        <OrgMarks
          createdByYou={access.yours}
          canPost={access.canPost}
          following={access.following}
          createdAt={announcement.orgCreatedAt ?? 0}
        />
      </div>
      <h3>
        <Link to={`/a/${announcement.id}`}>{announcement.title}</Link>
      </h3>
      <p className="clamp">{announcement.description}</p>
      <div className="announcement-card__details">
        {when ? <span>{when}</span> : null}
        {announcement.location ? <span>{announcement.location}</span> : null}
        {announcement.link ? <a href={announcement.link} target="_blank" rel="noreferrer">{announcement.link}</a> : null}
      </div>
    </article>
  )
}
