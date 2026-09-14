import { slug } from 'github-slugger'

export interface CategoryItem {
  label: string
  slug: string
}

const categoryLabels = ['產品開發', '訓練紀錄', '生活／職涯']

export const categoryConfig: CategoryItem[] = categoryLabels.map((label) => ({
  label,
  slug: slug(label),
}))
