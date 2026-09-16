import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import TOCInline from 'pliny/ui/TOCInline'
import { formatDate } from 'pliny/utils/formatDate'
import { categoryConfig } from '@/data/categoryData'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  related?: CoreContent<Blog>[]
  children: ReactNode
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  related = [],
  children,
}: LayoutProps) {
  const { path, slug, date, title, tags, category, readingTime } = content
  const basePath = path.split('/')[0]
  const categoryItem = categoryConfig.find((c) => c.label === category)

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-6 xl:pb-6">
            <div className="space-y-1 text-center">
              <dl className="space-y-10">
                <div>
                  <dt className="sr-only">Published on</dt>
                  <dd className="flex flex-wrap items-center justify-center gap-x-2 text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                    {categoryItem && (
                      <>
                        <Link
                          href={`/categories/${categoryItem.slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {categoryItem.label}
                        </Link>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <time dateTime={date}>
                      {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
                    </time>
                    {readingTime?.text && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{readingTime.text}</span>
                      </>
                    )}
                  </dd>
                </div>
              </dl>
              <PageTitle>{title}</PageTitle>
            </div>
          </header>

          <div className="pb-8">
            <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] lg:items-start lg:gap-x-8 xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,11rem)]">
              <aside className="contents xl:sticky xl:top-32 xl:col-start-1 xl:row-start-1 xl:block xl:self-start xl:pb-8">
                <div className="contents xl:block">
                  <dl className="order-1 border-b border-gray-200 pb-10 pt-6 dark:border-gray-700 lg:col-span-2 lg:row-start-1 lg:pb-8 lg:pt-10">
                    <dt className="sr-only">Authors</dt>
                    <dd>
                      <ul className="flex flex-wrap justify-center gap-4 sm:space-x-12 xl:block xl:space-x-0 xl:space-y-8">
                        {authorDetails.map((author) => (
                          <li className="flex items-center space-x-2" key={author.name}>
                            {author.avatar && (
                              <Image
                                src={author.avatar}
                                width={38}
                                height={38}
                                alt="avatar"
                                className="h-10 w-10 rounded-full"
                              />
                            )}
                            <dl className="whitespace-nowrap text-sm font-medium leading-5">
                              <dt className="sr-only">Name</dt>
                              <dd className="text-gray-900 dark:text-gray-100">{author.name}</dd>
                              <dt className="sr-only">Twitter</dt>
                              <dd>
                                {author.twitter && (
                                  <Link
                                    href={author.twitter}
                                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                                  >
                                    {author.twitter
                                      .replace('https://twitter.com/', '@')
                                      .replace('https://x.com/', '@')}
                                  </Link>
                                )}
                              </dd>
                            </dl>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </dl>

                  <footer className="order-4 pt-4 lg:col-span-2 lg:row-start-3 xl:pt-0">
                    <div className="divide-y divide-gray-200 text-sm font-medium leading-5 dark:divide-gray-700">
                      {tags && (
                        <div className="py-4 xl:py-8">
                          <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Tags
                          </h2>
                          <div className="flex flex-wrap">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                      )}
                      {(next || prev) && (
                        <div className="flex justify-between py-4 xl:block xl:space-y-8 xl:py-8">
                          {prev && prev.path && (
                            <div>
                              <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Previous Article
                              </h2>
                              <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                                <Link href={`/${prev.path}`}>{prev.title}</Link>
                              </div>
                            </div>
                          )}
                          {next && next.path && (
                            <div>
                              <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Next Article
                              </h2>
                              <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                                <Link href={`/${next.path}`}>{next.title}</Link>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="pt-4 xl:pt-8">
                      <Link
                        href={`/${basePath}`}
                        className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                        aria-label="Back to the blog"
                      >
                        &larr; Back to the blog
                      </Link>
                    </div>
                  </footer>
                </div>
              </aside>

              <div className="order-2 min-w-0 lg:col-start-1 lg:row-start-2 xl:col-start-2 xl:row-start-1">
                <div className="prose max-w-none border-b border-gray-200 pb-8 pt-10 dark:prose-invert dark:border-gray-700 xl:border-b-0">
                  {children}
                </div>
                {related.length > 0 && (
                  <section
                    aria-labelledby="related-posts"
                    className="border-b border-gray-200 py-8 dark:border-gray-700 xl:border-b-0"
                  >
                    <h2
                      id="related-posts"
                      className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Related Posts
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {related.map((item) => (
                        <li key={item.slug} className="flex flex-wrap items-baseline gap-x-3">
                          <Link
                            href={`/${item.path}`}
                            className="font-medium text-gray-900 hover:text-primary-500 dark:text-gray-100 dark:hover:text-primary-400"
                          >
                            {item.title}
                          </Link>
                          <time
                            dateTime={item.date}
                            className="text-sm text-gray-500 dark:text-gray-400"
                          >
                            {formatDate(item.date, siteMetadata.locale)}
                          </time>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <aside className="order-3 hidden pb-8 pt-10 lg:sticky lg:top-32 lg:col-start-2 lg:row-start-2 lg:block lg:self-start xl:col-start-3 xl:row-start-1">
                <h2 className="mb-4 text-xl font-bold">目錄</h2>
                <TOCInline
                  ulClassName="space-y-2 overflow-y-auto"
                  liClassName="list-none text-sm leading-6 hover:text-primary-500"
                  toc={content.toc}
                  exclude="Overview"
                  toHeading={4}
                  fromHeading={2}
                />
              </aside>
            </div>

            {siteMetadata.comments && (
              <section
                className="min-w-0 py-8 text-center text-gray-700 dark:text-gray-300 lg:mx-auto lg:w-[calc(100%-13rem)] xl:w-[calc(100%-26rem)]"
                id="comment"
              >
                <Comments slug={slug} />
              </section>
            )}
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
