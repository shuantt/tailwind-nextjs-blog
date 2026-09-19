import { database } from '@/lib/guestbook/db'
import { parsePage, parseSubmission } from '@/lib/guestbook/model'
import type { AdminMessage } from '@/lib/guestbook/model'
import { failure, rateLimit, readBody, requireSameOrigin } from '@/lib/guestbook/security'
import { notifyOwner } from '@/lib/guestbook/mail'
import { verifyTurnstile } from '@/lib/guestbook/turnstile'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const page = parsePage(new URL(request.url).searchParams.get('page'))
    const sql = database()
    // Explicit projection: private fields must never enter a public response.
    const rows = await sql`
      SELECT id, name, website, message, created_at, reply, replied_at
      FROM guestbook_messages WHERE visibility = 'public' AND status = 'approved'
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

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const input = parseSubmission(await readBody(request))
    if (input.company) return Response.json({ ok: true })
    const sql = database()
    await rateLimit(request)
    await verifyTurnstile(input.turnstileToken)
    // Retrying an uncertain network response does not create a second message.
    const rows = await sql`
      INSERT INTO guestbook_messages (request_id, name, email, website, message, visibility, source, privacy_version, consented_at)
      VALUES (${input.requestId}, ${input.name}, ${input.email}, ${input.website}, ${input.message}, ${input.visibility}, ${input.source}, ${input.privacyVersion}, now())
      ON CONFLICT (request_id) DO NOTHING RETURNING *
    `
    if (rows.length) {
      const message = rows[0] as AdminMessage
      if (await notifyOwner(message)) {
        // Mail is supplementary: once saved, never ask the visitor to submit again.
        await sql`UPDATE guestbook_messages SET notification_sent = true WHERE id = ${message.id}`.catch(
          () => {}
        )
      }
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return failure(error)
  }
}
