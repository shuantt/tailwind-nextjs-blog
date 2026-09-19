import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { categoryConfig } from '@/data/categoryData'
import { postsInCategory, publishedBlogs } from '@/lib/content'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata(props: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const params = await props.params
  const categorySlug = decodeURI(params.category)
  const categoryItem = categoryConfig.find((c) => c.slug === categorySlug)
  if (!categoryItem) {
    return {}
  }
  const hasPosts = postsInCategory(categoryItem.label).length > 0
  return genPageMetadata({
    title: `分類：${categoryItem.label}`,
    description: categoryItem.description,
    alternates: {
      canonical: `/categories/${categoryItem.slug}`,
    },
    // A fixed category with no posts yet is a real page, but not worth a search result.
    ...(hasPosts ? {} : { robots: { index: false, follow: true } }),
  })
}

export const generateStaticParams = async () => {
  return categoryConfig.map((c) => ({
    category: c.slug,
  }))
}

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const categorySlug = decodeURI(params.category)
  const categoryItem = categoryConfig.find((c) => c.slug === categorySlug)
  if (!categoryItem) {
    return notFound()
  }
  // Categories are a fixed taxonomy, so an empty one renders an empty state instead of a
  // 404: the sidebar and sitemap can rely on the page existing.
  const filteredPosts = allCoreContent(sortPosts(postsInCategory(categoryItem.label)))
  return <ListLayout posts={filteredPosts} totalPosts={publishedBlogs.length} title="Posts" />
}
