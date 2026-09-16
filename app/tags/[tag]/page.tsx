import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import { TAG_INDEX_MIN_POSTS, postsWithTag, tagDisplayName } from '@/lib/content'
import ListLayout from '@/layouts/ListLayoutWithTags'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const name = tagDisplayName(tag)
  const count = postsWithTag(tag).length
  return genPageMetadata({
    title: `標籤：${name}`,
    description: `所有標記為「${name}」的文章，共 ${count} 篇。`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tag}/feed.xml`,
      },
    },
    ...(count >= TAG_INDEX_MIN_POSTS ? {} : { robots: { index: false, follow: true } }),
  })
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const paths = tagKeys.map((tag) => ({
    tag: encodeURI(tag),
  }))
  return paths
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const filteredPosts = allCoreContent(sortPosts(postsWithTag(tag)))
  if (filteredPosts.length === 0) {
    return notFound()
  }
  return <ListLayout posts={filteredPosts} title={tagDisplayName(tag)} />
}
