import { useEffect, useState } from 'react'
import { OrgCard } from '../components/OrgCard'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import { listOrganizations } from '../services/organizations'
import { ORG_TYPES, type Organization, type OrgType } from '../types'

export function Browse() {
  const { configured } = useAuth()
  const [type, setType] = useState<OrgType | 'All'>('All')
  const [search, setSearch] = useState('')
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    let cancelled = false
    const handle = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        setError('')
        try {
          const next = await listOrganizations({ type, search })
          if (!cancelled) setOrgs(next)
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load organizations')
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [configured, type, search])

  return (
    <div className="page">
      <SetupBanner />
      <section className="section">
        <div className="section__head">
          <div>
            <h1>Browse</h1>
            <p className="lede lede--tight">Search by name or filter by type.</p>
          </div>
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
        {!loading && !error && orgs.length === 0 ? (
          <p className="empty">No organizations match that search.</p>
        ) : null}

        <div className="grid">
          {orgs.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      </section>
    </div>
  )
}
