// Artalk's ESM locale export is not resolved by this project's legacy Node module resolution.
declare module 'artalk/i18n/zh-TW' {
  const locale: import('artalk').I18n
  export default locale
}
