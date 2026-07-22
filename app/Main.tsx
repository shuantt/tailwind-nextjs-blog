import Link from '@/components/Link'
import Tag from '@/components/Tag'
import projectsData from '@/data/projectsData'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Image from '@/components/Image'
import StaggeredList from '@/components/StaggeredList'
import TypingIntro from '@/components/TypingIntro'
import type { CSSProperties } from 'react'

const MAX_DISPLAY = 8

interface HomeProps {
  posts: CoreContent<Blog>[]
}

export default function Home({ posts }: HomeProps) {
  return (
    <>
      <section className="my-8 border-b border-gray-200 pb-10 pt-4 dark:border-gray-700 sm:my-12 sm:grid sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-10 sm:pb-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="relative max-w-2xl rounded-3xl border border-gray-200 bg-white px-5 py-6 dark:border-gray-700 dark:bg-gray-950 sm:order-2 sm:px-8 sm:py-7">
          <span
            aria-hidden="true"
            className="absolute -bottom-[23px] left-12 h-6 w-3 text-gray-200 dark:text-gray-700 sm:hidden"
          >
            <svg viewBox="0 0 12 24" className="h-full w-full overflow-visible">
              <rect width="12" height="2" className="fill-white dark:fill-gray-950" />
              <path
                d="M1 0L6 23L11 0"
                className="fill-white stroke-current dark:fill-gray-950"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
          <span
            aria-hidden="true"
            className="absolute -left-[23px] top-1/2 hidden h-3 w-6 -translate-y-1/2 text-gray-200 dark:text-gray-700 sm:block"
          >
            <svg viewBox="0 0 24 12" className="h-full w-full overflow-visible">
              <rect x="22" width="2" height="12" className="fill-white dark:fill-gray-950" />
              <path
                d="M24 1L1 6L24 11"
                className="fill-white stroke-current dark:fill-gray-950"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
          <TypingIntro
            heading="嗨，我是 Shuan。"
            paragraphs={[
              '我從設計走進軟體開發，現在也還在摸索工作和生活之間，自己真正想做、想留下來的東西。',
              '這裡會寫職涯、生活、個人創作與專案，也會記錄我使用軟體和產品後的學習心得。比起整理答案，我更想分享實際經歷過的事。',
            ]}
          />
        </div>
        <div className="relative mt-7 grid grid-cols-[8.5rem_minmax(0,1fr)] rounded-md p-2 sm:order-1 sm:mt-0 sm:block sm:w-full sm:p-0">
          <div
            aria-hidden="true"
            className="absolute -bottom-2 -right-2 z-0 h-full w-full rounded-md border border-primary-200 dark:border-primary-800 sm:hidden"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] rounded-md bg-[#f4e6cc] sm:hidden"
          />
          <div className="relative z-10 order-1">
            <div
              aria-hidden="true"
              className="absolute -bottom-2 -right-2 hidden h-full w-full rounded-md border border-primary-200 dark:border-primary-800 sm:block"
            />
            <Image
              src="/static/images/avatar-animated-v4.gif"
              alt="Shuan Tseng"
              width={600}
              height={600}
              priority
              unoptimized
              sizes="(max-width: 640px) 136px, 224px"
              className="relative z-10 aspect-square w-full rounded-l-md object-cover sm:rounded-md"
            />
          </div>
          <dl className="relative z-10 order-2 grid -translate-x-4 grid-cols-[auto_auto] content-center justify-end pr-5 sm:order-none sm:mt-5 sm:translate-x-0 sm:grid-cols-2 sm:border-y sm:border-gray-200 sm:px-0 sm:py-3 sm:dark:border-gray-700">
            <div className="border-r border-gray-900/10 pr-5 sm:border-r-0 sm:pr-0">
              <dt className="text-[0.65rem] font-medium uppercase tracking-wider text-gray-600 sm:text-gray-500 sm:dark:text-gray-400">
                Posts
              </dt>
              <dd className="mt-2 text-2xl font-semibold leading-none text-gray-900 sm:mt-1 sm:text-lg sm:leading-normal sm:dark:text-gray-100">
                {posts.length}
              </dd>
            </div>
            <div className="pl-5 sm:pl-0">
              <dt className="text-[0.65rem] font-medium uppercase tracking-wider text-gray-600 sm:text-gray-500 sm:dark:text-gray-400">
                Projects
              </dt>
              <dd className="mt-2 text-2xl font-semibold leading-none text-gray-900 sm:mt-1 sm:text-lg sm:leading-normal sm:dark:text-gray-100">
                {projectsData.length}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-wide text-gray-900 dark:text-gray-100 sm:text-2xl md:text-4xl">
          最新貼文
        </h2>
        <StaggeredList className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post, index) => {
            const { slug, date, title, summary, tags } = post
            return (
              <li
                key={slug}
                className="staggered-list-item py-8"
                style={{ '--stagger-index': index } as CSSProperties}
              >
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xl font-bold leading-8 tracking-tight">
                            <Link
                              href={`/posts/${slug}`}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <div className="text-base font-medium leading-6">
                        <Link
                          href={`/posts/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read more: "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </StaggeredList>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/posts"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
    </>
  )
}
