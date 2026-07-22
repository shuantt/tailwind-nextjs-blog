import Link from '@/components/Link'

export default function NotFound() {
  return (
    <section className="grid min-h-[65vh] gap-10 border-b border-gray-300 py-16 dark:border-gray-800 sm:py-24 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-700 dark:text-primary-300">
          Error / 404
        </p>
        <p
          aria-hidden="true"
          className="mt-4 text-[7rem] font-bold leading-none tracking-[-0.08em] text-gray-300 dark:text-gray-800 sm:text-[10rem]"
        >
          404
        </p>
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <h1 className="text-4xl font-bold tracking-[-0.045em] text-gray-950 dark:text-gray-50 sm:text-6xl">
          這一頁，暫時不在這裡。
        </h1>
        <p className="mt-6 max-w-lg text-base leading-8 text-gray-600 dark:text-gray-400">
          可能是網址輸入錯誤，或內容已經移動。你可以回到首頁，或從文章列表繼續逛逛。
        </p>
        <div className="mt-9 flex flex-wrap gap-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center bg-gray-950 px-5 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-primary-200 dark:focus-visible:ring-offset-gray-950"
          >
            回到首頁
          </Link>
          <Link
            href="/posts"
            className="inline-flex min-h-11 items-center border-b border-gray-950 text-sm font-bold text-gray-950 hover:border-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-50 dark:text-gray-50 dark:hover:text-primary-300"
          >
            瀏覽文章{' '}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
