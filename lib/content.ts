import { allBlogs } from 'contentlayer/generated'
import { slug } from 'github-slugger'

export const publishedBlogs = allBlogs.filter((post) => post.draft !== true)

// /posts and /posts/page/[page] must slice with the same page size, otherwise the second
// page starts at the wrong offset and posts silently disappear from pagination.
export const POSTS_PER_PAGE = 8

// Tag pages with fewer posts than this are thin content: they still render, but are marked
// noindex and left out of the sitemap until the tag has enough posts to deserve a result.
export const TAG_INDEX_MIN_POSTS = 3

export function postsInCategory(categoryLabel: string) {
  return publishedBlogs.filter((post) => post.category === categoryLabel)
}

export function postsWithTag(tagSlug: string) {
  return publishedBlogs.filter((post) => post.tags?.some((tag) => slug(tag) === tagSlug))
}

// The URL slug is lowercase and dashed ("pages-cms"); this recovers the author's own
// spelling ("Pages CMS") from the first post that carries the tag.
export function tagDisplayName(tagSlug: string) {
  for (const post of publishedBlogs) {
    const match = post.tags?.find((tag) => slug(tag) === tagSlug)
    if (match) return match
  }
  return tagSlug
}

// Newest publish or update date in a set of posts, as YYYY-MM-DD, for sitemap lastmod.
export function latestPostDate(posts: { date: string; lastmod?: string }[]) {
  if (posts.length === 0) return undefined
  const newest = Math.max(...posts.map((post) => new Date(post.lastmod || post.date).getTime()))
  return new Date(newest).toISOString().split('T')[0]
}
