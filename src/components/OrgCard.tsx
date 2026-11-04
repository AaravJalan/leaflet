import { Link } from 'react-router-dom'
import type { Organization } from '../types'

export function OrgCard({ org }: { org: Organization }) {
  return (
    <article className="org-card">
      <div className="org-card__top">
        <span className="pill">{org.type}</span>
        {org.verified ? <span className="verified">Verified</span> : null}
      </div>
      <h3>
        <Link to={`/org/${org.id}`}>{org.name}</Link>
      </h3>
      <p className="clamp">{org.description}</p>
    </article>
  )
}
