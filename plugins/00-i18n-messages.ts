export default defineNuxtPlugin({
  name: 'i18n-locale-messages',
  enforce: 'pre',
  async setup() {
    await initI18nLocaleMessages()
  },
})
