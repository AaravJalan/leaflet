import { isNewOrg } from '../lib/roles'

export function OrgMarks({
  createdByYou,
  canPost,
  following,
  createdAt,
}: {
  createdByYou: boolean
  canPost: boolean
  following: boolean
  createdAt: number
}) {
  const showPost = canPost && !createdByYou
  const showFollow = following && !createdByYou
  const fresh = isNewOrg(createdAt)
  if (!createdByYou && !showPost && !showFollow && !fresh) return null

  return (
    <span className="marks">
      {createdByYou ? (
        <span className="mark mark--icon mark--yours" title="You created this org" aria-label="You created this org">
          <MarkIcon kind="yours" />
        </span>
      ) : null}
      {showPost ? (
        <span className="mark mark--icon mark--post" title="You can post here" aria-label="You can post here">
          <MarkIcon kind="post" />
        </span>
      ) : null}
      {showFollow ? (
        <span className="mark mark--icon mark--follow" title="You follow this org" aria-label="You follow this org">
          <MarkIcon kind="follow" />
        </span>
      ) : null}
      {fresh ? (
        <span className="mark mark--icon mark--new" title="Created in the last day" aria-label="Created in the last day">
          <MarkIcon kind="new" />
        </span>
      ) : null}
    </span>
  )
}

function MarkIcon({ kind }: { kind: 'yours' | 'post' | 'follow' | 'new' }) {
  if (kind === 'yours') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 7.5 8 3l5 4.5V13H3V7.5Z" />
      </svg>
    )
  }
  if (kind === 'post') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M10.2 2.8 13.2 5.8 5.5 13.5 2 14l.5-3.5 7.7-7.7Z" />
      </svg>
    )
  }
  if (kind === 'follow') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 2.5h8v11l-4-2.4-4 2.4v-11Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.2 9.2 6 14 8l-4.8 2L8 14.8 6.8 10 2 8l4.8-2L8 1.2Z" />
    </svg>
  )
}
