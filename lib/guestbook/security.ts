import { createHmac } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { database } from './db'
import { GuestbookError } from './model'

export const sessionCookie = 'guestbook-admin'
export const oauthCookie = 'guestbook-oauth'

function secret() {
  const value = process.env.GUESTBOOK_SESSION_SECRET
  if (!value || value.length < 32) throw new GuestbookError('管理登入尚未設定完成。', 503)
  return value
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export async function requireAdmin(request: NextRequest) {
  const authorization = request.headers.get('authorization') || ''
  if (
    !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization) ||
    authorization.length > 4096
  ) {
    throw new GuestbookError('請先以站主的 GitHub 帳號登入。', 401)
  }
  // Never forward a credential to an origin supplied by request headers or query parameters.
  let origin = 'http://127.0.0.1:23366'
  if (process.env.VERCEL) {
    const configured = process.env.GUESTBOOK_ORIGIN
    if (!configured) throw new GuestbookError('管理登入尚未設定完成。', 503)
    const url = new URL(configured)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new GuestbookError('管理登入設定無效。', 503)
    }
    origin = url.origin
  }
  const response = await fetch(`${origin}/api/v2/owner/session`, {
    headers: { Authorization: authorization },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  })
  if (response.status === 401 || response.status === 403) {
    throw new GuestbookError('請先以站主的 GitHub 帳號登入。', 401)
  }
  if (!response.ok) throw new GuestbookError('暫時無法確認登入狀態。', 503)
  const session = await response.json()
  if (session.is_owner !== true) throw new GuestbookError('請先以站主的 GitHub 帳號登入。', 401)
}

export function requireSameOrigin(request: Request) {
  const expected = process.env.GUESTBOOK_ORIGIN
  const origin = request.headers.get('origin')
  const allowed = expected ? new URL(expected).origin : new URL(request.url).origin
  if (!origin || origin !== allowed) throw new GuestbookError('請從本站送出表單。', 403)
}

export async function rateLimit(request: Request) {
  const salt = secret()
  // Vercel overwrites x-vercel-forwarded-for; do not trust client-supplied XFF.
  const ip =
    process.env.VERCEL === '1'
      ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      : 'local'
  const key = createHmac('sha256', salt).update(`submission:${ip}`).digest('hex')
  const sql = database()
  const rows = await sql`
    INSERT INTO guestbook_rate_limits (key, hits, expires_at)
    VALUES (${key}, 1, now() + interval '15 minutes')
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN guestbook_rate_limits.expires_at <= now() THEN 1 ELSE guestbook_rate_limits.hits + 1 END,
      expires_at = CASE WHEN guestbook_rate_limits.expires_at <= now() THEN now() + interval '15 minutes' ELSE guestbook_rate_limits.expires_at END
    RETURNING hits
  `
  if (Number(rows[0].hits) > 5) throw new GuestbookError('送出太頻繁了，請等 15 分鐘後再試。', 429)
  await sql`DELETE FROM guestbook_rate_limits WHERE expires_at < now() - interval '1 day'`
}

export async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new GuestbookError('表單格式不正確。', 415)
  }
  const reader = request.body?.getReader()
  if (!reader) throw new GuestbookError('表單內容為空。')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 24000) {
      await reader.cancel()
      throw new GuestbookError('內容太長，請縮短後再送出。', 413)
    }
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new GuestbookError('表單格式不正確。')
  }
}

export function failure(error: unknown) {
  // Do not log SQL errors, connection strings, email addresses, or message bodies.
  const known = error instanceof GuestbookError
  return Response.json(
    { error: known ? error.message : '暫時無法完成操作，請稍後重試。' },
    {
      status: known ? error.status : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
