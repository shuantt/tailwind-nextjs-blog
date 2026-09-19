'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { logoutOwner, ownerAuthorization } from '@/lib/owner-account'
import type { AdminMessage } from '@/lib/guestbook/model'
import { replyEmailUrl } from '@/lib/guestbook/model'
import { buttonClass, fieldClass, linkClass } from './styles'
import { messageDate } from './MessageList'

export default function GuestbookAdmin() {
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const pendingLoad = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    pendingLoad.current?.abort()
    const controller = new AbortController()
    pendingLoad.current = controller
    const { signal } = controller
    const headers = ownerAuthorization()
    const isCurrent = () =>
      !signal.aborted && headers.Authorization === ownerAuthorization().Authorization
    setBusy(true)
    setError('')
    setMessages([])
    setHasMore(false)
    try {
      const response = await fetch(`/api/guestbook/admin?filter=${filter}&page=${page}`, {
        cache: 'no-store',
        headers,
        signal,
      })
      const data = await response.json()
      if (!isCurrent()) return
      if (response.status === 401) {
        setAuthorized(false)
        setMessages([])
        return
      }
      if (!response.ok) throw new Error(data.error)
      setAuthorized(true)
      setMessages(data.messages)
      setHasMore(data.hasMore)
    } catch (error) {
      if (isCurrent()) setError(error instanceof Error ? error.message : '無法讀取留言。')
    } finally {
      if (isCurrent()) setBusy(false)
    }
  }, [filter, page])

  useEffect(() => {
    let credential = ownerAuthorization().Authorization
    const refreshIdentity = () => {
      const next = ownerAuthorization().Authorization
      if (next === credential) return
      credential = next
      setAuthorized(null)
      setNotice('')
      void load()
    }
    const stored = (event: StorageEvent) => {
      if (!event.key || event.key === 'ArtalkUser') refreshIdentity()
    }
    void load()
    window.addEventListener('storage', stored)
    window.addEventListener('focus', refreshIdentity)
    window.addEventListener('artalk-user-changed', refreshIdentity)
    return () => {
      pendingLoad.current?.abort()
      window.removeEventListener('storage', stored)
      window.removeEventListener('focus', refreshIdentity)
      window.removeEventListener('artalk-user-changed', refreshIdentity)
    }
  }, [load])

  async function act(id: string, action: string, reply?: string) {
    setBusy(true)
    setError('')
    setNotice('')
    const authorization = ownerAuthorization()
    try {
      const response = await fetch('/api/guestbook/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authorization },
        body: JSON.stringify({ id, action, reply }),
      })
      const data = await response.json()
      if (authorization.Authorization !== ownerAuthorization().Authorization) return
      if (response.status === 401) {
        setAuthorized(false)
        setMessages([])
      }
      if (!response.ok) throw new Error(data.error)
      setNotice(action === 'delete' ? '留言已刪除。' : '已儲存變更。')
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : '操作失敗，請再試一次。')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    try {
      await logoutOwner()
      setAuthorized(false)
      setMessages([])
    } catch {
      setError('登出失敗，請重試。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">留言管理</h1>
        {authorized && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void logout()}
            className={`${linkClass} min-h-11`}
          >
            登出
          </button>
        )}
      </div>
      {authorized === false && (
        <div className="mt-8 space-y-4">
          <p>請使用站主的 GitHub 帳號登入。</p>
          <a href="/api/guestbook/auth/login" className={buttonClass}>
            使用 GitHub 登入
          </a>
        </div>
      )}
      <div aria-live="polite" className="mt-5">
        {busy && (
          <p role="status" className="text-sm">
            正在處理…
          </p>
        )}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void load()} className={`${linkClass} min-h-11`}>
              重新載入
            </button>
          </div>
        )}
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
      </div>
      {authorized && (
        <>
          <div className="my-7 flex flex-wrap gap-2" aria-label="篩選留言">
            {(
              [
                ['all', '全部留言'],
                ['pending', '待審核'],
                ['private', '私密訊息'],
                ['approved', '已公開'],
                ['hidden', '已隱藏'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={busy}
                aria-pressed={filter === value}
                onClick={() => {
                  setFilter(value)
                  setPage(0)
                  setNotice('')
                }}
                className={`min-h-11 rounded-lg border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 ${filter === value ? 'border-primary-600 font-semibold text-primary-600 dark:text-primary-400' : 'border-gray-300 dark:border-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {!messages.length && !busy && !error && (
            <p className="py-10 text-gray-600 dark:text-gray-400">目前沒有這類訊息。</p>
          )}
          {messages.map((entry) => (
            <AdminEntry key={entry.id} entry={entry} busy={busy} onAction={act} />
          ))}
          <nav className="mt-8 flex items-center justify-between" aria-label="管理留言分頁">
            <button
              type="button"
              disabled={busy || page === 0}
              onClick={() => setPage(page - 1)}
              className={`${linkClass} min-h-11 disabled:opacity-40`}
            >
              上一頁
            </button>
            <span className="text-sm">第 {page + 1} 頁</span>
            <button
              type="button"
              disabled={busy || !hasMore}
              onClick={() => setPage(page + 1)}
              className={`${linkClass} min-h-11 disabled:opacity-40`}
            >
              下一頁
            </button>
          </nav>
        </>
      )}
    </div>
  )
}

function AdminEntry({
  entry,
  busy,
  onAction,
}: {
  entry: AdminMessage
  busy: boolean
  onAction: (id: string, action: string, reply?: string) => Promise<void>
}) {
  const [reply, setReply] = useState(entry.reply || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => {
    setReply(entry.reply || '')
  }, [entry.reply])
  return (
    <article className="border-t border-gray-200 py-7 dark:border-gray-800">
      <header className="flex flex-wrap items-baseline gap-3">
        <h2 className="break-all font-semibold">{entry.name}</h2>
        <time dateTime={entry.created_at} className="text-sm text-gray-500 dark:text-gray-400">
          {messageDate(entry.created_at)}
        </time>
      </header>
      <p className="mt-3 whitespace-pre-wrap leading-7 [overflow-wrap:anywhere]">{entry.message}</p>
      {entry.source && (
        <p className="mt-3 text-sm">
          文章：
          <a href={entry.source} className={linkClass}>
            {entry.source}
          </a>
        </p>
      )}
      {entry.website && /^https?:\/\//i.test(entry.website) && (
        <p className="mt-3 break-all text-sm">
          網站：
          <a href={entry.website} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {entry.website}
          </a>
        </p>
      )}
      {entry.email && (
        <p className="mt-3 break-all text-sm">
          Email：
          <a href={replyEmailUrl(entry.email)} className={linkClass}>
            {entry.email}
          </a>
        </p>
      )}
      {!entry.notification_sent && (
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          訊息已儲存；Email 通知尚未寄出，請在此查看。
        </p>
      )}
      {entry.visibility === 'public' && (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault()
            void onAction(entry.id, 'reply', reply)
          }}
        >
          <label htmlFor={`reply-${entry.id}`} className="text-sm font-medium">
            公開回覆
          </label>
          <textarea
            id={`reply-${entry.id}`}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            disabled={busy}
            maxLength={3000}
            rows={3}
            className={fieldClass}
          />
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            只有已核准的留言會顯示回覆。清空並儲存可移除回覆。
          </p>
          <button type="submit" disabled={busy} className={`${buttonClass} mt-3 dark:!text-white`}>
            儲存回覆
          </button>
        </form>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {entry.visibility === 'public' && entry.status !== 'approved' && (
          <button
            type="button"
            disabled={busy}
            className={buttonClass}
            onClick={() => void onAction(entry.id, 'approve')}
          >
            核准公開
          </button>
        )}
        {entry.visibility === 'public' && entry.status !== 'hidden' && (
          <button
            type="button"
            disabled={busy}
            className={`${linkClass} min-h-11`}
            onClick={() => void onAction(entry.id, 'hide')}
          >
            隱藏留言
          </button>
        )}
        {!confirmDelete ? (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 text-sm underline underline-offset-4"
            onClick={() => setConfirmDelete(true)}
          >
            刪除
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>永久刪除這則訊息與回覆？</span>
            <button
              type="button"
              disabled={busy}
              className="min-h-11 font-semibold underline"
              onClick={() => void onAction(entry.id, 'delete')}
            >
              確認刪除
            </button>
            <button
              type="button"
              disabled={busy}
              className="min-h-11 underline"
              onClick={() => setConfirmDelete(false)}
            >
              取消
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
