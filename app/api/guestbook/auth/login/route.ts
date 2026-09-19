export function GET() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/api/v2/owner/login?next=guestbook',
      'Cache-Control': 'no-store',
    },
  })
}
