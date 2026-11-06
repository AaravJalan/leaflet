import { COVER_OPTIONS } from '../lib/images'

export function CoverPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return (
    <fieldset className="cover-picker">
      <legend>Cover picture</legend>
      <div className="cover-picker__options">
        {COVER_OPTIONS.map((url, i) => (
          <button
            key={url}
            type="button"
            className={`cover-picker__option${value === url ? ' is-selected' : ''}`}
            aria-pressed={value === url}
            aria-label={`Cover ${i + 1}`}
            onClick={() => onChange(url)}
          >
            <img src={url} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </fieldset>
  )
}
