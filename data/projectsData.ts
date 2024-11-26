interface Project {
  title: string
  description: string
  frontend?: string
  backend?: string
  demoUrl?: string
  apiUrl?: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'CiaoCraft!',
    description: `CiaoCraft! 是一個手作課程販售平台 (B2B2C)。專案範圍含 前台網站 (會員管理) 和 商家管理後台。此作品為六角《 Node.js 前後端產品入門班 》團體專題。`,
    imgSrc: '/static/images/projects/ciaocraft/banner.jpg',
    frontend: 'Nuxt 3 (Vue 3), Pinia, Tailwind CSS',
    backend: 'Node.js, Express, MongoDB, Mongoose',
    demoUrl: 'https://ciaocraft-website.vercel.app/',
    apiUrl: 'https://ciaocraft-api.onrender.com/v1/#/',
    href: '',
  },
  {
    title: 'XSpace',
    description: `XSpace 是一個共享場地租借平台 (B2B2C)，具有完整租借方場地上架、管理，及出租方的預訂管理功能。範圍包含 前台網站 (買家、賣家管理) 和 平台方管理後台。此為 Build School 培訓課程結業作品。`,
    imgSrc: '/static/images/projects/xspace/banner.jpg',
    frontend: 'Bootstrap 5, SCSS, .NET Razor Pages with Vue 2',
    backend: '.NET 5 MVC, EF, Dapper, MSSQL, Clean Architecture',
    demoUrl: 'https://xspace-frontend.azurewebsites.net/Home',
    href: '',
  },
]

export default projectsData
