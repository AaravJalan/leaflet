import type { PermissionEvent } from '../types'

const KEY = 'leaflet-permission-events'

export function readPermissionLog(): PermissionEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PermissionEvent[]) : []
  } catch {
    return []
  }
}

export function rememberPermission(event: PermissionEvent) {
  const next = [event, ...readPermissionLog().filter((item) => item.id !== event.id)]
  localStorage.setItem(KEY, JSON.stringify(next))
}
