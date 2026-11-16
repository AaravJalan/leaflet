export type Scope = 'all' | 'following' | 'mine'

const OPTIONS: { id: Scope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Subscribed' },
  { id: 'mine', label: 'My orgs' },
]

export function ScopeToggle({
  value,
  onChange,
  only,
}: {
  value: Scope
  onChange: (value: Scope) => void
  /** Limit which filters show; defaults to all three. */
  only?: Scope[]
}) {
  const options = only ? OPTIONS.filter((option) => only.includes(option.id)) : OPTIONS
  return (
    <div
      className="segmented segmented--three"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label="Filter"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          className={value === option.id ? 'is-active' : ''}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
