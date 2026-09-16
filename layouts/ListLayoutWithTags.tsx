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
  description?: string
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
            href={currentPage - 1 === 1 ? `/${basePath}` : `/${basePath}/page/${currentPage - 1}`}
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
  description,
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

  const filters = (
    <nav aria-label="文章分類與標籤" className="px-6 py-4">
      {pathname.startsWith('/posts') ? (
        <Link href="/posts" aria-current="page" className="font-bold text-primary-500">
          全部文章
        </Link>
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
              {count === 0 ? (
                <span className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">{`${c.label} (0)`}</span>
              ) : activeCategorySlug === c.slug ? (
                <span
                  aria-current="page"
                  className="inline px-3 py-2 text-sm font-bold uppercase text-primary-500"
                >
                  {`${c.label} (${count})`}
                </span>
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
                <span
                  aria-current="page"
                  className="inline px-3 py-2 text-sm font-bold uppercase text-primary-500"
                >
                  {`${t} (${tagCounts[t]})`}
                </span>
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
    </nav>
  )

  // Below `lg` (tablet/iPad-Pro-portrait and phones), category/tag filters used
  // to live inside a <details>/<summary> toggle the user had to tap open first.
  // Replaced with always-visible, horizontally-scrollable pill rows so both
  // categories and tags are one tap away instead of hidden behind a toggle.
  const activeChipClassName =
    'inline-flex shrink-0 items-center rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white dark:bg-primary-700'
  const chipClassName =
    'inline-flex shrink-0 items-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-400'
  const disabledChipClassName =
    'inline-flex shrink-0 items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-300 dark:border-gray-700 dark:text-gray-600'
  const scrollRowClassName =
    'scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden'

  const mobileFilters = (
    <div className="mb-6 lg:hidden">
      <h4 className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        類別
      </h4>
      <div className={scrollRowClassName}>
        {pathname.startsWith('/posts') ? (
          <span aria-current="page" className={activeChipClassName}>
            全部文章
          </span>
        ) : (
          <Link href="/posts" className={chipClassName}>
            全部文章
          </Link>
        )}
        {categoryConfig.map((c) => {
          const count = categoryCounts[c.slug] ?? 0
          if (count === 0) {
            return (
              <span key={c.slug} className={disabledChipClassName}>
                {`${c.label} (0)`}
              </span>
            )
          }
          return activeCategorySlug === c.slug ? (
            <span key={c.slug} aria-current="page" className={activeChipClassName}>
              {`${c.label} (${count})`}
            </span>
          ) : (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              aria-label={`查看分類 ${c.label} 的文章`}
              className={chipClassName}
            >
              {`${c.label} (${count})`}
            </Link>
          )
        })}
      </div>

      <h4 className="mb-2 mt-4 px-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        標籤
      </h4>
      <div className={scrollRowClassName}>
        {visibleTags.map((t) => {
          return activeTagSlug === slug(t) ? (
            <span key={t} aria-current="page" className={activeChipClassName}>
              {`${t} (${tagCounts[t]})`}
            </span>
          ) : (
            <Link
              key={t}
              href={`/tags/${slug(t)}`}
              aria-label={`View posts tagged ${t}`}
              className={chipClassName}
            >
              {`${t} (${tagCounts[t]})`}
            </Link>
          )
        })}
        <Link
          href="/tags"
          className="inline-flex shrink-0 items-center rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-primary-500 hover:text-primary-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary-400 dark:hover:text-primary-400"
        >
          全部標籤 →
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <div>
        <div className="pb-6 pt-6">
          <h1 className="text-2xl font-extrabold tracking-wide text-gray-900 dark:text-gray-100 sm:text-2xl md:text-4xl lg:hidden">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-base leading-7 text-gray-500 dark:text-gray-400 lg:mt-0">
              {description}
            </p>
          )}
        </div>
        {mobileFilters}
        <div className="flex lg:gap-x-12 xl:gap-x-24">
          <div className="hidden h-full max-h-screen min-w-[280px] max-w-[280px] flex-wrap overflow-auto rounded bg-gray-50 pt-5 shadow-md dark:bg-gray-900/70 dark:shadow-gray-800/40 lg:flex">
            {filters}
          </div>
          <div className="min-w-0 flex-1">
            {displayPosts.length === 0 && (
              <p className="py-5 text-base text-gray-500 dark:text-gray-400">目前還沒有文章。</p>
            )}
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
                            <Link
                              href={`/${path}`}
                              className="text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
                            >
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags
                              ?.slice()
                              .sort((a, b) => a.localeCompare(b))
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
