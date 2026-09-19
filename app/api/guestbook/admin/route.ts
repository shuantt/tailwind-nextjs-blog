import type { NextRequest } from 'next/server'
import { database } from '@/lib/guestbook/db'
import { GuestbookError, parsePage } from '@/lib/guestbook/model'
import { failure, readBody, requireAdmin, requireSameOrigin } from '@/lib/guestbook/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const page = parsePage(request.nextUrl.searchParams.get('page'))
    const filter = request.nextUrl.searchParams.get('filter') || 'all'
    if (!['all', 'pending', 'private', 'approved', 'hidden'].includes(filter))
      throw new GuestbookError('篩選條件無效。')
    const sql = database()
    const rows = await sql`
      SELECT id, name, email, website, message, visibility, status, source, reply, replied_at, created_at, notification_sent
      FROM guestbook_messages
      WHERE (${filter} = 'all' AND visibility = 'public')
        OR (${filter} = 'private' AND visibility = 'private')
        OR (${filter} <> 'private' AND visibility = 'public' AND status = ${filter})
      ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET ${page * 20}
    `
    return Response.json(
      { messages: rows.slice(0, 20), hasMore: rows.length > 20 },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    requireSameOrigin(request)
    const body = await readBody(request)
    if (
      !body ||
      typeof body !== 'object' ||
      typeof body.id !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(body.id)
    ) {
      throw new GuestbookError('留言編號無效。')
    }
    const sql = database()
    let rows
    if (body.action === 'delete') {
      rows = await sql`DELETE FROM guestbook_messages WHERE id = ${body.id} RETURNING id`
    } else if (body.action === 'approve') {
      rows =
        await sql`UPDATE guestbook_messages SET status = 'approved' WHERE id = ${body.id} AND visibility = 'public' RETURNING id`
    } else if (body.action === 'hide') {
      rows =
        await sql`UPDATE guestbook_messages SET status = 'hidden' WHERE id = ${body.id} AND visibility = 'public' RETURNING id`
    } else if (body.action === 'reply') {
      if (
        typeof body.reply !== 'string' ||
        body.reply.trim().length > 3000 ||
        body.reply.includes('\0')
      )
        throw new GuestbookError('回覆請控制在 3,000 字以內。')
      const reply = body.reply.trim() || null
      rows =
        await sql`UPDATE guestbook_messages SET reply = ${reply}, replied_at = CASE WHEN ${reply}::text IS NULL THEN NULL ELSE now() END WHERE id = ${body.id} AND visibility = 'public' RETURNING id`
    } else {
      throw new GuestbookError('操作無效。')
    }
    if (!rows.length) throw new GuestbookError('找不到留言，或這則私密訊息不允許此操作。', 409)
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return failure(error)
  }
}
