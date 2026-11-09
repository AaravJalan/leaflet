import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrgAccess } from './orgAccess'

const state = vi.hoisted(() => ({
  uid: null as string | null,
  extraPosters: {} as Record<string, { userId: string }[]>,
  removedPosterIds: {} as Record<string, string[]>,
  follows: [] as string[],
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: state.uid ? { uid: state.uid } : null }),
}))

vi.mock('../context/DemoContext', () => ({
  useDemo: () => ({
    extraPosters: state.extraPosters,
    removedPosterIds: state.removedPosterIds,
    isFollowing: (orgId: string) => state.follows.includes(orgId),
  }),
}))

vi.mock('../data/mock', () => ({
  mockPosterIds: (orgId: string) => (orgId === 'sample' ? ['listed'] : []),
}))

function access(orgId: string, ownerId?: string) {
  return renderHook(() => useOrgAccess(orgId, ownerId)).result.current
}

beforeEach(() => {
  state.uid = 'me'
  state.extraPosters = {}
  state.removedPosterIds = {}
  state.follows = []
})

describe('useOrgAccess', () => {
  it('grants nothing when signed out', () => {
    state.uid = null
    state.follows = ['org']
    expect(access('org', 'owner')).toEqual({ yours: false, canPost: false, following: false })
  })

  it('lets the owner post', () => {
    expect(access('org', 'me')).toMatchObject({ yours: true, canPost: true })
  })

  it('does not let the owner be removed', () => {
    state.removedPosterIds = { org: ['me'] }
    expect(access('org', 'me').canPost).toBe(true)
  })

  it('denies an unrelated user', () => {
    expect(access('org', 'owner')).toMatchObject({ yours: false, canPost: false })
  })

  it('allows an added poster', () => {
    state.extraPosters = { org: [{ userId: 'me' }] }
    expect(access('org', 'owner').canPost).toBe(true)
  })

  it('allows a poster listed on a sample org', () => {
    state.uid = 'listed'
    expect(access('sample', 'owner').canPost).toBe(true)
  })

  it('lets removal override an added or listed poster', () => {
    state.extraPosters = { org: [{ userId: 'me' }] }
    state.removedPosterIds = { org: ['me'] }
    expect(access('org', 'owner').canPost).toBe(false)

    state.uid = 'listed'
    state.removedPosterIds = { sample: ['listed'] }
    expect(access('sample', 'owner').canPost).toBe(false)
  })

  it('scopes grants to the org', () => {
    state.extraPosters = { other: [{ userId: 'me' }] }
    expect(access('org', 'owner').canPost).toBe(false)
  })

  it('reports following', () => {
    state.follows = ['org']
    expect(access('org', 'owner').following).toBe(true)
    expect(access('other', 'owner').following).toBe(false)
  })
})
