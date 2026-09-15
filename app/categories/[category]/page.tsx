import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import { categoryConfig } from '@/data/categoryData'
import { publishedBlogs } from '@/lib/content'
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
  const title = categoryItem?.label ?? categorySlug
  return genPageMetadata({
    title,
    description: `${siteMetadata.title} ${title} 分類文章`,
    alternates: {
      canonical: `/categories/${categoryItem?.slug ?? categorySlug}`,
    },
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
  const filteredPosts = allCoreContent(
    sortPosts(publishedBlogs.filter((post) => post.category === categoryItem.label))
  )
  if (filteredPosts.length === 0) {
    return notFound()
  }
  return <ListLayout posts={filteredPosts} title={categoryItem.label} />
}
