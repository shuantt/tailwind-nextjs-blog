import 'css/prism.css'
import 'katex/dist/katex.css'

import { components } from '@/components/MDXComponents'
import { publishedBlogs } from '@/lib/content'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { allAuthors } from 'contentlayer/generated'
import type { Authors, Blog } from 'contentlayer/generated'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { categoryConfig } from '@/data/categoryData'
import { notFound } from 'next/navigation'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}
const RELATED_POSTS = 3

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const post = publishedBlogs.find((p) => p.slug === slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  let imageList = [siteMetadata.socialBanner]
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
      alt: post.title,
    }
  })

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'zh_TW',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList,
    },
    // Always set: an `alternates: undefined` here would override the root layout's
    // self-referencing canonical instead of inheriting it.
    alternates: {
      canonical: post.canonicalUrl ?? './',
    },
  }
}

export const generateStaticParams = async () => {
  return publishedBlogs.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const sortedCoreContents = allCoreContent(sortPosts(publishedBlogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = publishedBlogs.find((p) => p.slug === slug) as Blog
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  const mainContent = coreContent(post)
  const categoryItem = categoryConfig.find((c) => c.label === post.category)

  // Same category counts most, then shared tags; ties keep the newest-first order.
  const tagSet = new Set(post.tags ?? [])
  const related = sortedCoreContents
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score:
        (p.category === post.category ? 2 : 0) +
        (p.tags ?? []).filter((tag) => tagSet.has(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RELATED_POSTS)
    .map((entry) => entry.post)

  const postUrl = `${siteMetadata.siteUrl}/${post.path}`
  const personId = `${siteMetadata.siteUrl}/about#person`
  const jsonLd = {
    ...post.structuredData,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    inLanguage: siteMetadata.language,
    articleSection: post.category,
    keywords: post.tags,
    wordCount: post.readingTime?.words,
    author: authorDetails.map((author) => ({
      '@type': 'Person',
      ...(author.slug === 'default'
        ? { '@id': personId, url: `${siteMetadata.siteUrl}/about` }
        : {}),
      name: author.name,
      ...(author.github ? { sameAs: [author.github] } : {}),
    })),
    publisher: { '@type': 'Person', '@id': personId, name: siteMetadata.author },
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteMetadata.siteUrl },
      ...(categoryItem
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: categoryItem.label,
              item: `${siteMetadata.siteUrl}/categories/${encodeURI(categoryItem.slug)}`,
            },
          ]
        : []),
      { '@type': 'ListItem', position: categoryItem ? 3 : 2, name: post.title },
    ],
  }

  const Layout = layouts[post.layout || defaultLayout]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Layout
        content={mainContent}
        authorDetails={authorDetails}
        next={next}
        prev={prev}
        related={related}
      >
        <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
      </Layout>
    </>
  )
}
