import { getUserFromEvent } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    return { user: null, memberships: [] }
  }

  const memberships = (user as { memberships?: { organization: { id: string; name: string; slug: string; status: string } }[] }).memberships?.map((m) => ({
    organizationId: m.organization.id,
    organizationName: m.organization.name,
    slug: m.organization.slug,
    status: m.organization.status,
  }))

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      phone: user.phone,
      emailVerified: (user as { emailVerified?: boolean }).emailVerified,
    },
    memberships: memberships || [],
  }
})
