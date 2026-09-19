import localFont from 'next/font/local'

export const heroLatin = localFont({
  src: [
    { path: './silkscreen/Silkscreen-Regular.ttf', weight: '400', style: 'normal' },
    { path: './silkscreen/Silkscreen-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-hero-latin',
  display: 'swap',
  adjustFontFallback: false,
})

// Unmodified upstream font; the directory includes its original OFL license.
export const heroPixel = localFont({
  src: './cubic-11/Cubic_11.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-hero-pixel',
  display: 'swap',
  adjustFontFallback: false,
})
