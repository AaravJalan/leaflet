import { createAnnouncement } from './announcements'
import { createOrganization, getOrganization } from './organizations'
import type { OrgType } from '../types'

const day = 24 * 60 * 60 * 1000

const SEED = [
  {
    org: {
      name: 'Evanston Neighborhood Cleanup',
      description: 'Volunteer cleanups and block parties across Evanston.',
      type: 'Neighborhood' as OrgType,
    },
    posts: [
      {
        title: 'Saturday Riverbank Sweep',
        description:
          'Meet at the Church St bridge. Gloves and bags provided. Bring a water bottle.',
        location: 'Church St & Benson Ave, Evanston',
        startsAt: Date.now() + 3 * day,
        link: '',
      },
      {
        title: 'Alley Paint & Planters',
        description: 'Help refresh the alley murals behind Dempster. All ages welcome.',
        location: 'Behind 800 Dempster St',
        startsAt: Date.now() + 10 * day,
        link: '',
      },
    ],
  },
  {
    org: {
      name: 'NU Mutual Aid',
      description: 'Campus mutual aid requests, grocery runs, and resource shares.',
      type: 'Mutual Aid' as OrgType,
    },
    posts: [
      {
        title: 'Grocery run signup open',
        description: 'Need a ride to Jewel this week? Drivers and riders pair up Thursday night.',
        location: 'Norris University Center lobby',
        startsAt: Date.now() + 2 * day,
        link: 'https://example.com/grocery-run',
      },
    ],
  },
  {
    org: {
      name: 'Rogers Park Arts Collective',
      description: 'Pop-up shows, open studios, and neighborhood art walks.',
      type: 'Arts & Culture' as OrgType,
    },
    posts: [
      {
        title: 'Open studio night',
        description: 'Local makers open their doors from 6 to 9pm. Free, no RSVP needed.',
        location: '1520 W Morse Ave',
        startsAt: Date.now() + 5 * day,
        link: '',
      },
    ],
  },
  {
    org: {
      name: 'Lakeside Volunteers',
      description: 'Park restoration, shoreline care, and weekend workdays.',
      type: 'Volunteer' as OrgType,
    },
    posts: [
      {
        title: 'Dune grass planting',
        description: 'Help plant native grasses along the lakefront path. Tools on site.',
        location: 'Clark Street Beach',
        startsAt: Date.now() + 7 * day,
        link: '',
      },
      {
        title: 'Tool library hours extended',
        description: 'Borrow rakes, loppers, and wheelbarrows Saturdays 10am to 2pm.',
        location: 'Volunteer shed, south lot',
        startsAt: null,
        link: '',
      },
    ],
  },
]

export async function seedDemoData(input: {
  ownerId: string
  ownerName: string
}): Promise<{ orgCount: number; postCount: number }> {
  let orgCount = 0
  let postCount = 0

  for (const item of SEED) {
    const orgId = await createOrganization({
      ...item.org,
      ownerId: input.ownerId,
      ownerName: input.ownerName,
    })
    const org = await getOrganization(orgId)
    if (!org) continue
    orgCount += 1

    for (const post of item.posts) {
      await createAnnouncement({
        org,
        title: post.title,
        description: post.description,
        location: post.location,
        startsAt: post.startsAt,
        endsAt: null,
        createdByName: input.ownerName,
        schedule: 'once',
        repeatDays: [],
        weekOf: null,
        link: post.link,
        createdBy: input.ownerId,
      })
      postCount += 1
    }
  }

  return { orgCount, postCount }
}
