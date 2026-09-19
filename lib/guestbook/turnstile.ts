import { GuestbookError } from './model'

export async function verifyTurnstile(token: string) {
  const secret = process.env.GUESTBOOK_TURNSTILE_SECRET_KEY
  const origin = process.env.GUESTBOOK_ORIGIN
  if (!secret || !origin) {
    throw new GuestbookError('安全驗證尚未設定。', 503)
  }
  let result: { success?: boolean; hostname?: string; action?: string }
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Verification unavailable')
    result = await response.json()
  } catch {
    throw new GuestbookError('驗證服務暫時無法連線，請重新驗證後再試。', 503)
  }
  if (
    result?.success !== true ||
    result.hostname !== new URL(origin).hostname ||
    result.action !== 'guestbook'
  ) {
    throw new GuestbookError('驗證未通過或已過期，請重新驗證後再送出。')
  }
}
