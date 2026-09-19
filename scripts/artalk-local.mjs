import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseEnv } from 'node:util'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const required = [
  'ATK_AUTH_GITHUB_CLIENT_ID',
  'ATK_AUTH_GITHUB_CLIENT_SECRET',
  'ARTALK_GITHUB_OWNER_ID',
]

// Load credentials inside the launcher; never print values or forward unrelated secrets.
// The smoke/demo runner remains entirely independent of real environment files.
async function main() {
  if (process.env.VERCEL) throw new Error('This launcher is for localhost only.')
  let settings
  try {
    settings = parseEnv(await readFile(path.join(root, '.env.local'), 'utf8'))
  } catch {
    throw new Error('Cannot load local configuration. Check .env.local.')
  }
  const credentials = Object.fromEntries(required.map((key) => [key, settings[key]?.trim() || '']))
  const missing = required.filter((key) => !credentials[key])
  if (missing.length) throw new Error(`Missing local settings: ${missing.join(', ')}`)
  if (!/^[1-9]\d*$/.test(credentials.ARTALK_GITHUB_OWNER_ID)) {
    throw new Error('ARTALK_GITHUB_OWNER_ID must be a numeric GitHub account ID.')
  }
  if (process.argv.includes('--check')) {
    console.log('Local GitHub configuration is present; credential values were not displayed.')
    return
  }

  const directoryIndex = process.argv.indexOf('--data-dir')
  if (directoryIndex >= 0 && !process.argv[directoryIndex + 1]) {
    throw new Error('--data-dir requires a directory.')
  }
  const directory = path.resolve(
    directoryIndex >= 0 ? process.argv[directoryIndex + 1] : path.join(root, '.artalk-local')
  )
  await mkdir(directory, { recursive: true })
  const keyPath = path.join(directory, 'app-key')
  try {
    await writeFile(keyPath, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 })
  } catch (error) {
    if (error.code !== 'EEXIST') throw new Error('Cannot initialize the local session key.')
  }
  const key = (await readFile(keyPath, 'utf8')).trim()
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid local session key.')
  const child = spawn(
    path.join(root, 'services/artalk/bin', process.platform === 'win32' ? 'artalk.exe' : 'artalk'),
    [],
    {
      cwd: root,
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'ignore'],
      env: {
        SystemRoot: process.env.SystemRoot,
        PATH: process.env.PATH,
        TEMP: process.env.TEMP,
        TMP: process.env.TMP,
        PORT: '23366',
        ARTALK_LOCAL_DEMO: '1',
        ARTALK_DEMO_DIR: directory,
        ATK_APP_KEY: key,
        ...credentials,
      },
    }
  )
  child.on('error', () => {
    console.error('Cannot start Artalk. Run yarn artalk:build first.')
    process.exitCode = 1
  })
  child.on('exit', (code) => {
    if (code) console.error('Artalk stopped. Check that port 23366 is available.')
    process.exitCode = code || 0
  })
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill())
  child.on('spawn', () => {
    console.log('Local Artalk started with GitHub owner login and local SQLite data.')
    console.log('Login: http://localhost:3090/api/v2/owner/login')
  })
}

main().catch((error) => {
  console.error(error.code ? 'Cannot initialize local Artalk storage.' : error.message)
  process.exitCode = 1
})
