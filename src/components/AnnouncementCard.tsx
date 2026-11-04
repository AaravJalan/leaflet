import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { Announcement } from '../types'

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <article className="announcement-card">
      <div className="announcement-card__meta">
        <Link to={`/org/${announcement.orgId}`} className="pill">
          {announcement.orgName}
        </Link>
        <span className="muted">{announcement.orgType}</span>
      </div>
      <h3>
        <Link to={`/a/${announcement.id}`}>{announcement.title}</Link>
      </h3>
      <p className="clamp">{announcement.description}</p>
      <div className="announcement-card__details">
        {announcement.startsAt ? (
          <span>{format(announcement.startsAt, 'EEE, MMM d · h:mm a')}</span>
        ) : null}
        {announcement.location ? <span>{announcement.location}</span> : null}
      </div>
    </article>
  )
}
