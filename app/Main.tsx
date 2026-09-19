import Link from '@/components/Link'
import Tag from '@/components/Tag'
import projectsData from '@/data/projectsData'
import siteMetadata from '@/data/siteMetadata'
import { categoryConfig } from '@/data/categoryData'
// Aliased to avoid clashing with each post's own `slug` field (the URL
// slug) below — this one slugifies a category label into its URL slug,
// same as layouts/ListLayoutWithTags.tsx does for the /posts page.
import { slug as slugify } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import StaggeredList from '@/components/StaggeredList'
import HeroStatCard from '@/components/HeroStatCard'
import heroContent from '@/data/heroContent'
import { getRaceProgress } from '@/lib/raceCountdown'
import { getHeroStats } from '@/lib/heroStats'
import { INTRO_LIST_DELAY_MS } from '@/lib/introRevealTiming'
import type { CSSProperties } from 'react'
import { heroLatin, heroPixel } from './fonts/hero-fonts'

const MAX_DISPLAY = 8

interface HomeProps {
  posts: CoreContent<Blog>[]
}

export default function Home({ posts }: HomeProps) {
  const raceProgress = getRaceProgress()

  return (
    <>
      <section
        className={`${heroLatin.variable} ${heroPixel.variable} hero-pixel-text my-8 sm:my-12`}
      >
        <HeroStatCard
          heading={heroContent.heading}
          highlight={heroContent.highlight}
          bio={heroContent.bio}
          initialStats={getHeroStats()}
          postsCount={posts.length}
          projectsCount={projectsData.length}
          raceCurrentWeek={raceProgress.currentWeek}
          raceTotalWeeks={raceProgress.totalWeeks}
          raceProgressPct={raceProgress.progressPct}
        />
      </section>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-wide text-gray-900 dark:text-gray-100 sm:text-2xl md:text-4xl">
          最新貼文
        </h2>
        <StaggeredList
          className="divide-y divide-gray-200 dark:divide-gray-700"
          delayMs={INTRO_LIST_DELAY_MS}
        >
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post, index) => {
            const { slug, date, title, summary, tags, category, readingTime } = post
            const categoryItem = categoryConfig.find((c) => c.label === category)
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
                      <dd className="flex flex-wrap items-center gap-x-2 text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        {category && (
                          <>
                            <Link
                              href={`/categories/${categoryItem?.slug ?? slugify(category)}`}
                              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                              {category}
                            </Link>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                        {readingTime?.text && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{readingTime.text}</span>
                          </>
                        )}
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-xl font-bold leading-8 tracking-tight">
                            <Link
                              href={`/posts/${slug}`}
                              className="text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
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
