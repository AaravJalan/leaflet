import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { readHiddenOrgs, readHiddenPosts, readOrgEdits, readPostEdits } from '../lib/edits'
import type { Announcement, OrgMember } from '../types'
import { DemoProvider, useDemo } from './DemoContext'

function setup() {
  return renderHook(() => useDemo(), { wrapper: DemoProvider }).result
}

function stored(key: string) {
  return JSON.parse(localStorage.getItem(key) ?? 'null')
}

const member = (userId: string, displayName = userId): OrgMember => ({
  id: `m-${userId}`,
  orgId: 'org',
  userId,
  email: `${userId}@x.co`,
  displayName,
  addedBy: 'owner',
  createdAt: 1,
})

describe('useDemo', () => {
  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useDemo())).toThrow('useDemo must be used within DemoProvider')
  })
})

describe('follows', () => {
  it('defaults to an empty follow list', () => {
    expect(setup().current.follows).toEqual([])
  })

  it('restores saved follows, including an empty list', () => {
    localStorage.setItem('leaflet-follows', '[]')
    expect(setup().current.follows).toEqual([])
  })

  it('drops old mock follows from storage', () => {
    localStorage.setItem('leaflet-follows', '["mock-evanston","real-org"]')
    expect(setup().current.follows).toEqual(['real-org'])
    expect(stored('leaflet-follows')).toEqual(['real-org'])
  })

  it('follows and unfollows, and persists it', () => {
    localStorage.setItem('leaflet-follows', '[]')
    const result = setup()

    act(() => result.current.setFollowing('a', true))
    expect(result.current.isFollowing('a')).toBe(true)
    expect(stored('leaflet-follows')).toEqual(['a'])

    act(() => result.current.setFollowing('a', false))
    expect(result.current.isFollowing('a')).toBe(false)
    expect(stored('leaflet-follows')).toEqual([])
  })

  it('does not add a follow twice', () => {
    localStorage.setItem('leaflet-follows', '["a"]')
    const result = setup()
    act(() => result.current.setFollowing('a', true))
    expect(result.current.follows).toEqual(['a'])
  })
})

describe('posters', () => {
  it('adds a poster and replaces one with the same user id', () => {
    const result = setup()
    act(() => result.current.addPoster(member('a', 'First')))
    act(() => result.current.addPoster(member('a', 'Second')))
    expect(result.current.extraPosters.org.map((item) => item.displayName)).toEqual(['Second'])
  })

  it('removes a poster and records the removal', () => {
    const result = setup()
    act(() => result.current.addPoster(member('a')))
    act(() => result.current.removePoster('org', 'a'))
    expect(result.current.extraPosters.org).toEqual([])
    expect(result.current.removedPosterIds.org).toEqual(['a'])
  })

  it('records a removal once', () => {
    const result = setup()
    act(() => result.current.removePoster('org', 'a'))
    act(() => result.current.removePoster('org', 'a'))
    expect(result.current.removedPosterIds.org).toEqual(['a'])
  })

  it('clears the removal when the person is added back', () => {
    const result = setup()
    act(() => result.current.removePoster('org', 'a'))
    act(() => result.current.addPoster(member('a')))
    expect(result.current.removedPosterIds.org).toEqual([])
    expect(result.current.extraPosters.org).toHaveLength(1)
  })

  it('survives a reload', () => {
    const first = setup()
    act(() => first.current.addPoster(member('a')))
    act(() => first.current.removePoster('org', 'b'))
    const second = setup()
    expect(second.current.extraPosters.org.map((item) => item.userId)).toEqual(['a'])
    expect(second.current.removedPosterIds.org).toEqual(['b'])
  })
})

describe('local posts', () => {
  const post = (id: string, title = id) => ({ id, title }) as Announcement

  it('puts the newest first and replaces by id', () => {
    const result = setup()
    act(() => result.current.addLocalPost(post('a', 'old')))
    act(() => result.current.addLocalPost(post('b')))
    act(() => result.current.addLocalPost(post('a', 'new')))
    expect(result.current.localPosts.map((item) => item.title)).toEqual(['new', 'b'])
  })

  it('falls back to no posts for corrupt storage', () => {
    localStorage.setItem('leaflet-local-posts', '{')
    expect(setup().current.localPosts).toEqual([])
  })
})

describe('edits', () => {
  it('bumps revision for each write so pages reload', () => {
    const result = setup()
    expect(result.current.revision).toBe(0)

    act(() => result.current.saveOrg('o', { name: 'N' }))
    act(() => result.current.removeOrg('o2'))
    act(() => result.current.savePost('p', { title: 'T' }))
    act(() => result.current.removePost('p2'))

    expect(result.current.revision).toBe(4)
    expect(readOrgEdits().o).toEqual({ name: 'N' })
    expect(readHiddenOrgs()).toEqual(['o2'])
    expect(readPostEdits().p).toEqual({ title: 'T' })
    expect(readHiddenPosts()).toEqual(['p2'])
  })
})
