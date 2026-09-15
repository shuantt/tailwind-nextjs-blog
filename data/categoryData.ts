import { slug } from 'github-slugger'

export interface CategoryItem {
  label: string
  slug: string
}

const categoryLabels = ['產品開發', '學習成長', '生活紀錄']

export const categoryConfig: CategoryItem[] = categoryLabels.map((label) => ({
  label,
  slug: slug(label),
}))
