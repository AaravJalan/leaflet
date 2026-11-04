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

export type UserProfile = {
  uid: string
  email: string
  displayName: string
  createdAt: number
  /** Follow orgs / show up for community work */
  isVolunteer: boolean
  /** Create orgs and post announcements */
  isOrganizer: boolean
}

export type Organization = {
  id: string
  name: string
  slug: string
  description: string
  type: OrgType
  ownerId: string
  ownerName: string
  createdAt: number
  verified: boolean
}

export type OrgMember = {
  id: string
  orgId: string
  userId: string
  email: string
  displayName: string
  role: 'owner' | 'organizer'
  addedBy: string
  createdAt: number
}

export type Announcement = {
  id: string
  orgId: string
  orgName: string
  orgType: OrgType
  title: string
  description: string
  location: string
  startsAt: number | null
  link: string
  createdAt: number
  createdBy: string
}

export type Subscription = {
  id: string
  userId: string
  orgId: string
  orgName: string
  createdAt: number
}
