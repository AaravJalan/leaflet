import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrgAccess } from '../lib/orgAccess'
import type { Organization } from '../types'
import { OrgMarks } from './OrgMarks'

export function OrgCard({ org, canPost }: { org: Organization; canPost?: boolean }) {
  const { user } = useAuth()
  const access = useOrgAccess(org.id, org.ownerId)
  const yours = access.yours
  const poster = canPost ?? access.canPost

  return (
    <article className="org-card">
      <div className="org-card__top">
        <span className="pill">{org.type}</span>
        <OrgMarks
          createdByYou={yours}
          canPost={poster}
          following={access.following}
          createdAt={org.createdAt}
        />
      </div>
      <h3>
        <Link to={`/org/${org.id}`}>{org.name}</Link>
      </h3>
      <p className="clamp">{org.description}</p>
      {user ? <p className="muted org-by">by {org.ownerName}</p> : null}
    </article>
  )
}
