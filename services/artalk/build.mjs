import { createHash } from 'node:crypto'
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = path.dirname(fileURLToPath(import.meta.url))
const work = path.join(root, '.upstream')
const source = path.join(work, 'Artalk-2.10.0')

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, CGO_ENABLED: '0' },
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`)
}

async function download(url, name, checksum) {
  const destination = path.join(work, name)
  let data = await readFile(destination).catch(() => null)
  if (!data || createHash('sha256').update(data).digest('hex') !== checksum) {
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) })
    if (!response.ok) throw new Error(`Download failed: ${name}`)
    data = Buffer.from(await response.arrayBuffer())
  }
  if (createHash('sha256').update(data).digest('hex') !== checksum) {
    throw new Error(`Checksum mismatch: ${name}`)
  }
  await writeFile(destination, data)
  run('tar', ['-xzf', destination, '-C', work])
}

await mkdir(work, { recursive: true })
await download(
  'https://codeload.github.com/ArtalkJS/Artalk/tar.gz/refs/tags/v2.10.0',
  'source.tar.gz',
  '08d8686f5b5d8191693d612bf8d8e75d6d71790e465328889edcf641daa07171'
)
await download(
  'https://github.com/ArtalkJS/Artalk/releases/download/v2.10.0/artalk_ui.tar.gz',
  'ui.tar.gz',
  '6e6b5456a3265e29cecb36b7d935dbafb6639035e2681901123b6b150e307379'
)
await cp(path.join(work, 'artalk_ui'), path.join(source, 'public'), { recursive: true })
await copyFile(path.join(root, 'main.go'), path.join(source, 'main.go'))
await copyFile(path.join(root, 'main_test.go'), path.join(source, 'main_test.go'))
await copyFile(path.join(root, 'upload.go'), path.join(source, 'server/handler/upload.go'))
await copyFile(
  path.join(root, 'upload_test.go'),
  path.join(source, 'server/handler/upload_storage_test.go')
)
await copyFile(path.join(root, 'config.yml'), path.join(source, 'conf/shuantt.yml'))
await copyFile(path.join(root, 'state.go'), path.join(source, 'server/common/sql_state.go'))
await copyFile(path.join(root, 'anonymous.go'), path.join(source, 'server/common/browser_user.go'))
await copyFile(path.join(root, 'owner.go'), path.join(source, 'server/common/owner.go'))
await copyFile(path.join(root, 'owner_test.go'), path.join(source, 'server/common/owner_test.go'))
await copyFile(
  path.join(root, 'owner_login.go'),
  path.join(source, 'server/handler/auth_social_login.go')
)
await copyFile(
  path.join(root, 'owner_login_test.go'),
  path.join(source, 'server/handler/owner_login_test.go')
)
await copyFile(
  path.join(root, 'state_test.go'),
  path.join(source, 'server/common/sql_state_test.go')
)

await copyFile(
  path.join(root, 'turnstile_test.go'),
  path.join(source, 'internal/captcha/turnstile_integration_test.go')
)

// Keep the original core; these small, checked patches adapt request lifetimes and storage.
async function replace(relative, before, after) {
  const file = path.join(source, relative)
  const content = await readFile(file, 'utf8')
  if (content.split(before).length !== 2) throw new Error(`Upstream patch mismatch: ${relative}`)
  await writeFile(file, content.replace(before, after))
}
// Next.js removes trailing slashes; anchor relative sidebar assets and API URLs explicitly.
// Public avatar data is written only by the verified owner OAuth callback.
await replace(
  'internal/entity/user.go',
  '\tLink           string',
  '\tAvatarURL      string\n\tLink           string'
)
await replace(
  'internal/entity/comment_cooked.go',
  'type CookedComment struct {',
  'type CookedComment struct {\n\tAvatarURL string `json:"avatar_url,omitempty"`'
)
await replace(
  'internal/dao/cook.go',
  '\t\tNick:           user.Name,',
  '\t\tNick:           user.Name,\n\t\tAvatarURL:      user.AvatarURL,'
)
await replace(
  'public/sidebar/index.html',
  '<head>',
  '<head>\n    <base href="/sidebar/" />\n    <script src="/api/v2/owner/entry.js"></script>'
)
await replace('server/server.go', '\th.UserLogin(app, api)', '\th.OwnerPasswordLogin(app, api)')
for (const handler of [
  'AuthEmailLogin',
  'AuthEmailRegister',
  'AuthEmailSend',
  'AuthMergeApply',
  'AuthMergeCheck',
  'AuthSSOExchange',
]) {
  await replace('server/server.go', `\th.${handler}(app, api)`, '')
}
await replace(
  'server/common/auth.go',
  '\t// check tokenValidFrom',
  '\tif user.IsAdmin && !LocalPasswordFixture() && !IsGitHubOwner(app.Dao().DB(), user.ID) { return entity.User{}, ErrTokenUserNotFound }\n\n\t// check tokenValidFrom'
)
const sidebarBundle = 'public/sidebar/assets/index-CBbc3fNk.js'
await replace(
  sidebarBundle,
  'checkHasBasicUserInfo(){return!!this.data.name&&!!this.data.email}',
  'checkHasBasicUserInfo(){return!!this.data.name}'
)
await replace(
  sidebarBundle,
  'return!!(null===(e=iv.user)||void 0===e?void 0:e.email)',
  'return!!(null===(e=iv.user)||void 0===e?void 0:e.name)'
)
await replace(
  sidebarBundle,
  'if(null===(n=iv.user)||void 0===n?void 0:n.email)',
  'if(null===(n=iv.user)||void 0===n?void 0:n.name)'
)
await replace(
  'server/handler/comment_create.go',
  'Email   string `json:"email" validate:"required"`',
  'Email   string `json:"email" validate:"optional"`'
)
await replace(
  'server/handler/comment_create.go',
  'if !utils.ValidateEmail(p.Email) {',
  'if p.Email != "" && !utils.ValidateEmail(p.Email) {'
)
await replace(
  'server/handler/comment_create.go',
  'getUpdateAnonymousUser(app, p.Name, p.Email, p.Link, ip, ua)',
  'common.UpdateBrowserUser(app, c, p.Name, p.Email, p.Link, ip, ua)'
)
for (const file of ['comment_list.go', 'user_info.go']) {
  await replace(
    `server/handler/${file}`,
    'user = app.Dao().FindUser(p.Name, p.Email)',
    'user = common.GetBrowserUser(app, c)'
  )
}
await replace(
  'server/handler/notify_read_all.go',
  'Email string `json:"email" validate:"required"`',
  'Email string `json:"email" validate:"optional"`'
)
await replace(
  'server/handler/notify_read_all.go',
  'user := app.Dao().FindUser(p.Name, p.Email)',
  'user, err := common.GetUserByReq(app, c)\n if err == common.ErrTokenNotProvided { user = common.GetBrowserUser(app, c) }'
)
await replace(
  'server/handler/notify_read_all.go',
  'err := app.Dao().UserNotifyMarkAllAsRead(user.ID)',
  'err = app.Dao().UserNotifyMarkAllAsRead(user.ID)'
)
await replace('server/handler/comment_create.go', 'go commentCreatedJobs(', 'commentCreatedJobs(')
await replace('internal/email/queue.go', 'q.ch <- email', 'q.handleEmail(email)')
await replace('internal/captcha/checker_turnstile.go', '"net/url"', '"net/url"\n "os"')
await replace(
  'internal/captcha/checker_turnstile.go',
  'url := TURNSTILE_API',
  'endpoint := TURNSTILE_API'
)
await replace(
  'internal/captcha/checker_turnstile.go',
  'cli.PostForm(url, values)',
  'cli.PostForm(endpoint, values)'
)
await replace(
  'internal/captcha/checker_turnstile.go',
  'if success.Exists() && success.Bool() {',
  'origin, parseErr := url.Parse(os.Getenv("ATK_SITE_URL"))\n if success.Exists() && success.Bool() && parseErr == nil && origin.Hostname() != "" && gjson.GetBytes(respBuf, "hostname").String() == origin.Hostname() && gjson.GetBytes(respBuf, "action").String() == "artalk" {'
)
await replace(
  'internal/captcha/pages/turnstile.html',
  "sitekey: '{{.site_key}}',",
  "sitekey: '{{.site_key}}',\n          action: 'artalk',"
)
// Return an error for non-200 responses instead of a nil error that the handler dereferences.
await replace(
  'internal/captcha/checker_turnstile.go',
  'if err != nil || resp.StatusCode != 200 {\n\t\treturn false, err\n\t}',
  'if err != nil { return false, err }\n if resp.StatusCode != 200 { resp.Body.Close(); return false, fmt.Errorf("verification service unavailable") }'
)
await replace(
  'server/common/captcha.go',
  'if limiter.IsPass(ip) {',
  'if ConsumeCaptchaProof(app, c) {'
)
await replace(
  'server/handler/captcha_status.go',
  'limiter, err := common.GetLimiter(c)',
  '_, err := common.GetLimiter(c)'
)
await replace(
  'server/handler/captcha_status.go',
  'limiter.IsPass(c.IP())',
  'common.HasCaptchaProof(app, c)'
)
await replace(
  'server/handler/captcha_verify.go',
  'limiter.MarkVerifyPassed(c.IP())',
  'limiter.MarkVerifyPassed(c.IP())\n\t\t\tif err := common.MintCaptchaProof(app, c); err != nil { return err }'
)
await replace('server/server.go', '\tuploadedStatic(app, fb)', '')
await replace('server/server.go', '\tstatic(fb)', '\th.UploadedImages(app, fb)\n\tstatic(fb)')
await replace(
  'server/server.go',
  '\th.SettingApply(app, api)',
  '\t// Runtime settings are supplied by environment, never saved to ephemeral disk.'
)

if (!process.argv.includes('--prepare')) {
  const go = process.env.ARTALK_GO || 'go'
  if (process.argv.includes('--test')) {
    run(
      go,
      [
        'test',
        '.',
        './server/handler',
        './server/common',
        './internal/email',
        './internal/captcha',
      ],
      source
    )
  } else {
    const output = path.resolve(
      root,
      process.env.VERCEL_OUTPUT_FILE ||
        path.join('bin', process.platform === 'win32' ? 'artalk.exe' : 'artalk')
    )
    await mkdir(path.dirname(output), { recursive: true })
    run(
      go,
      [
        'build',
        '-trimpath',
        '-ldflags',
        '-s -w -X github.com/artalkjs/artalk/v2/internal/config.Version=2.10.0',
        '-o',
        output,
        '.',
      ],
      source
    )
  }
}
