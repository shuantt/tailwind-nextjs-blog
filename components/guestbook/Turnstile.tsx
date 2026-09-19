'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { linkClass } from './styles'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action: string
      theme: 'light' | 'dark'
      size: 'flexible'
      language: string
      'response-field': boolean
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
      'timeout-callback': () => void
    }
  ) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export default function Turnstile({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void
  resetKey: number
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const container = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const [ready, setReady] = useState(false)
  const [retry, setRetry] = useState(0)
  const [failed, setFailed] = useState(false)
  const [status, setStatus] = useState('正在載入安全驗證…')

  useEffect(() => {
    if (!siteKey || ready) return
    const timeout = setTimeout(
      () => setStatus('驗證載入較久，請確認網路或稍後重新整理頁面。'),
      15000
    )
    return () => clearTimeout(timeout)
  }, [siteKey, ready])

  useEffect(() => {
    const api = window.turnstile
    if (!ready || !api || !container.current || !siteKey) return
    let active = true
    onToken('')
    setFailed(false)
    setStatus('')
    const timeout = setTimeout(() => {
      if (active) {
        setStatus('驗證尚未完成，請重試。')
        setFailed(true)
      }
    }, 30000)
    const invalidate = (message: string) => {
      if (!active) return
      clearTimeout(timeout)
      onToken('')
      setFailed(true)
      setStatus(message)
    }
    let id: string | undefined
    try {
      id = api.render(container.current, {
        sitekey: siteKey,
        action: 'guestbook',
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        size: 'flexible',
        language: 'zh-tw',
        'response-field': false,
        callback: (token) => {
          if (!active) return
          clearTimeout(timeout)
          onToken(token)
          setStatus('')
          setFailed(false)
        },
        'expired-callback': () => invalidate('驗證已過期，請重新驗證。'),
        'error-callback': () => invalidate('驗證暫時無法完成，請重試。'),
        'timeout-callback': () => invalidate('驗證逾時，請重新驗證。'),
      })
    } catch {
      invalidate('驗證暫時無法完成，請重試。')
    }
    return () => {
      active = false
      clearTimeout(timeout)
      onToken('')
      if (id !== undefined) api.remove(id)
    }
  }, [ready, resolvedTheme, siteKey, onToken, resetKey, retry])

  return (
    <div className="space-y-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
      {siteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={() => setReady(true)}
            onError={() => {
              onToken('')
              setStatus('驗證載入失敗，請確認網路或稍後重新整理頁面。')
            }}
          />
          <div ref={container} className="min-h-16" />
          {status && <p role="status">{status}</p>}
          {ready && failed && (
            <button
              type="button"
              className={linkClass}
              onClick={() => setRetry((value) => value + 1)}
            >
              重新驗證
            </button>
          )}
        </>
      ) : (
        <p>安全驗證尚未設定。</p>
      )}
    </div>
  )
}
