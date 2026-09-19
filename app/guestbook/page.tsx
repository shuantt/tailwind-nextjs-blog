import { genPageMetadata } from 'app/seo'
import GuestbookForm from '@/components/guestbook/GuestbookForm'
import MessageList from '@/components/guestbook/MessageList'
import { publishedBlogs } from '@/lib/content'

export const metadata = genPageMetadata({
  title: '留言板 Guestbook',
  description: '歡迎留下網址讓我有機會回訪 :)',
})

export default async function Guestbook({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>
}) {
  const { post } = await searchParams
  const article =
    typeof post === 'string' ? publishedBlogs.find((entry) => entry.slug === post) : undefined
  return (
    <div className="pb-12 pt-6">
      <div className="border-b border-gray-200 pb-8 dark:border-gray-700">
        <h1 className="text-2xl font-bold leading-9 tracking-tight sm:text-3xl md:text-4xl">
          Guestbook
        </h1>
      </div>
      <div className="grid items-start gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="min-w-0">
          <MessageList />
        </div>
        <GuestbookForm
          article={article ? { title: article.title, path: `/${article.path}` } : undefined}
        />
      </div>
    </div>
  )
}
