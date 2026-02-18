export type AuthUser = {
  id: string
  email: string
  role: string
  displayName: string
  phone: string | null
} | null

export function useAuth() {
  const user = useState<AuthUser>('auth-user', () => null)

  async function fetchUser() {
    try {
      const data = await $fetch<{ user: AuthUser }>('/api/auth/me')
      user.value = data.user
    } catch {
      user.value = null
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/')
  }

  return { user, fetchUser, logout }
}
