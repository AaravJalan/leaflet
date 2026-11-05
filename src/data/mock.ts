import type { Announcement, Organization, OrgMember, PermissionEvent, UserProfile } from '../types'

const ME = '__me__'
const hour = 60 * 60 * 1000

type MockOrg = Organization & { posterIds: string[] }
type MockPost = Omit<
  Announcement,
  'orgName' | 'orgType' | 'createdByName' | 'schedule' | 'repeatDays' | 'weekOf'
>

const ORGS: MockOrg[] = [
  {
    id: 'mock-block-club',
    name: 'Rogers Park Block Club',
    slug: 'rogers-park-block-club',
    description: 'Block updates and alley work in Rogers Park.',
    type: 'Neighborhood',
    ownerId: ME,
    ownerName: 'You',
    location: 'Rogers Park',
    createdAt: 0,
    mock: true,
    posterIds: [ME],
  },
  {
    id: 'mock-compost',
    name: 'Campus Compost Crew',
    slug: 'campus-compost-crew',
    description: 'Campus compost drops and bin news.',
    type: 'Campus',
    ownerId: ME,
    ownerName: 'You',
    location: 'Tech courtyard',
    createdAt: 0,
    mock: true,
    posterIds: [ME, 'mock-priya'],
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
    posterIds: ['mock-priya', ME],
  },
  {
    id: 'mock-pantry',
    name: 'Foster Street Pantry',
    slug: 'foster-street-pantry',
    description: 'Food restocks and pantry hours.',
    type: 'Mutual Aid',
    ownerId: 'mock-jordan',
    ownerName: 'Jordan Lee',
    location: 'Foster St pantry',
    createdAt: 0,
    mock: true,
    posterIds: ['mock-jordan', ME],
  },
  {
    id: 'mock-evanston',
    name: 'Evanston Neighborhood Cleanup',
    slug: 'evanston-neighborhood-cleanup',
    description: 'Block cleanups and park days in Evanston.',
    type: 'Neighborhood',
    ownerId: 'mock-sam',
    ownerName: 'Sam Ortiz',
    location: 'Church St & Benson Ave, Evanston',
    createdAt: 0,
    mock: true,
    posterIds: ['mock-sam'],
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
]

const POSTS: MockPost[] = [
  {
    id: 'mock-post-alley',
    orgId: 'mock-block-club',
    title: 'Alley planters this Sunday',
    description: 'Planters go in behind 800 Dempster this Sunday.',
    location: 'Behind 800 Dempster',
    startsAt: 0,
    link: '',
    endsAt: null,
    createdAt: 0,
    createdBy: ME,
    mock: true,
  },
  {
    id: 'mock-post-compost',
    orgId: 'mock-compost',
    title: 'First bin drop',
    description: 'First compost bins arrive in the Tech courtyard.',
    location: 'Tech courtyard',
    startsAt: 0,
    link: '',
    endsAt: null,
    createdAt: 0,
    createdBy: ME,
    mock: true,
  },
  {
    id: 'mock-post-compost-priya',
    orgId: 'mock-compost',
    title: 'Extra buckets by the arch',
    description: 'Extra buckets are by the arch.',
    location: 'The Arch',
    startsAt: 0,
    link: '',
    endsAt: null,
    createdAt: 0,
    createdBy: 'mock-priya',
    mock: true,
  },
  {
    id: 'mock-post-grocery',
    orgId: 'mock-mutual-aid',
    title: 'Thursday grocery run',
    description: 'Drivers and riders pair up in the Norris lobby.',
    location: 'Norris University Center',
    startsAt: 0,
    link: '',
    endsAt: null,
    createdAt: 0,
    createdBy: 'mock-priya',
    mock: true,
  },
  {
    id: 'mock-post-pantry',
    orgId: 'mock-pantry',
    title: 'Thursday restock',
    description: 'Pantry restock this Thursday.',
    location: 'Foster St pantry',
    startsAt: 0,
    link: '',
    endsAt: null,
    createdAt: 0,
    createdBy: 'mock-jordan',
    mock: true,
  },
  {
    id: 'mock-post-sweep',
    orgId: 'mock-evanston',
    title: 'Saturday riverbank sweep',
    description: 'Gloves and bags provided. Meet at the Church St bridge.',
    location: 'Church St & Benson Ave',
    startsAt: 0,
    link: '',
    endsAt: null,
    createdAt: 0,
    createdBy: 'mock-sam',
    mock: true,
  },
  {
    id: 'mock-post-dune',
    orgId: 'mock-lakeside',
    title: 'Dune grass planting',
    description: 'Tools on site along the lakefront path.',
    location: 'Clark Street Beach',
    startsAt: 0,
    link: '',
    endsAt: null,
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
    link: '',
    endsAt: null,
    createdAt: 0,
    createdBy: 'mock-sam',
    mock: true,
  },
]

const AGES: Record<string, number> = {
  'mock-block-club': 12 * 24 * hour,
  'mock-compost': 8 * 24 * hour,
  'mock-mutual-aid': 3 * 24 * hour,
  'mock-pantry': 6 * 24 * hour,
  'mock-evanston': 5 * 24 * hour,
  'mock-lakeside': 6 * hour,
  'mock-post-alley': 8 * 24 * hour,
  'mock-post-compost': 2 * 24 * hour,
  'mock-post-compost-priya': 20 * hour,
  'mock-post-grocery': 18 * hour,
  'mock-post-pantry': 10 * hour,
  'mock-post-sweep': 2 * 24 * hour,
  'mock-post-dune': 4 * hour,
  'mock-post-hours': 3 * hour,
}

function stamp(id: string) {
  return Date.now() - (AGES[id] ?? hour)
}

export function mockOrganizations(userId: string | null, displayName: string): Organization[] {
  return ORGS.map((org) => {
    const { posterIds: _posters, ...rest } = org
    const yours = org.ownerId === ME
    return {
      ...rest,
      ownerId: yours ? userId || ME : org.ownerId,
      ownerName: yours ? displayName || 'You' : org.ownerName,
      createdAt: stamp(org.id),
    }
  })
}

export function mockPosterIds(orgId: string, userId: string | null): string[] {
  const org = ORGS.find((item) => item.id === orgId)
  if (!org) return []
  return org.posterIds.map((id) => (id === ME ? userId || ME : id))
}

export function mockMembers(orgId: string, userId: string | null, displayName: string): OrgMember[] {
  const org = ORGS.find((item) => item.id === orgId)
  if (!org) return []
  const names: Record<string, { name: string; email: string }> = {
    'mock-jordan': { name: 'Jordan Lee', email: 'jordan@example.com' },
    'mock-priya': { name: 'Priya Shah', email: 'priya@example.com' },
    'mock-sam': { name: 'Sam Ortiz', email: 'sam@example.com' },
  }
  const ownerId = org.ownerId === ME ? userId || ME : org.ownerId
  return org.posterIds
    .map((id) => (id === ME ? userId || ME : id))
    .filter((id) => id !== ownerId)
    .map((id) => ({
      id,
      orgId,
      userId: id,
      email: id === (userId || ME) ? '' : names[id]?.email || '',
      displayName: id === (userId || ME) ? displayName || 'You' : names[id]?.name || 'Poster',
      addedBy: ownerId,
      createdAt: stamp(orgId),
    }))
}

export function mockAnnouncements(userId: string | null): Announcement[] {
  const orgs = mockOrganizations(userId, 'You')
  return POSTS.map((post) => {
    const org = orgs.find((item) => item.id === post.orgId)
    const createdBy = post.createdBy === ME ? userId || ME : post.createdBy
    const names: Record<string, string> = {
      'mock-jordan': 'Jordan Lee',
      'mock-priya': 'Priya Shah',
      'mock-sam': 'Sam Ortiz',
    }
    return {
      ...post,
      orgName: org?.name || '',
      orgType: org?.type || 'Other',
      createdBy,
      createdByName: createdBy === (userId || ME) && post.createdBy === ME ? 'You' : names[post.createdBy] || 'Someone',
      orgOwnerId: org?.ownerId,
      orgCreatedAt: org?.createdAt,
      schedule: 'once',
      repeatDays: [],
      weekOf: null,
      createdAt: stamp(post.id),
      startsAt: stamp(post.id) + 3 * 24 * hour,
    }
  })
}

export const MOCK_ACCOUNTS: UserProfile[] = [
  {
    uid: 'mock-jordan',
    email: 'jordan@example.com',
    displayName: 'Jordan Lee',
    createdAt: 0,
    accountType: 'organizer',
  },
  {
    uid: 'mock-priya',
    email: 'priya@example.com',
    displayName: 'Priya Shah',
    createdAt: 0,
    accountType: 'both',
  },
  {
    uid: 'mock-sam',
    email: 'sam@example.com',
    displayName: 'Sam Ortiz',
    createdAt: 0,
    accountType: 'volunteer',
  },
]

export function mockPermissionEvents(userId: string): PermissionEvent[] {
  return [
    {
      id: 'mock-allowed-aid',
      type: 'allowed',
      orgId: 'mock-mutual-aid',
      orgName: 'NU Mutual Aid',
      actorId: 'mock-priya',
      actorName: 'Priya Shah',
      targetUserId: userId,
      createdAt: Date.now() - 2 * 24 * hour,
    },
    {
      id: 'mock-removed-lake',
      type: 'removed',
      orgId: 'mock-lakeside',
      orgName: 'Lakeside Volunteers',
      actorId: 'mock-sam',
      actorName: 'Sam Ortiz',
      targetUserId: userId,
      createdAt: Date.now() - 5 * hour,
    },
  ]
}

export const DEFAULT_MOCK_FOLLOWS = ['mock-evanston', 'mock-mutual-aid']

export const RETIRED_SAMPLE_NAMES = [
  'evanston neighborhood cleanup',
  'nu mutual aid',
  'rogers park arts collective',
  'lakeside volunteers',
]
