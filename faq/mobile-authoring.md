# 手機寫作與發布

本專案使用 Pages CMS 編輯 GitHub repository 裡的 MDX 文章。CMS 只負責內容編輯，
正式網站仍由既有的 Contentlayer、GitHub 與 Vercel 流程建置。

## 第一次設定

1. 前往 <https://app.pagescms.org>，使用 GitHub 登入。
2. 安裝 Pages CMS GitHub App 時，只授權 `shuantt/tailwind-nextjs-blog`。
3. 開啟 repository；CMS 會讀取根目錄的 `.pages.yml`。

## 建議的手機寫作流程

1. 先在 GitHub 從 `main` 建立 `writing/<article-slug>` 分支。
2. 在 Pages CMS 切換到該分支，再進入「文章」。
3. 在正確的分類目錄（目前為 `dev` 或 `life`）建立文章。
4. 新檔名使用小寫英文、數字與連字號，例如 `mobile-authoring`。CMS 會依設定建立 `.mdx`
   檔案，因此檔名欄位若已顯示副檔名，不要重複輸入 `.mdx`。
5. 儲存後等待 GitHub Actions 與 Vercel Preview 完成，確認預覽內容。
6. 從 `writing/<article-slug>` 對 `main` 開 Pull Request；檢查通過後再合併發布。

不要直接在 `main` 撰寫未完成文章：`main` 會觸發正式環境部署。

## 內容與圖片規則

- 標題、日期與摘要是必填欄位。
- 作者一般保留 `default`。
- 圖片會存入 `public/static/images/posts/`，文章內使用 `/static/images/posts/...` 路徑。
- 上傳圖片使用 JPG、PNG、WebP 或 GIF；HEIC 應先轉成 JPG 或 WebP。
- 一般 Markdown 可使用視覺化編輯器；含自訂 JSX 或複雜 MDX 時，改用 Source 模式並在桌機複查。
- 不要把待預覽文章放進 `data/draft/`；該目錄不會被 Contentlayer 編譯。

## 發布前檢查

Pull Request 應通過 repository 的既有檢查：

```bash
yarn check
yarn build
```

如果只是在手機撰寫，不需要在手機上執行這些指令；GitHub Actions 會在分支與 Pull Request
執行相同類型的內容、型別與建置檢查。
