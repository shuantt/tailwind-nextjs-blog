'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import type Artalk from 'artalk'
import siteMetadata from '@/data/siteMetadata'

export default function Comments({ slug }: { slug: string }) {
  const container = useRef<HTMLDivElement>(null)
  const instance = useRef<Artalk | null>(null)
  const { resolvedTheme } = useTheme()
  const dark = useRef(resolvedTheme === 'dark')
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    dark.current = resolvedTheme === 'dark'
    instance.current?.setDarkMode(dark.current)
  }, [resolvedTheme])

  useEffect(() => {
    const logout = () => {
      const comments = instance.current
      if (!comments) return
      // Drop the in-memory token before rebuilding the editor and its admin controls.
      comments.ctx.getUser().update({ name: '', email: '', link: '', token: '', is_admin: false })
      setAttempt((value) => value + 1)
    }
    const stored = (event: StorageEvent) => {
      if (event.key && event.key !== 'ArtalkUser') return
      if (!instance.current?.ctx.getUser().getData().token) return
      try {
        if (JSON.parse(localStorage.getItem('ArtalkUser') || '{}')?.token) return
      } catch {
        // Invalid browser data cannot preserve an authenticated editor.
      }
      logout()
    }
    window.addEventListener('artalk-logout', logout)
    window.addEventListener('storage', stored)
    return () => {
      window.removeEventListener('artalk-logout', logout)
      window.removeEventListener('storage', stored)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let placeholderObserver: MutationObserver | undefined
    const controller = new AbortController()
    setStatus('loading')

    async function mount() {
      try {
        const [response, { default: Artalk }, { default: zhTW }] = await Promise.all([
          fetch('/api/v2/conf', { signal: controller.signal }),
          import('artalk'),
          import('artalk/i18n/zh-TW'),
        ])
        if (!response.ok) throw new Error('Comments unavailable')
        const conf = await response.json()
        if (!conf.frontend_conf) throw new Error('Invalid comment service')
        if (cancelled || !container.current) return

        instance.current = Artalk.init({
          el: container.current,
          server: window.location.origin,
          site: siteMetadata.comments.site,
          pageKey: `/posts/${slug}`,
          pageTitle: document.title.replace(/ \| SHUANTT$/, ''),
          locale: { ...zhTW, onlyAdminCanReply: '本篇評論功能已關閉' },
          darkMode: dark.current,
          // Keep replies threaded even below Artalk's automatic mobile breakpoint.
          flatMode: false,
          placeholder: '輸入內容……',
          noComment: '還沒有留言，來聊聊吧。',
          sendBtn: '送出留言',
          uaBadge: false,
          versionCheck: false,
          reqTimeout: 60000,
          imgLazyLoad: 'native',
          // Use native emoji without fetching a third-party sticker collection.
          emoticons: [
            {
              name: 'Emoji',
              type: 'emoji',
              items: [
                '😀',
                '😊',
                '😂',
                '🥹',
                '🤔',
                '😍',
                '🥳',
                '😎',
                '👍',
                '👏',
                '🙏',
                '❤️',
                '🔥',
                '🎉',
              ].map((emoji) => ({ key: emoji, val: emoji })),
            },
          ],
          avatarURLBuilder: (comment) =>
            (comment as typeof comment & { avatar_url?: string }).avatar_url ||
            '/static/images/comment-avatar.svg',
        })
        const comments = instance.current
        const user = comments.ctx.getUser()
        comments.on('comment-rendered', (comment) => {
          const data = comment.getData() as ReturnType<typeof comment.getData> & {
            avatar_url?: string
          }
          if (!data.avatar_url) return
          // The server supplies this field only for the authenticated GitHub owner.
          const element = comment.getEl()
          element.classList.add('comment-owner')
          element
            .querySelectorAll<HTMLAnchorElement>('.atk-avatar > a, .atk-nick > a')
            .forEach((link) => {
              link.href = '/about'
              link.removeAttribute('target')
              link.removeAttribute('rel')
            })
          const avatar = element.querySelector<HTMLImageElement>('.atk-avatar img')
          if (avatar) avatar.alt = comment.getData().nick
        })
        comments.on('user-changed', () => window.dispatchEvent(new Event('artalk-user-changed')))
        user.checkHasBasicUserInfo = () => Boolean(user.getData().name.trim())
        const arrangeFields = () => {
          const fields = comments.ctx.inject('editor').getHeaderInputEls()
          const header = fields.name.parentElement?.closest('.atk-header')
          if (!header) return
          const labels = { name: '暱稱', link: '網址（選填）', email: '郵件地址（選填）' }
          const placeholders = {
            name: '輸入暱稱',
            link: 'https://example.com',
            email: '留下 Email，方便接收回覆通知',
          }
          for (const field of ['name', 'link', 'email'] as const) {
            const input = fields[field]
            input.required = field === 'name'
            if (input.placeholder !== placeholders[field]) {
              input.placeholder = placeholders[field]
            }
            if (input.closest('.comment-field')) continue
            const label = document.createElement('label')
            label.className = `comment-field comment-field-${field}`
            const title = document.createElement('span')
            title.textContent = labels[field]
            label.append(title, input)
            header.append(label)
          }
        }
        comments.on('mounted', arrangeFields)
        comments.on('updated', arrangeFields)
        arrangeFields()
        // Artalk can restore defaults asynchronously when its editor plugins remount.
        placeholderObserver = new MutationObserver(arrangeFields)
        placeholderObserver.observe(comments.ctx.inject('editor').getEl(), {
          subtree: true,
          attributes: true,
          attributeFilter: ['placeholder'],
        })
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void mount()
    return () => {
      cancelled = true
      controller.abort()
      placeholderObserver?.disconnect()
      instance.current?.destroy()
      instance.current = null
    }
  }, [slug, attempt])

  return (
    <section className="not-prose w-full" aria-label="文章留言">
      {status === 'loading' && (
        <p role="status" className="py-6 text-sm text-gray-500 dark:text-gray-400">
          留言載入中…
        </p>
      )}
      {status === 'error' && (
        <p role="status" className="py-6 text-sm text-gray-600 dark:text-gray-400">
          留言暫時無法載入。
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="ml-2 text-primary-600 underline underline-offset-4 dark:text-primary-400"
          >
            再試一次
          </button>
        </p>
      )}
      <div ref={container} className="blog-comments" />
    </section>
  )
}
