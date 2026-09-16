import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { publishedBlogs } from '@/lib/content'
import siteMetadata from '@/data/siteMetadata'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(publishedBlogs)
  const posts = allCoreContent(sortedPosts)
  const personId = `${siteMetadata.siteUrl}/about#person`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteMetadata.siteUrl}/#website`,
        url: siteMetadata.siteUrl,
        name: siteMetadata.title,
        alternateName: siteMetadata.seo.alternateName,
        description: siteMetadata.description,
        inLanguage: siteMetadata.language,
        publisher: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: siteMetadata.author,
        url: `${siteMetadata.siteUrl}/about`,
        sameAs: [siteMetadata.github],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Main posts={posts} />
    </>
  )
}
