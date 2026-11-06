import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { OrgMarks } from '../components/OrgMarks'
import { PosterPicker } from '../components/PosterPicker'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { mockMembers } from '../data/mock'
import { rememberPermission } from '../lib/permissionLog'
import { uniquePosters } from '../lib/posters'
import { canFollow } from '../lib/roles'
import { loadAnnouncementsForOrg, loadOrganization } from '../services/catalog'
import { listOrgMembers, removeOrgMember, upsertOrgMember } from '../services/members'
import { deleteOrganization } from '../services/organizations'
import { recordPermissionEvent } from '../services/activity'
import {
  isSubscribed,
  subscribeToOrg,
  unsubscribeFromOrg,
} from '../services/subscriptions'
import type { Announcement, Organization, OrgMember, UserProfile } from '../types'

export function OrgDetail() {
  const { orgId = '' } = useParams()
  const { user, profile, configured } = useAuth()
  const demo = useDemo()
  const navigate = useNavigate()
  const [org, setOrg] = useState<Organization | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [members, setMembers] = useState<OrgMember[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const displayName = profile?.displayName || user?.displayName || 'You'

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const nextOrg = await loadOrganization(orgId, user?.uid ?? null, displayName)
        const nextPosts = await loadAnnouncementsForOrg(orgId, user?.uid ?? null, demo.localPosts)
        let nextMembers: OrgMember[] = []
        if (nextOrg?.mock) {
          nextMembers = mockMembers(orgId, user?.uid ?? null, displayName)
        } else if (nextOrg && configured) {
          try {
            nextMembers = await listOrgMembers(orgId)
          } catch {
            nextMembers = []
          }
        }
        const extras = demo.extraPosters[orgId] ?? []
        const removed = new Set(demo.removedPosterIds[orgId] ?? [])
        nextMembers = uniquePosters(
          [...nextMembers.filter((member) => !removed.has(member.userId)), ...extras],
          nextOrg?.ownerId,
        )
        let nextSub = false
        if (user && nextOrg && !nextOrg.mock) {
          try {
            nextSub = await isSubscribed(user.uid, nextOrg.id)
          } catch {
            nextSub = false
          }
        }
        if (nextOrg?.mock) nextSub = demo.isFollowing(nextOrg.id)
        if (cancelled) return
        setOrg(nextOrg)
        setAnnouncements(nextPosts)
        setMembers(nextMembers)
        setSubscribed(nextSub)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load organization')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [orgId, user, displayName, configured, demo.localPosts, demo.extraPosters, demo.removedPosterIds, demo.follows, demo.revision])

  const yours = Boolean(user && org && org.ownerId === user.uid)
  const canPost = Boolean(user && org && (yours || members.some((member) => member.userId === user.uid)))
  const showSubscribe = Boolean(user && org && !yours && canFollow(profile?.accountType))

  async function toggleSubscribe() {
    if (!user || !org || yours) return
    setBusy(true)
    setError('')
    try {
      if (org.mock) {
        demo.setFollowing(org.id, !subscribed)
        setSubscribed(!subscribed)
      } else if (subscribed) {
        await unsubscribeFromOrg(user.uid, org.id)
        demo.setFollowing(org.id, false)
        setSubscribed(false)
      } else {
        await subscribeToOrg({ userId: user.uid, orgId: org.id, orgName: org.name })
        demo.setFollowing(org.id, true)
        setSubscribed(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update subscription')
    } finally {
      setBusy(false)
    }
  }

  async function noteAccess(target: UserProfile, type: 'allowed' | 'removed') {
    if (!user || !org) return
    const event = {
      id: `${type}-${org.id}-${target.uid}-${Date.now()}`,
      type,
      orgId: org.id,
      orgName: org.name,
      actorId: user.uid,
      actorName: profile?.displayName || user.displayName || 'Someone',
      targetUserId: target.uid,
      createdAt: Date.now(),
    }
    rememberPermission(event)
    if (!org.mock) {
      try {
        await recordPermissionEvent(event)
      } catch {
        // The membership change still stands if the activity note cannot be saved.
      }
    }
  }

  async function addPoster(found: UserProfile) {
    if (!user || !org) return
    setBusy(true)
    setError('')
    try {
      if (found.uid === org.ownerId) {
        setError('The creator can already post.')
        return
      }
      const already = members.some(
        (member) =>
          member.userId === found.uid ||
          (found.email && member.email.toLowerCase() === found.email.toLowerCase()),
      )
      if (already) {
        setError('That account can already post.')
        return
      }
      const member: OrgMember = {
        id: found.uid,
        orgId: org.id,
        userId: found.uid,
        email: found.email,
        displayName: found.displayName,
        addedBy: user.uid,
        createdAt: Date.now(),
      }
      if (!org.mock) await upsertOrgMember(member)
      demo.addPoster(member)
      setMembers((current) => uniquePosters([...current, member], org.ownerId))
      await noteAccess(found, 'allowed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add poster')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!org || !yours) return
    if (!window.confirm(`Delete ${org.name}? Announcements will stay unless you remove them separately.`)) {
      return
    }
    setBusy(true)
    setError('')
    try {
      if (org.mock) demo.removeOrg(org.id)
      else await deleteOrganization(org.id)
      navigate('/orgs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete organization')
    } finally {
      setBusy(false)
    }
  }
  async function removePoster(member: OrgMember) {
    if (!org) return
    setError('')
    try {
      if (!org.mock) await removeOrgMember(org.id, member.userId)
      demo.removePoster(org.id, member.userId)
      setMembers((current) => current.filter((item) => item.userId !== member.userId))
      await noteAccess(
        {
          uid: member.userId,
          email: member.email,
          displayName: member.displayName,
          createdAt: member.createdAt,
          accountType: null,
        },
        'removed',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove poster')
    }
  }

  return (
    <div className="page">
      <SetupBanner />
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !org ? <p className="empty">Organization not found.</p> : null}

      {org ? (
        <>
          <section className="org-hero">
            <div className="org-hero__meta">
              <span className="pill">{org.type}</span>
              <OrgMarks
                createdByYou={yours}
                canPost={canPost}
                following={Boolean(user) && subscribed}
                createdAt={org.createdAt}
              />
            </div>
            <h1>{org.name}</h1>
            <p className="lede" style={{ whiteSpace: "pre-line" }}>{org.description}</p>
            {org.location ? <p className="muted">{org.location}</p> : null}
            {org.link ? <a href={org.link} target="_blank" rel="noreferrer"> {org.link} </a> : null}
            {user ? <p className="muted">Organized by {org.ownerName}</p> : null}
            <div className="hero__actions">
              {yours ? (
                <>
                  <Link className="btn" to={`/org/${org.id}/edit`}>
                    Edit org
                  </Link>
                  <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => void onDelete()}>
                    Delete org
                  </button>
                </>
              ) : null}
              {showSubscribe ? (
                <button
                  type="button"
                  className={subscribed ? 'btn btn--ghost' : 'btn'}
                  disabled={busy}
                  onClick={() => void toggleSubscribe()}
                >
                  {subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
              ) : null}
              {!user ? (
                <Link className="btn" to="/auth">
                  Sign in
                </Link>
              ) : null}
              {user && !profile?.accountType ? (
                <Link className="btn btn--ghost" to="/settings">
                  Choose account type
                </Link>
              ) : null}
              {canPost ? (
                <Link className="btn btn--ghost" to={`/org/${org.id}/new`}>
                  New announcement
                </Link>
              ) : null}
            </div>
            {user && profile?.accountType === 'organizer' && !yours ? (
              <p className="muted">Organizer-only accounts can post when added, but cannot subscribe.</p>
            ) : null}
          </section>

          {yours ? (
            <section className="panel">
              <h2>Who can post</h2>
              <p className="lede lede--tight">You can always post. Add other accounts by email.</p>
              {members.length === 0 ? <p className="muted">No one else can post yet.</p> : null}
              <ul className="follow-list">
                {members.map((member) => (
                  <li key={member.userId} className="poster-row">
                    <span>
                      {member.displayName}
                      {member.email ? <span className="muted"> · {member.email}</span> : null}
                    </span>
                    <button type="button" className="btn btn--ghost" onClick={() => void removePoster(member)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <PosterPicker
                showList={false}
                excludeIds={[org.ownerId, ...members.map((member) => member.userId)]}
                onPick={(person) => void addPoster(person)}
              />
            </section>
          ) : null}

          <section className="section">
            <div className="section__head">
              <h2>Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <p className="empty">No announcements yet.</p>
            ) : (
              <div className="stack">
                {announcements.map((item) => (
                  <AnnouncementCard key={item.id} announcement={item} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
