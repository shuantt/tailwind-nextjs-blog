# CLAUDE.md — AI 協作指南

本檔案是 `tailwind-nextjs-blog` 這個 repository 對所有 AI coding agents（Claude Code、Codex、
Cursor 等）的**唯一規範來源**。`AGENTS.md` 只負責把讀者導向這裡，請勿在 `AGENTS.md` 新增規則。
內容應保持精簡、可驗證；當架構、指令或交付流程改變時，請同步更新本檔。

## 0. 回應語言（最優先）

- **一律使用繁體中文（台灣用語）回應使用者**：計畫、說明、提問、進度更新、交付摘要皆然。
  即使使用者以英文提問，仍以繁體中文回覆，除非使用者明確要求其他語言。
- 程式碼識別字、指令、檔名、路徑、錯誤訊息、套件名與技術名詞保留英文原文，不要翻譯。
- 程式碼註解沿用該檔案既有語言。目前多數檔案是英文；`tailwind.config.js`、
  `data/heroContent.ts` 等少數檔案使用中文，就跟著用中文。
- 不使用簡體中文，也避免中國大陸用語。例如：軟體（非軟件）、網路（非網絡）、預設（非默認）、
  字串（非字符串）、程式碼（非代碼）、影片（非視頻）、資料（非數據）、使用者（非用戶）、
  函式（非函數）、物件（非對象）、快取（非緩存）、佇列（非隊列）。
- Commit message 沿用既有慣例：Conventional Commits 前綴（`feat` / `fix` / `docs` / `chore` /
  `refactor` / `content`），冒號後的描述可用繁體中文或英文。Pages CMS 自動產生的
  `content(post): ...` 與 `content(media): ...` 格式定義在 `.pages.yml`，不要更動。

## 1. 專案概觀

- Shuan Tseng 的個人部落格「SHUANTT」，正式站 <https://blog.shuantt.com>。
  基底是 Tailwind Next.js Starter Blog 2.3.0，已大量客製：品牌與霓虹橘主題色、首頁 Hero 動畫與
  RPG 風格狀態卡、Category + Tags 雙層分類、Pages CMS 手機寫作流程。
- 技術棧：Next.js 15.5 App Router、React 18、TypeScript、Tailwind CSS 3。
  MDX 由 `contentlayer2` 編譯；`pliny` 提供文章工具、KBar 搜尋、Google Analytics 與 Giscus 留言。
- 套件管理：Yarn 3.6.1（釘在 `.yarn/releases`，使用 `node-modules` linker），Node >= 20.9。
- 部署：Vercel Git integration。feature branch 產生 Preview；push 到 `main` 產生 Production。
  因此 `main` 上不要放未完成的文章或半成品程式碼。
- 網站語言與 locale 為繁體中文（`zh-TW`），Open Graph locale 為 `zh_TW`。
- 內容結構：三個固定分類（產品開發、學習成長、生活紀錄，定義在 `data/categoryData.ts`）加上
  自由標籤。文章直接放在 `data/posts/<slug>.mdx`（扁平結構），分類由 frontmatter 的 `category`
  決定，不再依目錄分類。舊的 `/posts/dev/...`、`/posts/life/...` 路徑由 `next.config.js` 的
  permanent redirect 轉址。
- 手機寫作：使用 Pages CMS 直接編輯 GitHub repository，表單定義在 `.pages.yml`，流程說明在
  `faq/mobile-authoring.md`。

## 2. 資訊來源優先順序

文件與實作不一致時，依序以下列為準：

1. 使用者當下的要求。
2. 本檔案。
3. 可執行的設定與現行程式碼：`package.json`、`next.config.js`、`contentlayer.config.ts`、
   `scripts/validate-content.mjs`、`.pages.yml`、`app/`。
4. `faq/` 內的本地說明文件。
5. `README.md`。它仍大量保留上游模板內容，對本站可能已過時，只在需要上游背景時參考。

## 3. Repository 地圖

| 路徑                            | 用途                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `app/`                          | App Router 頁面、metadata、providers、`sitemap.ts`、`robots.ts`、`seo.tsx`                      |
| `app/posts/[...slug]/page.tsx`  | 文章頁；檔內的 `layouts` 對照表決定可用版型                                                     |
| `app/categories/[category]/`    | 分類列表頁，以 `categoryConfig` 的 label 比對 `post.category`                                   |
| `app/tags/`                     | 標籤總覽與標籤列表頁                                                                            |
| `app/tag-data.json`             | Contentlayer 生成的標籤計數，**已追蹤**                                                         |
| `app/category-data.json`        | Contentlayer 生成的分類計數，**已追蹤**                                                         |
| `app/Main.tsx`                  | 首頁（Server Component），在伺服器端計算賽事倒數後把純數字傳給 client                           |
| `components/`                   | 共用 UI 與 MDX 元件對照（`MDXComponents.tsx`）                                                  |
| `components/HeroStatCard.tsx`   | 首頁 RPG 狀態卡視覺                                                                             |
| `components/IntroReveal.tsx`    | 首頁標題進場動畫                                                                                |
| `layouts/`                      | `PostLayout`、`PostSimple`、`PostBanner`、列表版型、`AuthorLayout`                              |
| `lib/content.ts`                | `publishedBlogs`、`POSTS_PER_PAGE`、標籤索引門檻與分類／標籤查詢；頁面一律從這裡取文章          |
| `lib/raceCountdown.ts`          | 半馬訓練倒數計算（首頁 QUEST 列）                                                               |
| `lib/introRevealTiming.ts`      | 首頁動畫時間常數，刻意不加 `'use client'` 以便 Server Component 匯入                            |
| `data/posts/`                   | 已發布 MDX 文章（扁平結構）                                                                     |
| `data/draft/`                   | 草稿與參考範例，Contentlayer 以 `contentDirExclude` 排除                                        |
| `data/authors/`                 | 作者檔案，目前有 `default`（Shuan Tseng）與 `sparrowhawk`                                       |
| `data/categoryData.ts`          | 三個固定分類的 label 與 slug                                                                    |
| `data/heroContent.ts`           | 首頁 Hero 所有文案與數字，視覺留在元件內                                                        |
| `data/siteMetadata.js`          | 站台身分、語系、網址、GA、Giscus、KBar 設定                                                     |
| `data/headerNavLinks.ts`        | 頁首導覽                                                                                        |
| `data/projectsData.ts`          | Projects 頁內容                                                                                 |
| `data/references-data.bib`      | `bibliography` 引用資料                                                                         |
| `public/static/`                | 已提交的圖片、logo、favicon；文章圖片放 `public/static/images/posts/`                           |
| `css/`                          | 全站 Tailwind 與 Prism 樣式                                                                     |
| `scripts/postbuild.mjs`         | 建置後產生 RSS                                                                                  |
| `scripts/validate-content.mjs`  | `yarn content:check` 的內容驗證規則                                                             |
| `contentlayer.config.ts`        | MDX schema、computed fields、remark/rehype 外掛、標籤與分類計數、搜尋索引                       |
| `tailwind.config.js`            | 全站配色統一入口：`primary`（自訂霓虹橘色階）、`secondary`（indigo）                            |
| `next.config.js`                | CSP 與安全標頭、圖片 remotePatterns、舊路徑 redirect、bundle analyzer                           |
| `.pages.yml`                    | Pages CMS 的內容集合、欄位、分類選項與 commit 訊息模板                                          |
| `.github/workflows/quality.yml` | PR 與非 `main` 分支的 CI：`yarn check` 與靜態匯出 `yarn build`                                  |
| `.husky/pre-commit`             | `lint-staged`：對暫存的 js/ts 跑 `eslint --fix`，對 js/ts/json/css/md/mdx 跑 `prettier --write` |
| `faq/`                          | 本地說明：手機寫作、自訂 MDX 元件、KBar 搜尋、Docker 部署                                       |

## 4. 指令

使用釘住的 Yarn 版本。除非任務明確要求，不要更換套件管理器或重生 `yarn.lock`。

```bash
yarn install --immutable   # 安裝相依套件
yarn dev                   # 開發伺服器
yarn build                 # next build + 產生 RSS
yarn serve                 # 以正式模式啟動
yarn analyze               # bundle 分析
yarn lint                  # 非破壞性 lint（app、components、lib、layouts、scripts）
yarn lint:fix              # 僅在修正屬於任務範圍時使用，之後檢視 diff
yarn typecheck             # tsc --noEmit
yarn content:build         # contentlayer2 build，同時重生 tag-data / category-data / search.json
yarn content:check         # 執行 scripts/validate-content.mjs
yarn check                 # content:build + lint + typecheck + content:check
```

- Windows PowerShell 5.1 不支援 `&&`；若執行原則擋住 `yarn.ps1`，改用 `yarn.cmd` 或
  `node .yarn/releases/yarn-3.6.1.cjs <script>`。
- CI 只在 pull request、非 `main` 的 push 與手動觸發時執行，內容為 `yarn check` 加上
  `EXPORT=1 UNOPTIMIZED=1 yarn build`（靜態匯出）。靜態匯出模式下 `next.config.js` 的
  headers 與 redirects **不會**生效，所以 CI 不會驗證它們，只有 Vercel 部署會。
- 目前沒有 repository 自有的單元或瀏覽器測試；`yarn.lock` 裡的測試套件是間接相依，不算專案測試。

## 5. 接收任務時須注意（動手前）

1. **先看工作樹。** 執行 `git status --short` 與 `git diff --stat`。已存在的未提交變更是使用者
   進行中的工作：保留、不還原、不順手提交，也不執行 `git stash`、`git checkout --`、`git reset`。
2. **讀相關檔案再動手。** 至少看過牽涉的 route、component、layout、內容 schema、驗證腳本與
   鄰近慣例，再提案或修改。
3. **先判斷任務類型**，再決定同步點與檢查方式：

   | 類型                    | 主要檔案                                                | 至少要跑                                                 |
   | ----------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
   | 文章內容                | `data/posts/`、`public/static/images/posts/`            | `yarn content:check`；用到新 MDX 語法時再跑 `yarn build` |
   | 內容 schema／分類／作者 | 見 6.2 的同步清單                                       | `yarn check` + `yarn build`                              |
   | UI／元件／樣式          | `components/`、`layouts/`、`css/`、`tailwind.config.js` | `yarn lint` + `yarn typecheck`；雙主題、雙寬度目視       |
   | 路由／URL／SEO          | `app/`、`next.config.js`、`app/sitemap.ts`              | `yarn build`                                             |
   | 設定／整合／CSP         | `next.config.js`、`data/siteMetadata.js`                | `yarn build`，並回報對正式站的影響                       |
   | 相依套件                | `package.json`、`yarn.lock`                             | `yarn install --immutable` + `yarn check` + `yarn build` |

4. **範圍判斷。** 小而明確的請求直接實作；範圍大的請求先簡短列出計畫，並隨事實更新。
5. **何時提問。** 只有在缺少的決定會實質改變公開內容、URL、metadata、外部整合、部署，或需要
   刪除資料時才提問。其他情況做最小、可逆的假設，並在交付時明確揭露。
6. **不要為了「了解專案」掃描** `.env.local`、`node_modules/`、`.next/`、`.contentlayer/`、
   `out/` 或整份 `README.md`。用有目標的搜尋與檢查。
7. **中文與編碼。** 終端機裡看起來像亂碼的中文，多半是終端解碼問題而不是檔案損壞。先以 UTF-8
   方式確認，不要「修正」看似亂碼的內容。寫檔一律 UTF-8、無 BOM、LF 換行（`.gitattributes`
   強制 LF）。PowerShell 5.1 的 `Set-Content` 預設 ANSI、`Out-File` 會加 BOM，寫含中文的檔案時
   避免直接使用，或明確指定編碼。
8. **repo 根目錄的雜項檔案**（例如 `Claude outputs/` 與零散的 `.png` 截圖）是使用者的個人暫存，
   不要提交、刪除、搬移或當成專案資源引用；自己的暫存檔也不要放進 repo。
9. **子代理**只用於真正獨立的工作，給明確的邊界，避免同時編輯同一個檔案。
10. **使用者的文章語氣、檔名、frontmatter 引號風格不是要修的東西。**

## 6. 調整專案時須注意（動手中）

### 6.1 文章與內容

- 可發布文章放 `data/posts/<slug>.mdx`；未完成或參考用的內容放 `data/draft/`。`draft: true` 的
  檔案不可留在 `data/posts/`，`yarn content:check` 會失敗。
- slug 取自 `data/posts/` 之下的相對路徑（去掉副檔名），對應網址 `/posts/<slug>`。slug 使用小寫
  英文、數字與連字號；大小寫不同但拼法相同的 slug 視為重複。
- frontmatter 欄位：`title`、`date`、`category` 是 schema 必填；`summary` 在驗證腳本與 CMS 中
  也是必填。其他可用欄位：`tags`、`authors`、`draft`、`images`、`layout`、`lastmod`、
  `bibliography`、`canonicalUrl`。
- `category` 必須是 `data/categoryData.ts` 裡三個 label 之一，且是單一字串；`tags` 是陣列。
- `authors` 只能用 `data/authors/` 已存在的 slug，一般保留 `default`。
- `layout` 只能是 `PostLayout`、`PostSimple`、`PostBanner`。
- 文章內的本地圖片放 `public/static/images/posts/`，以根相對路徑引用（`/static/images/...`）；
  frontmatter 與內文引用的圖片都必須實際存在。
- 站內連結使用 `/posts/...`、`/categories/...`、`/tags/...` 或既有靜態頁；禁止舊的 `/blog/`。
  驗證腳本會檢查連結能否解析。
- 用 `next/image` 顯示外部圖片時，來源網域必須列在 `next.config.js` 的 `images.remotePatterns`
  （目前只有 `picsum.photos`）。
- 除非使用者要求，不要改寫文章內文、標題、摘要或語氣。即使使用者要求做 SEO 調整，也只動結構：
  標題層級、清單、站內連結、frontmatter。不要新增「先講結論」、TL;DR 之類的開頭摘要段落，
  也不要自行撰寫任何句子；那會讓文章讀起來像 AI 寫的，作者明確表示不接受。
- SEO 撰寫規範：標題控制在 22 個全形字以內，因為 `<title>` 套用 `%s | SHUANTT` 模板；`summary`
  60 到 80 字；內文從 `##` 開始且層級不跳；首段出現主題關鍵字；圖片 alt 用中文描述內容；標籤
  沿用既有寫法與大小寫；修改已發布文章時更新 `lastmod`。
- 標籤頁文章數少於 `lib/content.ts` 的 `TAG_INDEX_MIN_POSTS` 時為 noindex 且不進 sitemap；
  分類頁沒有文章時照常渲染空狀態但 noindex。
- 新增或調整文章的工作流程是固定的 `draft` 分支加 PR，而不是直接改 `main`；`draft` 分支的
  Vercel Preview 網址固定，合併後分支自動刪除再重建。分支與合併時機由使用者決定。

### 6.2 內容 schema 的同步點

新增或修改 frontmatter 欄位、分類、作者、版型時，下列位置必須一起更新，缺一就會出現 CMS、
驗證或建置不一致：

| 變更             | 需同步                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| frontmatter 欄位 | `contentlayer.config.ts`（schema）、`scripts/validate-content.mjs`（規則）、`.pages.yml`（表單欄位）、使用該欄位的 `layouts/` 與 `app/`           |
| 分類             | `data/categoryData.ts`、`.pages.yml` 的 `category` 選項（label 必須逐字相同）、既有文章的 `category`、`app/category-data.json`（重生）            |
| 作者欄位         | `contentlayer.config.ts` 的 `Authors`、`layouts/AuthorLayout.tsx`、對應的 `data/authors/*.mdx`、`components/social-icons`                         |
| 新作者           | `data/authors/<slug>.mdx`、`.pages.yml` 的 `authors` 選項                                                                                         |
| 版型             | `layouts/`、`app/posts/[...slug]/page.tsx` 的 `layouts` 對照表、`scripts/validate-content.mjs` 的 `allowedLayouts`、`.pages.yml` 的 `layout` 選項 |

### 6.3 程式碼與 UI

- 預設寫 Server Component。只有需要瀏覽器 API、state、effect 或 client 事件處理時才加
  `'use client'`。
- 遵循現有 App Router 寫法，包括 Next.js 15 動態頁面的 async `params`。
- 使用別名 `@/components`、`@/data`、`@/layouts`、`@/css`，不要寫長相對路徑。
- 優先重用 `components/Image.tsx`、`components/Link.tsx` 與既有 layout，再考慮新抽象或新套件。
- 格式：無分號、單引號、2 空格縮排、100 欄、ES5 尾逗號、Prettier Tailwind class 排序。
  pre-commit 的 `lint-staged` 會自動格式化暫存檔案；交付前先自行跑過 lint，以免 commit 內容與
  預期不同。
- 保留亮／暗主題（`darkMode: 'class'`）、響應式版面、鍵盤操作、語意化 HTML 與可存取的標籤。
- 全站配色只從 `tailwind.config.js` 的 `primary` / `secondary` 調整，不要在元件裡硬編顏色。
- 介面文字與各頁 h1 的英文（`Projects`、`Tags`、`Read more` 等）是刻意的設計決定，不要為了 SEO
  改成中文；搜尋用的中文關鍵字放在 `<title>`、description 與結構化資料。
- 首頁 Hero 的文案改 `data/heroContent.ts`，視覺改 `components/HeroStatCard.tsx` 與
  `components/IntroReveal.tsx`。與日期有關的計算保持在伺服器端（見 `lib/raceCountdown.ts` 的
  註解），避免 hydration mismatch。
- 文章列表與統計一律從 `lib/content.ts` 的 `publishedBlogs` 取得，不要直接使用未過濾的
  `allBlogs`。
- 保持變更聚焦：不重排無關檔案、不覆寫使用者變更、不做「順手」重構。

### 6.4 路由、URL 與 SEO

- 文章正式路由是 `/posts/<slug>`；RSS、sitemap、JSON-LD、搜尋索引與站內連結都必須對齊。
- 重新命名或搬移已發布文章會改變公開網址。若必須這麼做，在 `next.config.js` 依既有模式新增
  permanent redirect、更新站內連結，並在交付時明確指出網址變更。
- `app/sitemap.ts` 使用 `force-static`，會列出靜態頁、分類頁、標籤頁與文章頁；新增頁面類型時
  記得一併加入。
- 不要把更動公開 URL、metadata、canonical、Open Graph 當成附帶清理。

### 6.5 設定、安全與外部整合

- 絕不讀取、印出、複製、提交或修改 `.env.local` 與其他真實環境檔，除非使用者明確授權該次操作。
  只用 `.env.example` 認識變數名稱，不要捏造值。
- `NEXT_PUBLIC_` 開頭的變數會暴露到瀏覽器；其他整合金鑰必須留在伺服器端。
- 新增外部 script、iframe、圖片來源、分析或留言服務時，必須同步審慎更新 `next.config.js` 的
  Content Security Policy；目前允許的第三方為 Giscus、Google Tag Manager 與 Umami。
- Google Analytics ID、Giscus 設定、KBar 搜尋設定都在 `data/siteMetadata.js`，不要當成清理項目
  修改。
- 現有公開頁面都在 Vercel 建置時預先渲染，沒有自訂 API route。只有產品明確需要時才加入 route
  handler 或 Server Action，並保持 Vercel 與標準 Next.js 相容。

### 6.6 生成檔與建置產物

- `.contentlayer/`、`.next/`、`out/`、`public/search.json`、RSS 與 sitemap 皆為生成物且已忽略，
  不要提交。
- `app/tag-data.json` 與 `app/category-data.json` 由 Contentlayer 生成但已追蹤。只有內容變更
  確實改變計數時才把它們的 diff 納入；純程式碼任務若意外改到，請還原。
- `scripts/postbuild.mjs` 在一般建置時把 RSS 寫到 `public/`，靜態匯出時寫到 `out/`。

### 6.7 相依套件與升級限制

- Next.js 固定在 15.5 維護版並搭配 React 18，等待 Pliny 的 KBar、Giscus、DocSearch 相依鏈現代化。
  Next.js 16 與 React 19 要在同一個專門的變更中一起升級。
- Yarn 會回報 Pliny 舊版 `react-virtual` 的 React peer 警告。目前 lint、typecheck 與靜態建置皆
  通過；不要用寬鬆的 package override 把警告藏起來。
- `next lint` 在 Next.js 15.5 已標示為棄用，遷移到 ESLint CLI 應與 Next.js 16 升級一起處理。
- 新增相依套件前先確認既有套件（`pliny`、`@headlessui/react`、既有 remark/rehype 外掛）是否已能
  滿足需求；新增時在交付時說明理由與影響。

## 7. 交付前檢查與回報

交付前：

1. 檢視最終 diff：沒有不該出現的生成檔、沒有 secrets、沒有編碼或換行改變、沒有無關的格式化。
2. 依第 5 節的表格跑最窄的相關檢查；牽涉路由、MDX、設定、相依套件或正式渲染時再跑 `yarn build`。
3. UI 變更在有瀏覽器可用時，於手機與桌機寬度、亮與暗主題各確認一次。
4. **絕不在指令未成功完成的情況下宣稱檢查通過。** 區分「既有失敗」與「本次變更造成的失敗」，
   兩者都要如實回報。

回報格式（繁體中文，簡潔）：

- **結果**：完成了什麼、沒完成什麼。
- **變更檔案**：清單，必要時附一句用途。
- **執行的檢查**：指令與實際結果；略過的檢查與原因。
- **假設與風險**：做過的假設、對公開網址／整合／部署的影響、建議的後續步驟。

## 8. 絕對禁止

- 未經使用者要求就 commit、push、部署、發布內容，或更動 Vercel、GitHub、Giscus、GA、Pages CMS 等
  外部服務。
- 讀取或修改 `.env.local` 與其他真實環境檔。
- 更換套件管理器、重生 `yarn.lock`、用廣泛的 override 壓掉 peer 警告。
- 順手更改公開 URL、metadata、analytics、CSP、留言、電子報或部署設定。
- 改寫使用者的文章內文。
- 提交建置產物，或把暫存檔、預覽 HTML、截圖放進 repo。
- 使用會動到使用者未提交變更的 git 指令。
- 以簡體中文或非繁體中文回應使用者。

## 9. 維護本檔

- 可長期沿用、影響全 repository 的發現寫進本檔，不要散落在其他說明檔。
- 某個目錄若需要與根目錄不同的穩定規則，優先在本檔新增一節；只有在規則量大到影響可讀性時才
  建立該目錄自己的 `CLAUDE.md`。
- `AGENTS.md` 永遠只保留指向本檔的指標，不放規則，避免兩份文件漂移。
