import type { Announcement } from '../types'

/** Preset covers people can pick when posting, until real uploads exist. */
export const COVER_OPTIONS = [1, 2, 3].map(
  (n) => `https://picsum.photos/seed/leaflet-cover-${n}/1200/500`,
)

/** Real cover if set, otherwise a stable placeholder seeded by the post id. */
export function coverImage(post: Pick<Announcement, 'id' | 'imageUrl'>, width = 800, height = 400) {
  return post.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(post.id)}/${width}/${height}`
}
