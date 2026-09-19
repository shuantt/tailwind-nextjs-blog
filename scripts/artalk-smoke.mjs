import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { runInNewContext } from 'node:vm'

// Isolated local data only; never load .env files or contact a hosted database.
const demo = process.argv.includes('--demo')
const port = demo ? 23366 : 23367
const base = `http://127.0.0.1:${port}`
const binary = path.resolve(
  'services/artalk/bin',
  process.platform === 'win32' ? 'artalk.exe' : 'artalk'
)
const resumeIndex = process.argv.indexOf('--resume-demo')
const resumeDirectory = resumeIndex >= 0 ? process.argv[resumeIndex + 1] : undefined
if (resumeIndex >= 0) {
  assert.ok(demo && resumeDirectory, '--resume-demo requires --demo and a temporary demo directory')
  assert.equal(path.dirname(path.resolve(resumeDirectory)), path.resolve(tmpdir()))
  assert.ok(path.basename(resumeDirectory).startsWith('shuantt-artalk-demo-'))
}
const directory = resumeDirectory || (await mkdtemp(path.join(tmpdir(), 'shuantt-artalk-demo-')))
const password = randomBytes(24).toString('base64url')
const hash = spawnSync(binary, ['--hash-password'], { input: password, encoding: 'utf8' })
assert.equal(hash.status, 0, hash.stderr)
const env = {
  SystemRoot: process.env.SystemRoot,
  TEMP: process.env.TEMP || tmpdir(),
  TMP: process.env.TMP || tmpdir(),
  PATH: process.env.PATH,
  PORT: String(port),
  ARTALK_LOCAL_DEMO: '1',
  ARTALK_DEMO_DIR: directory,
  ATK_APP_KEY: randomBytes(32).toString('hex'),
  ARTALK_ADMIN_EMAIL: 'owner@example.test',
  ARTALK_ADMIN_PASSWORD_HASH: hash.stdout.trim(),
  ARTALK_BLOCKED_WORDS: 'smoke-blocked-phrase',
}
let service
let output = ''
function start() {
  service = spawn(binary, [], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  service.stdout.on('data', (data) => {
    output += data
  })
  service.stderr.on('data', (data) => {
    output += data
  })
}
async function ready() {
  for (let index = 0; index < 100; index++) {
    if (service.exitCode !== null) throw new Error(output)
    try {
      const response = await fetch(`${base}/api/v2/version`)
      if (response.ok) return
    } catch {
      /* Wait for this local child to listen. */
    }
    await setTimeout(100)
  }
  throw new Error(`Service did not start: ${output}`)
}
async function stop() {
  if (service.exitCode !== null) return
  const ended = new Promise((resolve) => service.once('exit', resolve))
  service.kill()
  await ended
}
async function request(route, method = 'GET', data, token, cookie) {
  const response = await fetch(`${base}/api/v2${route}`, {
    method,
    headers: {
      Origin: 'http://localhost:3090',
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  })
  const body = await response.json().catch(() => ({}))
  return {
    status: response.status,
    body,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  }
}

start()
try {
  await ready()
  if (!resumeDirectory) {
    const login = await request('/user/access_token', 'POST', {
      email: 'owner@example.test',
      password,
    })
    assert.equal(login.status, 200, JSON.stringify(login.body))
    const token = login.body.token
    assert.ok(token)
    const page = {
      site_name: 'SHUANTT',
      page_key: '/posts/new-nextjs-blog',
      page_title: '本機示範文章',
    }
    const content = '這是本機示範留言。可以匿名聊天，也可以回覆其他讀者 😊'
    const created = await request('/comments', 'POST', {
      ...page,
      name: '示範讀者',
      email: 'reader@example.test',
      content,
    })
    assert.equal(created.status, 200, JSON.stringify(created.body))
    assert.equal(created.body.is_pending, false, 'ordinary comment should publish immediately')
    const id = created.body.id
    const query = `/comments?site_name=SHUANTT&limit=20&page_key=${encodeURIComponent(page.page_key)}`
    const denied = await request(`/comments/${id}`, 'DELETE')
    assert.equal(denied.status, 403)
    async function approve(comment) {
      const result = await request(
        `/comments/${comment.id}`,
        'PUT',
        {
          ...page,
          content: comment.content,
          rid: comment.rid || 0,
          is_pending: false,
          is_pinned: false,
          is_collapsed: false,
        },
        token
      )
      assert.equal(result.status, 200, JSON.stringify(result.body))
    }
    const listed = await request(query)
    assert.equal(
      JSON.stringify(listed.body).includes(content),
      true,
      `public comment missing: ${JSON.stringify(listed.body)}`
    )
    assert.equal(JSON.stringify(listed.body).includes('reader@example.test'), false, 'email leaked')
    const reply = await request('/comments', 'POST', {
      ...page,
      name: '另一位讀者',
      email: 'reply@example.test',
      rid: id,
      content: '路人也能接著回覆，這裡不需要先登入。',
    })
    assert.equal(reply.status, 200, JSON.stringify(reply.body))
    assert.equal(reply.body.is_pending, false, 'visitor reply should publish immediately')
    assert.equal(JSON.stringify((await request(query)).body).includes(reply.body.content), true)
    const adminReply = await request(
      '/comments',
      'POST',
      {
        ...page,
        name: 'Shuan',
        email: 'owner@example.test',
        rid: id,
        content: '歡迎！這則站主回覆也只存在本機測試資料中。',
      },
      token
    )
    assert.equal(adminReply.status, 200, JSON.stringify(adminReply.body))
    assert.equal(adminReply.body.is_pending, false)
    if (!demo) {
      assert.equal((await request('/user/status', 'GET', undefined, token)).body.is_login, true)
      assert.equal((await request('/user/status')).body.is_login, false)
      assert.equal(
        (await request('/user/status', 'GET', undefined, 'invalid-token')).body.is_login,
        false
      )
      assert.equal(
        (await request('/user/status?name=Shuan&email=owner%40example.test')).body.is_login,
        false,
        'an owner name/email must not establish a logged-in identity'
      )
      const setClosed = (closed) =>
        request(
          `/pages/${listed.body.page.id}`,
          'PUT',
          {
            site_name: page.site_name,
            key: page.page_key,
            title: page.page_title,
            admin_only: closed,
          },
          token
        )
      assert.equal((await setClosed(true)).status, 200)
      assert.equal((await request(query)).body.page.admin_only, true)
      assert.equal(
        (await request('/comments', 'POST', { ...page, name: '訪客', content: 'Closed page' }))
          .status,
        403
      )
      const otherPage = await request('/comments', 'POST', {
        ...page,
        page_key: '/posts/closure-scope-test',
        name: '訪客',
        content: 'Other pages still accept comments',
      })
      assert.equal(otherPage.status, 200, JSON.stringify(otherPage.body))
      assert.equal((await setClosed(false)).status, 200)
      const blocked = await request('/comments', 'POST', {
        ...page,
        name: '攔截測試',
        content: 'Contains smoke-blocked-phrase for the isolated filter test.',
      })
      assert.equal(blocked.status, 200, JSON.stringify(blocked.body))
      assert.equal(
        JSON.stringify((await request(query)).body).includes('smoke-blocked-phrase'),
        false,
        'keyword filter no longer hides blocked content'
      )
      const pending = await request(`${query}&scope=site&type=pending`, 'GET', undefined, token)
      assert.equal(JSON.stringify(pending.body).includes('smoke-blocked-phrase'), true)
      await approve(blocked.body)
      assert.equal(
        JSON.stringify((await request(query)).body).includes('smoke-blocked-phrase'),
        true
      )
      assert.equal(
        (await request(`/comments/${blocked.body.id}`, 'DELETE', undefined, token)).status,
        200
      )
      const emptyContact = {
        ...page,
        name: '同名訪客',
        email: '',
        link: '',
        content: '不留聯絡資料的留言',
      }
      const visitorA = await request('/comments', 'POST', emptyContact)
      const visitorB = await request('/comments', 'POST', {
        ...emptyContact,
        content: '另一個同名訪客',
      })
      assert.equal(visitorA.status, 200, JSON.stringify(visitorA.body))
      assert.equal(visitorB.status, 200, JSON.stringify(visitorB.body))
      assert.equal(visitorA.body.is_pending, false)
      assert.equal(visitorB.body.is_pending, false)
      assert.ok(visitorA.cookie)
      assert.ok(visitorB.cookie)
      assert.notEqual(visitorA.cookie, visitorB.cookie)
      const ownQuery = `${query}&scope=user&type=mine&name=${encodeURIComponent(emptyContact.name)}`
      const mineA = await request(ownQuery, 'GET', undefined, undefined, visitorA.cookie)
      const mineB = await request(ownQuery, 'GET', undefined, undefined, visitorB.cookie)
      const stranger = await request(ownQuery)
      assert.equal(mineA.body.count, 1, JSON.stringify(mineA.body))
      assert.equal(mineB.body.count, 1, JSON.stringify(mineB.body))
      assert.equal(stranger.body.count, 0, 'name alone exposed private notifications')
      assert.equal(JSON.stringify(mineA.body).includes(visitorB.body.content), false)
      const anonymousReply = await request(
        '/comments',
        'POST',
        { ...emptyContact, rid: id, content: '不留 Email 也能回覆' },
        undefined,
        visitorA.cookie
      )
      assert.equal(anonymousReply.status, 200, JSON.stringify(anonymousReply.body))
      assert.equal(anonymousReply.body.is_pending, false)
      const sameBrowser = await request(ownQuery, 'GET', undefined, undefined, visitorA.cookie)
      assert.equal(sameBrowser.body.count, 2, 'browser identity was not retained')
      const noAdmin = await request(
        `${query}&scope=site&type=pending`,
        'GET',
        undefined,
        undefined,
        visitorA.cookie
      )
      assert.equal(noAdmin.body.count, 0, 'visitor accessed admin moderation list')
      const markRead = await request(
        '/notifies/read',
        'POST',
        { name: emptyContact.name, email: '' },
        undefined,
        visitorA.cookie
      )
      assert.equal(markRead.status, 200, JSON.stringify(markRead.body))
      const badEmail = await request('/comments', 'POST', {
        ...emptyContact,
        email: 'not-an-email',
      })
      assert.equal(badEmail.status, 400)
      const sidebar = await fetch(`${base}/sidebar`)
      const html = await sidebar.text()
      assert.match(html, /<base href="\/sidebar\/"/)
      const script = html.match(/src="([^"]+\.js)"/)[1]
      const asset = await fetch(new URL(script, `${base}/sidebar/`))
      assert.equal(asset.status, 200, 'sidebar script missing')
      assert.match(asset.headers.get('content-type'), /javascript/)
      const entry = await (await fetch(`${base}/api/v2/owner/entry.js`)).text()
      const events = new Map()
      const redirects = []
      let storedUser = JSON.stringify({ token: 'isolated-browser-token' })
      const location = { hash: '#/comments', replace: (url) => redirects.push(url) }
      runInNewContext(entry, {
        localStorage: { getItem: () => storedUser },
        location,
        addEventListener: (name, handler) => events.set(name, handler),
      })
      assert.equal(redirects.length, 0, 'signed-in sidebar was redirected')
      storedUser = null
      events.get('storage')({ key: 'ArtalkUser' })
      assert.equal(redirects.pop(), '/api/v2/owner/login', 'cross-tab logout was ignored')
      events.get('focus')()
      assert.equal(redirects.pop(), '/api/v2/owner/login', 'resumed sidebar retained login')
      storedUser = '{invalid'
      events.get('storage')({ key: null })
      assert.equal(redirects.pop(), '/api/v2/owner/login', 'invalid identity retained login')
    }
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    )
    const form = new FormData()
    form.set('file', new Blob([png], { type: 'image/png' }), 'demo.png')
    const upload = await fetch(`${base}/api/v2/upload`, {
      method: 'POST',
      body: form,
      headers: { Origin: 'http://localhost:3090' },
    })
    assert.equal(upload.status, 200, await upload.clone().text())
    const image = await upload.json()
    const imagePath = new URL(image.public_url).pathname
    await stop()
    start()
    await ready()
    const restored = await fetch(`${base}${imagePath}`)
    assert.equal(restored.status, 200, 'image lost after restart')
    assert.deepEqual(Buffer.from(await restored.arrayBuffer()), png)
    assert.equal(
      JSON.stringify((await request(query)).body).includes(content),
      true,
      'comment lost after restart'
    )
    const deletion = await request(`/comments/${adminReply.body.id}`, 'DELETE', undefined, token)
    assert.equal(deletion.status, 200, JSON.stringify(deletion.body))
    console.log(
      'PASS: immediate public comments and replies, keyword filtering, optional contact fields, browser isolation, deletion authorization, sidebar assets, durable images and restart persistence.'
    )
  }
  if (demo) {
    console.log('Local Artalk preview ready on 127.0.0.1:23366 (isolated temporary database).')
    // Keep the child alive for browser review; credentials stay in this process.
    await new Promise((resolve) => {
      process.once('SIGINT', resolve)
      process.once('SIGTERM', resolve)
      service.once('exit', resolve)
    })
  }
} finally {
  await stop()
}
