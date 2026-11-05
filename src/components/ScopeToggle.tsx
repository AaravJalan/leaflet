export type Scope = 'all' | 'following' | 'mine'

const OPTIONS: { id: Scope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'mine', label: 'My orgs' },
]

export function ScopeToggle({
  value,
  onChange,
}: {
  value: Scope
  onChange: (value: Scope) => void
}) {
  return (
    <div className="segmented segmented--three" role="tablist" aria-label="Filter">
      {OPTIONS.map((option) => (
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
