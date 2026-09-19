'use client'

import { useEffect, useState } from 'react'
import Link from '@/components/Link'
import { logoutOwner } from '@/lib/owner-account'

type LoginStatus = 'checking' | 'guest' | 'owner' | 'expired' | 'unavailable'

const statusLabels: Record<LoginStatus, string> = {
  checking: 'Hi, 交個朋友吧',
  guest: 'Hi, 交個朋友吧',
  owner: '站主已登入',
  expired: '登入已失效，請重新登入',
  unavailable: '暫時無法確認登入狀態',
}

export default function CommentAccountFooter() {
  const [status, setStatus] = useState<LoginStatus>('checking')
  const [logoutError, setLogoutError] = useState('')

  async function logout() {
    try {
      await logoutOwner()
      setLogoutError('')
      setStatus('guest')
    } catch {
      setLogoutError('無法清除登入資訊，請再試一次。')
    }
  }

  useEffect(() => {
    let currentToken: string | undefined
    let pending: AbortController | undefined
    let disposed = false

    async function check(force = false) {
      let token = ''
      try {
        const saved = JSON.parse(localStorage.getItem('ArtalkUser') || '{}')
        if (typeof saved?.token === 'string') token = saved.token
      } catch {
        // Missing or invalid browser data never establishes an authenticated identity.
      }
      if (!force && token === currentToken) return
      currentToken = token
      pending?.abort()
      if (!token) {
        setStatus('guest')
        return
      }

      const controller = new AbortController()
      pending = controller
      const timeout = window.setTimeout(() => controller.abort(), 10000)
      setStatus('checking')
      try {
        const response = await fetch('/api/v2/owner/session', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        })
        if (response.status === 401 || response.status === 403) {
          if (!disposed && pending === controller && currentToken === token) setStatus('expired')
          return
        }
        if (!response.ok) throw new Error('Login status unavailable')
        const data = await response.json()
        if (typeof data.is_owner !== 'boolean') throw new Error('Invalid login status')
        if (!disposed && pending === controller && currentToken === token) {
          setStatus(data.is_owner ? 'owner' : 'expired')
        }
      } catch {
        if (!disposed && pending === controller && currentToken === token) {
          setStatus('unavailable')
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    const refresh = () => void check(true)
    const changed = () => void check()
    const stored = (event: StorageEvent) => {
      if (!event.key || event.key === 'ArtalkUser') changed()
    }
    void check()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', stored)
    window.addEventListener('artalk-user-changed', changed)
    return () => {
      disposed = true
      pending?.abort()
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', stored)
      window.removeEventListener('artalk-user-changed', changed)
    }
  }, [])

  return (
    <div className="mb-3 text-center text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center justify-center gap-2">
        <Link href="/privacy">隱私權條款</Link>
        <span aria-hidden="true">•</span>
        {/* Artalk serves its own application, so use a full navigation instead of Next routing. */}
        <a
          href={status === 'owner' ? '/sidebar/#/comments' : '/api/v2/owner/login'}
          aria-label="通知中心"
          title="通知中心"
          className="-mx-1 inline-flex h-9 w-6 items-center justify-center rounded hover:text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:hover:text-primary-400"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="m9 3-.6 2.4-1.8 1L4.2 6 2 9.8l1.8 1.6v2L2 15l2.2 3.8 2.4-.4 1.8 1L9 22h4.4l.6-2.6 1.8-1 2.4.4 2.2-3.8-1.8-1.6v-2l1.8-1.6L18.2 6l-2.4.4-1.8-1L13.4 3Z"
              transform="translate(.8 -.5)"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </a>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-xs">
        <p
          role="status"
          className={status === 'owner' ? 'font-medium text-primary-600 dark:text-primary-400' : ''}
        >
          {status === 'owner' ? (
            <Link
              href="/guestbook/admin"
              className="underline underline-offset-4"
              title="留言板管理"
            >
              {statusLabels[status]}
            </Link>
          ) : (
            statusLabels[status]
          )}
        </p>
        {(status === 'owner' || status === 'expired' || status === 'unavailable') && (
          <button
            type="button"
            onClick={logout}
            className="rounded px-1 py-1 underline underline-offset-4 hover:text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:hover:text-primary-400"
          >
            登出
          </button>
        )}
      </div>
      {logoutError && (
        <p role="alert" className="mt-2 text-xs">
          {logoutError}
        </p>
      )}
    </div>
  )
}
