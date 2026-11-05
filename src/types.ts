export const ORG_TYPES = [
  'Neighborhood',
  'Volunteer',
  'Campus',
  'Advocacy',
  'Mutual Aid',
  'Arts & Culture',
  'Other',
] as const

export type OrgType = (typeof ORG_TYPES)[number]

export type AccountType = 'organizer' | 'volunteer' | 'both'

export type UserProfile = {
  uid: string
  email: string
  displayName: string
  createdAt: number
  accountType: AccountType | null
}

export type Organization = {
  id: string
  name: string
  slug: string
  description: string
  type: OrgType
  ownerId: string
  ownerName: string
  location: string
  createdAt: number
  /** Client-only sample org. Not stored as a special Firestore flag. */
  mock?: boolean
}

export type PermissionEvent = {
  id: string
  type: 'allowed' | 'removed'
  orgId: string
  orgName: string
  actorId: string
  actorName: string
  targetUserId: string
  createdAt: number
}

export type OrgMember = {
  id: string
  orgId: string
  userId: string
  email: string
  displayName: string
  addedBy: string
  createdAt: number
}

export type Announcement = {
  id: string
  orgId: string
  orgName: string
  orgType: OrgType
  orgOwnerId?: string
  orgCreatedAt?: number
  title: string
  description: string
  location: string
  startsAt: number | null
  endsAt: number | null
  link: string
  createdAt: number
  createdBy: string
  createdByName: string
  schedule: 'once' | 'weekly'
  repeatDays: number[]
  weekOf: number | null
  mock?: boolean
}

export type Subscription = {
  id: string
  userId: string
  orgId: string
  orgName: string
  createdAt: number
}
