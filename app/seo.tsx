import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'

interface PageSEOProps {
  title: string
  description?: string
  image?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

// Dimensions and alt text let social crawlers lay the card out before fetching the image.
export const socialBannerImage = {
  url: siteMetadata.socialBanner,
  width: 1200,
  height: 600,
  alt: siteMetadata.title,
}

export function genPageMetadata({ title, description, image, ...rest }: PageSEOProps): Metadata {
  const images = image ? [image] : [socialBannerImage]
  return {
    title,
    description: description || siteMetadata.description,
    openGraph: {
      title: `${title} | ${siteMetadata.title}`,
      description: description || siteMetadata.description,
      url: './',
      siteName: siteMetadata.title,
      images,
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      title: `${title} | ${siteMetadata.title}`,
      card: 'summary_large_image',
      images,
    },
    ...rest,
  }
}
