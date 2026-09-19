'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PublicMessage } from '@/lib/guestbook/model'
import { linkClass } from './styles'

export function messageDate(value: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Taipei',
  }).format(new Date(value))
}

export default function MessageList() {
  const [messages, setMessages] = useState<PublicMessage[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async (nextPage: number, signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/guestbook?page=${nextPage}`, { cache: 'no-store', signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setMessages((current) =>
        nextPage
          ? [
              ...current,
              ...data.messages.filter(
                (item: PublicMessage) => !current.some((old) => old.id === item.id)
              ),
            ]
          : data.messages
      )
      setPage(nextPage)
      setHasMore(data.hasMore)
    } catch (error) {
      if (!signal?.aborted)
        setError(error instanceof Error ? error.message : '暫時無法載入留言，請再試一次。')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void load(0, controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <section className="min-w-0" aria-label="留言列表">
      <div aria-live="polite" className="min-h-64">
        {!messages.length && !loading && !error && (
          <p className="py-6 text-gray-600 dark:text-gray-400">這裡還沒有留言，歡迎成為第一位 :)</p>
        )}
        {messages.map((entry) => (
          <article key={entry.id} className="border-b border-gray-200 py-6 dark:border-gray-800">
            <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="break-all font-semibold">
                {entry.website && /^https?:\/\//i.test(entry.website) ? (
                  <a
                    href={entry.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className={linkClass}
                  >
                    {entry.name}
                  </a>
                ) : (
                  entry.name
                )}
              </h2>
              <time
                dateTime={entry.created_at}
                className="text-sm tabular-nums text-gray-500 dark:text-gray-400"
              >
                {messageDate(entry.created_at)}
              </time>
            </header>
            <p className="mt-3 whitespace-pre-wrap break-words leading-7 [overflow-wrap:anywhere]">
              {entry.message}
            </p>
            {entry.reply && (
              <div className="ml-4 mt-5 border-l border-gray-300 pl-5 dark:border-gray-700">
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  Shuan{' '}
                  <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                    站主回覆
                  </span>
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words leading-7 [overflow-wrap:anywhere]">
                  {entry.reply}
                </p>
              </div>
            )}
          </article>
        ))}
        {loading && (
          <p role="status" className="py-6 text-sm text-gray-600 dark:text-gray-400">
            正在載入留言…
          </p>
        )}
        {error && (
          <div className="py-6">
            <p role="alert" className="text-sm text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>
        )}
      </div>
      {hasMore && !loading && !error && (
        <button
          type="button"
          className={`${linkClass} mt-6 min-h-11`}
          onClick={() => void load(page + 1)}
        >
          載入更多留言
        </button>
      )}
    </section>
  )
}
