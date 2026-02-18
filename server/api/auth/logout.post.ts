export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cookieName = config.cookieName || 'tierschutz_session'
  deleteCookie(event, cookieName, { path: '/' })
  return { ok: true }
})
