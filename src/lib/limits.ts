// Character limits for user-entered text. firestore.rules enforces the same
// numbers on the server, so change both together.
export const LIMITS = {
  displayName: 50,
  orgName: 80,
  orgDescription: 1000,
  orgLocation: 120,
  announcementTitle: 100,
  announcementDescription: 2000,
  announcementLocation: 150,
  link: 500,
} as const

/** Cut a value down to a limit, e.g. a display name taken from a Google account. */
export function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max).trim() : value
}
