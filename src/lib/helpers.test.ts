import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OrgMember, PermissionEvent } from '../types'
import { COVER_OPTIONS, coverImage } from './images'
import { readPermissionLog, rememberPermission } from './permissionLog'
import { uniquePosters } from './posters'
import { DAY_MS, canFollow, canOrganize, isNewOrg } from './roles'
import { slugify } from './slug'

describe('slugify', () => {
  it.each([
    ['Rogers Park Block Club', 'rogers-park-block-club'],
    ['  padded  ', 'padded'],
    ['Arts & Culture!', 'arts-culture'],
    ['---already--dashed---', 'already-dashed'],
    ['Room 101', 'room-101'],
    ['!!!', ''],
    ['', ''],
  ])('turns %j into %j', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('caps the length at 48 characters', () => {
    expect(slugify('a'.repeat(60))).toHaveLength(48)
  })
})

describe('roles', () => {
  it.each([
    ['organizer', true, false],
    ['volunteer', false, true],
    ['both', true, true],
    [null, false, false],
    [undefined, false, false],
  ] as const)('%s: organize %s, follow %s', (type, organize, follow) => {
    expect(canOrganize(type)).toBe(organize)
    expect(canFollow(type)).toBe(follow)
  })

  describe('isNewOrg', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('is true only for less than a day', () => {
      vi.useFakeTimers({ now: 10 * DAY_MS })
      expect(isNewOrg(10 * DAY_MS)).toBe(true)
      expect(isNewOrg(9 * DAY_MS + 1)).toBe(true)
      expect(isNewOrg(9 * DAY_MS)).toBe(false)
    })
  })
})

describe('uniquePosters', () => {
  const member = (userId: string, email: string): OrgMember => ({
    id: `m-${userId}`,
    orgId: 'org',
    userId,
    email,
    displayName: userId,
    addedBy: 'owner',
    createdAt: 1,
  })
  const ids = (members: OrgMember[]) => members.map((item) => item.userId)

  it('keeps distinct members in order', () => {
    expect(ids(uniquePosters([member('b', 'b@x.co'), member('a', 'a@x.co')]))).toEqual(['b', 'a'])
  })

  it('excludes the owner', () => {
    expect(ids(uniquePosters([member('owner', 'o@x.co'), member('a', 'a@x.co')], 'owner'))).toEqual(['a'])
  })

  it('removes repeats by user id', () => {
    expect(ids(uniquePosters([member('a', 'a@x.co'), member('a', 'other@x.co')]))).toEqual(['a'])
  })

  it('removes repeats by email, ignoring case and whitespace', () => {
    expect(ids(uniquePosters([member('a', 'Sam@X.co'), member('b', '  sam@x.co ')]))).toEqual(['a'])
  })

  it('does not treat blank emails as duplicates', () => {
    expect(ids(uniquePosters([member('a', ''), member('b', '  ')]))).toEqual(['a', 'b'])
  })
})

describe('coverImage', () => {
  it('prefers the real image', () => {
    expect(coverImage({ id: 'p', imageUrl: 'https://img.test/a.png' })).toBe('https://img.test/a.png')
  })

  it('uses a placeholder seeded by id when the image is blank', () => {
    expect(coverImage({ id: 'p1', imageUrl: '' })).toBe('https://picsum.photos/seed/p1/800/400')
  })

  it('honors a custom size and encodes the id', () => {
    expect(coverImage({ id: 'a/b c' }, 100, 50)).toBe('https://picsum.photos/seed/a%2Fb%20c/100/50')
  })

  it('offers three distinct presets', () => {
    expect(new Set(COVER_OPTIONS).size).toBe(3)
  })
})

describe('permissionLog', () => {
  const event = (id: string, createdAt = 1): PermissionEvent => ({
    id,
    type: 'allowed',
    orgId: 'org',
    orgName: 'Org',
    actorId: 'actor',
    actorName: 'Actor',
    targetUserId: 'target',
    createdAt,
  })

  it('starts empty', () => {
    expect(readPermissionLog()).toEqual([])
  })

  it('puts the newest event first', () => {
    rememberPermission(event('a'))
    rememberPermission(event('b'))
    expect(readPermissionLog().map((item) => item.id)).toEqual(['b', 'a'])
  })

  it('replaces an event with the same id', () => {
    rememberPermission(event('a', 1))
    rememberPermission(event('b'))
    rememberPermission(event('a', 2))
    const log = readPermissionLog()
    expect(log.map((item) => item.id)).toEqual(['a', 'b'])
    expect(log[0].createdAt).toBe(2)
  })

  it('returns empty for corrupt storage', () => {
    localStorage.setItem('leaflet-permission-events', '{nope')
    expect(readPermissionLog()).toEqual([])
  })
})
