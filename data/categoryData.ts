import { slug } from 'github-slugger'

export interface CategoryItem {
  label: string
  slug: string
  // Doubles as the category page's meta description and its intro paragraph.
  description: string
}

const categories: Omit<CategoryItem, 'slug'>[] = [
  {
    label: '產品開發',
    description:
      '網站與產品開發的實作紀錄與心得，從技術選型、架構到部署，以及與 AI 協作開發的經驗與反思。',
  },
  {
    label: '學習成長',
    description: '學習方法、職涯轉換與技能養成的反思，記錄從設計走向程式的過程。',
  },
  {
    label: '生活紀錄',
    description: '日常、運動與旅行的生活紀錄，包含抱石、跑步與各種新嘗試。',
  },
]

export const categoryConfig: CategoryItem[] = categories.map((category) => ({
  ...category,
  slug: slug(category.label),
}))
