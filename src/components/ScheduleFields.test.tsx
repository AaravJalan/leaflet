import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ScheduleFields } from './ScheduleFields'

function setup(overrides: Partial<Parameters<typeof ScheduleFields>[0]> = {}) {
  const props = {
    schedule: 'once' as const,
    onSchedule: vi.fn(),
    startsAt: '',
    onStartsAt: vi.fn(),
    endsAt: '',
    onEndsAt: vi.fn(),
    weekOf: '',
    onWeekOf: vi.fn(),
    startTime: '',
    onStartTime: vi.fn(),
    endTime: '',
    onEndTime: vi.fn(),
    days: [] as number[],
    onDays: vi.fn(),
    ...overrides,
  }
  render(<ScheduleFields {...props} />)
  return props
}

describe('ScheduleFields', () => {
  it('shows start and end inputs for a one time post', () => {
    setup()
    expect(screen.getByLabelText('Starts')).toBeTruthy()
    expect(screen.getByLabelText('Ends')).toBeTruthy()
    expect(screen.queryByLabelText('Week of')).toBeNull()
  })

  it('shows week, day, and time inputs for a weekly post', () => {
    setup({ schedule: 'weekly' })
    expect(screen.getByLabelText('Week of')).toBeTruthy()
    expect(screen.getByLabelText('Start time')).toBeTruthy()
    expect(screen.getByLabelText('End time')).toBeTruthy()
    expect(screen.getAllByRole('checkbox')).toHaveLength(7)
    expect(screen.queryByLabelText('Starts')).toBeNull()
  })

  it('switches modes from the toggle', () => {
    const props = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }))
    expect(props.onSchedule).toHaveBeenCalledWith('weekly')
    fireEvent.click(screen.getByRole('button', { name: 'One time' }))
    expect(props.onSchedule).toHaveBeenCalledWith('once')
  })

  it('reports datetime changes', () => {
    const props = setup()
    fireEvent.change(screen.getByLabelText('Starts'), { target: { value: '2026-11-09T18:30' } })
    fireEvent.change(screen.getByLabelText('Ends'), { target: { value: '2026-11-09T20:00' } })
    expect(props.onStartsAt).toHaveBeenCalledWith('2026-11-09T18:30')
    expect(props.onEndsAt).toHaveBeenCalledWith('2026-11-09T20:00')
  })

  it('reports weekly field changes', () => {
    const props = setup({ schedule: 'weekly' })
    fireEvent.change(screen.getByLabelText('Week of'), { target: { value: '2026-11-09' } })
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '19:00' } })
    expect(props.onWeekOf).toHaveBeenCalledWith('2026-11-09')
    expect(props.onStartTime).toHaveBeenCalledWith('18:00')
    expect(props.onEndTime).toHaveBeenCalledWith('19:00')
  })

  it('adds a day', () => {
    const props = setup({ schedule: 'weekly', days: [1] })
    fireEvent.click(screen.getByLabelText('Sun'))
    expect(props.onDays).toHaveBeenCalledWith([1, 0])
  })

  it('removes a selected day', () => {
    const props = setup({ schedule: 'weekly', days: [1, 3] })
    fireEvent.click(screen.getByLabelText('Mon'))
    expect(props.onDays).toHaveBeenCalledWith([3])
  })

  it('checks only the selected days', () => {
    setup({ schedule: 'weekly', days: [3] })
    expect((screen.getByLabelText('Wed') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Thu') as HTMLInputElement).checked).toBe(false)
  })
})
