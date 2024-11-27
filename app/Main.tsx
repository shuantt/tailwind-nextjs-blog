import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import Image from '@/components/Image'
import NewsletterForm from 'pliny/ui/NewsletterForm'

const MAX_DISPLAY = 8

export default function Home({ posts }) {
  return (
    <>
      <div className="lg mb-10 mt-8 space-y-4 sm:space-x-6 sm:space-y-0 lg:flex">
        {/* Welcome */}
        <div className="w-full space-y-2 sm:flex sm:flex-col sm:justify-between sm:space-y-5 xl:w-2/3">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100  md:text-4xl ">
            Hi, this is Shuan,
          </h1>
          <p className="text-sm leading-8 md:text-base md:leading-10">
            設計師轉工程師，除了寫技術文，可能還會寫寫生涯規劃、藝術設計、閱讀心得等雜文，如有任何錯誤之處還請多多指點，我會非常感激。
          </p>
          <div className="space-y-2 rounded-xl bg-gray-100 p-6 dark:bg-gray-700">
            <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 ">
              關於「Posts」和「Technotes」分類
            </h3>
            <p className="text-sm leading-8 md:text-base md:leading-10">
              為方便整理和閱讀，另開一個站
              <a
                href="https://shuan-technote.vercel.app/"
                className=" px-1 text-blue-500 underline hover:font-bold"
              >
                Technotes
              </a>
              存放零碎筆記和系列內容，部落格這邊的寫法會嘗試更精簡一點。(而且這樣生活廢文多也看起來更自然呢
              )
            </p>
          </div>
        </div>{' '}
        {/* Banner Image */}
        <div className="hidden w-full overflow-hidden rounded lg:block xl:w-1/3">
          <Image
            src="/static/images/avatar.jpg"
            alt={'homepage-banner'}
            width={600}
            height={600}
            className="h-full w-full object-cover "
          />
          {/* <img
            className="h-full w-full object-cover"
            src="https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg"
            alt=""
          /> */}
        </div>
      </div>
      <div className="mb-8">
        {/* 文章列表 */}
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl md:text-4xl ">
          最新貼文
        </h1>
        {/* <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p> */}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags } = post
            return (
              <li key={slug} className="py-8">
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
        </ul>
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
      {/* {siteMetadata.newsletter?.provider && (
        <div className="flex items-center justify-center pt-4">
          <NewsletterForm />
        </div>
      )} */}
    </>
  )
}
