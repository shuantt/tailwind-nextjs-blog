import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { after, beforeEach, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { build } from 'esbuild'
import { PGlite } from '@electric-sql/pglite'

const require = createRequire(import.meta.url)
const { NextRequest } = require('next/server')
const db = new PGlite()
await db.exec(await readFile(new URL('../db/guestbook.sql', import.meta.url), 'utf8'))
const result = await build({
  stdin: {
    contents: `
      export * as model from './lib/guestbook/model'
      export * as security from './lib/guestbook/security'
      export * as publicRoute from './app/api/guestbook/route'
      export * as adminRoute from './app/api/guestbook/admin/route'
      export * as loginRoute from './app/api/guestbook/auth/login/route'
      export * as callbackRoute from './app/api/guestbook/auth/callback/route'
      export * as logoutRoute from './app/api/guestbook/auth/logout/route'
    `,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  plugins: [
    {
      name: 'isolated-guestbook-integrations',
      setup(builder) {
        builder.onLoad({ filter: /lib[\\/]guestbook[\\/]db\.ts$/ }, () => ({
          contents: 'export function database() { return globalThis.testSql }',
          loader: 'ts',
        }))
        builder.onLoad({ filter: /lib[\\/]guestbook[\\/]mail\.ts$/ }, () => ({
          contents:
            'export async function notifyOwner() { globalThis.mailAttempts++; return false }',
          loader: 'ts',
        }))
      },
    },
  ],
})
const sandbox = {
  module: { exports: {} },
  require,
  Buffer,
  Request,
  Response,
  URL,
  URLSearchParams,
  AbortSignal,
  process: {
    env: {
      NODE_ENV: 'test',
      GUESTBOOK_ORIGIN: 'http://localhost:3000',
      GUESTBOOK_SESSION_SECRET: 'test-only-secret-not-for-production-123456',
      GUESTBOOK_TURNSTILE_SECRET_KEY: 'test-only-turnstile-secret',
    },
  },
  mailAttempts: 0,
  fetch: async () => {
    throw new Error('Unexpected external network request')
  },
  testSql: async (strings, ...parameters) => {
    const query = strings.reduce(
      (text, part, index) => text + (index ? `$${index}` : '') + part,
      ''
    )
    return (await db.query(query, parameters)).rows
  },
}
vm.runInNewContext(result.outputFiles[0].text, sandbox)
const { model, publicRoute, adminRoute, loginRoute, callbackRoute, logoutRoute } =
  sandbox.module.exports
const origin = 'http://localhost:3000'
const input = (overrides = {}) => ({
  name: '測試訪客',
  email: 'visitor@example.test',
  message: 'hello <script>alert(1)</script>',
  visibility: 'private',
  requestId: randomUUID(),
  contactConsent: true,
  privacyVersion: '2026-09-19-public-guestbook',
  turnstileToken: 'test-only-token',
  ...overrides,
})
const adminAuthorization = 'Bearer test.owner.signature'
function request(path, body, admin = false, requestOrigin = origin) {
  return new NextRequest(`${origin}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Origin: requestOrigin,
      ...(admin ? { Authorization: adminAuthorization } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}
async function submit(value) {
  const response = await publicRoute.POST(request('/api/guestbook', value))
  assert.equal(response.status, 200, JSON.stringify(await response.json()))
  return (
    await db.query('SELECT * FROM guestbook_messages WHERE request_id = $1', [value.requestId])
  ).rows[0]
}
beforeEach(async () => {
  await db.exec('TRUNCATE guestbook_messages, guestbook_rate_limits')
  sandbox.mailAttempts = 0
  sandbox.process.env.GUESTBOOK_TURNSTILE_SECRET_KEY = 'test-only-turnstile-secret'
  sandbox.fetch = async (url, options) => {
    if (url === 'http://127.0.0.1:23366/api/v2/owner/session') {
      assert.equal(options.headers.Authorization, adminAuthorization)
      assert.equal(options.cache, 'no-store')
      assert.equal(options.redirect, 'error')
      return Response.json({ is_owner: true })
    }
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify')
    assert.equal(options.body.get('secret'), 'test-only-turnstile-secret')
    assert.ok(options.body.get('response'))
    assert.deepEqual([...options.body.keys()].sort(), ['response', 'secret'])
    return Response.json({ success: true, hostname: 'localhost', action: 'guestbook' })
  }
})
after(async () => {
  await db.close()
})

test('explicit consent, private email, source and payload validation', () => {
  for (const contactConsent of [undefined, false, 'true', 1]) {
    assert.throws(() => model.parseSubmission(input({ contactConsent })))
  }
  assert.throws(() => model.parseSubmission(input({ privacyVersion: 'old-version' })))
  assert.throws(() => model.parseSubmission(input({ turnstileToken: '' })))
  assert.throws(() => model.parseSubmission(input({ turnstileToken: 'x'.repeat(2049) })))
  assert.throws(() => model.parseSubmission(input({ visibility: undefined })))
  assert.throws(() => model.parseSubmission(input({ visibility: 'public-ish' })))
  assert.throws(() => model.parseSubmission(input({ email: '' })))
  assert.throws(() => model.parseSubmission(input({ source: '//evil.example' })))
  assert.equal(model.parseSubmission(input({ message: '字'.repeat(800) })).message.length, 800)
  assert.throws(() => model.parseSubmission(input({ message: '字'.repeat(801) })))
  assert.throws(() =>
    model.parseSubmission(input({ email: 'x@example.test\r\nBcc:evil@example.test' }))
  )
  assert.throws(() =>
    model.parseSubmission(input({ visibility: 'public', email: '', website: '' }))
  )
  assert.equal(
    model.parseSubmission(
      input({ visibility: 'public', email: '', website: 'https://example.test' })
    ).email,
    null
  )
  for (const website of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'https://user:password@example.test',
    'not-a-url',
    'https://example.test/\nmalicious',
  ]) {
    assert.throws(() => model.parseSubmission(input({ website })))
  }
})

test('website-only and email-only submissions are saved; empty contact is rejected', async () => {
  const website = 'https://example.test/about'
  const row = await submit(input({ visibility: 'public', email: '', website }))
  assert.equal(row.website, website)
  assert.equal(row.email, null)
  const adminRows = (
    await (await adminRoute.GET(request('/api/guestbook/admin', undefined, true))).json()
  ).messages
  assert.equal(adminRows[0].website, website)
  const emailOnly = await submit(input({ visibility: 'public', website: '' }))
  assert.equal(emailOnly.website, null)
  assert.equal(emailOnly.email, 'visitor@example.test')
  const response = await publicRoute.POST(
    request('/api/guestbook', input({ visibility: 'public', email: '', website: '' }))
  )
  assert.equal(response.status, 400)
  await db.query("UPDATE guestbook_messages SET status = 'approved' WHERE id = $1", [row.id])
  const publicRows = (await (await publicRoute.GET(request('/api/guestbook'))).json()).messages
  assert.equal(publicRows[0].website, website)
  assert.equal(Object.hasOwn(publicRows[0], 'email'), false)
})

test('public API exposes only approved public messages, never email or private source', async () => {
  const privateMessage = await submit(input())
  const pending = await submit(input({ visibility: 'public' }))
  let response = await publicRoute.GET(request('/api/guestbook'))
  assert.deepEqual((await response.json()).messages, [])
  assert.equal(
    (
      await adminRoute.POST(
        request('/api/guestbook/admin', { id: privateMessage.id, action: 'approve' }, true)
      )
    ).status,
    409
  )
  assert.equal(
    (
      await adminRoute.POST(
        request('/api/guestbook/admin', { id: pending.id, action: 'approve' }, true)
      )
    ).status,
    200
  )
  response = await publicRoute.GET(request('/api/guestbook'))
  const rows = (await response.json()).messages
  assert.equal(rows.length, 1)
  assert.equal(rows[0].id, pending.id)
  assert.deepEqual(Object.keys(rows[0]).sort(), [
    'created_at',
    'id',
    'message',
    'name',
    'replied_at',
    'reply',
    'website',
  ])
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
})

test('database enforces immutable consent even outside application routes', async () => {
  const row = await submit(input())
  await assert.rejects(
    db.query("UPDATE guestbook_messages SET visibility = 'public' WHERE id = $1", [row.id])
  )
  await assert.rejects(
    db.query("UPDATE guestbook_messages SET status = 'approved' WHERE id = $1", [row.id])
  )
  await assert.rejects(
    db.query("UPDATE guestbook_messages SET reply = 'public reply' WHERE id = $1", [row.id])
  )
})

test('management requires signed owner identity and same-origin mutations', async () => {
  const row = await submit(input({ visibility: 'public' }))
  assert.equal((await adminRoute.GET(request('/api/guestbook/admin'))).status, 401)
  assert.equal(
    (await adminRoute.POST(request('/api/guestbook/admin', { id: row.id, action: 'delete' })))
      .status,
    401
  )
  assert.equal(
    (
      await adminRoute.POST(
        request(
          '/api/guestbook/admin',
          { id: row.id, action: 'delete' },
          true,
          'https://evil.example'
        )
      )
    ).status,
    403
  )
  assert.equal(
    (await publicRoute.POST(request('/api/guestbook', input(), false, 'https://evil.example')))
      .status,
    403
  )
  for (const verdict of [{ is_admin: true }, { is_owner: 'true' }, { is_owner: false }]) {
    sandbox.fetch = async () => Response.json(verdict)
    assert.equal(
      (await adminRoute.GET(request('/api/guestbook/admin', undefined, true))).status,
      401
    )
  }
  sandbox.fetch = async () => new Response(null, { status: 401 })
  assert.equal((await adminRoute.GET(request('/api/guestbook/admin', undefined, true))).status, 401)
  const oldCookie = new NextRequest(`${origin}/api/guestbook/admin`, {
    headers: { Cookie: 'guestbook-admin=old-signed-session' },
  })
  assert.equal((await adminRoute.GET(oldCookie)).status, 401)
})

test('reply visibility follows moderation; hide and delete remove public content', async () => {
  const row = await submit(input({ visibility: 'public' }))
  const action = (action, reply) =>
    adminRoute.POST(request('/api/guestbook/admin', { id: row.id, action, reply }, true))
  assert.equal((await action('reply', '謝謝留言')).status, 200)
  assert.equal((await (await publicRoute.GET(request('/api/guestbook'))).json()).messages.length, 0)
  await action('approve')
  assert.equal(
    (await (await publicRoute.GET(request('/api/guestbook'))).json()).messages[0].reply,
    '謝謝留言'
  )
  await action('hide')
  assert.equal((await (await publicRoute.GET(request('/api/guestbook'))).json()).messages.length, 0)
  await action('delete')
  assert.equal((await db.query('SELECT count(*) FROM guestbook_messages')).rows[0].count, 0)
})

test('failed mail still stores messages; uncertain retries are idempotent', async () => {
  const value = input()
  const row = await submit(value)
  assert.equal(row.notification_sent, false)
  assert.equal(row.privacy_version, '2026-09-19-public-guestbook')
  assert.ok(row.consented_at)
  assert.equal(Object.hasOwn(row, 'turnstileToken'), false)
  await submit(value)
  assert.equal((await db.query('SELECT count(*) FROM guestbook_messages')).rows[0].count, 1)
  assert.equal(sandbox.mailAttempts, 1)
})

test('missing or outdated consent cannot be bypassed through direct API requests', async () => {
  for (const override of [
    { contactConsent: false },
    { contactConsent: 'true' },
    { privacyVersion: 'old' },
    { turnstileToken: '' },
  ]) {
    assert.equal((await publicRoute.POST(request('/api/guestbook', input(override)))).status, 400)
  }
  assert.equal((await db.query('SELECT count(*) FROM guestbook_messages')).rows[0].count, 0)
  assert.equal(sandbox.mailAttempts, 0)
})

test('Turnstile rejects failed, replayed, wrong-host and wrong-action tokens before storing', async () => {
  for (const verdict of [
    { success: false, 'error-codes': ['invalid-input-response'] },
    { success: false, 'error-codes': ['timeout-or-duplicate'] },
    { success: true, hostname: 'evil.example', action: 'guestbook' },
    { success: true, hostname: 'localhost', action: 'login' },
    { success: 'true', hostname: 'localhost', action: 'guestbook' },
  ]) {
    sandbox.fetch = async () => Response.json(verdict)
    assert.equal((await publicRoute.POST(request('/api/guestbook', input()))).status, 400)
  }
  assert.equal((await db.query('SELECT count(*) FROM guestbook_messages')).rows[0].count, 0)
  assert.equal(sandbox.mailAttempts, 0)
})

test('missing Turnstile configuration and service errors fail closed', async () => {
  delete sandbox.process.env.GUESTBOOK_TURNSTILE_SECRET_KEY
  assert.equal((await publicRoute.POST(request('/api/guestbook', input()))).status, 503)
  sandbox.process.env.GUESTBOOK_TURNSTILE_SECRET_KEY = 'test-only-turnstile-secret'
  sandbox.fetch = async () => {
    throw new Error('network timeout')
  }
  assert.equal((await publicRoute.POST(request('/api/guestbook', input()))).status, 503)
  sandbox.fetch = async () => new Response('unavailable', { status: 503 })
  assert.equal((await publicRoute.POST(request('/api/guestbook', input()))).status, 503)
  assert.equal((await db.query('SELECT count(*) FROM guestbook_messages')).rows[0].count, 0)
  assert.equal(sandbox.mailAttempts, 0)
})

test('schema upgrades preserve historical messages without inventing consent', async () => {
  const id = randomUUID()
  await db.query(
    `INSERT INTO guestbook_messages (request_id, name, message, visibility)
     VALUES ($1, '歷史留言', 'hello', 'public')`,
    [id]
  )
  await db.exec(await readFile(new URL('../db/guestbook.sql', import.meta.url), 'utf8'))
  const row = (await db.query('SELECT * FROM guestbook_messages WHERE request_id = $1', [id]))
    .rows[0]
  assert.equal(row.privacy_version, null)
  assert.equal(row.consented_at, null)
  assert.equal(row.message, 'hello')
})

test('durable rate limits and honeypot block abuse', async () => {
  for (let index = 0; index < 5; index++) await submit(input())
  assert.equal((await publicRoute.POST(request('/api/guestbook', input()))).status, 429)
  assert.equal(
    (await publicRoute.POST(request('/api/guestbook', input({ company: 'spam' })))).status,
    200
  )
  assert.equal((await db.query('SELECT count(*) FROM guestbook_messages')).rows[0].count, 5)
})

test('body size is bounded before JSON processing', async () => {
  const response = await publicRoute.POST(request('/api/guestbook', { message: 'a'.repeat(25000) }))
  assert.equal(response.status, 413)
})

test('reply links encode visitor-controlled email without adding recipients', () => {
  const email = 'hello?bcc=other%40example.test&x=@example.com'
  const url = new URL(model.replyEmailUrl(email))
  assert.equal(decodeURIComponent(url.pathname), email)
  assert.equal(url.searchParams.get('bcc'), null)
  assert.equal(url.searchParams.size, 1)
  assert.equal(url.searchParams.get('subject'), 'Re: 你在 SHUANTT 的留言')
})

test('old OAuth entrypoints use the common owner login and cannot mint sessions', async () => {
  const login = await loginRoute.GET()
  assert.equal(login.headers.get('Location'), '/api/v2/owner/login?next=guestbook')
  const callback = await callbackRoute.GET()
  assert.equal(callback.headers.get('Location'), login.headers.get('Location'))
  assert.equal(callback.headers.get('Set-Cookie'), null)
  const logout = await logoutRoute.POST(request('/api/guestbook/auth/logout', {}))
  assert.equal(logout.status, 200)
  assert.ok(logout.headers.get('Set-Cookie').includes('guestbook-admin=;'))
  assert.ok(logout.headers.get('Set-Cookie').includes('Max-Age=0'))
  assert.equal(
    (
      await logoutRoute.POST(
        request('/api/guestbook/auth/logout', {}, false, 'https://evil.example')
      )
    ).status,
    403
  )
})

test('owner verification fails closed and never uses caller-controlled origins', async () => {
  sandbox.process.env.VERCEL = '1'
  const configured = sandbox.process.env.GUESTBOOK_ORIGIN
  try {
    delete sandbox.process.env.GUESTBOOK_ORIGIN
    assert.equal(
      (await adminRoute.GET(request('/api/guestbook/admin', undefined, true))).status,
      503
    )
    sandbox.process.env.GUESTBOOK_ORIGIN = 'https://trusted.example.test'
    sandbox.fetch = async (url, options) => {
      assert.equal(url, 'https://trusted.example.test/api/v2/owner/session')
      assert.equal(options.redirect, 'error')
      return Response.json({ is_owner: true })
    }
    const maliciousHost = new NextRequest('https://evil.example/api/guestbook/admin', {
      headers: {
        Authorization: adminAuthorization,
        Host: 'evil.example',
        'X-Forwarded-Host': 'evil.example',
      },
    })
    assert.equal((await adminRoute.GET(maliciousHost)).status, 200)
    for (const status of [302, 500, 503]) {
      sandbox.fetch = async () => new Response(null, { status })
      assert.equal((await adminRoute.GET(maliciousHost)).status, 503)
    }
    sandbox.fetch = async () => {
      throw new Error('timeout')
    }
    assert.equal((await adminRoute.GET(maliciousHost)).status, 503)
  } finally {
    delete sandbox.process.env.VERCEL
    sandbox.process.env.GUESTBOOK_ORIGIN = configured
  }
})
