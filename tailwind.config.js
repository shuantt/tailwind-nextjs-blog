// @ts-check
const { fontFamily } = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

/** @type {import("tailwindcss/types").Config } */
module.exports = {
  content: [
    './node_modules/pliny/**/*.js',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './layouts/**/*.{js,ts,tsx}',
    './data/**/*.mdx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', ...fontFamily.sans],
      },
      colors: {
        // 全站配色統一入口：要換整體風格，只需要改這兩個色階名稱指向的 Tailwind
        // 內建色（例如 colors.rose、colors.violet），或替換成自訂色階物件
        // { 50: '#..', ..., 900: '#..' }，全站用到 primary-*/secondary-* 的地方
        // 都會自動套用，不用逐一元件修改。
        primary: {
          // 電路板霓虹橘 — 自訂色階（非 Tailwind 內建色），飽和、偏紅橘，在深色背景上
          // 有發光感。之後想再換色系，直接整組替換或改回 colors.xxx 即可。
          50: '#fff3ed',
          100: '#ffe2d1',
          200: '#ffc3a3',
          300: '#ff9d6e',
          400: '#ff7a42',
          500: '#ff5a1f',
          600: '#eb4210',
          700: '#c2340d',
          800: '#9a2c10',
          900: '#7c2710',
        }, // 主要強調色：標題、連結、按鈕、tag、hover 狀態
        secondary: colors.indigo, // 次要強調色：目前用於文章內文的 inline code 顏色
        gray: colors.gray,
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.600')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2': {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: theme('colors.secondary.500'),
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.400')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('colors.gray.100'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
