import { describe, expect, it } from 'vitest'
import type { Announcement, Organization } from '../types'
import {
  applyOrgs,
  applyPosts,
  hideOrg,
  hidePost,
  readHiddenOrgs,
  readHiddenPosts,
  readOrgEdits,
  readPostEdits,
  saveOrgEdit,
  savePostEdit,
} from './edits'

const org = (id: string, name = id) => ({ id, name, description: 'original' }) as Organization
const post = (id: string, title = id) => ({ id, title, startsAt: 100 }) as Announcement

describe('reading storage', () => {
  it('uses empty defaults', () => {
    expect(readHiddenOrgs()).toEqual([])
    expect(readHiddenPosts()).toEqual([])
    expect(readOrgEdits()).toEqual({})
    expect(readPostEdits()).toEqual({})
  })

  it('uses empty defaults for corrupt JSON', () => {
    localStorage.setItem('leaflet-hidden-orgs', 'not json')
    localStorage.setItem('leaflet-post-edits', '{')
    expect(readHiddenOrgs()).toEqual([])
    expect(readPostEdits()).toEqual({})
  })
})

describe('hiding', () => {
  it('adds ids once', () => {
    hideOrg('a')
    hideOrg('b')
    expect(hideOrg('a')).toEqual(['a', 'b'])
    expect(readHiddenOrgs()).toEqual(['a', 'b'])
  })

  it('keeps posts and orgs separate', () => {
    hidePost('a')
    expect(readHiddenPosts()).toEqual(['a'])
    expect(readHiddenOrgs()).toEqual([])
  })
})

describe('saving edits', () => {
  it('merges repeated edits to one org', () => {
    saveOrgEdit('a', { name: 'New' })
    saveOrgEdit('a', { location: 'Evanston' })
    expect(readOrgEdits().a).toEqual({ name: 'New', location: 'Evanston' })
  })

  it('leaves other orgs alone', () => {
    saveOrgEdit('a', { name: 'A' })
    saveOrgEdit('b', { name: 'B' })
    expect(readOrgEdits()).toEqual({ a: { name: 'A' }, b: { name: 'B' } })
  })

  it('lets a later edit clear a post date with null', () => {
    savePostEdit('a', { startsAt: 5, title: 'T' })
    savePostEdit('a', { startsAt: null })
    expect(readPostEdits().a).toEqual({ startsAt: null, title: 'T' })
  })
})

describe('applyOrgs', () => {
  it('filters hidden orgs and overlays edits', () => {
    hideOrg('gone')
    saveOrgEdit('kept', { name: 'Renamed' })
    expect(applyOrgs([org('gone'), org('kept'), org('other')])).toEqual([
      { id: 'kept', name: 'Renamed', description: 'original' },
      { id: 'other', name: 'other', description: 'original' },
    ])
  })

  it('does not mutate its input', () => {
    saveOrgEdit('a', { name: 'Renamed' })
    const input = org('a', 'Original')
    applyOrgs([input])
    expect(input.name).toBe('Original')
  })
})

describe('applyPosts', () => {
  it('filters hidden posts and overlays edits', () => {
    hidePost('gone')
    savePostEdit('kept', { title: 'Renamed', startsAt: null })
    expect(applyPosts([post('gone'), post('kept')])).toEqual([{ id: 'kept', title: 'Renamed', startsAt: null }])
  })
})
