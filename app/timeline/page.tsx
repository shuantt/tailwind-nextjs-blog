import Link from '@/components/Link'
import { publishedBlogs } from '@/lib/content'
import { genPageMetadata } from 'app/seo'
import { sortPosts } from 'pliny/utils/contentlayer'

export const metadata = genPageMetadata({
  title: '歷年文章 Timeline',
  description: '依年份瀏覽 SHUANTT 的全部文章。',
  alternates: { canonical: '/timeline' },
})

export default function TimelinePage() {
  const postsByYear = new Map<string, typeof publishedBlogs>()
  for (const post of sortPosts(publishedBlogs)) {
    const year = post.date.slice(0, 4)
    const posts = postsByYear.get(year) ?? []
    posts.push(post)
    postsByYear.set(year, posts)
  }

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-8 pt-6 dark:border-gray-700">
        <h1 className="text-2xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl sm:leading-10 md:text-4xl md:leading-tight">
          Timeline
        </h1>
        <Link
          href="/posts"
          className="py-2 text-sm text-gray-500 underline-offset-4 hover:text-primary-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
        >
          返回文章列表
        </Link>
      </div>
      <div className="space-y-10 pt-8 sm:space-y-12 sm:pt-10">
        {[...postsByYear].map(([year, posts]) => (
          <section key={year} aria-labelledby={`year-${year}`}>
            <h2
              id={`year-${year}`}
              className="mb-3 text-2xl font-bold tabular-nums tracking-wide text-gray-900 dark:text-gray-100"
            >
              {year}
            </h2>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {posts.map((post) => (
                <li key={post.path}>
                  <Link
                    href={`/${post.path}`}
                    className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-4 rounded-sm py-3 text-gray-800 transition-colors hover:text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:text-gray-200 dark:hover:text-primary-400 sm:gap-6"
                  >
                    <time
                      dateTime={post.date}
                      aria-label={post.date.slice(0, 10)}
                      className="whitespace-nowrap text-sm tabular-nums text-gray-500 dark:text-gray-400"
                    >
                      {post.date.slice(5, 10).replace('-', '/')}
                    </time>
                    <span className="min-w-0 break-words leading-7 group-hover:underline group-hover:underline-offset-4">
                      {post.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {postsByYear.size === 0 && (
          <p className="text-gray-500 dark:text-gray-400">目前還沒有文章。</p>
        )}
      </div>
    </div>
  )
}
