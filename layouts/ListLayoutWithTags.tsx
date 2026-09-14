/* eslint-disable jsx-a11y/anchor-is-valid */
'use client'

import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { categoryConfig } from '@/data/categoryData'
import tagData from 'app/tag-data.json'
import categoryData from 'app/category-data.json'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname.split('/')[1]
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pb-8 pt-6 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const pathname = usePathname()
  const tagCounts = tagData as Record<string, number>
  const categoryCounts = categoryData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  // const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])
  const sortedTags = tagKeys.sort((a, b) => {
    const isNumber = (str) => /^[0-9]/.test(str)
    const isEnglish = (str) => /^[A-Za-z]/.test(str)
    const isChinese = (str) => /^[\u4e00-\u9fa5]/.test(str)

    if (isNumber(a) && !isNumber(b)) return -1
    if (!isNumber(a) && isNumber(b)) return 1

    if (isEnglish(a) && !isEnglish(b)) return -1
    if (!isEnglish(a) && isEnglish(b)) return 1

    if (isChinese(a) && !isChinese(b)) return -1
    if (!isChinese(a) && isChinese(b)) return 1

    // 如果是同类型，使用 localeCompare 进行排序
    return a.localeCompare(b, 'zh')
  })
  const visibleTags = sortedTags.slice(0, 8)

  const activeCategorySlug = pathname.startsWith('/categories/')
    ? decodeURI(pathname.split('/categories/')[1])
    : null
  const activeTagSlug = pathname.startsWith('/tags/')
    ? decodeURI(pathname.split('/tags/')[1])
    : null

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  return (
    <>
      <div>
        <div className="pb-6 pt-6">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:hidden sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            {title}
          </h1>
        </div>
        <div className="flex sm:space-x-24">
          <div className="hidden h-full max-h-screen min-w-[280px] max-w-[280px] flex-wrap overflow-auto rounded bg-gray-50 pt-5 shadow-md dark:bg-gray-900/70 dark:shadow-gray-800/40 sm:flex">
            <div className="px-6 py-4">
              {pathname.startsWith('/posts') ? (
                <h3 className="font-bold uppercase text-primary-500">全部文章</h3>
              ) : (
                <Link
                  href={`/posts`}
                  className="font-bold uppercase text-gray-700 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-500"
                >
                  全部文章
                </Link>
              )}

              <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                類別
              </h4>
              <ul>
                {categoryConfig.map((c) => {
                  const count = categoryCounts[c.slug] ?? 0
                  return (
                    <li key={c.slug} className="my-3">
                      {activeCategorySlug === c.slug ? (
                        <h3 className="inline px-3 py-2 text-sm font-bold uppercase text-primary-500">
                          {`${c.label} (${count})`}
                        </h3>
                      ) : (
                        <Link
                          href={`/categories/${c.slug}`}
                          className="px-3 py-2 text-sm font-medium uppercase text-gray-500 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-500"
                          aria-label={`查看分類 ${c.label} 的文章`}
                        >
                          {`${c.label} (${count})`}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>

              <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                標籤
              </h4>
              <ul>
                {visibleTags.map((t) => {
                  return (
                    <li key={t} className="my-3">
                      {activeTagSlug === slug(t) ? (
                        <h3 className="inline px-3 py-2 text-sm font-bold uppercase text-primary-500">
                          {`${t} (${tagCounts[t]})`}
                        </h3>
                      ) : (
                        <Link
                          href={`/tags/${slug(t)}`}
                          className="px-3 py-2 text-sm font-medium uppercase text-gray-500 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-500"
                          aria-label={`View posts tagged ${t}`}
                        >
                          {`${t} (${tagCounts[t]})`}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
              <Link
                href="/tags"
                className="mt-3 inline-block px-3 py-2 text-sm font-medium uppercase text-gray-500 hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-500"
              >
                查看全部標籤
              </Link>
            </div>
          </div>
          <div>
            <ul>
              {displayPosts.map((post) => {
                const { path, date, title, summary, tags, category } = post
                const categoryItem = categoryConfig.find((c) => c.label === category)
                return (
                  <li key={path} className="py-5">
                    <article className="flex flex-col space-y-2 xl:space-y-0">
                      <dl>
                        <dt className="sr-only">Published on</dt>
                        <dd className="flex flex-wrap items-center gap-x-2 text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                          {category && (
                            <>
                              <Link
                                href={`/categories/${categoryItem?.slug ?? slug(category)}`}
                                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {category}
                              </Link>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <time dateTime={date} suppressHydrationWarning>
                            {formatDate(date, siteMetadata.locale)}
                          </time>
                        </dd>
                      </dl>
                      <div className="space-y-3">
                        <div>
                          <h2 className="text-2xl font-bold leading-8 tracking-wide">
                            <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags
                              ?.sort((a, b) => a.localeCompare(b))
                              .map((tag) => {
                                return <Tag key={tag} text={tag} />
                              })}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
            {pagination && pagination.totalPages > 1 && (
              <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
