import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { hideOrg, hidePost, saveOrgEdit, savePostEdit, type OrgEdit, type PostEdit } from '../lib/edits'
import type { Announcement, OrgMember } from '../types'

const FOLLOWS = 'leaflet-follows'
const EXTRA_POSTERS = 'leaflet-extra-posters'
const REMOVED_POSTERS = 'leaflet-removed-posters'
const LOCAL_POSTS = 'leaflet-local-posts'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function realFollows(ids: string[]) {
  return ids.filter((id) => !id.startsWith('mock-'))
}

type DemoValue = {
  follows: string[]
  isFollowing: (orgId: string) => boolean
  setFollowing: (orgId: string, on: boolean) => void
  extraPosters: Record<string, OrgMember[]>
  removedPosterIds: Record<string, string[]>
  addPoster: (member: OrgMember) => void
  removePoster: (orgId: string, userId: string) => void
  localPosts: Announcement[]
  addLocalPost: (post: Announcement) => void
  revision: number
  saveOrg: (id: string, edit: OrgEdit) => void
  removeOrg: (id: string) => void
  savePost: (id: string, edit: PostEdit) => void
  removePost: (id: string) => void
}

const DemoContext = createContext<DemoValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [follows, setFollows] = useState<string[]>(() => {
    const next = realFollows(readJson<string[]>(FOLLOWS, []))
    localStorage.setItem(FOLLOWS, JSON.stringify(next))
    return next
  })
  const [extraPosters, setExtraPosters] = useState<Record<string, OrgMember[]>>(() =>
    readJson(EXTRA_POSTERS, {}),
  )
  const [removedPosterIds, setRemovedPosterIds] = useState<Record<string, string[]>>(() =>
    readJson(REMOVED_POSTERS, {}),
  )
  const [localPosts, setLocalPosts] = useState<Announcement[]>(() => readJson(LOCAL_POSTS, []))
  const [revision, setRevision] = useState(0)

  const setFollowing = useCallback((orgId: string, on: boolean) => {
    setFollows((current) => {
      const has = current.includes(orgId)
      if (on && has) return current
      if (!on && !has) return current
      const next = on ? [...current, orgId] : current.filter((id) => id !== orgId)
      localStorage.setItem(FOLLOWS, JSON.stringify(next))
      return next
    })
  }, [])

  const addPoster = useCallback((member: OrgMember) => {
    setExtraPosters((current) => {
      const list = current[member.orgId] ?? []
      const next = {
        ...current,
        [member.orgId]: [...list.filter((item) => item.userId !== member.userId), member],
      }
      localStorage.setItem(EXTRA_POSTERS, JSON.stringify(next))
      return next
    })
    setRemovedPosterIds((current) => {
      const next = {
        ...current,
        [member.orgId]: (current[member.orgId] ?? []).filter((id) => id !== member.userId),
      }
      localStorage.setItem(REMOVED_POSTERS, JSON.stringify(next))
      return next
    })
  }, [])

  const removePoster = useCallback((orgId: string, userId: string) => {
    setExtraPosters((current) => {
      const next = {
        ...current,
        [orgId]: (current[orgId] ?? []).filter((item) => item.userId !== userId),
      }
      localStorage.setItem(EXTRA_POSTERS, JSON.stringify(next))
      return next
    })
    setRemovedPosterIds((current) => {
      const next = {
        ...current,
        [orgId]: [...new Set([...(current[orgId] ?? []), userId])],
      }
      localStorage.setItem(REMOVED_POSTERS, JSON.stringify(next))
      return next
    })
  }, [])

  const addLocalPost = useCallback((post: Announcement) => {
    setLocalPosts((current) => {
      const next = [post, ...current.filter((item) => item.id !== post.id)]
      localStorage.setItem(LOCAL_POSTS, JSON.stringify(next))
      return next
    })
  }, [])

  const saveOrg = useCallback((id: string, edit: OrgEdit) => {
    saveOrgEdit(id, edit)
    setRevision((value) => value + 1)
  }, [])

  const removeOrg = useCallback((id: string) => {
    hideOrg(id)
    setRevision((value) => value + 1)
  }, [])

  const savePost = useCallback((id: string, edit: PostEdit) => {
    savePostEdit(id, edit)
    setRevision((value) => value + 1)
  }, [])

  const removePost = useCallback((id: string) => {
    hidePost(id)
    setRevision((value) => value + 1)
  }, [])

  const value = useMemo<DemoValue>(
    () => ({
      follows,
      isFollowing: (orgId) => follows.includes(orgId),
      setFollowing,
      extraPosters,
      removedPosterIds,
      addPoster,
      removePoster,
      localPosts,
      addLocalPost,
      revision,
      saveOrg,
      removeOrg,
      savePost,
      removePost,
    }),
    [
      follows,
      setFollowing,
      extraPosters,
      removedPosterIds,
      addPoster,
      removePoster,
      localPosts,
      addLocalPost,
      revision,
      saveOrg,
      removeOrg,
      savePost,
      removePost,
    ],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  return ctx
}
