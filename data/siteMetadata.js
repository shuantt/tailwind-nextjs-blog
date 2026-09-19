/** @type {Omit<import("pliny/config").PlinyConfig, 'comments'> & { comments: { provider: 'artalk', site: string } }} */
const siteMetadata = {
  title: `SHUANTT`,
  author: 'Shuan Tseng',
  headerTitle: 'SHUANTT',
  headerTagline: 'DEV & DESIGN BY SHUAN TSENG',
  description: '關於職涯、生活、個人創作、專案，以及軟體與產品使用經驗的記錄。',
  // SEO copy shared by app/layout.tsx and app/page.tsx. `title` stays the brand suffix used
  // by the `%s | SHUANTT` template; `defaultTitle` is the full homepage title that carries
  // the descriptive keywords.
  seo: {
    defaultTitle: 'SHUANTT｜Shuan Tseng 的開發、設計與生活部落格',
    // Google picks the site name shown above results from WebSite JSON-LD name/alternateName.
    alternateName: 'Shuan Tseng 的部落格',
    postsDescription:
      'Shuan Tseng 的全部文章，涵蓋產品開發、學習成長與生活紀錄三個分類，依發布日期排序。',
  },
  language: 'zh-TW',
  theme: 'system', // initial load follows OS preference; switch button only offers light/dark
  siteUrl: 'https://blog.shuantt.com',
  siteRepo: 'https://github.com/shuantt/tailwind-nextjs-blog',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,
  // mastodon: 'https://mastodon.social/@mastodonuser',
  email: 'tehsuan.tht@gmail.com',
  github: 'https://github.com/shuantt',
  // x: 'https://twitter.com/x',
  // twitter: 'https://twitter.com/Twitter',
  // facebook: 'https://facebook.com',
  // youtube: 'https://youtube.com',
  // linkedin: 'https://www.linkedin.com',
  // threads: 'https://www.threads.net',
  // instagram: 'https://www.instagram.com',
  // medium: 'https://medium.com',
  // bluesky: 'https://bsky.app/',
  locale: 'zh-TW',
  // set to true if you want a navbar fixed to the top
  stickyNav: true,
  analytics: {
    // If you want to use an analytics provider you have to add it to the
    // content security policy in the `next.config.js` file.
    // supports Plausible, Simple Analytics, Umami, Posthog or Google Analytics.
    // umamiAnalytics: {
    //   // We use an env variable for this site to avoid other users cloning our analytics ID
    //   umamiWebsiteId: process.env.NEXT_UMAMI_ID, // e.g. 123e4567-e89b-12d3-a456-426614174000
    //   // You may also need to overwrite the script if you're storing data in the US - ex:
    //   // src: 'https://us.umami.is/script.js'
    //   // Remember to add 'us.umami.is' in `next.config.js` as a permitted domain for the CSP
    // },
    // plausibleAnalytics: {
    //   plausibleDataDomain: '', // e.g. tailwind-nextjs-starter-blog.vercel.app
    // If you are hosting your own Plausible.
    //   src: '', // e.g. https://plausible.my-domain.com/js/script.js
    // },
    // simpleAnalytics: {},
    // posthogAnalytics: {
    //   posthogProjectApiKey: '', // e.g. 123e4567-e89b-12d3-a456-426614174000
    // },
    googleAnalytics: {
      googleAnalyticsId: 'G-V5KP9LC9B6', // e.g. G-XXXXXXX
    },
  },
  comments: {
    provider: 'artalk',
    site: 'SHUANTT',
  },
  search: {
    provider: 'kbar', // kbar or algolia
    kbarConfig: {
      searchDocumentsPath: '/search.json',
    },
    // provider: 'algolia',
    // algoliaConfig: {
    //   // The application ID provided by Algolia
    //   appId: 'R2IYF7ETH7',
    //   // Public API key: it is safe to commit it
    //   apiKey: '599cec31baffa4868cae4e79f180729b',
    //   indexName: 'docsearch',
    // },
  },
}

module.exports = siteMetadata
