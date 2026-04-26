interface PostLike {
  data: {
    date?: string
    status?: string
  }
}

export const POSTS_PAGE_SIZE = 10

export function comparePostsByDateDesc<T extends PostLike>(a: T, b: T) {
  if (!a.data.date && !b.data.date) return 0
  if (!a.data.date) return 1
  if (!b.data.date) return -1
  return b.data.date.localeCompare(a.data.date)
}

export function getVisiblePostsSorted<T extends PostLike>(posts: T[], filterDrafts: boolean) {
  const visiblePosts = filterDrafts ? posts.filter((post) => post.data.status === 'published') : [...posts]
  return visiblePosts.sort(comparePostsByDateDesc)
}
