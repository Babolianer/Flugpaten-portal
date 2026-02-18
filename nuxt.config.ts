// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,
    // Deaktiviert den Vue Component Inspector (vite-plugin-vue-inspector), der bei orgs-map.vue einen 500-Fehler verursacht.
    componentInspector: false,
  },
  modules: [],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  css: ['~/assets/css/main.css', 'maplibre-gl/dist/maplibre-gl.css'],
  compatibilityDate: '2024-11-01',
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    maintenancePassword: process.env.MAINTENANCE_PASSWORD || 'b2bsellers',
    maintenanceAdminEmail: process.env.MAINTENANCE_ADMIN_EMAIL || 'admin@tierschutz.de',
    cookieName: 'tierschutz_session',
    libretranslateApiKey: process.env.LIBRETRANSLATE_API_KEY || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
    mailFrom: process.env.MAIL_FROM || 'PawBridge Flugpaten <onboarding@resend.dev>',
    mailLogoUrl: process.env.MAIL_LOGO_URL || '',
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
  app: {
    head: {
      title: 'Tierschutz-Flugpaten Portal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Wähle dein Reiseziel und hilf einem Tier' },
      ],
    },
  },
})
