// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  experimental: {
    appManifest: false,
  },
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
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-11-01',
  nitro: {
    preset: 'vercel',
    serverAssets: [{ baseName: 'data', dir: './data' }],
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    maintenancePassword: process.env.MAINTENANCE_PASSWORD || 'b2bsellers',
    maintenanceAdminEmail: process.env.MAINTENANCE_ADMIN_EMAIL || 'admin@tierschutz.de',
    cookieName: 'tierschutz_session',
    libretranslateApiKey: process.env.LIBRETRANSLATE_API_KEY || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
    smtpSecure: process.env.SMTP_SECURE !== 'false',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
    mailFrom: process.env.MAIL_FROM || 'PawTransfer <noreply@pawtransfer.net>',
    mailLogoUrl: process.env.MAIL_LOGO_URL || '',
    adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || '',
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-SCGFJKSM77',
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
