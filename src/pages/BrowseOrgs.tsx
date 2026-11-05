import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OrgCard } from '../components/OrgCard'
import { ScopeToggle, type Scope } from '../components/ScopeToggle'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { loadOrganizations } from '../services/catalog'
import { ORG_TYPES, type Organization, type OrgType } from '../types'

function readScope(value: string | null): Scope {
  if (value === 'following' || value === 'mine') return value
  return 'all'
}

export function BrowseOrgs() {
  const { user, profile } = useAuth()
  const demo = useDemo()
  const [params, setParams] = useSearchParams()
  const scope = user ? readScope(params.get('scope')) : 'all'
  const [type, setType] = useState<OrgType | 'All'>('All')
  const [search, setSearch] = useState('')
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const handle = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        setError('')
        try {
          const next = await loadOrganizations({
            type,
            search,
            userId: user?.uid ?? null,
            displayName: profile?.displayName || user?.displayName || 'You',
          })
          if (!cancelled) setOrgs(next)
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load organizations')
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 150)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [type, search, user, profile, demo.revision])

  const visible = orgs.filter((org) => {
    if (scope === 'following') return demo.follows.includes(org.id) && org.ownerId !== user?.uid
    if (scope === 'mine') return Boolean(user && org.ownerId === user.uid)
    return true
  })

  return (
    <div className="page">
      <SetupBanner />
      <section className="section">
        <div className="section__head">
          <div>
            <h1>Organizations</h1>
            <p className="lede lede--tight">
              {user ? 'All public orgs, followed orgs, or created orgs.' : 'Public orgs.'}
            </p>
          </div>
          {user ? (
            <ScopeToggle
              value={scope}
              onChange={(next) => {
                if (next === 'all') setParams({})
                else setParams({ scope: next })
              }}
            />
          ) : null}
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Organization name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as OrgType | 'All')}
            aria-label="Organization type"
          >
            <option value="All">All types</option>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && visible.length === 0 ? (
          <p className="empty">No organizations in this view.</p>
        ) : null}

        <div className="grid">
          {visible.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      </section>
    </div>
  )
}
