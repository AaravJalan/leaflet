import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'
import type { AccountType } from '../types'

const OPTIONS: { id: AccountType; title: string; body: string }[] = [
  {
    id: 'volunteer',
    title: 'Volunteer',
    body: 'Read every public org and subscribe to ones you did not create. You can post only if an organizer adds you.',
  },
  {
    id: 'organizer',
    title: 'Organizer',
    body: 'Create as many orgs as you want. Post only on orgs you created or were added to. You cannot subscribe.',
  },
  {
    id: 'both',
    title: 'Both',
    body: 'Create orgs and subscribe to other people’s orgs. Post only where you created the org or were given permission.',
  },
]

export function Settings() {
  const { user, profile, chooseAccountType } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!user) return <Navigate to="/auth" replace />

  async function pick(type: AccountType) {
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      await chooseAccountType(type)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow">
      <SetupBanner />
      <section className="panel">
        <h1>Settings</h1>
        <p className="lede lede--tight">
          Pick one account type. You can change it later. This is how Leaflet decides whether you
          create orgs, subscribe, or both.
        </p>
        <div className="choices">
          {OPTIONS.map((option) => {
            const selected = profile?.accountType === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={selected ? 'choice is-selected' : 'choice'}
                disabled={busy}
                onClick={() => void pick(option.id)}
              >
                <span className="choice__check" aria-hidden="true">
                  {selected ? '✓' : ''}
                </span>
                <span>
                  <strong>{option.title}</strong>
                  <span className="choice__body">{option.body}</span>
                </span>
              </button>
            )
          })}
        </div>
        {saved ? <p className="muted">Saved.</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>
    </div>
  )
}
