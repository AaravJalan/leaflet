import { useEffect, useMemo, useState } from 'react'
import { MOCK_ACCOUNTS } from '../data/mock'
import { listUsers } from '../services/users'
import type { UserProfile } from '../types'

export function PosterPicker({
  selected = [],
  onPick,
  onRemove,
  excludeIds,
  showList = true,
}: {
  selected?: UserProfile[]
  onPick: (person: UserProfile) => void
  onRemove?: (person: UserProfile) => void
  excludeIds: string[]
  showList?: boolean
}) {
  const [people, setPeople] = useState<UserProfile[]>(MOCK_ACCOUNTS)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    void listUsers()
      .then((remote) => {
        if (cancelled) return
        const byEmail = new Map<string, UserProfile>()
        for (const person of MOCK_ACCOUNTS) byEmail.set(person.email.toLowerCase(), person)
        for (const person of remote) {
          if (!person.email) continue
          byEmail.set(person.email.toLowerCase(), person)
        }
        setPeople([...byEmail.values()])
      })
      .catch(() => {
        if (!cancelled) setPeople(MOCK_ACCOUNTS)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const blocked = useMemo(() => {
    const ids = new Set(excludeIds)
    for (const person of selected) ids.add(person.uid)
    return ids
  }, [excludeIds, selected])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return people
      .filter((person) => !blocked.has(person.uid))
      .filter((person) => {
        if (!needle) return true
        return (
          person.email.toLowerCase().includes(needle) ||
          person.displayName.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, 8)
  }, [people, blocked, query])

  function addPerson(person: UserProfile) {
    if (blocked.has(person.uid)) {
      setNotice('That account can already post.')
      return
    }
    onPick(person)
    setQuery('')
    setNotice('')
    setOpen(false)
  }

  function addFromQuery() {
    const needle = query.trim().toLowerCase()
    if (!needle) return
    const exact = people.find((person) => person.email.toLowerCase() === needle)
    const pick = exact || (matches.length === 1 ? matches[0] : undefined)
    if (!pick) {
      setNotice('No Leaflet account uses that email yet.')
      setOpen(true)
      return
    }
    addPerson(pick)
  }

  return (
    <div className="poster-picker">
      {showList && selected.length > 0 ? (
        <ul className="follow-list">
          {selected.map((person) => (
            <li key={person.uid} className="poster-row">
              <span>
                {person.displayName || 'Account'}
                <span className="muted"> · {person.email}</span>
              </span>
              {onRemove ? (
                <button type="button" className="btn btn--ghost" onClick={() => onRemove(person)}>
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {showList && selected.length === 0 ? <p className="muted">No one else can post yet.</p> : null}

      <div className="poster-add">
        <div className="suggest">
          <input
            type="email"
            placeholder="person@email.com"
            value={query}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setNotice('')
              setOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addFromQuery()
              }
            }}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120)
            }}
          />
          {open ? (
            <ul className="suggest__list">
              {matches.length === 0 ? (
                <li className="suggest__empty">No Leaflet account matches that.</li>
              ) : (
                matches.map((person) => (
                  <li key={person.uid}>
                    <button type="button" onMouseDown={() => addPerson(person)}>
                      <strong>{person.displayName || 'Account'}</strong>
                      <span>{person.email}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
        <button className="btn" type="button" onClick={addFromQuery}>
          Add
        </button>
      </div>
      {notice ? <p className="error">{notice}</p> : null}
    </div>
  )
}
