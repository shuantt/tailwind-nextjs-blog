import { MetadataRoute } from 'next'
import siteMetadata from '@/data/siteMetadata'
import {
  TAG_INDEX_MIN_POSTS,
  latestPostDate,
  postsInCategory,
  postsWithTag,
  publishedBlogs,
} from '@/lib/content'
import { categoryConfig } from '@/data/categoryData'
import tagData from 'app/tag-data.json'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl
  const newestPost = latestPostDate(publishedBlogs)

  // Listing pages change when their posts change, so they carry the newest post date in
  // their set. Pages with no meaningful date omit lastmod instead of claiming a fresh edit
  // on every build, which only teaches crawlers to ignore the field.
  const routes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: newestPost },
    { url: `${siteUrl}/posts`, lastModified: newestPost },
    { url: `${siteUrl}/timeline`, lastModified: newestPost },
    { url: `${siteUrl}/tags`, lastModified: newestPost },
    { url: `${siteUrl}/about` },
    { url: `${siteUrl}/projects` },
    { url: `${siteUrl}/guestbook` },
    { url: `${siteUrl}/privacy` },
  ]

  const categoryRoutes = categoryConfig.flatMap((category) => {
    const posts = postsInCategory(category.label)
    if (posts.length === 0) return []
    return [
      {
        url: `${siteUrl}/categories/${encodeURI(category.slug)}`,
        lastModified: latestPostDate(posts),
      },
    ]
  })

  const tagRoutes = Object.keys(tagData as Record<string, number>).flatMap((tag) => {
    const posts = postsWithTag(tag)
    if (posts.length < TAG_INDEX_MIN_POSTS) return []
    return [
      {
        url: `${siteUrl}/tags/${encodeURI(tag)}`,
        lastModified: latestPostDate(posts),
      },
    ]
  })

  const blogRoutes = publishedBlogs.map((post) => ({
    url: `${siteUrl}/${post.path}`,
    lastModified: post.lastmod || post.date,
  }))

  return [...routes, ...categoryRoutes, ...tagRoutes, ...blogRoutes]
}
