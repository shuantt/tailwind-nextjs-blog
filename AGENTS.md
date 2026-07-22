# AI Collaboration Guide

This file is the repository-wide source of truth for AI coding agents. Keep it factual,
concise, and updated when the architecture, commands, or delivery workflow changes.

## Project Overview

- Personal blog for Shuan Tseng, based on Tailwind Next.js Starter Blog 2.3.0.
- Next.js 15 App Router with React 18 and TypeScript.
- Tailwind CSS 3 for styling.
- MDX content is compiled by `contentlayer2`; `pliny` supplies blog, search, analytics,
  comments, and content helpers.
- Yarn 3.6.1 is pinned in `.yarn/releases` and configured with the `node-modules` linker.
- The production target is a static GitHub Pages export built by `.github/workflows/pages.yml`
  on pushes to `main`.
- The public site language and locale are Traditional Chinese (`zh-TW`). Preserve UTF-8 when
  reading or editing Chinese content; apparent mojibake may be a terminal decoding issue.

## Source-of-Truth Order

When documentation and implementation disagree, prefer:

1. The user's current request.
2. This file and any more deeply nested `AGENTS.md`.
3. Executable configuration and current code (`package.json`, `next.config.js`,
   `contentlayer.config.ts`, and `app/`).
4. `README.md`, which still contains substantial upstream-template documentation and may be
   stale for this customized site.

## Repository Map

- `app/`: App Router pages, metadata, providers, sitemap, and robots.
- `components/`: Shared UI and MDX component mappings.
- `lib/`: Shared publication rules, including the canonical published-post collection.
- `layouts/`: Blog list, post, banner, and author layouts.
- `data/posts/`: Published MDX sources, grouped by category.
- `data/draft/`: Draft/reference MDX excluded by Contentlayer configuration.
- `data/authors/`: Author profiles.
- `data/siteMetadata.js`: Canonical site identity, integrations, locale, and URLs.
- `data/headerNavLinks.ts`: Header navigation.
- `data/projectsData.ts`: Projects-page content.
- `public/static/`: Committed images, logos, and favicons.
- `css/`: Global Tailwind and Prism styles.
- `scripts/`: Post-build RSS generation.
- `contentlayer.config.ts`: MDX schema, computed fields, plugins, tags, and search generation.
- `.github/workflows/pages.yml`: Node 20 static-export deployment pipeline.

## Commands

Use the pinned Yarn version; do not switch package managers or regenerate the lockfile unless
the task explicitly requires it.

```bash
yarn install --immutable
yarn dev
yarn build
yarn serve
yarn analyze
yarn check
yarn content:check
```

Match GitHub Pages locally with PowerShell environment variables (use equivalent syntax in
other shells):

```powershell
$env:EXPORT='1'; $env:UNOPTIMIZED='1'; yarn build
```

Useful non-destructive checks:

```bash
yarn lint
yarn typecheck
```

`yarn lint` is non-destructive; use `yarn lint:fix` only when fixes are in scope, then inspect the
resulting diff. `yarn check` generates Contentlayer types, runs lint and type checks, and validates
publishable content. There is no repository-owned unit or browser test suite at present;
transitive test packages in `yarn.lock` do not count as project tests.

On Windows PowerShell, use `yarn.cmd` or
`node .yarn/releases/yarn-3.6.1.cjs` if script execution policy blocks `yarn.ps1`.

## Generated Files and Build Effects

- Contentlayer output under `.contentlayer/` is generated and ignored.
- `contentlayer.config.ts` regenerates `app/tag-data.json` and `public/search.json`.
- `scripts/postbuild.mjs` regenerates RSS files in `public/`, or in `out/` during static export.
- `.next/`, `out/`, generated RSS/search files, and sitemaps are build artifacts; do not commit
  them unless the repository's ignore policy or the user explicitly changes.
- `app/tag-data.json` is tracked even though it is generated. Include its diff only when content
  changes legitimately alter tag counts.

## Implementation Conventions

- Prefer Server Components. Add `'use client'` only when browser APIs, state, effects, or client
  event handlers require it.
- Follow the existing App Router patterns, including async `params` in dynamic Next.js 15 pages.
- Use the configured aliases (`@/components`, `@/data`, `@/layouts`, and `@/css`) instead of long
  relative imports.
- Reuse local primitives such as `components/Image.tsx`, `components/Link.tsx`, and existing
  layouts before introducing new abstractions or dependencies.
- Match repository formatting: no semicolons, single quotes, 2-space indentation, 100-column
  target, trailing ES5 commas, and Tailwind class sorting via Prettier.
- Preserve light/dark theme behavior, responsive layouts, keyboard access, semantic HTML, and
  accessible labels.
- Keep changes focused. Do not reformat unrelated files or overwrite user changes.
- Do not change public URLs, metadata, analytics, CSP, comments, newsletter providers, or
  deployment settings as incidental cleanup.
- Canonical article routes use `/posts/...`; keep RSS, sitemap, JSON-LD, search, and internal
  links aligned with that route family.
- Keep production features compatible with static export. GitHub Pages cannot run POST route
  handlers, Server Actions, or Next.js response-header configuration.

## Content Conventions

- Add publishable articles under `data/posts/<category>/<slug>.mdx`; keep unfinished material in
  `data/draft/` unless the user requests another workflow.
- Common frontmatter fields are `title`, `date`, `authors`, `draft`, `tags`, `summary`, `images`,
  `layout`, `lastmod`, `bibliography`, and `canonicalUrl`. `title` and `date` are required by the
  schema.
- Use author slugs that exist under `data/authors/`; the normal fallback is `default`.
- Available post layouts are `PostLayout`, `PostSimple`, and `PostBanner`.
- Put referenced local media under `public/static/images/` and use root-relative URLs such as
  `/static/images/example.jpg`.
- Preserve the author's language, voice, filenames, frontmatter quoting style, and UTF-8
  encoding. Do not rewrite article prose unless asked.

## Environment and Security

- Never read, print, copy, commit, or modify `.env.local` or other real environment files unless
  the user explicitly authorizes the exact operation.
- Use `.env.example` only to learn variable names. Never invent credentials or substitute real
  values into examples.
- Values prefixed with `NEXT_PUBLIC_` are exposed to browsers; all other integration keys must
  remain server-side.
- Adding an external script, frame, image host, analytics service, or comment provider may also
  require a deliberate Content Security Policy update in `next.config.js` for server deployments.
  GitHub Pages does not apply Next.js response headers.

## Known Upgrade Constraints

- Next.js is held on the latest 15.5 maintenance release with React 18 while Pliny's KBar,
  Giscus, and DocSearch dependency chain is modernized. Upgrade Next.js 16 and React 19 together
  in a dedicated change.
- Yarn reports an upstream React peer warning from Pliny's legacy `react-virtual` dependency.
  The current lint, typecheck, and static build pass; do not hide the warning with a broad package
  override.
- `next lint` is deprecated in Next.js 15.5. Migrate to the ESLint CLI as part of the Next.js 16
  upgrade.
- The deployed artifact is static and has no Node.js runtime. Audit findings in Contentlayer
  telemetry and Next.js build-time image tooling must still be reviewed when upstream versions
  change, but they are not deployed as request-handling services on GitHub Pages.

## Working Agreement

Before editing:

1. Inspect the relevant route, component, content schema, and nearby conventions.
2. Check the working tree and preserve unrelated or pre-existing changes.
3. State any assumption that could affect content, URLs, integrations, or deployment.

Before handing off:

1. Review the final diff for accidental generated files, secrets, encoding changes, and unrelated
   formatting.
2. Run the narrowest relevant checks, then `yarn build` for changes that affect routing, MDX,
   configuration, dependencies, or production rendering.
3. For UI changes, verify the affected page at mobile and desktop widths in both themes when a
   browser is available.
4. Report changed files, checks run, failures or skipped checks, and any follow-up risk.

Do not commit, push, deploy, publish content, or change external services unless the user asks.
