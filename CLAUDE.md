# CLAUDE.md — AI Agent 維護規範

本檔是 repository 唯一規範來源；`AGENTS.md` 只保留指向本檔的連結。
優先順序：使用者當下要求 → 本檔 → 現行程式與設定 → `faq/` → `README.md`。

## 協作規則

- 一律使用繁體中文（台灣用語）回應；識別字、指令、檔名與錯誤訊息保留原文。註解沿用檔案語言。
- 開始前執行 `git status --short`、`git diff --stat`，閱讀相關實作再修改。
- 保留使用者未提交變更；不執行會覆寫它們的 stash、checkout、reset，不順手重構或格式化無關檔案。
- 未經要求，不建立或切換分支、不 commit、push、部署、發布內容或修改外部服務。
- Commit message 使用 Conventional Commits，必須有標題與內文，說明主要變更及驗證；不更動 `.pages.yml` 的 CMS 訊息模板。
- 不改寫使用者文章的內文、標題、摘要或語氣；SEO 任務也不自行新增 TL;DR 或說明段落。
- 真實環境檔（含 `.env.local`）僅在使用者明確授權的操作範圍內讀寫；平時只查 `.env.example`。
  不輸出或提交憑證、連線字串、私人資料；`NEXT_PUBLIC_` 變數會暴露至瀏覽器。
- 不為了解專案掃描 `node_modules/`、`.next/`、`.contentlayer/`、`out/` 或整份 README。
- `Claude outputs/` 與根目錄零散截圖屬使用者暫存，不提交、刪除、搬移或引用；Agent 暫存檔放 repo 外。
- 寫檔使用 UTF-8、無 BOM、LF；中文顯示異常先確認解碼。避免 PowerShell 5.1 預設寫檔編碼。
- 小而明確的工作直接處理，缺少關鍵決策才提問。子代理僅在明確要求時使用，且不得同時編輯同一檔案。
- 本 repo 公開：只記錄維護所需架構與限制，不另存私人部署資訊、帳號資料或已從隱私權頁移除的技術細節。

## 技術與部署

- SHUANTT 個人部落格；Next.js 15.5 App Router、React 18、TypeScript、Tailwind CSS 3、Contentlayer 2、Pliny。
- Yarn 3.6.1、`node-modules` linker、Node >= 20.9；不更換套件管理器或無故重生 lockfile。
- 語系 `zh-TW`，Open Graph `zh_TW`；主題色由 `tailwind.config.js` 的 `primary` / `secondary` 管理。
- Vercel Git integration：分支 push 產生 Preview，`main` push 產生 Production。
- `vercel.json` 使用 Services：`web` 為 Next.js，`artalk` 為 Go；本站需要後端，不支援整站純靜態匯出。
- Artalk 路由 `/api/v2`、`/dist`、`/sidebar`、`/comment-images` 必須先於 web fallback。
  保留 `/(.*)` fallback 與 `/sidebar/` → `/sidebar` redirect；修改後驗證首頁、靜態圖片與管理頁。
- 本機由 `next.config.js` 將 Artalk 路由轉至 `127.0.0.1:23366`；Vercel 由 Services router 處理。
- `UNOPTIMIZED` 控制圖片直出；部署曾遇圖片最佳化路由 404，重新啟用前須驗證頭像、Projects 圖片及 `/_next/image`。
- GA 由 `data/siteMetadata.js` 與 `app/layout.tsx` 的 Pliny Analytics 接入；目前不新增 Vercel Web Analytics 或 Speed Insights。

## 檔案入口

| 功能                       | 主要檔案                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------- |
| 站台、GA、Artalk、搜尋設定 | `data/siteMetadata.js`                                                                  |
| Header 導覽                | `data/headerNavLinks.ts`、`components/Header.tsx`                                       |
| About                      | `data/authors/default.mdx`、`app/about/page.tsx`、`layouts/AuthorLayout.tsx`            |
| Hero 文案與列表            | `data/heroContent.ts`                                                                   |
| Hero 視覺與動畫            | `components/HeroStatCard.tsx`、`components/IntroReveal.tsx`、`lib/introRevealTiming.ts` |
| Hero 數值                  | `lib/heroItems.ts`、`lib/heroStats.ts`、`lib/raceCountdown.ts`、`app/Main.tsx`          |
| Projects                   | `data/projectsData.ts`                                                                  |
| 文章列表與查詢             | `layouts/ListLayoutWithTags.tsx`、`lib/content.ts`                                      |
| 歷年文章                   | `app/timeline/page.tsx`                                                                 |
| 文章版型                   | `app/posts/[...slug]/page.tsx`、`layouts/`                                              |
| 文章留言                   | `components/Comments.tsx`、`services/artalk/`                                           |
| 頁尾與登入狀態             | `components/Footer.tsx`、`components/CommentAccountFooter.tsx`                          |
| Guestbook                  | `app/guestbook/`、`components/guestbook/`、`app/api/guestbook/`、`lib/guestbook/`       |
| Guestbook schema、隱私權   | `db/guestbook.sql`、`lib/guestbook/privacy.ts`、`app/privacy/page.tsx`                  |
| MDX、CMS、內容驗證         | `contentlayer.config.ts`、`.pages.yml`、`scripts/validate-content.mjs`                  |
| 樣式、安全、SEO            | `css/`、`tailwind.config.js`、`next.config.js`、`app/seo.tsx`、`app/sitemap.ts`         |

## 內容與 UI

- 已發布文章放 `data/posts/<slug>.mdx`（扁平結構）；草稿放 `data/draft/`，`data/posts/` 不留 `draft: true`。
- slug 使用小寫英文、數字、連字號；正式路由 `/posts/<slug>`，禁止新增舊 `/blog/` 連結。
- 必填 frontmatter：`title`、`date`、`category`、`summary`；其他欄位依 Contentlayer schema。
  `category` 為 `data/categoryData.ts` 的單一 label，`tags` 為陣列，`authors` 對應現有作者檔。
- 版型限 `PostLayout`、`PostSimple`、`PostBanner`；新增版型同步文章 route 對照表、驗證腳本與 CMS。
- 文章圖片放 `public/static/images/posts/`，以 `/static/images/...` 引用；外部 `next/image` 來源須列入 `images.remotePatterns`。
- 文章工作使用固定 `draft` 分支與 PR；建立、切換與合併時機由使用者決定。
- 使用者要求 SEO 編輯時：標題 22 個全形字內、摘要 60–80 字、內文從 `##` 開始且層級不跳、alt 用中文、標籤沿用既有寫法；修改已發布內容更新 `lastmod`。
- 內容 schema 變更同步 `contentlayer.config.ts`、驗證腳本、`.pages.yml` 與使用端；分類／作者變更也須同步既有 frontmatter。
- 文章列表、計數與 Timeline 一律取 `lib/content.ts` 的 `publishedBlogs`，不在頁面直接使用 `allBlogs`。
  分頁使用 `POSTS_PER_PAGE`；`totalPosts` 由 Server Component 傳入完整總數，不受分類、標籤或分頁影響。
- Posts 與分類頁保留 `Posts` 大標題、分隔線及「查看歷年文章」底線箭頭連結；分類描述只用於 metadata。
  桌機與手機皆顯示 `全部文章(X)`。
- Timeline 依年份分組、日期新到舊；日期格式 `YYYY / MM / DD`，文章列緊湊且無列間分隔線。
- 預設 Server Component；需要 state、effect、瀏覽器 API 或事件才加 `'use client'`；動態頁面沿用 async `params`。
- 使用路徑別名及既有 `Image`、`Link` 元件；新增套件前確認既有能力。
- 保留亮／暗主題、RWD、鍵盤操作與可存取標籤；使用者偏好簡約 UI，不自行加解釋性標語。
- 英文介面標題是刻意設計，不為 SEO 改成中文；中文關鍵字放 metadata 與結構化資料。
- 格式：無分號、單引號、2 空格、100 欄、ES5 尾逗號、Prettier Tailwind 排序。

### Hero

- 文案只改 `data/heroContent.ts`，版面留在元件；`statusItems`、`quests` 共用陣列型別，依陣列順序顯示。
- 每項 `key` 在列表內唯一；`hidden: true` 隱藏；自訂項目填 `value`，可附 `unit`、`progressPct`。
- 省略 `value` 時由 `lib/heroItems.ts` 解析 `posts`、`projects`、`raceTraining`。
  賽事名稱支援 `{currentWeek}`、`{totalWeeks}`；進度限制 0–100；桌機與手機共用解析結果。
- `lib/heroStats.ts` 使用台北時間：Coffee 09:00 為 100、18:00 歸零；Sleep 以日期固定抽樣，平日 50–75、週末 80–140，超過 100 顯示紅字但血條最多 100%。
- EXP. 以 2022-12-05 起算，依實際周年長度計算年資及當年進度；不要用固定 365 天取代。
- 初始日期數值由伺服器傳入，避免 hydration mismatch；掛載後每分鐘與返回頁面時更新。動畫常數模組保持可由伺服器匯入。

## 留言與管理

### Artalk 文章留言

- 前端與 Go 上游固定 Artalk 2.10.0；`services/artalk/build.mjs` 下載並驗證雜湊，再套用本站整合。
  `.upstream/`、`bin/` 是建置產物，不能直接修改或提交。
- 訪客可匿名留言與巢狀回覆，Email、網址非必填；不提供訪客 OAuth 或通知中心。
- 一般留言直接公開（`pending_default: false`）；設定封鎖詞時命中留言仍可進待審，不移除防垃圾機制。
- 留言關閉狀態以單篇為單位；站主名稱與頭像取 GitHub、連結至 About。
- 正式環境使用 PostgreSQL；OAuth 暫存狀態與上傳圖片保存在資料庫，不能依賴本機檔案持久化。
  圖片限 PNG／JPEG／GIF，單張 1 MB、總量 50 MB，限制由 `upload.go` 管理。
- 正式投稿必須通過 Turnstile；必要設定不足時回傳 503，不降級成免驗證或密碼登入。
- 頁尾齒輪連至 Artalk 管理；「站主已登入」連至 Guestbook 管理，並提供登出。

### Guestbook

- 與文章留言為獨立系統及資料庫；schema 在 `db/guestbook.sql`，API 使用 Node.js Route Handlers。
- 表單提交公開留言：暱稱、內容必填，網址／Email 至少一項，內容上限 800 字。
  桌機左側留言、右側表單；手機以 CTA 開啟彈窗。
- 新留言預設 `pending`；公開查詢只取 `visibility = public AND status = approved`，不要套用 Artalk 的免審設定。
- 公開 API 使用明確欄位，不回傳 Email、私密內容或管理欄位；既有私密資料維持私密，保留 visibility 不可變更的 SQL trigger。
- 管理頁支援審核、隱藏、回覆、刪除；公開回覆不適用私密留言。
- 投稿檢查同源 Origin、欄位、honeypot、限流、Turnstile hostname 與 `guestbook` action、隱私權同意及版本。
  缺少驗證設定不可跳過；`requestId` 維持冪等，避免重複投稿。
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 是公開 site key，secret 只在伺服器；修改 site key 後須重新建置。
  本機也須符合 hostname／action 驗證，不能只放出 widget。
- `/privacy`、同意文案與 `lib/guestbook/privacy.ts` 版本一致；保存同意時間與版本，不保存驗證 token。
- 先儲存留言，再嘗試選用的 Gmail 通知；寄信失敗不回滾留言，不宣稱未設定的通知已啟用。

### 共用站主登入與安全

- Artalk 與 Guestbook 共用 GitHub OAuth 站主權杖，只允許 `ARTALK_GITHUB_OWNER_ID` 指定的 GitHub 數字 ID。
  不以暱稱或 Email 合併管理身分。
- Guestbook 每次管理操作向固定來源的 Artalk owner session API 驗證，不接受舊 Guestbook Cookie。
  禁止把 Bearer token 轉送至 request header／query 指定的來源；變更操作另檢查同源 Origin。
- 變數名稱與用途以 `.env.example` 為準；Artalk、Guestbook 的資料庫與 Turnstile 設定分開管理。
- 新增 script、iframe 或外部來源時檢查 `next.config.js` 的 CSP，不順手放寬安全規則。

## 路由與生成檔

- 公開網址變更須有 permanent redirect，並同步站內連結、RSS、sitemap、JSON-LD、搜尋索引及 canonical。
- `app/sitemap.ts` 為 `force-static`；新增公開頁面時同步檢查，管理頁不加入 sitemap。
- 標籤少於 `TAG_INDEX_MIN_POSTS` 時 noindex 且不進 sitemap；空分類可顯示但 noindex。
- `.contentlayer/`、`.next/`、`out/`、`public/search.json`、RSS、sitemap 是忽略的生成物，不提交。
- `app/tag-data.json`、`app/category-data.json` 已追蹤，僅在內容確實改變計數時納入；還原意外生成差異前確認不是使用者變更。

## 指令與驗證

Windows 可使用 `node .yarn/releases/yarn-3.6.1.cjs <指令>`；PowerShell 5.1 不支援 `&&`。

| 指令                                                           | 用途                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `yarn install --immutable`                                     | 安裝固定相依套件                                                                              |
| `yarn dev` / `yarn serve`                                      | 開發／正式模式啟動                                                                            |
| `yarn build`                                                   | Next.js 建置與 RSS                                                                            |
| `yarn lint` / `yarn typecheck`                                 | 不自動修正的 lint／型別檢查                                                                   |
| `yarn lint:fix`                                                | 僅對任務範圍使用，之後檢視 diff                                                               |
| `yarn content:build` / `yarn content:check`                    | 產生 Contentlayer／驗證文章                                                                   |
| `yarn check`                                                   | content:build + lint + typecheck + content:check                                              |
| `yarn hero:test`                                               | Hero 日期、進度與列表解析                                                                     |
| `yarn guestbook:test`                                          | 隔離 PGlite 測試 API、SQL 限制與管理權限，不連外、不讀真實環境檔                              |
| `yarn artalk:test` / `yarn artalk:build` / `yarn artalk:smoke` | Artalk 測試／Go 建置／隔離 API 與重啟驗證；需 Go 1.26.5                                       |
| `yarn artalk:demo`                                             | 隔離本機示範，搭配 Next.js 3090；不代表正式驗證已完成                                         |
| `yarn artalk:local`                                            | 使用者要求本機登入時，由啟動器載入三項 GitHub 設定，不輸出值；資料留在忽略的 `.artalk-local/` |
| `yarn analyze`                                                 | Bundle 分析                                                                                   |

- 文章：`content:check`；新增 MDX 語法再跑 build。
- UI：lint、typecheck；有瀏覽器時確認手機／桌機、亮／暗主題。
- Hero／Guestbook 邏輯：加跑對應測試；Artalk 整合跑 test、build、smoke。
- 路由、schema、整合、CSP、套件：相關檢查與 build；套件變更加跑 immutable install。
- 純文件修改：檢查格式、路徑與 diff，不需建置網站。
- 直接執行 ESLint CLI 時，現有 eslintrc 設定需 `ESLINT_USE_FLAT_CONFIG=false`。
  `next lint` 棄用與 Pliny peer 警告不以廣泛 override 掩蓋。
- Next.js 16／React 19 留待專門升級任務一起處理，不隨功能修改升級。
- CI 在 PR、非 main push 與手動觸發執行 check、Guestbook／Hero 測試、build；另有 Artalk Go 測試、建置及 smoke job。
- pre-commit 使用 lint-staged 自動修正暫存檔，commit 前後確認範圍沒有擴大。
- 交付前執行 `git diff --check` 並檢視 diff；回報完成內容與實際驗證，未執行、失敗或受阻需明說。
  不把編譯成功當成整體建置通過。

本檔只保留長期有效的規則與實作限制，不記錄臨時錯誤、測試結果、部署 ID 或操作流水帳。
