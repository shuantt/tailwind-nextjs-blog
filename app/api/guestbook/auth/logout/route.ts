import { NextResponse } from 'next/server'
import {
  cookieOptions,
  failure,
  oauthCookie,
  requireSameOrigin,
  sessionCookie,
} from '@/lib/guestbook/security'

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const response = NextResponse.json({ ok: true })
    response.cookies.set(sessionCookie, '', cookieOptions(0))
    response.cookies.set(oauthCookie, '', cookieOptions(0))
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    return failure(error)
  }
}
