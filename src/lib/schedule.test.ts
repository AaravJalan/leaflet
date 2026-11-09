import { describe, expect, it } from 'vitest'
import {
  WEEKDAYS,
  buildWhen,
  dateInWeek,
  formatWhen,
  mondayOf,
  toDateInput,
  toDateTimeInput,
  toTimeInput,
} from './schedule'

// Everything here is expressed in local time, so the suite must pass in any
// time zone. CI runs it in several to keep that true.

/** Local timestamp. `month` is 1-based, unlike the Date constructor. */
function at(year: number, month: number, day: number, hours = 0, minutes = 0) {
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime()
}

function ymd(date: Date) {
  return toDateInput(date.getTime())
}

const MON = 1
const TUE = 2
const WED = 3
const THU = 4
const FRI = 5
const SAT = 6
const SUN = 0

// 2026-11-09 is a Monday, so this week runs Nov 9 to Nov 15.
const WEEK = '2026-11-09'

type WhenItem = Parameters<typeof formatWhen>[0]

function item(overrides: Partial<WhenItem>): WhenItem {
  return { schedule: 'once', repeatDays: [], weekOf: null, startsAt: null, endsAt: null, ...overrides }
}

describe('WEEKDAYS', () => {
  it('lists Monday first and Sunday last, using JS day numbers', () => {
    expect(WEEKDAYS.map((day) => day.id)).toEqual([MON, TUE, WED, THU, FRI, SAT, SUN])
    expect(WEEKDAYS.map((day) => day.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  })
})

describe('mondayOf', () => {
  it.each([
    ['Monday stays put', '2026-11-09', '2026-11-09'],
    ['Tuesday', '2026-11-10', '2026-11-09'],
    ['Wednesday', '2026-11-11', '2026-11-09'],
    ['Thursday', '2026-11-12', '2026-11-09'],
    ['Friday', '2026-11-13', '2026-11-09'],
    ['Saturday', '2026-11-14', '2026-11-09'],
    ['Sunday belongs to the week that started six days earlier', '2026-11-15', '2026-11-09'],
  ])('%s', (_name, input, expected) => {
    expect(ymd(mondayOf(input))).toBe(expected)
  })

  it.each([
    ['across a month boundary', '2026-10-01', '2026-09-28'],
    ['across a year boundary', '2026-01-01', '2025-12-29'],
    ['across a leap day', '2024-03-01', '2024-02-26'],
    ['from a leap day', '2024-02-29', '2024-02-26'],
  ])('rolls back %s', (_name, input, expected) => {
    expect(ymd(mondayOf(input))).toBe(expected)
  })

  it('returns local midnight', () => {
    const monday = mondayOf('2026-11-12')
    expect([monday.getHours(), monday.getMinutes(), monday.getSeconds(), monday.getMilliseconds()]).toEqual([
      0, 0, 0, 0,
    ])
  })

  it('holds for every day across several years, including DST changes', () => {
    const msPerDay = 24 * 60 * 60 * 1000
    for (let n = 0; n < 366 * 4; n += 1) {
      const day = new Date(2024, 0, 1 + n, 12)
      const input = ymd(day)
      const monday = mondayOf(input)

      expect(monday.getDay(), input).toBe(MON)

      // Compare calendar dates in UTC so a 23 or 25 hour day can't skew the gap.
      const gap =
        (Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) -
          Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate())) /
        msPerDay
      expect(gap, input).toBeGreaterThanOrEqual(0)
      expect(gap, input).toBeLessThanOrEqual(6)

      expect(ymd(mondayOf(ymd(monday))), input).toBe(ymd(monday))
    }
  })
})

describe('dateInWeek', () => {
  it.each([
    [MON, '2026-11-09'],
    [TUE, '2026-11-10'],
    [WED, '2026-11-11'],
    [THU, '2026-11-12'],
    [FRI, '2026-11-13'],
    [SAT, '2026-11-14'],
    [SUN, '2026-11-15'],
  ])('places weekday %i on %s', (weekday, expected) => {
    expect(ymd(dateInWeek(WEEK, weekday, '09:00'))).toBe(expected)
  })

  it('treats Sunday as the end of the week, not the start', () => {
    expect(dateInWeek(WEEK, SUN, '09:00').getTime()).toBeGreaterThan(dateInWeek(WEEK, SAT, '09:00').getTime())
  })

  it('gives the same result for any date inside the week', () => {
    const expected = dateInWeek('2026-11-09', FRI, '18:30').getTime()
    for (const value of ['2026-11-10', '2026-11-12', '2026-11-14', '2026-11-15']) {
      expect(dateInWeek(value, FRI, '18:30').getTime(), value).toBe(expected)
    }
  })

  it('sets hours and minutes and clears seconds', () => {
    const date = dateInWeek(WEEK, WED, '18:45')
    expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]).toEqual([18, 45, 0, 0])
  })

  it('handles the first and last minute of the day', () => {
    expect(dateInWeek(WEEK, MON, '00:00').getTime()).toBe(at(2026, 11, 9, 0, 0))
    expect(dateInWeek(WEEK, MON, '23:59').getTime()).toBe(at(2026, 11, 9, 23, 59))
  })

  it('rolls into the next month and year', () => {
    expect(ymd(dateInWeek('2026-09-28', SUN, '10:00'))).toBe('2026-10-04')
    expect(ymd(dateInWeek('2025-12-29', SAT, '10:00'))).toBe('2026-01-03')
  })

  it('rolls over a leap day', () => {
    expect(ymd(dateInWeek('2024-02-26', THU, '10:00'))).toBe('2024-02-29')
    expect(ymd(dateInWeek('2024-02-26', FRI, '10:00'))).toBe('2024-03-01')
  })

  it.each([
    ['US spring forward', '2026-03-02', '2026-03-08'],
    ['US fall back', '2026-10-26', '2026-11-01'],
  ])('keeps the wall clock time on the Sunday of %s', (_name, week, sunday) => {
    const date = dateInWeek(week, SUN, '10:15')
    expect(ymd(date)).toBe(sunday)
    expect([date.getHours(), date.getMinutes()]).toEqual([10, 15])
  })

  it('falls back to midnight for a blank or malformed time', () => {
    for (const time of ['', 'abc', ':']) {
      const date = dateInWeek(WEEK, TUE, time)
      expect([ymd(date), date.getHours(), date.getMinutes()], time).toEqual(['2026-11-10', 0, 0])
    }
  })

  it('accepts an hour with no minutes', () => {
    const date = dateInWeek(WEEK, TUE, '7')
    expect([date.getHours(), date.getMinutes()]).toEqual([7, 0])
  })
})

describe('toDateInput', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateInput(at(2026, 11, 9, 18, 30))).toBe('2026-11-09')
  })

  it('zero pads the month and day', () => {
    expect(toDateInput(at(2026, 1, 5))).toBe('2026-01-05')
  })

  it('uses the local day at the edges of the day', () => {
    expect(toDateInput(at(2026, 6, 15, 0, 0))).toBe('2026-06-15')
    expect(toDateInput(at(2026, 6, 15, 23, 59))).toBe('2026-06-15')
  })

  it('returns an empty string for null', () => {
    expect(toDateInput(null)).toBe('')
  })

  it('treats 0 as unset', () => {
    expect(toDateInput(0)).toBe('')
  })
})

describe('toTimeInput', () => {
  it('formats 24 hour local time', () => {
    expect(toTimeInput(at(2026, 11, 9, 18, 30))).toBe('18:30')
  })

  it('zero pads hours and minutes', () => {
    expect(toTimeInput(at(2026, 11, 9, 9, 5))).toBe('09:05')
  })

  it('formats midnight as 00:00', () => {
    expect(toTimeInput(at(2026, 11, 9, 0, 0))).toBe('00:00')
  })

  it('returns an empty string for null', () => {
    expect(toTimeInput(null)).toBe('')
  })
})

describe('toDateTimeInput', () => {
  it('produces the format a datetime-local input expects', () => {
    expect(toDateTimeInput(at(2026, 1, 5, 9, 5))).toBe('2026-01-05T09:05')
  })

  it('returns an empty string for null', () => {
    expect(toDateTimeInput(null)).toBe('')
  })
})

describe('buildWhen, one time', () => {
  it('converts both datetime inputs to timestamps', () => {
    expect(buildWhen('once', '2026-11-09T18:30', '2026-11-09T20:00', '', '', '', [])).toEqual({
      schedule: 'once',
      repeatDays: [],
      weekOf: null,
      startsAt: at(2026, 11, 9, 18, 30),
      endsAt: at(2026, 11, 9, 20, 0),
    })
  })

  it('allows blank start and end', () => {
    const result = buildWhen('once', '', '', '', '', '', [])
    expect(result.startsAt).toBeNull()
    expect(result.endsAt).toBeNull()
  })

  it('allows a start with no end', () => {
    const result = buildWhen('once', '2026-11-09T18:30', '', '', '', '', [])
    expect(result.startsAt).toBe(at(2026, 11, 9, 18, 30))
    expect(result.endsAt).toBeNull()
  })

  it('ignores leftover weekly fields after the user switches modes', () => {
    const result = buildWhen('once', '2026-11-09T18:30', '', WEEK, '09:00', '10:00', [MON, WED])
    expect(result.repeatDays).toEqual([])
    expect(result.weekOf).toBeNull()
    expect(result.startsAt).toBe(at(2026, 11, 9, 18, 30))
  })

  it('round trips through toDateTimeInput for the edit form', () => {
    const input = '2026-03-08T10:15'
    const { startsAt } = buildWhen('once', input, '', '', '', '', [])
    expect(toDateTimeInput(startsAt)).toBe(input)
  })
})

describe('buildWhen, weekly', () => {
  it.each([
    ['week', '', '09:00', [MON]],
    ['start time', WEEK, '', [MON]],
    ['days', WEEK, '09:00', []],
  ])('rejects a missing %s', (_name, weekOf, startTime, days) => {
    expect(() => buildWhen('weekly', '', '', weekOf, startTime, '', days)).toThrow(
      'Pick a week, at least one day, and a start time.',
    )
  })

  it('stores the Monday of the chosen week', () => {
    const result = buildWhen('weekly', '', '', '2026-11-12', '09:00', '', [FRI])
    expect(result.weekOf).toBe(at(2026, 11, 9))
  })

  it('anchors start and end on the selected day', () => {
    const result = buildWhen('weekly', '', '', WEEK, '09:00', '10:30', [WED])
    expect(result.startsAt).toBe(at(2026, 11, 11, 9, 0))
    expect(result.endsAt).toBe(at(2026, 11, 11, 10, 30))
  })

  it('anchors on the earliest day of the week regardless of click order', () => {
    const result = buildWhen('weekly', '', '', WEEK, '09:00', '', [FRI, TUE, THU])
    expect(result.startsAt).toBe(at(2026, 11, 10, 9, 0))
  })

  it('anchors after the weekdays when Sunday is also selected', () => {
    const result = buildWhen('weekly', '', '', WEEK, '09:00', '', [SUN, SAT])
    expect(result.startsAt).toBe(at(2026, 11, 14, 9, 0))
  })

  it('anchors on the last day of the week when only Sunday is selected', () => {
    const result = buildWhen('weekly', '', '', WEEK, '09:00', '', [SUN])
    expect(result.startsAt).toBe(at(2026, 11, 15, 9, 0))
  })

  it('leaves the end null without an end time', () => {
    expect(buildWhen('weekly', '', '', WEEK, '09:00', '', [MON]).endsAt).toBeNull()
  })

  it('keeps every selected day, in the order given', () => {
    const days = [FRI, MON, SUN]
    const result = buildWhen('weekly', '', '', WEEK, '09:00', '', days)
    expect(result.repeatDays).toEqual([FRI, MON, SUN])
    expect(days).toEqual([FRI, MON, SUN])
  })

  it('ignores leftover one time fields', () => {
    const result = buildWhen('weekly', '2020-01-01T00:00', '2020-01-02T00:00', WEEK, '09:00', '', [MON])
    expect(result.startsAt).toBe(at(2026, 11, 9, 9, 0))
    expect(result.endsAt).toBeNull()
  })

  it('round trips through the edit form helpers', () => {
    const result = buildWhen('weekly', '', '', '2026-11-12', '18:05', '19:40', [THU])
    expect(toDateInput(result.weekOf)).toBe(WEEK)
    expect(toTimeInput(result.startsAt)).toBe('18:05')
    expect(toTimeInput(result.endsAt)).toBe('19:40')
  })

  it('formats back to what the user picked', () => {
    const result = buildWhen('weekly', '', '', WEEK, '18:00', '19:30', [FRI, MON])
    expect(formatWhen(result)).toBe('Week of Nov 9, Mon, Fri, 6:00 PM to 7:30 PM')
  })
})

describe('formatWhen, one time', () => {
  it('shows only the start when there is no end', () => {
    expect(formatWhen(item({ startsAt: at(2026, 11, 9, 18, 30) }))).toBe('Mon, Nov 9, 6:30 PM')
  })

  it('shows the full date on both sides of a range', () => {
    expect(formatWhen(item({ startsAt: at(2026, 11, 9, 18, 0), endsAt: at(2026, 11, 9, 20, 0) }))).toBe(
      'Mon, Nov 9, 6:00 PM to Mon, Nov 9, 8:00 PM',
    )
  })

  it('distinguishes an end on a different day', () => {
    expect(formatWhen(item({ startsAt: at(2026, 11, 9, 22, 0), endsAt: at(2026, 11, 10, 1, 0) }))).toBe(
      'Mon, Nov 9, 10:00 PM to Tue, Nov 10, 1:00 AM',
    )
  })

  it('distinguishes an end in a different month', () => {
    expect(formatWhen(item({ startsAt: at(2026, 10, 31, 22, 0), endsAt: at(2026, 11, 1, 1, 0) }))).toBe(
      'Sat, Oct 31, 10:00 PM to Sun, Nov 1, 1:00 AM',
    )
  })

  it('formats midnight and noon on a 12 hour clock', () => {
    expect(formatWhen(item({ startsAt: at(2026, 11, 9, 0, 0) }))).toBe('Mon, Nov 9, 12:00 AM')
    expect(formatWhen(item({ startsAt: at(2026, 11, 9, 12, 0) }))).toBe('Mon, Nov 9, 12:00 PM')
  })

  it('is empty with no start', () => {
    expect(formatWhen(item({}))).toBe('')
  })

  it('is empty when only an end exists', () => {
    expect(formatWhen(item({ endsAt: at(2026, 11, 9, 20, 0) }))).toBe('')
  })
})

describe('formatWhen, weekly', () => {
  const weekly = (overrides: Partial<WhenItem>) =>
    item({
      schedule: 'weekly',
      repeatDays: [MON],
      weekOf: at(2026, 11, 9),
      startsAt: at(2026, 11, 9, 18, 0),
      ...overrides,
    })

  it('shows week, days, and time range', () => {
    expect(formatWhen(weekly({ endsAt: at(2026, 11, 9, 19, 30) }))).toBe('Week of Nov 9, Mon, 6:00 PM to 7:30 PM')
  })

  it('omits the range without an end', () => {
    expect(formatWhen(weekly({}))).toBe('Week of Nov 9, Mon, 6:00 PM')
  })

  it('sorts days Monday to Sunday', () => {
    expect(formatWhen(weekly({ repeatDays: [SUN, FRI, MON, WED] }))).toBe(
      'Week of Nov 9, Mon, Wed, Fri, Sun, 6:00 PM',
    )
  })

  it('does not mutate repeatDays while sorting', () => {
    const repeatDays = [SUN, MON]
    formatWhen(weekly({ repeatDays }))
    expect(repeatDays).toEqual([SUN, MON])
  })

  it('says Weekly when there is no week', () => {
    expect(formatWhen(weekly({ weekOf: null }))).toBe('Weekly, Mon, 6:00 PM')
  })

  it('omits the time when there is no start', () => {
    expect(formatWhen(weekly({ startsAt: null }))).toBe('Week of Nov 9, Mon')
  })

  it('drops an end that has no start', () => {
    expect(formatWhen(weekly({ startsAt: null, endsAt: at(2026, 11, 9, 19, 0) }))).toBe('Week of Nov 9, Mon')
  })

  it('skips day ids it does not know', () => {
    expect(formatWhen(weekly({ repeatDays: [MON, 9] }))).toBe('Week of Nov 9, Mon, 6:00 PM')
  })

  it('falls back to the one time format with no repeat days', () => {
    expect(formatWhen(weekly({ repeatDays: [] }))).toBe('Mon, Nov 9, 6:00 PM')
  })

  it('tolerates older records with no repeatDays field', () => {
    const legacy = { ...weekly({}), repeatDays: undefined } as unknown as WhenItem
    expect(formatWhen(legacy)).toBe('Mon, Nov 9, 6:00 PM')
  })
})
