import { Authors, allAuthors } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import AuthorLayout from '@/layouts/AuthorLayout'
import { coreContent } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

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
      <div className=" py-4">
        <h2 className="mb-4 text-xl font-semibold">有想與我交流的事情嗎？</h2>
        <p className="leading-7 text-gray-600 dark:text-gray-400">
          不論是專案合作、工作機會，或者是對程式開發、設計、生活或只是想與我隨性聊聊，都歡迎透過{' '}
          <Link
            href="mailto:tehsuan.tht@gmail.com"
            className="inline-block py-2 font-medium text-primary-600 underline underline-offset-4 dark:text-primary-400"
          >
            Email
          </Link>{' '}
          或到{' '}
          <Link
            href="/guestbook"
            className="inline-block py-2 font-medium text-primary-600 underline underline-offset-4 dark:text-primary-400"
          >
            Guestbook
          </Link>{' '}
          留話給我，我會盡快回覆你！記得留下你的個人網站或社群連結，讓我有機會回訪喔 :)
        </p>
      </div>
    </>
  )
}
