import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const root = process.cwd()
const postsDirectory = path.join(root, 'data', 'posts')
const authorsDirectory = path.join(root, 'data', 'authors')
const publicDirectory = path.join(root, 'public')
const allowedLayouts = new Set(['PostLayout', 'PostSimple', 'PostBanner'])
const staticRoutes = new Set(['/', '/about', '/posts', '/projects', '/tags', '/categories'])
const errors = []

function findContentFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return findContentFiles(entryPath)
    }

    return /\.mdx?$/.test(entry.name) ? [entryPath] : []
  })
}

function report(file, message) {
  errors.push(`${path.relative(root, file)}: ${message}`)
}

function postSlug(file) {
  return path
    .relative(postsDirectory, file)
    .replace(/\\/g, '/')
    .replace(/\.mdx?$/, '')
}

function checkPublicAsset(file, assetPath) {
  const cleanPath = assetPath.split(/[?#]/)[0]

  if (!cleanPath.startsWith('/') || cleanPath.startsWith('//')) {
    return
  }

  const target = path.join(publicDirectory, cleanPath.replace(/^\/+/, ''))
  if (!existsSync(target)) {
    report(file, `missing public asset: ${assetPath}`)
  }
}

const authorSlugs = new Set(
  findContentFiles(authorsDirectory).map((file) => path.basename(file).replace(/\.mdx?$/, ''))
)
const postFiles = findContentFiles(postsDirectory)
const routeToFile = new Map(postFiles.map((file) => [`/posts/${postSlug(file)}`, file]))
const seenSlugs = new Map()

for (const file of postFiles) {
  const source = readFileSync(file, 'utf8')
  const { data, content } = matter(source)
  const slug = postSlug(file)
  const normalizedSlug = slug.toLocaleLowerCase('en-US')
  const previousFile = seenSlugs.get(normalizedSlug)

  if (previousFile) {
    report(file, `slug duplicates ${path.relative(root, previousFile)}: ${slug}`)
  } else {
    seenSlugs.set(normalizedSlug, file)
  }

  for (const field of ['title', 'date', 'summary']) {
    if (!data[field]) {
      report(file, `missing required frontmatter field: ${field}`)
    }
  }

  if (data.draft === true) {
    report(file, 'draft content belongs in data/draft, not data/posts')
  }

  if (data.date && Number.isNaN(new Date(data.date).getTime())) {
    report(file, `invalid date: ${data.date}`)
  }

  if (typeof data.category !== 'string' || data.category.trim().length === 0) {
    report(file, 'category must be a single non-empty string')
  }

  if (data.tags && !Array.isArray(data.tags)) {
    report(file, 'tags must be an array')
  }

  const authors = data.authors || ['default']
  if (!Array.isArray(authors)) {
    report(file, 'authors must be an array')
  } else {
    for (const author of authors) {
      if (!authorSlugs.has(author)) {
        report(file, `unknown author: ${author}`)
      }
    }
  }

  if (data.layout && !allowedLayouts.has(data.layout)) {
    report(file, `unknown layout: ${data.layout}`)
  }

  if (data.canonicalUrl) {
    try {
      new URL(data.canonicalUrl)
    } catch {
      report(file, `invalid canonicalUrl: ${data.canonicalUrl}`)
    }
  }

  const frontmatterImages = data.images
    ? Array.isArray(data.images)
      ? data.images
      : [data.images]
    : []
  const markdownImages = [...content.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
    (match) => match[1]
  )

  for (const image of [...frontmatterImages, ...markdownImages]) {
    if (typeof image === 'string') {
      checkPublicAsset(file, image)
    }
  }

  const markdownLinks = [...content.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
  for (const match of markdownLinks) {
    const href = match[1].split(/[?#]/)[0]

    if (!href.startsWith('/') || href.startsWith('//') || href === '') {
      continue
    }

    if (href.startsWith('/blog/')) {
      report(file, `legacy internal route should use /posts/: ${match[1]}`)
      continue
    }

    if (
      !staticRoutes.has(href) &&
      !routeToFile.has(href) &&
      !href.startsWith('/tags/') &&
      !href.startsWith('/categories/') &&
      !href.startsWith('/static/')
    ) {
      report(file, `unknown internal link: ${match[1]}`)
    }
  }
}

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error(s):`)
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
} else {
  console.log(`Validated ${postFiles.length} published posts and ${authorSlugs.size} authors.`)
}
