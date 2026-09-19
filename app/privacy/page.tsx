import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import { PRIVACY_UPDATED_AT } from '@/lib/guestbook/privacy'

export const metadata = genPageMetadata({
  title: '隱私權條款',
  description: '說明 SHUANTT 留言與聯絡表單的資料蒐集、公開選擇、安全驗證與刪除申請方式。',
})

export default function Privacy() {
  return (
    <div className="pb-12 pt-6">
      <div className="border-b border-gray-200 pb-8 dark:border-gray-700">
        <h1 className="text-2xl font-bold leading-9 tracking-tight sm:text-3xl md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          隱私權條款 · 更新日期 <time dateTime={PRIVACY_UPDATED_AT}>{PRIVACY_UPDATED_AT}</time>
        </p>
      </div>
      <article className="prose mx-auto pt-8 dark:prose-invert">
        <p>
          SHUANTT 是 Shuan Tseng 經營的個人部落格。本頁說明你瀏覽本站、在文章留言或透過 Guestbook
          留言或聯絡我時，資料會如何使用。若有疑問，可寄信至{' '}
          <a href={`mailto:${siteMetadata.email}`}>{siteMetadata.email}</a>。
        </p>

        <h2>留言與聯絡會保存哪些資料？</h2>
        <p>
          Guestbook 會保存你提供的稱呼、網站網址、Email、留言內容及送出時間。 網址或 Email
          至少填寫一項。從文章連結進入時，也可以附上該篇文章的來源；送出前可移除。
          為了記錄這次同意，會一併保存隱私權條款版本與同意時間。
        </p>
        <p>
          這些資料用於閱讀與回覆訊息、討論合作或工作機會、管理公開留言及防止濫用。 Email
          不會顯示在公開留言板，也不會因為這次聯絡而被加入行銷或電子報名單。
          請不要在訊息中填入密碼、金融帳號或其他不必要的敏感資料。
        </p>
        <p>
          你可以選擇不提供資料。未填必填欄位、未勾選同意或未通過安全驗證時，無法使用表單送出，
          但仍可瀏覽網站或直接寄 Email。公開留言沒有留下 Email 時，我只能在留言板公開回覆。
        </p>

        <h2>哪些內容會公開？</h2>
        <p>
          Guestbook 為公開留言板。稱呼、網站網址、留言、日期及站主回覆會在審核通過後公開，
          可能被搜尋引擎收錄或由他人複製。Email 不會公開，僅用於回覆與聯絡。
          請勿在公開訊息內寫入不希望公開的聯絡方式或他人的個人資料。
        </p>
        <p>
          我不會將你選擇的私密訊息改為公開。若想移除已公開的留言，請使用下方的聯絡方式提出申請；
          本站移除後，外部搜尋快取或他人已保存的副本可能仍存在。
        </p>

        <h2>安全驗證與瀏覽器儲存</h2>
        <p>
          聯絡表單使用 Cloudflare Turnstile 防止自動化濫用。載入驗證時，Cloudflare 會處理 IP
          位址、瀏覽器與裝置訊號等驗證所需資訊。訊息內容與 Email 不會用於這項驗證。 詳細處理方式請見{' '}
          <Link href="https://www.cloudflare.com/turnstile-privacy-policy/">
            Cloudflare 隱私權說明
          </Link>
          。
        </p>
        <p>
          為維護網站安全與防止垃圾訊息，本站及必要服務供應商會處理連線資訊與使用紀錄， 其中可能包含
          IP 位址，並在安全維護所需期間內保留。
        </p>
        <p>
          Guestbook 不會在瀏覽器長期保存你的稱呼或聯絡資料。網站會記住主題偏好，
          並使用維持必要功能的 Cookie 或瀏覽器儲存。訪客不需要登入即可留言。
        </p>

        <h2>資料由誰處理、存放在哪裡？</h2>
        <p>
          訊息由站主處理，並由提供網站代管、資料儲存、安全防護與電子郵件的必要服務供應商協助處理。
          訊息與聯絡資料可能透過電子郵件通知站主，並用於後續回覆。
          這些服務可能在台灣以外的地區處理資料，實際位置依服務供應商的作業地區而定。
          除你選擇公開的內容、上述必要處理或依法應提供的情形外，不會將聯絡資料出售或提供給他人行銷。
        </p>

        <h2>網站分析與文章留言</h2>
        <p>
          本站使用 Google Analytics 了解瀏覽情形，可能透過 Cookie 與瀏覽器資訊記錄頁面瀏覽、
          裝置與使用行為。稱呼、Email 與訊息內容不會由本站主動提供作為分析資料。 相關處理請見{' '}
          <Link href="https://policies.google.com/privacy">Google 隱私權政策</Link>；
          你可透過瀏覽器的隱私設定限制相關儲存或追蹤。
        </p>
        <p>
          文章留言與 Guestbook 分開運作，可以不登入，並以公開討論為目的。
          本站會保存稱呼、Email（若提供）、網站連結、留言與圖片、回覆關係及時間， 並處理 IP
          與瀏覽器資訊以防止濫用。Email 不會公開，公開內容可能經過審核後顯示。
          瀏覽器會記住留言身分與草稿，登入時也會保存登入狀態；可登出或清除本站瀏覽器資料移除。 留下
          Email 並啟用通知時，可能收到回覆通知。想私下聯絡，請直接寄 Email。
        </p>
        <p>
          若選擇使用 Google 或 GitHub 登入，本站會取得辨識帳號所需的基本個人資料，
          例如帳號識別碼、顯示名稱、Email 或頭像資訊；實際資料依你授權的範圍而定。 請參閱{' '}
          <Link href="https://policies.google.com/privacy">Google 隱私權政策</Link>與{' '}
          <Link href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub 隱私權聲明
          </Link>
          。
        </p>

        <h2>保存期間與你的選擇</h2>
        <p>
          聯絡資料在處理訊息、後續往來及必要紀錄的範圍內保留；公開留言在留言板提供服務期間保留，
          直到站主移除或依申請刪除。目前訊息沒有固定天數的自動刪除機制。
          不再需要的資料可由站主刪除；涉及依法須保存的紀錄時，依必要期間處理。
        </p>
        <p>
          你可寄信至 <a href={`mailto:${siteMetadata.email}`}>{siteMetadata.email}</a>，
          申請查詢、閱覽、取得複本、更正、停止蒐集／處理／利用或刪除你的資料，也可撤回聯絡同意。
          請提供留言日期、稱呼或內容線索，方便確認範圍；為避免他人冒名，可能需要合理的身分確認。
          沒有留下 Email 的公開留言，也可透過上述方式提出申請。
        </p>
        <p>
          處理刪除申請時，會一併確認本站保存的訊息與相關郵件副本。
          備份與技術紀錄依服務供應商的保留週期到期移除，無法保證即時從所有備份消失。
        </p>

        <h2>條款更新</h2>
        <p>
          資料用途或服務有調整時，會更新本頁日期與內容； 過去的私密訊息不會因條款更新而改為公開。
        </p>
        <p>
          <Link href="/guestbook">前往留言板 →</Link>
        </p>
      </article>
    </div>
  )
}
