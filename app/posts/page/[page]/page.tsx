import ListLayout from '@/layouts/ListLayoutWithTags'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { POSTS_PER_PAGE, publishedBlogs } from '@/lib/content'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

const totalPages = Math.ceil(publishedBlogs.length / POSTS_PER_PAGE)

export async function generateMetadata(props: {
  params: Promise<{ page: string }>
}): Promise<Metadata> {
  const params = await props.params
  const isFirstPage = params.page === '1'
  return genPageMetadata({
    title: isFirstPage ? '全部文章 Posts' : `全部文章 第 ${params.page} 頁`,
    description: siteMetadata.seo.postsDescription,
    alternates: {
      // Page 1 duplicates /posts, so it points its canonical there. On Vercel the
      // next.config.js redirect sends /posts/page/1 to /posts before this page renders.
      canonical: isFirstPage ? '/posts' : './',
    },
  })
}

// `output: 'export'` (the CI build) rejects a dynamic route whose generateStaticParams
// returns nothing, so page 1 is always generated even though it mirrors /posts.
export const generateStaticParams = async () => {
  return Array.from({ length: Math.max(totalPages, 1) }, (_, i) => ({
    page: (i + 1).toString(),
  }))
}

export default async function Page(props: { params: Promise<{ page: string }> }) {
  const params = await props.params
  const pageNumber = parseInt(params.page, 10)
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > Math.max(totalPages, 1)) {
    return notFound()
  }

  const posts = allCoreContent(sortPosts(publishedBlogs))
  const initialDisplayPosts = posts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages,
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
