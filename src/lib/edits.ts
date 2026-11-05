import type { Announcement, Organization, OrgType } from '../types'

const HIDDEN_ORGS = 'leaflet-hidden-orgs'
const ORG_EDITS = 'leaflet-org-edits'
const HIDDEN_POSTS = 'leaflet-hidden-posts'
const POST_EDITS = 'leaflet-post-edits'

export type OrgEdit = {
  name?: string
  description?: string
  type?: OrgType
  location?: string
  slug?: string
}

export type PostEdit = {
  title?: string
  description?: string
  location?: string
  startsAt?: number | null
  endsAt?: number | null
  link?: string
  schedule?: 'once' | 'weekly'
  repeatDays?: number[]
  weekOf?: number | null
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function readHiddenOrgs() {
  return read<string[]>(HIDDEN_ORGS, [])
}

export function readOrgEdits() {
  return read<Record<string, OrgEdit>>(ORG_EDITS, {})
}

export function readHiddenPosts() {
  return read<string[]>(HIDDEN_POSTS, [])
}

export function readPostEdits() {
  return read<Record<string, PostEdit>>(POST_EDITS, {})
}

export function hideOrg(id: string) {
  const next = [...new Set([...readHiddenOrgs(), id])]
  localStorage.setItem(HIDDEN_ORGS, JSON.stringify(next))
  return next
}

export function saveOrgEdit(id: string, edit: OrgEdit) {
  const next = { ...readOrgEdits(), [id]: { ...readOrgEdits()[id], ...edit } }
  localStorage.setItem(ORG_EDITS, JSON.stringify(next))
  return next
}

export function hidePost(id: string) {
  const next = [...new Set([...readHiddenPosts(), id])]
  localStorage.setItem(HIDDEN_POSTS, JSON.stringify(next))
  return next
}

export function savePostEdit(id: string, edit: PostEdit) {
  const next = { ...readPostEdits(), [id]: { ...readPostEdits()[id], ...edit } }
  localStorage.setItem(POST_EDITS, JSON.stringify(next))
  return next
}

export function applyOrgs(orgs: Organization[]) {
  const hidden = new Set(readHiddenOrgs())
  const edits = readOrgEdits()
  return orgs
    .filter((org) => !hidden.has(org.id))
    .map((org) => ({ ...org, ...edits[org.id] }))
}

export function applyPosts(posts: Announcement[]) {
  const hidden = new Set(readHiddenPosts())
  const edits = readPostEdits()
  return posts
    .filter((post) => !hidden.has(post.id))
    .map((post) => ({ ...post, ...edits[post.id] }))
}
