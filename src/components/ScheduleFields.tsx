import { WEEKDAYS } from '../lib/schedule'

export function ScheduleFields({
  schedule,
  onSchedule,
  startsAt,
  onStartsAt,
  endsAt,
  onEndsAt,
  weekOf,
  onWeekOf,
  startTime,
  onStartTime,
  endTime,
  onEndTime,
  days,
  onDays,
}: {
  schedule: 'once' | 'weekly'
  onSchedule: (value: 'once' | 'weekly') => void
  startsAt: string
  onStartsAt: (value: string) => void
  endsAt: string
  onEndsAt: (value: string) => void
  weekOf: string
  onWeekOf: (value: string) => void
  startTime: string
  onStartTime: (value: string) => void
  endTime: string
  onEndTime: (value: string) => void
  days: number[]
  onDays: (value: number[]) => void
}) {
  function toggleDay(id: number) {
    onDays(days.includes(id) ? days.filter((day) => day !== id) : [...days, id])
  }

  return (
    <fieldset className="schedule">
      <legend>When</legend>
      <div className="segmented">
        <button
          type="button"
          className={schedule === 'once' ? 'is-active' : ''}
          onClick={() => onSchedule('once')}
        >
          One time
        </button>
        <button
          type="button"
          className={schedule === 'weekly' ? 'is-active' : ''}
          onClick={() => onSchedule('weekly')}
        >
          Weekly
        </button>
      </div>

      {schedule === 'once' ? (
        <div className="schedule__grid">
          <label>
            Starts
            <input type="datetime-local" value={startsAt} onChange={(e) => onStartsAt(e.target.value)} />
          </label>
          <label>
            Ends
            <input type="datetime-local" value={endsAt} onChange={(e) => onEndsAt(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="schedule__grid">
          <label>
            Week of
            <input type="date" value={weekOf} onChange={(e) => onWeekOf(e.target.value)} required />
          </label>
          <div className="day-picks">
            <span>Days</span>
            <div className="day-picks__row">
              {WEEKDAYS.map((day) => (
                <label key={day.id} className={days.includes(day.id) ? 'day-pick is-on' : 'day-pick'}>
                  <input
                    type="checkbox"
                    checked={days.includes(day.id)}
                    onChange={() => toggleDay(day.id)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <label>
            Start time
            <input type="time" value={startTime} onChange={(e) => onStartTime(e.target.value)} required />
          </label>
          <label>
            End time
            <input type="time" value={endTime} onChange={(e) => onEndTime(e.target.value)} />
          </label>
        </div>
      )}
    </fieldset>
  )
}
