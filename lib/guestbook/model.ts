import { PRIVACY_VERSION } from './privacy'

export const MESSAGE_MAX_LENGTH = 800

export type Visibility = 'private' | 'public'
export type MessageStatus = 'pending' | 'approved' | 'hidden'

export type PublicMessage = {
  id: string
  name: string
  website: string | null
  message: string
  created_at: string
  reply: string | null
  replied_at: string | null
}

export type AdminMessage = PublicMessage & {
  email: string | null
  visibility: Visibility
  status: MessageStatus
  source: string | null
  notification_sent: boolean
}

export class GuestbookError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}

export function parseSubmission(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new GuestbookError('請確認表單內容後再試一次。')
  }
  const data = value as Record<string, unknown>
  if (data.contactConsent !== true || data.privacyVersion !== PRIVACY_VERSION) {
    throw new GuestbookError('請閱讀隱私權條款並勾選同意，再送出訊息。')
  }
  const field = (key: string, limit: number, required = false) => {
    const value = data[key]
    if (value !== undefined && typeof value !== 'string') {
      throw new GuestbookError('表單格式不正確，請重新填寫。')
    }
    const text = ((value as string) || '').trim()
    if ((required && !text) || text.length > limit || text.includes('\0')) {
      throw new GuestbookError('請確認暱稱與內容已填寫，且未超過字數限制。')
    }
    return text
  }
  // Missing consent must never default to public.
  if (data.visibility !== 'private' && data.visibility !== 'public') {
    throw new GuestbookError('請選擇訊息的公開方式。')
  }
  const name = field('name', 60, true)
  const message = field('message', MESSAGE_MAX_LENGTH, true)
  const email = field('email', 254, data.visibility === 'private')
  if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
    throw new GuestbookError('請填寫有效的 Email，讓我能回覆你。')
  }
  const website = field('website', 2048)
  if (website) {
    try {
      const url = new URL(website)
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        /\s/.test(website)
      ) {
        throw new Error('Invalid website')
      }
    } catch {
      throw new GuestbookError('請填寫完整的網站網址（https://…）。')
    }
  }
  if (!email && !website) throw new GuestbookError('網址或 Email 請至少填寫一項。')
  const source = field('source', 250)
  if (source && !/^\/posts\/[a-z0-9-]+$/.test(source)) {
    throw new GuestbookError('文章連結無效，請移除文章連結後再試。')
  }
  const requestId = field('requestId', 36, true)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new GuestbookError('請重新整理頁面後再送出。')
  }
  return {
    name,
    message,
    email: email || null,
    visibility: data.visibility as Visibility,
    source: source || null,
    requestId,
    website: website || null,
    company: field('company', 500),
    turnstileToken: field('turnstileToken', 2048, true),
    privacyVersion: PRIVACY_VERSION,
  }
}

export function parsePage(value: string | null) {
  const page = Number(value || '0')
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) {
    throw new GuestbookError('頁碼無效。')
  }
  return page
}

export function replyEmailUrl(email: string) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Re: 你在 SHUANTT 的留言')}`
}
