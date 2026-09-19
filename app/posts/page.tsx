import ListLayout from '@/layouts/ListLayoutWithTags'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { POSTS_PER_PAGE, publishedBlogs } from '@/lib/content'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({
  title: '全部文章 Posts',
  description: siteMetadata.seo.postsDescription,
})

export default function BlogPage() {
  const posts = allCoreContent(sortPosts(publishedBlogs))
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
  }

  return (
    <ListLayout
      posts={posts}
      totalPosts={publishedBlogs.length}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="Posts"
    />
  )
}
