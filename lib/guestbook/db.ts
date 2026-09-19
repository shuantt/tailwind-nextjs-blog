import { neon } from '@neondatabase/serverless'
import { GuestbookError } from './model'

export function database() {
  const url = process.env.GUESTBOOK_DATABASE_URL
  if (!url) throw new GuestbookError('留言板尚未開放。', 503)
  return neon(url)
}
