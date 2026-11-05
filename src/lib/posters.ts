import type { OrgMember } from '../types'

export function uniquePosters(members: OrgMember[], ownerId?: string) {
  const seen = new Set<string>()
  const next: OrgMember[] = []
  for (const member of members) {
    if (ownerId && member.userId === ownerId) continue
    const email = member.email.trim().toLowerCase()
    if (seen.has(member.userId) || (email && seen.has(email))) continue
    seen.add(member.userId)
    if (email) seen.add(email)
    next.push(member)
  }
  return next
}
