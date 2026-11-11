import type { Announcement, Organization, OrgMember, UserProfile } from '../types'

const hour = 60 * 60 * 1000

type MockOrg = Organization & { posterIds: string[] }

const NAMES: Record<string, { name: string; email: string }> = {
  'mock-jordan': { name: 'Jordan Lee', email: 'jordan@example.com' },
  'mock-priya': { name: 'Priya Shah', email: 'priya@example.com' },
  'mock-sam': { name: 'Sam Ortiz', email: 'sam@example.com' },
}

const ORGS: MockOrg[] = [
  {
    id: 'mock-evanston',
    name: 'Evanston Neighborhood Cleanup',
    slug: 'evanston-neighborhood-cleanup',
    description: 'Block cleanups and park days in Evanston.',
    type: 'Neighborhood',
    ownerId: 'mock-jordan',
    ownerName: 'Jordan Lee',
    location: 'Church St & Benson Ave, Evanston',
    createdAt: 0,
    mock: true,
    posterIds: ['mock-jordan'],
  },
  {
    id: 'mock-mutual-aid',
    name: 'NU Mutual Aid',
    slug: 'nu-mutual-aid',
    description: 'Grocery runs and campus resource shares.',
    type: 'Mutual Aid',
    ownerId: 'mock-priya',
    ownerName: 'Priya Shah',
    location: 'Norris University Center',
    createdAt: 0,
    mock: true,
    posterIds: ['mock-priya', 'mock-sam'],
  },
  {
    id: 'mock-lakeside',
    name: 'Lakeside Volunteers',
    slug: 'lakeside-volunteers',
    description: 'Shoreline workdays and a tool library.',
    type: 'Volunteer',
    ownerId: 'mock-sam',
    ownerName: 'Sam Ortiz',
    location: 'Clark Street Beach',
    createdAt: 0,
    mock: true,
    posterIds: ['mock-sam'],
  },
  {
    id: 'mock-arts',
    name: 'Rogers Park Arts Collective',
    slug: 'rogers-park-arts-collective',
    description: 'Open studios and neighborhood art nights.',
    type: 'Arts & Culture',
    ownerId: 'mock-jordan',
    ownerName: 'Jordan Lee',
    location: '1520 W Morse Ave',
    createdAt: 0,
    mock: true,
    posterIds: ['mock-jordan', 'mock-priya'],
  },
]

type MockPost = Omit<
  Announcement,
  'orgName' | 'orgType' | 'createdByName' | 'schedule' | 'repeatDays' | 'weekOf' | 'orgOwnerId' | 'orgCreatedAt'
>

const POSTS: MockPost[] = [
  {
    id: 'mock-post-sweep',
    orgId: 'mock-evanston',
    title: 'Saturday riverbank sweep',
    description: 'Gloves and bags provided. Meet at the Church St bridge.',
    location: 'Church St & Benson Ave',
    startsAt: 0,
    endsAt: null,
    link: '',
    createdAt: 0,
    createdBy: 'mock-jordan',
    mock: true,
  },
  {
    id: 'mock-post-grocery',
    orgId: 'mock-mutual-aid',
    title: 'Thursday grocery run',
    description: 'Drivers and riders pair up in the Norris lobby.',
    location: 'Norris University Center',
    startsAt: 0,
    endsAt: null,
    link: '',
    createdAt: 0,
    createdBy: 'mock-priya',
    mock: true,
  },
  {
    id: 'mock-post-dune',
    orgId: 'mock-lakeside',
    title: 'Dune grass planting',
    description: 'Tools on site along the lakefront path.',
    location: 'Clark Street Beach',
    startsAt: 0,
    endsAt: null,
    link: '',
    createdAt: 0,
    createdBy: 'mock-sam',
    mock: true,
  },
  {
    id: 'mock-post-hours',
    orgId: 'mock-lakeside',
    title: 'Tool library hours',
    description: 'Borrow rakes and wheelbarrows Saturday morning.',
    location: 'Volunteer shed, south lot',
    startsAt: 0,
    endsAt: null,
    link: '',
    createdAt: 0,
    createdBy: 'mock-sam',
    mock: true,
  },
  {
    id: 'mock-post-studio',
    orgId: 'mock-arts',
    title: 'Open studio night',
    description: 'Local makers open their doors from 6 to 9pm.',
    location: '1520 W Morse Ave',
    startsAt: 0,
    endsAt: null,
    link: '',
    createdAt: 0,
    createdBy: 'mock-priya',
    mock: true,
  },
]

const AGES: Record<string, number> = {
  'mock-evanston': 5 * 24 * hour,
  'mock-mutual-aid': 3 * 24 * hour,
  'mock-lakeside': 6 * hour,
  'mock-arts': 10 * 24 * hour,
  'mock-post-sweep': 2 * 24 * hour,
  'mock-post-grocery': 18 * hour,
  'mock-post-dune': 4 * hour,
  'mock-post-hours': 3 * hour,
  'mock-post-studio': 30 * hour,
}

function stamp(id: string) {
  return Date.now() - (AGES[id] ?? hour)
}

/** Shared sample orgs. Same for every visitor. Never owned by the signed-in user. */
export function mockOrganizations(_userId: string | null = null, _displayName = ''): Organization[] {
  return ORGS.map(({ posterIds: _posters, ...org }) => ({
    ...org,
    createdAt: stamp(org.id),
  }))
}

export function mockPosterIds(orgId: string, _userId: string | null): string[] {
  return ORGS.find((org) => org.id === orgId)?.posterIds ?? []
}

export function mockMembers(orgId: string, _userId: string | null, _displayName: string): OrgMember[] {
  const org = ORGS.find((item) => item.id === orgId)
  if (!org) return []
  return org.posterIds
    .filter((id) => id !== org.ownerId)
    .map((id) => ({
      id,
      orgId,
      userId: id,
      email: NAMES[id]?.email || '',
      displayName: NAMES[id]?.name || 'Poster',
      addedBy: org.ownerId,
      createdAt: stamp(orgId),
    }))
}

export function mockAnnouncements(_userId: string | null = null): Announcement[] {
  const orgs = mockOrganizations()
  return POSTS.map((post) => {
    const org = orgs.find((item) => item.id === post.orgId)
    return {
      ...post,
      orgName: org?.name || '',
      orgType: org?.type || 'Other',
      orgOwnerId: org?.ownerId,
      orgCreatedAt: org?.createdAt,
      createdByName: NAMES[post.createdBy]?.name || 'Someone',
      schedule: 'once' as const,
      repeatDays: [],
      weekOf: null,
      createdAt: stamp(post.id),
      startsAt: stamp(post.id) + 3 * 24 * hour,
    }
  })
}

export const MOCK_ACCOUNTS: UserProfile[] = Object.entries(NAMES).map(([uid, person]) => ({
  uid,
  email: person.email,
  displayName: person.name,
  createdAt: 0,
  accountType: uid === 'mock-sam' ? 'volunteer' : 'both',
}))

export function mockPermissionEvents(_userId: string) {
  return []
}

export const DEFAULT_MOCK_FOLLOWS: string[] = []
