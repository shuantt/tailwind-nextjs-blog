# 手機寫作與發布

本專案使用 Pages CMS 編輯 GitHub repository 裡的 MDX 文章。CMS 只負責內容編輯，
正式網站仍由既有的 Contentlayer、GitHub 與 Vercel 流程建置。

## 第一次設定

1. 前往 <https://app.pagescms.org>，使用 GitHub 登入。
2. 安裝 Pages CMS GitHub App 時，只授權 `shuantt/tailwind-nextjs-blog`。
3. 開啟 repository；CMS 會讀取根目錄的 `.pages.yml`。

## 建議的手機寫作流程

1. 寫作一律在 `draft` 分支。打開 Pages CMS 後看側欄的分支：不是 `draft` 就到分支選單切換；
   清單裡沒有 `draft` 時，先確認目前在 `main`，在搜尋框輸入 `draft` 按 Create 建立，再點選它
   切換過去。網址列會出現分支名稱，可以直接加入手機書籤。
2. 進入「文章」。之後每次儲存都會 commit 到 `draft` 分支，圖片也一樣。
3. 直接在 `data/posts` 最上層建立文章，不要建立或選擇子目錄。文章分類不再依目錄區分，
   而是在表單的「分類」欄位選擇：產品開發、學習成長、生活紀錄三選一。
4. 新檔名使用小寫英文、數字與連字號，例如 `mobile-authoring`。CMS 會依設定建立 `.mdx`
   檔案，因此檔名欄位若已顯示副檔名，不要重複輸入 `.mdx`。
5. 檔名就是文章網址：`data/posts/mobile-authoring.mdx` 會發布在 `/posts/mobile-authoring`。
   發布後不要再改檔名，否則舊網址會失效；真的要改，需要在桌機另外設定轉址。
6. 儲存後 GitHub Actions 會跑檢查，Vercel 會更新 `draft` 分支的 Preview。預覽網址固定是
   <https://shuan-blog-git-draft-shuantts-projects.vercel.app>；若已完成下方的自訂網域設定，
   則是 <https://draft.blog.shuantt.com>。加入手機書籤後，每次存檔重新整理同一頁即可。
   第一次開預覽會先被導到 Vercel 登入頁，用同一個帳號登入一次即可；不想登入的話，到 Vercel
   專案的 Settings、Deployment Protection 把 Vercel Authentication 關閉。
7. 寫完後在 GitHub 從 `draft` 對 `main` 開 Pull Request，Vercel 也會在 PR 留言附上預覽連結；
   檢查通過後合併發布，`draft` 分支會自動刪除，下一篇再建一個同名分支即可。

不要直接在 `main` 撰寫未完成文章：`main` 會觸發正式環境部署。半成品請留在 `draft` 分支，
分支本身就是草稿機制。同一時間只有一條寫作線；若同時寫兩篇，它們會一起預覽、一起發布。

## 自訂預覽網址（選用，一次性）

預設的預覽網址很長，可以綁成 `draft.blog.shuantt.com`，只需兩步：

1. Vercel：專案 `shuan-blog` 的 Settings、Domains，新增 `draft.blog.shuantt.com`，環境選 Preview
   並指定 Git 分支 `draft`。
2. Cloudflare：`shuantt.com` 的 DNS 新增一筆 CNAME，名稱 `draft.blog`，目標
   `cname.vercel-dns.com`，Proxy 狀態關閉（DNS only）。

DNS 生效後 Vercel 會自動簽發憑證，之後 `draft` 分支的最新預覽就固定在這個網址。

## 內容與圖片規則

- 標題、發布日期、分類與摘要是必填欄位。
- 分類只能從三個固定選項中選一個，選項名稱不要自行輸入，否則網站建置會失敗。
- 標籤可以自由新增多個，用來做分類底下更細的主題區分。
- 作者一般保留 `default`（Shuan Tseng）。
- 文章版型預設為「標準版型」（`PostLayout`），一般文章不需要更改。
- 「草稿」開關不要用來暫存半成品：`draft: true` 的文章放在 `data/posts/` 會讓 repository 的
  內容檢查失敗，分支上的 GitHub Actions 也會跟著失敗。暫存請靠分支，不要靠這個開關。
- 圖片會存入 `public/static/images/posts/`，文章內使用 `/static/images/posts/...` 路徑。
  「社群分享／橫幅圖片」欄位與內文圖片都使用同一個資料夾。
- 上傳圖片使用 JPG、PNG、WebP 或 GIF；HEIC 應先轉成 JPG 或 WebP。
- 站內連結使用 `/posts/<檔名>`、`/categories/...` 或 `/tags/...`；舊的 `/blog/...` 與
  `/posts/dev/...`、`/posts/life/...` 路徑不要再用。
- 一般 Markdown 可使用視覺化編輯器；含自訂 JSX 或複雜 MDX 時，改用 Source 模式並在桌機複查。
- 不要把待預覽文章放進 `data/draft/`；該目錄不會被 Contentlayer 編譯。

## 發布前檢查

Pull Request 應通過 repository 的既有檢查：

```bash
yarn check
yarn build
```

如果只是在手機撰寫，不需要在手機上執行這些指令；GitHub Actions 會在分支與 Pull Request
執行相同類型的內容、型別與建置檢查。檢查失敗時，最常見的原因是分類欄位沒選、摘要空白、
「草稿」開關被打開，或內文引用了不存在的圖片。
