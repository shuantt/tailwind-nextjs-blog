'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { PRIVACY_VERSION } from '@/lib/guestbook/privacy'
import { MESSAGE_MAX_LENGTH } from '@/lib/guestbook/model'
import Link from '@/components/Link'
import Turnstile from './Turnstile'
import GuestbookComposer from './GuestbookComposer'
import { buttonClass, fieldClass, linkClass } from './styles'

export default function GuestbookForm({ article }: { article?: { title: string; path: string } }) {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [includeArticle, setIncludeArticle] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const requestId = useRef<string | null>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Remove the former opt-in name storage; drafts now stay in this form only.
    try {
      localStorage.removeItem('guestbook-name')
    } catch {
      /* Storage is optional. */
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    if (!email.trim() && !website.trim()) {
      setError('網址或 Email 請至少填寫一項。')
      statusRef.current?.focus()
      return
    }
    if (!turnstileToken) {
      setError('請先完成安全驗證。')
      statusRef.current?.focus()
      return
    }
    const fields = new FormData(form)
    setBusy(true)
    setError('')
    setSuccess('')
    requestId.current ||= crypto.randomUUID()
    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          name,
          website,
          email,
          message,
          visibility: 'public',
          company: fields.get('company'),
          source: includeArticle ? article?.path : undefined,
          requestId: requestId.current,
          contactConsent: consent,
          privacyVersion: PRIVACY_VERSION,
          turnstileToken,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setSuccess('留言已收到，審核後公開。謝謝你！')
      form.reset()
      setName('')
      setWebsite('')
      setEmail('')
      setMessage('')
      setConsent(false)
      requestId.current = null
    } catch (error) {
      setError(
        error instanceof Error && error.name !== 'TimeoutError'
          ? error.message
          : '暫時無法送出，請稍後重試。'
      )
    } finally {
      // Tokens are single-use, including after uncertain network responses.
      setTurnstileToken('')
      setVerificationAttempt((value) => value + 1)
      setBusy(false)
      requestAnimationFrame(() => statusRef.current?.focus())
    }
  }

  return (
    <GuestbookComposer busy={busy}>
      {(active) => (
        <form
          onSubmit={submit}
          onChange={() => {
            if (!busy) {
              requestId.current = null
              setSuccess('')
              setError('')
            }
          }}
          className="mt-6"
          aria-label="留下想和我說的話"
          aria-busy={busy}
        >
          <fieldset disabled={busy} className="space-y-4" aria-label="你的留言">
            <div className="grid grid-cols-2 gap-4">
              <label className="block min-w-0 text-sm font-medium" htmlFor="guest-name">
                暱稱
                <input
                  id="guest-name"
                  name="name"
                  placeholder="你的暱稱"
                  autoComplete="nickname"
                  required
                  maxLength={60}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block min-w-0 text-sm font-medium" htmlFor="guest-website">
                網址
                <input
                  id="guest-website"
                  name="website"
                  type="url"
                  placeholder="個人連結"
                  autoComplete="url"
                  maxLength={2048}
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  aria-describedby="contact-help"
                  className={fieldClass}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="guest-email">
                Email
                <input
                  id="guest-email"
                  name="email"
                  type="email"
                  placeholder="聯絡信箱"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-describedby="contact-help"
                  className={fieldClass}
                />
              </label>
              <p id="contact-help" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Email 不公開只做回應用途
              </p>
            </div>
            {article && includeArticle && (
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-l border-gray-300 pl-3 text-xs leading-5 dark:border-gray-700">
                <p className="min-w-0 break-words">關於：{article.title}</p>
                <button
                  type="button"
                  onClick={() => setIncludeArticle(false)}
                  className={linkClass + ' shrink-0'}
                >
                  移除文章連結
                </button>
              </div>
            )}
            <div>
              <label htmlFor="guest-message" className="text-sm font-medium">
                留言內容
              </label>
              <textarea
                id="guest-message"
                name="message"
                placeholder="輸入內容……"
                required
                maxLength={MESSAGE_MAX_LENGTH}
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                aria-describedby="message-limit"
                className={fieldClass + ' resize-y'}
              />
              <p
                id="message-limit"
                className="mt-2 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400"
              >
                {message.length.toLocaleString()} / {MESSAGE_MAX_LENGTH}
              </p>
            </div>
            <div className="hidden" aria-hidden="true">
              <label htmlFor="guest-company">Leave this field empty</label>
              <input id="guest-company" name="company" tabIndex={-1} autoComplete="off" />
            </div>
            <label htmlFor="guest-consent" className="flex items-center gap-2 text-xs leading-5">
              <input
                id="guest-consent"
                name="contactConsent"
                type="checkbox"
                required
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="shrink-0 rounded border-gray-400 text-primary-600 focus:ring-primary-600"
              />
              <span>
                同意
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  隱私權條款
                </Link>
                和公開留言內容
              </span>
            </label>
            {active && <Turnstile onToken={setTurnstileToken} resetKey={verificationAttempt} />}
            <button
              type="submit"
              disabled={!turnstileToken}
              className={buttonClass + ' w-full dark:!text-white'}
            >
              {busy ? '正在送出…' : '送出留言'}
            </button>
          </fieldset>
          <div
            ref={statusRef}
            tabIndex={-1}
            className="mt-3 rounded-lg empty:mt-0 focus:outline-none"
            aria-live="polite"
          >
            {success && (
              <p role="status" className="text-sm leading-6">
                {success}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm leading-6">
                {error}
              </p>
            )}
          </div>
        </form>
      )}
    </GuestbookComposer>
  )
}
