import type { AccountType } from '../types'

export function canOrganize(type: AccountType | null | undefined) {
  return type === 'organizer' || type === 'both'
}

export function canFollow(type: AccountType | null | undefined) {
  return type === 'volunteer' || type === 'both'
}

export const DAY_MS = 24 * 60 * 60 * 1000

export function isNewOrg(createdAt: number) {
  return Date.now() - createdAt < DAY_MS
}
