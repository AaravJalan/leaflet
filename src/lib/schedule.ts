import { format } from 'date-fns'
import type { Announcement } from '../types'

export const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
] as const

export function mondayOf(dateValue: string) {
  const anchor = new Date(`${dateValue}T12:00:00`)
  const day = anchor.getDay()
  const delta = day === 0 ? -6 : 1 - day
  anchor.setDate(anchor.getDate() + delta)
  anchor.setHours(0, 0, 0, 0)
  return anchor
}

export function dateInWeek(weekValue: string, weekday: number, time: string) {
  const monday = mondayOf(weekValue)
  const target = new Date(monday)
  const offset = weekday === 0 ? 6 : weekday - 1
  target.setDate(monday.getDate() + offset)
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  target.setHours(hours || 0, minutes || 0, 0, 0)
  return target
}

export function toDateInput(value: number | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toTimeInput(value: number | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toDateTimeInput(value: number | null) {
  if (!value) return ''
  return `${toDateInput(value)}T${toTimeInput(value)}`
}

export function buildWhen(
  schedule: 'once' | 'weekly',
  startsAt: string,
  endsAt: string,
  weekOf: string,
  startTime: string,
  endTime: string,
  days: number[],
) {
  if (schedule === 'weekly') {
    if (!weekOf || !startTime || days.length === 0) {
      throw new Error('Pick a week, at least one day, and a start time.')
    }
    const first = WEEKDAYS.map((day) => day.id).find((id) => days.includes(id)) ?? days[0]
    return {
      schedule,
      repeatDays: days,
      weekOf: mondayOf(weekOf).getTime(),
      startsAt: dateInWeek(weekOf, first, startTime).getTime(),
      endsAt: endTime ? dateInWeek(weekOf, first, endTime).getTime() : null,
    }
  }
  return {
    schedule,
    repeatDays: [] as number[],
    weekOf: null,
    startsAt: startsAt ? new Date(startsAt).getTime() : null,
    endsAt: endsAt ? new Date(endsAt).getTime() : null,
  }
}

export function formatWhen(item: Pick<Announcement, 'schedule' | 'repeatDays' | 'weekOf' | 'startsAt' | 'endsAt'>) {
  const repeatDays = item.repeatDays ?? []
  if (item.schedule === 'weekly' && repeatDays.length > 0) {
    const days = [...repeatDays]
      .sort((a, b) => WEEKDAYS.findIndex((day) => day.id === a) - WEEKDAYS.findIndex((day) => day.id === b))
      .map((id) => WEEKDAYS.find((day) => day.id === id)?.label)
      .filter(Boolean)
      .join(', ')
    const week = item.weekOf ? `Week of ${format(item.weekOf, 'MMM d')}` : 'Weekly'
    const start = item.startsAt ? format(item.startsAt, 'h:mm a') : ''
    const end = item.endsAt ? format(item.endsAt, 'h:mm a') : ''
    const time = start && end ? `${start} to ${end}` : start
    return [week, days, time].filter(Boolean).join(', ')
  }
  if (!item.startsAt) return ''
  const start = format(item.startsAt, 'EEE, MMM d, h:mm a')
  if (!item.endsAt) return start
  return `${start} to ${format(item.endsAt, 'h:mm a')}`
}
