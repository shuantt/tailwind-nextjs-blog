import { Authors, allAuthors } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import AuthorLayout from '@/layouts/AuthorLayout'
import { coreContent } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'

const description =
  'Shuan Tseng，設計背景出身、近四年經驗的全端工程師與創作者。這裡記錄開發、設計與生活，歡迎交流專案與工作機會。'

export const metadata = genPageMetadata({
  title: '關於 Shuan Tseng：全端工程師與創作者',
  description,
})

export default function Page() {
  const author = allAuthors.find((p) => p.slug === 'default') as Authors
  const mainContent = coreContent(author)
  const pageUrl = `${siteMetadata.siteUrl}/about`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl,
    inLanguage: siteMetadata.language,
    mainEntity: {
      '@type': 'Person',
      // Same @id as the Person on the homepage and in post authorship, so crawlers
      // treat them as one entity.
      '@id': `${pageUrl}#person`,
      name: author.name,
      description,
      jobTitle: author.occupation,
      url: pageUrl,
      image: author.avatar ? `${siteMetadata.siteUrl}${author.avatar}` : undefined,
      sameAs: [author.github, author.linkedin, author.facebook, author.instagram].filter(Boolean),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthorLayout content={mainContent}>
        <MDXLayoutRenderer code={author.body.code} />
      </AuthorLayout>
    </>
  )
}
