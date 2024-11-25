import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm'

const MAX_DISPLAY = 5

export default function Home({ posts }) {
  return (
    <>
      {/* <div className="mb-8 space-y-8 border-b-[1px] border-solid border-gray-200 py-8 dark:border-gray-700 sm:flex sm:space-x-8 sm:space-y-0"> */}
      <div className="mb-16 mt-8 space-y-4 sm:flex sm:space-x-6 sm:space-y-0">
        {/* Welcome */}
        <div className="w-full space-y-2 sm:space-y-5 md:w-1/2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100  md:text-4xl ">
            Hi, this is Shuan,
          </h1>
          <p className="text-sm leading-8 md:text-base md:leading-10">
            設計師轉工程師，除了技術類的內容，可能還會寫寫生涯、藝術相關、閱讀心得等雜文，如有任何錯誤之處還請多多指點，我會非常感激。
          </p>
          <div className="space-y-2 rounded-xl bg-gray-100 p-6 dark:bg-gray-700">
            <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 ">
              關於「貼文」和「技術筆記」分類
            </h3>
            <p className="text-sm leading-8">
              有些部落格教學文閱讀體驗不太好，決定零碎筆記和長文類整理在像技術文件的框架中 (
              <a href="#" className=" text-blue-500 underline hover:font-bold">
                技術筆記
              </a>
              ) ，這裡放觀念或者大綱加總結的內容。( 而且這樣生活廢文多也看起來更自然呢 )
            </p>
          </div>
        </div>{' '}
        {/* Banner Image */}
        <div className="w-full md:w-1/2">
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
                              href={`/blog/${slug}`}
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
                          href={`/blog/${slug}`}
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
            href="/blog"
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
