<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface PendingOrg {
  id: string
  name: string
  slug: string
  description?: string | null
  contactEmail: string
  status: string
  createdByUser?: { displayName: string; email: string }
  locations?: { id: string }[]
}

interface ApprovedOrg {
  id: string
  name: string
  slug: string
  contactEmail: string
  preferredLanguage: string
  createdAt: string
  createdByUser: {
    id: string
    email: string
    displayName: string
    emailVerified: boolean
    lastLoginAt: string | null
    adminNotes: string | null
  } | null
  profileComplete: boolean
  transportsCount: number
}

interface BlockedOrg extends ApprovedOrg {
  status: 'CANCELLED' | 'REJECTED'
}

interface TransportRequestRow {
  id: string
  title: string
  status: string
  earliestDate: string
  latestDate: string
  originAirport: string
  destAirport: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  animal: { id: string; name: string; species: string } | null
  createdAt: string
}

const { t, locale } = useI18n()
const pendingOrgs = ref<PendingOrg[]>([])
const pendingPage = ref(1)
const pendingTotal = ref(0)
const pendingTotalPages = ref(0)
const pendingPageSize = ref(15)
const pendingSearch = ref('')
const approvedOrgs = ref<ApprovedOrg[]>([])
const approvedPage = ref(1)
const approvedTotal = ref(0)
const approvedTotalPages = ref(0)
const approvedPageSize = ref(15)
const approvedSearch = ref('')
const blockedOrgs = ref<BlockedOrg[]>([])
const blockedPage = ref(1)
const blockedTotal = ref(0)
const blockedTotalPages = ref(0)
const blockedPageSize = ref(15)
const blockedSearch = ref('')
const blockedStatusFilter = ref<string>('')
const requests = ref<TransportRequestRow[]>([])
const requestsPage = ref(1)
const requestsTotal = ref(0)
const requestsTotalPages = ref(0)
const requestsPageSize = ref(15)
const requestsSearch = ref('')
const requestsStatusFilter = ref<string>('')
const loading = ref(true)
const loadingApproved = ref(true)
const loadingBlocked = ref(true)
const loadingRequests = ref(true)
const message = ref('')
const activeTab = ref<'overview' | 'organizations' | 'requests' | 'acquise' | 'reviews' | 'mailing' | 'settings'>('overview')
const sidebarCollapsed = ref(false)
const sidebarMobileOpen = ref(false)
const acquiseMenuOpen = ref(true)
const organizationsMenuOpen = ref(true)
const mailingMenuOpen = ref(true)
const mailingSubTab = ref<'flows' | 'archive'>('flows')
const mailflowMode = ref<'oneTime' | 'workflows'>('oneTime')

const pageHeading = computed(() => {
  if (activeTab.value === 'overview') return t('admin.tabOverview')
  if (activeTab.value === 'organizations') return t('admin.tabOrganizations')
  if (activeTab.value === 'requests')
    return `${t('admin.tabOrganizations')} – ${t('admin.orgNav.transportRequests')}`
  if (activeTab.value === 'acquise') {
    const subKey: Record<typeof acquiseSubTab.value, string> = {
      users: 'admin.acquise.tabUsers',
      registeredOrgs: 'admin.acquise.tabRegisteredOrgs',
      orgaAquise: 'admin.orgaAquise.tabOrgaAquise',
    }
    return `${t('admin.tabAcquise')} – ${t(subKey[acquiseSubTab.value])}`
  }
  if (activeTab.value === 'reviews') return t('admin.tabReviews')
  if (activeTab.value === 'mailing') {
    const subKey: Record<typeof mailingSubTab.value, string> = {
      flows: 'admin.mailing.subTabFlows',
      archive: 'admin.mailing.subTabArchive',
    }
    return `${t('admin.tabMailing')} – ${t(subKey[mailingSubTab.value])}`
  }
  if (activeTab.value === 'settings') return t('admin.tabSettings')
  return ''
})

const maintenanceMode = ref(false)
const loadingMaintenance = ref(false)
const savingMaintenance = ref(false)
const acquiseSubTab = ref<'users' | 'registeredOrgs' | 'orgaAquise'>('users')

interface AdminUserRow {
  id: string
  email: string
  displayName: string
  preferredLanguage: string
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
  adminNotes: string | null
  blockedAt: string | null
  profileComplete: boolean
  completedFlightsCount: number
}
const adminUsers = ref<AdminUserRow[]>([])
const adminUsersPage = ref(1)
const adminUsersTotal = ref(0)
const adminUsersTotalPages = ref(0)
const loadingAdminUsers = ref(false)
const adminUsersFilterNew = ref(false)
const adminUsersFilterUnverified = ref(false)
const adminUsersFilterActive = ref(false)
const adminUsersFilterProfileComplete = ref(false)
const adminUsersFilterLastLoginFrom = ref('')
const adminUsersFilterLastLoginTo = ref('')
const adminUsersSearch = ref('')
const savingUserNotesId = ref<string | null>(null)
const savingOrgUserNotesId = ref<string | null>(null)
const savingUserLanguageId = ref<string | null>(null)
const savingOrgLanguageId = ref<string | null>(null)
const verifyingUserId = ref<string | null>(null)
const blockingUserId = ref<string | null>(null)
const adminUsersListBlocked = ref(false)
const languageOptions = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pl', label: 'Polski' },
] as const

interface ReportedReviewRow {
  id: string
  rating: number
  comment: string | null
  orgResponse: string | null
  createdAt: string
  reviewerName: string
  reviewerEmail: string
  orgName: string | null
  orgSlug: string | null
  requestTitle: string
  reportsCount: number
  reportReasons: string[]
}
const adminReviews = ref<ReportedReviewRow[]>([])
const loadingAdminReviews = ref(false)
const deletingReviewId = ref<string | null>(null)
const reviewsPage = ref(1)
const reviewsTotal = ref(0)
const reviewsTotalPages = ref(0)
const reviewsPageSize = ref(15)
const reviewsSearch = ref('')
const reviewsHasReports = ref(false)
const stats = ref<{ orgsCount: number; transportsCount: number; activeTransportsCount: number; usersCount: number } | null>(null)
const loadingStats = ref(false)

const { getRequestStatusLabel } = useRequestStatus()

/** Gibt die anzuzeigenden Seitenzahlen für die Paginierung zurück (inkl. 'ellipsis' für Auslassungen) */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = []
  if (current <= 4) {
    for (let i = 1; i <= Math.min(5, total); i++) pages.push(i)
    if (total > 6) pages.push('ellipsis', total)
  } else if (current >= total - 3) {
    pages.push(1, 'ellipsis')
    for (let i = Math.max(1, total - 4); i <= total; i++) pages.push(i)
  } else {
    pages.push(1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total)
  }
  return pages
}

async function loadMaintenance() {
  loadingMaintenance.value = true
  try {
    const res = await $fetch<{ maintenance: boolean }>('/api/admin/maintenance')
    maintenanceMode.value = res.maintenance
  } catch {
    maintenanceMode.value = false
  } finally {
    loadingMaintenance.value = false
  }
}

async function setMaintenance(value: boolean) {
  savingMaintenance.value = true
  message.value = ''
  try {
    const res = await $fetch<{ maintenance: boolean }>('/api/admin/maintenance', {
      method: 'PATCH',
      body: { maintenance: value },
    })
    maintenanceMode.value = res.maintenance
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.value = err?.data?.message || 'Wartungsmodus konnte nicht gespeichert werden.'
  } finally {
    savingMaintenance.value = false
  }
}

async function loadPending(page = 1) {
  try {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pendingPageSize.value))
    if (pendingSearch.value.trim()) params.set('search', pendingSearch.value.trim())
    const res = await $fetch<{
      organizations: PendingOrg[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('/api/admin/orgs?' + params.toString())
    pendingOrgs.value = res.organizations
    pendingPage.value = res.pagination.page
    pendingTotal.value = res.pagination.total
    pendingTotalPages.value = res.pagination.totalPages
  } catch (e: unknown) {
    if ((e as { statusCode?: number })?.statusCode === 403) {
      await navigateTo('/login')
    }
    message.value = 'Fehler beim Laden'
  } finally {
    loading.value = false
  }
}

async function loadApproved(page = 1) {
  try {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(approvedPageSize.value))
    if (approvedSearch.value.trim()) params.set('search', approvedSearch.value.trim())
    const res = await $fetch<{
      organizations: ApprovedOrg[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('/api/admin/orgs/approved?' + params.toString())
    approvedOrgs.value = res.organizations
    approvedPage.value = res.pagination.page
    approvedTotal.value = res.pagination.total
    approvedTotalPages.value = res.pagination.totalPages
  } catch {
    message.value = 'Fehler beim Laden der Organisationen'
  } finally {
    loadingApproved.value = false
  }
}

async function loadBlocked(page = 1) {
  try {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(blockedPageSize.value))
    if (blockedSearch.value.trim()) params.set('search', blockedSearch.value.trim())
    if (blockedStatusFilter.value) params.set('status', blockedStatusFilter.value)
    const res = await $fetch<{
      organizations: BlockedOrg[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('/api/admin/orgs/blocked?' + params.toString())
    blockedOrgs.value = res.organizations
    blockedPage.value = res.pagination.page
    blockedTotal.value = res.pagination.total
    blockedTotalPages.value = res.pagination.totalPages
  } catch {
    message.value = 'Fehler beim Laden der gesperrten Organisationen'
  } finally {
    loadingBlocked.value = false
  }
}

async function loadRequests(page = 1) {
  try {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(requestsPageSize.value))
    if (requestsSearch.value.trim()) params.set('search', requestsSearch.value.trim())
    if (requestsStatusFilter.value) params.set('status', requestsStatusFilter.value)
    const res = await $fetch<{
      requests: TransportRequestRow[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('/api/admin/requests?' + params.toString())
    requests.value = res.requests
    requestsPage.value = res.pagination.page
    requestsTotal.value = res.pagination.total
    requestsTotalPages.value = res.pagination.totalPages
  } catch {
    message.value = 'Fehler beim Laden der Transportanfragen'
  } finally {
    loadingRequests.value = false
  }
}

function goToPendingPage(p: number) {
  if (p < 1 || p > pendingTotalPages.value) return
  loadPending(p)
}

function goToApprovedPage(p: number) {
  if (p < 1 || p > approvedTotalPages.value) return
  loadApproved(p)
}

function goToBlockedPage(p: number) {
  if (p < 1 || p > blockedTotalPages.value) return
  loadBlocked(p)
}

function goToRequestsPage(p: number) {
  if (p < 1 || p > requestsTotalPages.value) return
  loadRequests(p)
}

async function loadAdminUsers(page = 1) {
  loadingAdminUsers.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', '15')
    if (adminUsersFilterNew.value) params.set('filterNew', 'true')
    if (adminUsersFilterUnverified.value) params.set('filterUnverified', 'true')
    if (adminUsersFilterActive.value) params.set('filterActive', 'true')
    if (adminUsersFilterProfileComplete.value) params.set('filterProfileComplete', 'true')
    if (adminUsersFilterLastLoginFrom.value) params.set('lastLoginFrom', adminUsersFilterLastLoginFrom.value)
    if (adminUsersFilterLastLoginTo.value) params.set('lastLoginTo', adminUsersFilterLastLoginTo.value)
    if (adminUsersSearch.value.trim()) params.set('search', adminUsersSearch.value.trim())
    if (adminUsersListBlocked.value) params.set('list', 'blocked')
    const res = await $fetch<{
      users: AdminUserRow[]
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>('/api/admin/users?' + params.toString())
    adminUsers.value = res.users
    adminUsersPage.value = res.page
    adminUsersTotal.value = res.total
    adminUsersTotalPages.value = res.totalPages
  } catch {
    message.value = 'Fehler beim Laden der Nutzer'
  } finally {
    loadingAdminUsers.value = false
  }
}

function goToAdminUsersPage(p: number) {
  if (p < 1 || p > adminUsersTotalPages.value) return
  loadAdminUsers(p)
}

async function saveUserNotes(u: AdminUserRow, notes: string) {
  savingUserNotesId.value = u.id
  try {
    await $fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      body: { adminNotes: notes || null },
    })
    u.adminNotes = notes || null
  } catch {
    message.value = 'Notiz konnte nicht gespeichert werden'
  } finally {
    savingUserNotesId.value = null
  }
}

async function saveOrgUserNotes(org: ApprovedOrg, notes: string) {
  const userId = org.createdByUser?.id
  if (!userId) return
  savingOrgUserNotesId.value = org.id
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: { adminNotes: notes || null },
    })
    if (org.createdByUser) org.createdByUser.adminNotes = notes || null
  } catch {
    message.value = 'Notiz konnte nicht gespeichert werden'
  } finally {
    savingOrgUserNotesId.value = null
  }
}

async function saveUserLanguage(u: AdminUserRow, preferredLanguage: string) {
  savingUserLanguageId.value = u.id
  try {
    await $fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      body: { preferredLanguage },
    })
    u.preferredLanguage = preferredLanguage
  } catch {
    message.value = 'Sprache konnte nicht gespeichert werden'
  } finally {
    savingUserLanguageId.value = null
  }
}

async function saveOrgLanguage(org: ApprovedOrg, preferredLanguage: string) {
  savingOrgLanguageId.value = org.id
  try {
    await $fetch(`/api/admin/orgs/${org.id}`, {
      method: 'PATCH',
      body: { preferredLanguage },
    })
    org.preferredLanguage = preferredLanguage
  } catch {
    message.value = 'Orga-Sprache konnte nicht gespeichert werden'
  } finally {
    savingOrgLanguageId.value = null
  }
}

async function setUserBlocked(u: AdminUserRow, blocked: boolean) {
  const msg = blocked ? t('admin.acquise.confirmBlockUser') : t('admin.acquise.confirmUnblockUser')
  if (!confirm(msg)) return
  blockingUserId.value = u.id
  message.value = ''
  try {
    await $fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body: { blocked } })
    await loadAdminUsers(adminUsersPage.value)
    await loadStats()
  } catch {
    message.value = blocked ? t('admin.acquise.blockUserError') : t('admin.acquise.unblockUserError')
  } finally {
    blockingUserId.value = null
  }
}

async function verifyUser(u: AdminUserRow) {
  if (u.emailVerified) return
  verifyingUserId.value = u.id
  message.value = ''
  try {
    await $fetch(`/api/admin/users/${u.id}/verify`, { method: 'PATCH' })
    u.emailVerified = true
    message.value = t('admin.acquise.verifySuccess')
  } catch {
    message.value = t('admin.acquise.verifyError')
  } finally {
    verifyingUserId.value = null
  }
}

async function verifyOrgUser(org: ApprovedOrg) {
  const userId = org.createdByUser?.id
  if (!userId || org.createdByUser?.emailVerified) return
  verifyingUserId.value = userId
  message.value = ''
  try {
    await $fetch(`/api/admin/users/${userId}/verify`, { method: 'PATCH' })
    if (org.createdByUser) org.createdByUser.emailVerified = true
    message.value = t('admin.acquise.verifySuccess')
  } catch {
    message.value = t('admin.acquise.verifyError')
  } finally {
    verifyingUserId.value = null
  }
}

async function load() {
  loading.value = true
  loadingApproved.value = true
  loadingBlocked.value = true
  loadingRequests.value = true
  await Promise.all([loadPending(), loadApproved(), loadBlocked(), loadRequests()])
}

async function approve(id: string) {
  try {
    await $fetch(`/api/admin/orgs/${id}/approve`, { method: 'POST' })
    await Promise.all([loadPending(pendingPage.value), loadApproved(approvedPage.value)])
  } catch {
    message.value = 'Fehler beim Genehmigen'
  }
}

async function reject(id: string) {
  try {
    await $fetch(`/api/admin/orgs/${id}/reject`, { method: 'POST' })
    await loadPending(pendingPage.value)
  } catch {
    message.value = 'Fehler beim Ablehnen'
  }
}

function viewAsOrg(orgId: string) {
  navigateTo({ path: '/org/dashboard', query: { asOrg: orgId } })
}

function openOrgCrm(orgId: string) {
  const target = `/admin-crm/${orgId}`
  navigateTo(target)
  if (process.client) {
    window.location.assign(target)
  }
}

async function blockOrg(id: string) {
  if (!confirm(t('admin.confirmBlock'))) return
  try {
    await $fetch(`/api/admin/orgs/${id}/block`, { method: 'POST' })
    message.value = ''
    await Promise.all([loadApproved(approvedPage.value), loadBlocked(blockedPage.value), loadRequests(requestsPage.value)])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.value = err?.data?.message ?? 'Fehler beim Sperren'
  }
}

async function unblockOrg(id: string) {
  if (!confirm(t('admin.confirmUnblock'))) return
  try {
    await $fetch(`/api/admin/orgs/${id}/unblock`, { method: 'POST' })
    message.value = ''
    await Promise.all([loadApproved(approvedPage.value), loadPending(pendingPage.value), loadBlocked(blockedPage.value)])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.value = err?.data?.message ?? 'Fehler beim Entsperren'
  }
}

async function loadStats() {
  loadingStats.value = true
  try {
    stats.value = await $fetch<{ orgsCount: number; transportsCount: number; activeTransportsCount: number; usersCount: number }>('/api/admin/stats')
  } catch {
    stats.value = null
  } finally {
    loadingStats.value = false
  }
}

async function loadAdminReviews(page = 1) {
  loadingAdminReviews.value = true
  try {
    const query: Record<string, string | number | boolean> = { page, pageSize: reviewsPageSize.value }
    if (reviewsSearch.value.trim()) query.search = reviewsSearch.value.trim()
    if (reviewsHasReports.value) query.hasReports = 'true'
    const res = await $fetch<{
      reviews: ReportedReviewRow[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('/api/admin/reviews', { query })
    adminReviews.value = res.reviews
    reviewsPage.value = res.pagination.page
    reviewsTotal.value = res.pagination.total
    reviewsTotalPages.value = res.pagination.totalPages
  } catch {
    adminReviews.value = []
  } finally {
    loadingAdminReviews.value = false
  }
}

function goToReviewsPage(p: number) {
  if (p < 1 || p > reviewsTotalPages.value) return
  loadAdminReviews(p)
}

async function deleteReview(id: string) {
  if (!confirm(t('admin.reviews.confirmDelete'))) return
  deletingReviewId.value = id
  try {
    await $fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    adminReviews.value = adminReviews.value.filter((r) => r.id !== id)
    message.value = ''
  } catch {
    message.value = t('admin.reviews.deleteError')
  } finally {
    deletingReviewId.value = null
  }
}

watch([activeTab, acquiseSubTab], ([tab, sub]) => {
  if (tab === 'organizations') {
    loadPending()
    loadApproved()
    loadBlocked()
  }
  if (tab === 'requests') loadRequests(requestsPage.value)
  if (tab === 'acquise' && sub === 'users') loadAdminUsers()
  if (tab === 'acquise' && sub === 'registeredOrgs') loadApproved()
  if (tab === 'reviews') loadAdminReviews(reviewsPage.value)
  if (tab === 'overview') loadStats()
})

watch(
  [
    adminUsersFilterNew,
    adminUsersFilterUnverified,
    adminUsersFilterActive,
    adminUsersFilterProfileComplete,
    adminUsersFilterLastLoginFrom,
    adminUsersFilterLastLoginTo,
    adminUsersSearch,
    adminUsersListBlocked,
  ],
  () => {
    if (activeTab.value === 'acquise' && acquiseSubTab.value === 'users') loadAdminUsers(1)
  },
)

watch(activeTab, (tab) => {
  if (tab === 'acquise') acquiseMenuOpen.value = true
  if (tab === 'organizations' || tab === 'requests') organizationsMenuOpen.value = true
  if (tab === 'mailing') mailingMenuOpen.value = true
})

function toggleOrganizationsNav() {
  organizationsMenuOpen.value = !organizationsMenuOpen.value
  if (activeTab.value !== 'organizations' && activeTab.value !== 'requests') {
    activeTab.value = 'organizations'
  }
}

onMounted(() => {
  load()
  loadMaintenance()
  loadStats()
})
</script>

<template>
  <div class="container mx-auto w-full max-w-[100rem] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
    <div class="flex gap-6">
      <!-- Desktop Sidebar -->
      <aside
        class="hidden md:flex flex-col border-r border-slate-200/80 bg-slate-50 shrink-0"
        :class="sidebarCollapsed ? 'w-[4.25rem]' : 'w-64'"
      >
        <div class="px-3 py-3 flex items-center justify-between gap-2 border-b border-slate-200/80">
          <div class="flex items-center gap-2 min-w-0" :class="sidebarCollapsed ? 'justify-center w-full' : ''">
            <span class="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-500 [&_svg]:h-5 [&_svg]:w-5" aria-hidden="true">
              <AdminSidebarGlyph name="overview" />
            </span>
            <span v-if="!sidebarCollapsed" class="text-sm font-bold text-slate-900 tracking-tight truncate">Admin</span>
          </div>
          <button
            v-if="!sidebarCollapsed"
            type="button"
            class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 transition-colors shrink-0"
            aria-label="Sidebar einklappen"
            @click="sidebarCollapsed = true"
          >
            <span class="text-lg leading-none" aria-hidden="true">‹</span>
          </button>
          <button
            v-else
            type="button"
            class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 transition-colors mx-auto"
            aria-label="Sidebar ausklappen"
            @click="sidebarCollapsed = false"
          >
            <span class="text-lg leading-none" aria-hidden="true">›</span>
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-6" aria-label="Admin Navigation">
          <!-- Übersicht -->
          <div>
            <button
              type="button"
              :title="sidebarCollapsed ? t('admin.tabOverview') : undefined"
              class="w-full flex items-center gap-2.5 rounded-md py-2 text-left text-sm font-semibold border-l-[3px] transition-colors"
              :class="[
                sidebarCollapsed ? 'justify-center px-0' : 'pl-2 pr-2',
                activeTab === 'overview'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900'
                  : 'border-transparent text-slate-700 hover:bg-slate-100/90',
              ]"
              @click="activeTab = 'overview'; loadStats()"
            >
              <AdminSidebarGlyph
                name="overview"
                class="shrink-0"
                :class="activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span v-if="!sidebarCollapsed" class="truncate">{{ t('admin.tabOverview') }}</span>
            </button>
          </div>

          <!-- Organisationen -->
          <div>
            <p
              v-if="!sidebarCollapsed"
              class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {{ t('admin.tabOrganizations') }}
            </p>
            <button
              type="button"
              :title="sidebarCollapsed ? t('admin.tabOrganizations') : undefined"
              class="w-full flex items-center gap-2.5 rounded-md py-2 text-left text-sm font-semibold border-l-[3px] border-transparent text-slate-800 hover:bg-slate-100/90 transition-colors"
              :class="sidebarCollapsed ? 'justify-center px-0' : 'pl-2 pr-2'"
              @click="toggleOrganizationsNav()"
            >
              <AdminSidebarGlyph name="building" class="shrink-0 text-slate-400" />
              <span v-if="!sidebarCollapsed" class="truncate min-w-0 flex-1 text-left">{{ t('admin.tabOrganizations') }}</span>
              <AdminSidebarGlyph
                v-if="!sidebarCollapsed"
                name="chevron-down"
                class="shrink-0 text-slate-400 transition-transform duration-200"
                :class="organizationsMenuOpen ? 'rotate-180' : ''"
              />
            </button>
            <Transition
              enter-active-class="transition-[opacity,transform] duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-0.5"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-opacity duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-show="organizationsMenuOpen && !sidebarCollapsed"
                class="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 ml-3 pl-2"
              >
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
                  :class="
                    activeTab === 'organizations'
                      ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80'
                  "
                  @click="activeTab = 'organizations'"
                >
                  <AdminSidebarGlyph
                    name="building"
                    class="shrink-0"
                    :class="activeTab === 'organizations' ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="truncate">{{ t('admin.orgNav.manageOrgs') }}</span>
                </button>
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
                  :class="
                    activeTab === 'requests'
                      ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80'
                  "
                  @click="activeTab = 'requests'"
                >
                  <AdminSidebarGlyph
                    name="truck"
                    class="shrink-0"
                    :class="activeTab === 'requests' ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="truncate">{{ t('admin.orgNav.transportRequests') }}</span>
                </button>
              </div>
            </Transition>
          </div>

          <!-- Akquise -->
          <div>
            <p
              v-if="!sidebarCollapsed"
              class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {{ t('admin.tabAcquise') }}
            </p>
            <button
              type="button"
              :title="sidebarCollapsed ? t('admin.tabAcquise') : undefined"
              class="w-full flex items-center gap-2.5 rounded-md py-2 text-left text-sm font-semibold border-l-[3px] border-transparent text-slate-800 hover:bg-slate-100/90 transition-colors"
              :class="sidebarCollapsed ? 'justify-center px-0' : 'pl-2 pr-2'"
              @click="acquiseMenuOpen = !acquiseMenuOpen; if (activeTab !== 'acquise') activeTab = 'acquise'"
            >
              <AdminSidebarGlyph name="megaphone" class="shrink-0 text-slate-400" />
              <span v-if="!sidebarCollapsed" class="truncate min-w-0 flex-1 text-left">{{ t('admin.tabAcquise') }}</span>
              <AdminSidebarGlyph
                v-if="!sidebarCollapsed"
                name="chevron-down"
                class="shrink-0 text-slate-400 transition-transform duration-200"
                :class="acquiseMenuOpen ? 'rotate-180' : ''"
              />
            </button>
            <Transition
              enter-active-class="transition-[opacity,transform] duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-0.5"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-opacity duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-show="acquiseMenuOpen && !sidebarCollapsed"
                class="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 ml-3 pl-2"
              >
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
                  :class="
                    activeTab === 'acquise' && acquiseSubTab === 'users'
                      ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80'
                  "
                  @click="activeTab = 'acquise'; acquiseSubTab = 'users'; loadAdminUsers(1)"
                >
                  <AdminSidebarGlyph
                    name="users"
                    class="shrink-0"
                    :class="activeTab === 'acquise' && acquiseSubTab === 'users' ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="truncate">{{ t('admin.acquise.tabUsers') }}</span>
                </button>
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
                  :class="
                    activeTab === 'acquise' && acquiseSubTab === 'registeredOrgs'
                      ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80'
                  "
                  @click="activeTab = 'acquise'; acquiseSubTab = 'registeredOrgs'"
                >
                  <AdminSidebarGlyph
                    name="building-plus"
                    class="shrink-0"
                    :class="activeTab === 'acquise' && acquiseSubTab === 'registeredOrgs' ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="truncate">{{ t('admin.acquise.tabRegisteredOrgs') }}</span>
                </button>
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
                  :class="
                    activeTab === 'acquise' && acquiseSubTab === 'orgaAquise'
                      ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80'
                  "
                  @click="activeTab = 'acquise'; acquiseSubTab = 'orgaAquise'"
                >
                  <AdminSidebarGlyph
                    name="table"
                    class="shrink-0"
                    :class="activeTab === 'acquise' && acquiseSubTab === 'orgaAquise' ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="truncate">{{ t('admin.orgaAquise.tabOrgaAquise') }}</span>
                </button>
              </div>
            </Transition>
          </div>

          <!-- Moderation -->
          <div>
            <p
              v-if="!sidebarCollapsed"
              class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {{ t('admin.tabReviews') }}
            </p>
            <button
              type="button"
              :title="sidebarCollapsed ? t('admin.tabReviews') : undefined"
              class="w-full flex items-center gap-2.5 rounded-md py-2 text-left text-sm font-semibold border-l-[3px] transition-colors"
              :class="[
                sidebarCollapsed ? 'justify-center px-0' : 'pl-2 pr-2',
                activeTab === 'reviews'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900'
                  : 'border-transparent text-slate-700 hover:bg-slate-100/90',
              ]"
              @click="activeTab = 'reviews'; loadAdminReviews(1)"
            >
              <AdminSidebarGlyph
                name="star"
                class="shrink-0"
                :class="activeTab === 'reviews' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span v-if="!sidebarCollapsed" class="truncate">{{ t('admin.tabReviews') }}</span>
            </button>
          </div>

          <!-- Mailing -->
          <div>
            <p
              v-if="!sidebarCollapsed"
              class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {{ t('admin.tabMailing') }}
            </p>
            <button
              type="button"
              :title="sidebarCollapsed ? t('admin.tabMailing') : undefined"
              class="w-full flex items-center gap-2.5 rounded-md py-2 text-left text-sm font-semibold border-l-[3px] border-transparent text-slate-800 hover:bg-slate-100/90 transition-colors"
              :class="sidebarCollapsed ? 'justify-center px-0' : 'pl-2 pr-2'"
              @click="mailingMenuOpen = !mailingMenuOpen; if (activeTab !== 'mailing') activeTab = 'mailing'"
            >
              <AdminSidebarGlyph name="mail" class="shrink-0 text-slate-400" />
              <span v-if="!sidebarCollapsed" class="truncate min-w-0 flex-1 text-left">{{ t('admin.tabMailing') }}</span>
              <AdminSidebarGlyph
                v-if="!sidebarCollapsed"
                name="chevron-down"
                class="shrink-0 text-slate-400 transition-transform duration-200"
                :class="mailingMenuOpen ? 'rotate-180' : ''"
              />
            </button>
            <Transition
              enter-active-class="transition-[opacity,transform] duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-0.5"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-opacity duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-show="mailingMenuOpen && !sidebarCollapsed"
                class="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 ml-3 pl-2"
              >
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
                  :class="
                    activeTab === 'mailing' && mailingSubTab === 'flows'
                      ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80'
                  "
                  @click="activeTab = 'mailing'; mailingSubTab = 'flows'"
                >
                  <AdminSidebarGlyph
                    name="cog"
                    class="shrink-0"
                    :class="activeTab === 'mailing' && mailingSubTab === 'flows' ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="truncate">{{ t('admin.mailing.subTabFlows') }}</span>
                </button>
                <button
                  type="button"
                  class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
                  :class="
                    activeTab === 'mailing' && mailingSubTab === 'archive'
                      ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-100/80'
                  "
                  @click="activeTab = 'mailing'; mailingSubTab = 'archive'"
                >
                  <AdminSidebarGlyph
                    name="inbox"
                    class="shrink-0"
                    :class="activeTab === 'mailing' && mailingSubTab === 'archive' ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="truncate">{{ t('admin.mailing.subTabArchive') }}</span>
                </button>
              </div>
            </Transition>
          </div>

          <!-- Einstellungen -->
          <div>
            <p
              v-if="!sidebarCollapsed"
              class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {{ t('admin.tabSettings') }}
            </p>
            <button
              type="button"
              :title="sidebarCollapsed ? t('admin.tabSettings') : undefined"
              class="w-full flex items-center gap-2.5 rounded-md py-2 text-left text-sm font-semibold border-l-[3px] transition-colors"
              :class="[
                sidebarCollapsed ? 'justify-center px-0' : 'pl-2 pr-2',
                activeTab === 'settings'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900'
                  : 'border-transparent text-slate-700 hover:bg-slate-100/90',
              ]"
              @click="activeTab = 'settings'"
            >
              <AdminSidebarGlyph
                name="cog"
                class="shrink-0"
                :class="activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span v-if="!sidebarCollapsed" class="truncate">{{ t('admin.tabSettings') }}</span>
            </button>
          </div>
        </nav>
      </aside>

      <!-- Main -->
      <div class="flex-1 min-w-0 w-full max-w-7xl">
        <div class="md:hidden mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
            @click="sidebarMobileOpen = true"
          >
            Menü
          </button>
          <button
            v-if="sidebarCollapsed"
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="sidebarCollapsed = false"
          >
            Sidebar öffnen
          </button>
        </div>

        <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">{{ t('admin.title') }}</h1>
        <h2 v-if="pageHeading" class="text-lg font-semibold text-slate-800 mb-4">{{ pageHeading }}</h2>
        <div v-if="message" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {{ message }}
        </div>

        <!-- Tab: Übersicht (Dashboard) -->
        <div v-show="activeTab === 'overview'" class="space-y-10">
      <!-- Statistik -->
      <section class="p-4 sm:p-6 rounded-xl border border-slate-200 bg-white">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">{{ t('admin.statsTitle') }}</h2>
        <div v-if="loadingStats" class="text-slate-500 text-sm">{{ t('admin.loading') }}</div>
        <div v-else-if="stats" class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <p class="text-2xl font-bold text-slate-900">{{ stats.orgsCount }}</p>
            <p class="text-sm text-slate-600">{{ t('admin.statsOrgs') }}</p>
          </div>
          <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <p class="text-2xl font-bold text-slate-900">{{ stats.transportsCount }}</p>
            <p class="text-sm text-slate-600">{{ t('admin.statsTransportsTotal') }}</p>
          </div>
          <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <p class="text-2xl font-bold text-slate-900">{{ stats.activeTransportsCount }}</p>
            <p class="text-sm text-slate-600">{{ t('admin.statsTransportsActive') }}</p>
          </div>
          <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <p class="text-2xl font-bold text-slate-900">{{ stats.usersCount }}</p>
            <p class="text-sm text-slate-600">{{ t('admin.statsUsers') }}</p>
          </div>
        </div>
      </section>

      <section v-if="pendingTotal > 0" class="p-4 rounded-xl border border-amber-200 bg-amber-50">
        <h2 class="text-lg font-semibold text-slate-800 mb-2">{{ t('admin.pendingOrgs') }}</h2>
        <p class="text-slate-600 text-sm mb-3">
          {{ t('admin.overviewPendingHint', { count: pendingTotal }) }}
        </p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm transition-colors"
          @click="activeTab = 'organizations'"
        >
          {{ t('admin.goToOrganizations') }}
        </button>
      </section>

      <section v-if="stats && stats.transportsCount > 0" class="p-4 rounded-xl border border-slate-200 bg-slate-50">
        <h2 class="text-lg font-semibold text-slate-800 mb-2">{{ t('admin.transportRequests') }}</h2>
        <p class="text-slate-600 text-sm mb-3">
          {{ t('admin.overviewRequestsHint', { count: stats.transportsCount }) }}
        </p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm transition-colors"
          @click="activeTab = 'requests'"
        >
          {{ t('admin.goToTransportRequests') }}
        </button>
      </section>
    </div>

    <!-- Tab: Organisationen -->
    <div v-show="activeTab === 'organizations'" class="space-y-10">
      <section>
        <h2 class="text-lg font-semibold text-slate-800 mb-3">{{ t('admin.pendingOrgs') }}</h2>
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            v-model="pendingSearch"
            type="search"
            :placeholder="t('admin.searchPlaceholder')"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
            @keyup.enter="loadPending(1)"
          />
          <button
            type="button"
            class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
            @click="loadPending(1)"
          >
            {{ t('admin.search') }}
          </button>
        </div>
        <div v-if="loading" class="text-slate-600 text-sm">{{ t('admin.loading') }}</div>
        <div v-else-if="pendingOrgs.length === 0" class="p-5 sm:p-6 rounded-xl bg-white border border-slate-200">
          {{ t('admin.noPending') }}
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="org in pendingOrgs"
            :key="org.id"
            class="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0"
          >
            <div class="min-w-0">
              <h3 class="font-semibold text-slate-900 break-words">{{ org.name }}</h3>
              <p class="text-sm text-slate-600 break-all">{{ org.contactEmail }}</p>
              <p v-if="org.createdByUser" class="text-xs text-slate-500 mt-1 break-all">
                {{ t('admin.createdBy') }}: {{ org.createdByUser.displayName }} ({{ org.createdByUser.email }})
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                class="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors min-h-[44px]"
                @click="approve(org.id)"
              >
                {{ t('admin.approve') }}
              </button>
              <button
                type="button"
                class="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors min-h-[44px]"
                @click="reject(org.id)"
              >
                {{ t('admin.reject') }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="pendingTotal > 15" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-600">{{ t('admin.acquise.pageInfo', { from: (pendingPage - 1) * pendingPageSize + 1, to: Math.min(pendingPage * pendingPageSize, pendingTotal), total: pendingTotal }) }}</p>
          <nav class="flex items-center gap-1" aria-label="Paginierung">
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="pendingPage <= 1 || loading" :aria-label="t('admin.paginationFirst')" @click="goToPendingPage(1)">«</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="pendingPage <= 1 || loading" :aria-label="t('admin.acquise.prevPage')" @click="goToPendingPage(pendingPage - 1)">&lt;</button>
            <template v-for="p in getPageNumbers(pendingPage, pendingTotalPages)" :key="String(p)">
              <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
              <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === pendingPage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loading" @click="goToPendingPage(p)">{{ p }}</button>
            </template>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="pendingPage >= pendingTotalPages || loading" :aria-label="t('admin.acquise.nextPage')" @click="goToPendingPage(pendingPage + 1)">&gt;</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="pendingPage >= pendingTotalPages || loading" :aria-label="t('admin.paginationLast')" @click="goToPendingPage(pendingTotalPages)">»</button>
          </nav>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-slate-800 mb-3">{{ t('admin.approvedOrgs') }}</h2>
        <p class="text-slate-600 text-sm mb-2">{{ t('admin.overviewHintApproved') }}</p>
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            v-model="approvedSearch"
            type="search"
            :placeholder="t('admin.searchPlaceholder')"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
            @keyup.enter="loadApproved(1)"
          />
          <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadApproved(1)">{{ t('admin.search') }}</button>
        </div>
        <div v-if="loadingApproved" class="text-slate-600 text-sm">{{ t('admin.loading') }}</div>
        <div v-else-if="approvedOrgs.length === 0" class="p-5 rounded-xl bg-white border border-slate-200">
          {{ t('admin.noApproved') }}
        </div>
        <div v-else>
          <!-- Mobile: Cards -->
          <div class="sm:hidden space-y-3">
            <div v-for="org in approvedOrgs" :key="org.id" class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="min-w-0">
                <div class="font-semibold text-slate-900 break-words">{{ org.name }}</div>
                <div class="text-sm text-slate-600 break-all mt-1">{{ org.contactEmail }}</div>
              </div>
              <div class="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center px-3 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm transition-colors min-h-[44px]"
                  @click="openOrgCrm(org.id)"
                >
                  CRM
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm transition-colors min-h-[44px]"
                  @click="viewAsOrg(org.id)"
                >
                  {{ t('admin.viewAsOrg') }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors min-h-[44px]"
                  @click="blockOrg(org.id)"
                >
                  {{ t('admin.block') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop: Table -->
          <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table class="w-full min-w-[400px] text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableOrg') }}</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableContact') }}</th>
                  <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableAction') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="org in approvedOrgs" :key="org.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td class="py-3 px-4 text-slate-900">{{ org.name }}</td>
                  <td class="py-3 px-4 text-slate-600">{{ org.contactEmail }}</td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm transition-colors"
                        @click="openOrgCrm(org.id)"
                      >
                        CRM
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm transition-colors"
                        @click="viewAsOrg(org.id)"
                      >
                        {{ t('admin.viewAsOrg') }}
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                        @click="blockOrg(org.id)"
                      >
                        {{ t('admin.block') }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="approvedTotal > 15" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-600">{{ t('admin.acquise.pageInfo', { from: (approvedPage - 1) * approvedPageSize + 1, to: Math.min(approvedPage * approvedPageSize, approvedTotal), total: approvedTotal }) }}</p>
          <nav class="flex items-center gap-1" aria-label="Paginierung">
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage <= 1 || loadingApproved" :aria-label="t('admin.paginationFirst')" @click="goToApprovedPage(1)">«</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage <= 1 || loadingApproved" :aria-label="t('admin.acquise.prevPage')" @click="goToApprovedPage(approvedPage - 1)">&lt;</button>
            <template v-for="p in getPageNumbers(approvedPage, approvedTotalPages)" :key="String(p)">
              <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
              <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === approvedPage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loadingApproved" @click="goToApprovedPage(p)">{{ p }}</button>
            </template>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage >= approvedTotalPages || loadingApproved" :aria-label="t('admin.acquise.nextPage')" @click="goToApprovedPage(approvedPage + 1)">&gt;</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage >= approvedTotalPages || loadingApproved" :aria-label="t('admin.paginationLast')" @click="goToApprovedPage(approvedTotalPages)">»</button>
          </nav>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-slate-800 mb-3">{{ t('admin.blockedOrgs') }}</h2>
        <p class="text-slate-600 text-sm mb-2">{{ t('admin.overviewHintBlocked') }}</p>
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            v-model="blockedSearch"
            type="search"
            :placeholder="t('admin.searchPlaceholder')"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
            @keyup.enter="loadBlocked(1)"
          />
          <select
            v-model="blockedStatusFilter"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
            @change="loadBlocked(1)"
          >
            <option value="">{{ t('admin.filterAll') }}</option>
            <option value="REJECTED">{{ t('admin.statusRejected') }}</option>
            <option value="CANCELLED">{{ t('admin.statusBlocked') }}</option>
          </select>
          <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadBlocked(1)">{{ t('admin.search') }}</button>
        </div>
        <div v-if="loadingBlocked" class="text-slate-600 text-sm">{{ t('admin.loading') }}</div>
        <div v-else-if="blockedOrgs.length === 0" class="p-5 rounded-xl bg-white border border-slate-200">
          {{ t('admin.noBlocked') }}
        </div>
        <div v-else>
          <!-- Mobile: Cards -->
          <div class="sm:hidden space-y-3">
            <div v-for="org in blockedOrgs" :key="org.id" class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-semibold text-slate-900 break-words">{{ org.name }}</div>
                  <div class="text-sm text-slate-600 break-all mt-1">{{ org.contactEmail }}</div>
                </div>
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium shrink-0"
                  :class="org.status === 'REJECTED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'"
                >
                  {{ org.status === 'REJECTED' ? t('admin.statusRejected') : t('admin.statusBlocked') }}
                </span>
              </div>
              <div class="mt-3">
                <button
                  type="button"
                  class="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors min-h-[44px]"
                  @click="unblockOrg(org.id)"
                >
                  {{ t('admin.unblock') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop: Table -->
          <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table class="w-full min-w-[400px] text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableOrg') }}</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableStatus') }}</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableContact') }}</th>
                  <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableAction') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="org in blockedOrgs" :key="org.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td class="py-3 px-4 text-slate-900">{{ org.name }}</td>
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                      :class="org.status === 'REJECTED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'"
                    >
                      {{ org.status === 'REJECTED' ? t('admin.statusRejected') : t('admin.statusBlocked') }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-600">{{ org.contactEmail }}</td>
                  <td class="py-3 px-4 text-right">
                    <button
                      type="button"
                      class="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
                      @click="unblockOrg(org.id)"
                    >
                      {{ t('admin.unblock') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="blockedTotal > 15" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-600">{{ t('admin.acquise.pageInfo', { from: (blockedPage - 1) * blockedPageSize + 1, to: Math.min(blockedPage * blockedPageSize, blockedTotal), total: blockedTotal }) }}</p>
          <nav class="flex items-center gap-1" aria-label="Paginierung">
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="blockedPage <= 1 || loadingBlocked" :aria-label="t('admin.paginationFirst')" @click="goToBlockedPage(1)">«</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="blockedPage <= 1 || loadingBlocked" :aria-label="t('admin.acquise.prevPage')" @click="goToBlockedPage(blockedPage - 1)">&lt;</button>
            <template v-for="p in getPageNumbers(blockedPage, blockedTotalPages)" :key="String(p)">
              <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
              <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === blockedPage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loadingBlocked" @click="goToBlockedPage(p)">{{ p }}</button>
            </template>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="blockedPage >= blockedTotalPages || loadingBlocked" :aria-label="t('admin.acquise.nextPage')" @click="goToBlockedPage(blockedPage + 1)">&gt;</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="blockedPage >= blockedTotalPages || loadingBlocked" :aria-label="t('admin.paginationLast')" @click="goToBlockedPage(blockedTotalPages)">»</button>
          </nav>
        </div>
      </section>
    </div>

    <!-- Tab: Transportanfragen -->
    <div v-show="activeTab === 'requests'" class="space-y-6">
      <section>
        <h2 class="text-lg font-semibold text-slate-800 mb-3">{{ t('admin.transportRequests') }}</h2>
        <p class="text-slate-600 text-sm mb-2">{{ t('admin.requestsHint') }}</p>
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            v-model="requestsSearch"
            type="search"
            :placeholder="t('admin.searchPlaceholder')"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
            @keyup.enter="loadRequests(1)"
          />
          <select
            v-model="requestsStatusFilter"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
            @change="loadRequests(1)"
          >
            <option value="">{{ t('admin.filterAll') }}</option>
            <option value="OPEN">{{ t('requestStatus.OPEN') }}</option>
            <option value="MATCHED">{{ t('requestStatus.MATCHED') }}</option>
            <option value="COMPLETED">{{ t('requestStatus.COMPLETED') }}</option>
            <option value="CANCELLED">{{ t('requestStatus.CANCELLED') }}</option>
          </select>
          <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadRequests(1)">{{ t('admin.search') }}</button>
        </div>
        <div v-if="loadingRequests" class="text-slate-600 text-sm">{{ t('admin.loading') }}</div>
        <div v-else-if="requests.length === 0" class="p-5 rounded-xl bg-white border border-slate-200">
          {{ t('admin.noRequests') }}
        </div>
        <div v-else>
          <!-- Mobile: Cards -->
          <div class="sm:hidden space-y-3">
            <div v-for="r in requests" :key="r.id" class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-semibold text-slate-900 break-words">{{ r.title }}</div>
                  <div class="text-sm text-slate-600 mt-1 break-words">{{ r.organizationName }}</div>
                  <div class="text-sm text-slate-600 mt-1">{{ r.originAirport }} → {{ r.destAirport }}</div>
                  <div class="text-xs text-slate-500 mt-2">
                    {{ new Date(r.earliestDate).toLocaleDateString(locale) }} – {{ new Date(r.latestDate).toLocaleDateString(locale) }}
                  </div>
                </div>
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium shrink-0"
                  :class="{
                    'bg-emerald-50 text-emerald-700': r.status === 'OPEN',
                    'bg-blue-50 text-blue-700': r.status === 'MATCHED',
                    'bg-slate-100 text-slate-600': r.status === 'COMPLETED',
                    'bg-red-50 text-red-700': r.status === 'CANCELLED',
                  }"
                >
                  {{ getRequestStatusLabel(r.status) }}
                </span>
              </div>
              <div class="mt-3">
                <button
                  type="button"
                  class="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm transition-colors min-h-[44px]"
                  @click="viewAsOrg(r.organizationId)"
                >
                  {{ t('admin.viewAsOrg') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop: Table -->
          <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table class="w-full min-w-[560px] text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableRequest') }}</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableOrg') }}</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableRoute') }}</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.acquise.status') }}</th>
                  <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.tablePeriod') }}</th>
                  <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableAction') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in requests" :key="r.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td class="py-3 px-4 text-slate-900">{{ r.title }}</td>
                  <td class="py-3 px-4 text-slate-600">{{ r.organizationName }}</td>
                  <td class="py-3 px-4 text-slate-600">{{ r.originAirport }} → {{ r.destAirport }}</td>
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                      :class="{
                        'bg-emerald-50 text-emerald-700': r.status === 'OPEN',
                        'bg-blue-50 text-blue-700': r.status === 'MATCHED',
                        'bg-slate-100 text-slate-600': r.status === 'COMPLETED',
                        'bg-red-50 text-red-700': r.status === 'CANCELLED',
                      }"
                    >
                      {{ getRequestStatusLabel(r.status) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-600">
                    {{ new Date(r.earliestDate).toLocaleDateString(locale) }} – {{ new Date(r.latestDate).toLocaleDateString(locale) }}
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button
                      type="button"
                      class="inline-flex items-center px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm transition-colors"
                      @click="viewAsOrg(r.organizationId)"
                    >
                      {{ t('admin.viewAsOrg') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="requests.length > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-600">{{ t('admin.acquise.pageInfo', { from: (requestsPage - 1) * requestsPageSize + 1, to: Math.min(requestsPage * requestsPageSize, requestsTotal), total: requestsTotal }) }}</p>
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-600">{{ t('admin.acquise.pageOf', { page: requestsPage, total: requestsTotalPages || 1 }) }}</span>
            <nav v-if="requestsTotal > 15" class="flex items-center gap-1" aria-label="Paginierung">
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="requestsPage <= 1 || loadingRequests" :aria-label="t('admin.paginationFirst')" @click="goToRequestsPage(1)">«</button>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="requestsPage <= 1 || loadingRequests" :aria-label="t('admin.acquise.prevPage')" @click="goToRequestsPage(requestsPage - 1)">&lt;</button>
              <template v-for="p in getPageNumbers(requestsPage, requestsTotalPages)" :key="String(p)">
                <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
                <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === requestsPage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loadingRequests" @click="goToRequestsPage(p)">{{ p }}</button>
              </template>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="requestsPage >= requestsTotalPages || loadingRequests" :aria-label="t('admin.acquise.nextPage')" @click="goToRequestsPage(requestsPage + 1)">&gt;</button>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="requestsPage >= requestsTotalPages || loadingRequests" :aria-label="t('admin.paginationLast')" @click="goToRequestsPage(requestsTotalPages)">»</button>
            </nav>
          </div>
        </div>
      </section>
    </div>

    <!-- Tab: Acquise -->
    <div v-show="activeTab === 'acquise'" class="space-y-6">
      <div class="sm:hidden">
        <label class="block text-sm font-medium text-slate-700 mb-1">Acquise</label>
        <select v-model="acquiseSubTab" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="users">{{ t('admin.acquise.tabUsers') }}</option>
          <option value="registeredOrgs">{{ t('admin.acquise.tabRegisteredOrgs') }}</option>
          <option value="orgaAquise">{{ t('admin.orgaAquise.tabOrgaAquise') }}</option>
        </select>
      </div>

      <div class="hidden sm:flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          :class="acquiseSubTab === 'users' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          @click="acquiseSubTab = 'users'; loadAdminUsers()"
        >
          {{ t('admin.acquise.tabUsers') }}
        </button>
        <button
          type="button"
          :class="acquiseSubTab === 'registeredOrgs' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          @click="acquiseSubTab = 'registeredOrgs'; loadApproved()"
        >
          {{ t('admin.acquise.tabRegisteredOrgs') }}
        </button>
        <button
          type="button"
          :class="acquiseSubTab === 'orgaAquise' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          @click="acquiseSubTab = 'orgaAquise'"
        >
          {{ t('admin.orgaAquise.tabOrgaAquise') }}
        </button>
      </div>

      <!-- Sub-Tab: Nutzer -->
      <template v-if="acquiseSubTab === 'users'">
        <section>
          <h2 class="text-lg font-semibold text-slate-800 mb-2">{{ t('admin.acquise.usersTitle') }}</h2>
          <p class="text-slate-600 text-sm mb-4">{{ t('admin.acquise.usersDescription') }}</p>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <input
              v-model="adminUsersSearch"
              type="search"
              :placeholder="t('admin.searchPlaceholder')"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
              @keyup.enter="loadAdminUsers(1)"
            />
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="adminUsersFilterNew" type="checkbox" class="rounded border-slate-300" />
              <span class="text-sm text-slate-700">{{ t('admin.acquise.filterNew') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="adminUsersFilterUnverified" type="checkbox" class="rounded border-slate-300" />
              <span class="text-sm text-slate-700">{{ t('admin.acquise.filterUnverified') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="adminUsersFilterActive" type="checkbox" class="rounded border-slate-300" />
              <span class="text-sm text-slate-700">{{ t('admin.acquise.filterActive') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="adminUsersFilterProfileComplete" type="checkbox" class="rounded border-slate-300" />
              <span class="text-sm text-slate-700">{{ t('admin.acquise.userProfileComplete') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="adminUsersListBlocked" type="checkbox" class="rounded border-slate-300" />
              <span class="text-sm text-slate-700">{{ t('admin.acquise.filterBlockedOnly') }}</span>
            </label>
            <input
              v-model="adminUsersFilterLastLoginFrom"
              type="date"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              :aria-label="`Letzter Login von`"
            />
            <input
              v-model="adminUsersFilterLastLoginTo"
              type="date"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              :aria-label="`Letzter Login bis`"
            />
            <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadAdminUsers(1)">{{ t('admin.search') }}</button>
          </div>
          <div v-if="loadingAdminUsers" class="text-slate-600 text-sm py-4">{{ t('admin.acquise.loading') }}</div>
          <div v-else-if="adminUsers.length === 0" class="p-6 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm">
            {{ adminUsersListBlocked ? t('admin.acquise.usersEmptyBlocked') : t('admin.acquise.usersEmpty') }}
          </div>
          <div v-else>
            <!-- Mobile: Cards -->
            <div class="sm:hidden space-y-3">
              <div v-for="u in adminUsers" :key="u.id" class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <NuxtLink :to="`/user/${u.id}`" class="text-amber-600 hover:underline font-semibold break-words">{{ u.displayName }}</NuxtLink>
                    <div class="text-sm text-slate-600 break-all mt-1">{{ u.email }}</div>
                    <div class="text-xs text-slate-500 mt-2">
                      {{ t('admin.acquise.userFlights') }}: {{ u.completedFlightsCount }} ·
                      {{ t('admin.acquise.userCreated') }}: {{ new Date(u.createdAt).toLocaleDateString(locale) }}
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 shrink-0">
                    <span v-if="u.emailVerified" class="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">E-Mail ✓</span>
                    <button
                      v-else
                      type="button"
                      :disabled="verifyingUserId === u.id"
                      class="inline-flex px-2 py-1 rounded text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium disabled:opacity-50 min-h-[32px]"
                      @click="verifyUser(u)"
                    >
                      {{ verifyingUserId === u.id ? '…' : t('admin.acquise.verifyButton') }}
                    </button>
                    <span class="inline-flex px-2 py-0.5 rounded text-xs" :class="u.profileComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'">
                      Profil: {{ u.profileComplete ? '✓' : '–' }}
                    </span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Sprache</label>
                  <select
                    :value="u.preferredLanguage || 'de'"
                    :disabled="savingUserLanguageId === u.id"
                    class="w-full py-2 px-3 rounded-lg border border-slate-300 text-slate-800 text-sm min-h-[44px]"
                    @change="saveUserLanguage(u, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">{{ t('admin.acquise.userNotes') }}</label>
                  <input
                    type="text"
                    :value="u.adminNotes ?? ''"
                    :disabled="savingUserNotesId === u.id"
                    class="w-full py-2 px-3 rounded-lg border border-slate-300 text-slate-800 text-sm min-h-[44px]"
                    :placeholder="t('admin.acquise.userNotesPlaceholder')"
                    @blur="saveUserNotes(u, ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="flex flex-wrap gap-2 pt-1">
                  <button
                    v-if="!adminUsersListBlocked"
                    type="button"
                    :disabled="blockingUserId === u.id"
                    class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50 min-h-[36px]"
                    @click="setUserBlocked(u, true)"
                  >
                    {{ t('admin.acquise.blockUser') }}
                  </button>
                  <button
                    v-else
                    type="button"
                    :disabled="blockingUserId === u.id"
                    class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 min-h-[36px]"
                    @click="setUserBlocked(u, false)"
                  >
                    {{ t('admin.acquise.unblockUser') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Desktop: Table -->
            <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table class="w-full min-w-[800px] text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userName') }}</th>
                  <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.email') }}</th>
                  <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userEmailVerified') }}</th>
                  <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userProfileComplete') }}</th>
                  <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userFlights') }}</th>
                  <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userCreated') }}</th>
                  <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userLastLogin') }}</th>
                  <th class="text-left py-3 px-3 font-semibold text-slate-700">Sprache</th>
                  <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userNotes') }}</th>
                  <th class="text-right py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userActions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in adminUsers" :key="u.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td class="py-3 px-3">
                    <NuxtLink :to="`/user/${u.id}`" class="text-amber-600 hover:underline font-medium">{{ u.displayName }}</NuxtLink>
                  </td>
                  <td class="py-3 px-3 text-slate-600">{{ u.email }}</td>
                  <td class="py-3 px-3 text-center">
                    <span v-if="u.emailVerified" class="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">✓</span>
                    <button
                      v-else
                      type="button"
                      :disabled="verifyingUserId === u.id"
                      class="inline-flex px-2 py-1 rounded text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium disabled:opacity-50"
                      @click="verifyUser(u)"
                    >
                      {{ verifyingUserId === u.id ? '…' : t('admin.acquise.verifyButton') }}
                    </button>
                  </td>
                  <td class="py-3 px-3 text-center">
                    <span v-if="u.profileComplete" class="text-green-600">✓</span>
                    <span v-else class="text-slate-400">–</span>
                  </td>
                  <td class="py-3 px-3 text-center text-slate-600">{{ u.completedFlightsCount }}</td>
                  <td class="py-3 px-3 text-slate-600">{{ new Date(u.createdAt).toLocaleDateString(locale) }}</td>
                  <td class="py-3 px-3 text-slate-600">{{ u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString(locale) : '–' }}</td>
                  <td class="py-3 px-3">
                    <select
                      :value="u.preferredLanguage || 'de'"
                      :disabled="savingUserLanguageId === u.id"
                      class="w-full max-w-[150px] py-1.5 px-2 rounded border border-slate-300 text-slate-800 text-xs bg-white"
                      @change="saveUserLanguage(u, ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                  </td>
                  <td class="py-3 px-3">
                    <input
                      type="text"
                      :value="u.adminNotes ?? ''"
                      :disabled="savingUserNotesId === u.id"
                      class="w-full max-w-[200px] py-1.5 px-2 rounded border border-slate-300 text-slate-800 text-xs"
                      :placeholder="t('admin.acquise.userNotesPlaceholder')"
                      @blur="saveUserNotes(u, ($event.target as HTMLInputElement).value)"
                    />
                  </td>
                  <td class="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      v-if="!adminUsersListBlocked"
                      type="button"
                      :disabled="blockingUserId === u.id"
                      class="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                      @click="setUserBlocked(u, true)"
                    >
                      {{ t('admin.acquise.blockUser') }}
                    </button>
                    <button
                      v-else
                      type="button"
                      :disabled="blockingUserId === u.id"
                      class="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      @click="setUserBlocked(u, false)"
                    >
                      {{ t('admin.acquise.unblockUser') }}
                    </button>
                  </td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>
          <div v-if="adminUsersTotal > 15" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p class="text-sm text-slate-600">
              {{ t('admin.acquise.pageInfo', { from: (adminUsersPage - 1) * 15 + 1, to: Math.min(adminUsersPage * 15, adminUsersTotal), total: adminUsersTotal }) }}
            </p>
            <nav class="flex items-center gap-1" aria-label="Paginierung">
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="adminUsersPage <= 1 || loadingAdminUsers" :aria-label="t('admin.paginationFirst')" @click="goToAdminUsersPage(1)">«</button>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="adminUsersPage <= 1 || loadingAdminUsers" :aria-label="t('admin.acquise.prevPage')" @click="goToAdminUsersPage(adminUsersPage - 1)">&lt;</button>
              <template v-for="p in getPageNumbers(adminUsersPage, adminUsersTotalPages)" :key="String(p)">
                <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
                <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === adminUsersPage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loadingAdminUsers" @click="goToAdminUsersPage(p)">{{ p }}</button>
              </template>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="adminUsersPage >= adminUsersTotalPages || loadingAdminUsers" :aria-label="t('admin.acquise.nextPage')" @click="goToAdminUsersPage(adminUsersPage + 1)">&gt;</button>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="adminUsersPage >= adminUsersTotalPages || loadingAdminUsers" :aria-label="t('admin.paginationLast')" @click="goToAdminUsersPage(adminUsersTotalPages)">»</button>
            </nav>
          </div>
        </section>
      </template>

      <!-- Sub-Tab: Orga Aquise -->
      <template v-else-if="acquiseSubTab === 'orgaAquise'">
        <AdminOrgaAquiseTable />
      </template>

      <!-- Sub-Tab: Registrierte Organisationen -->
      <template v-else-if="acquiseSubTab === 'registeredOrgs'">
        <section>
          <h2 class="text-lg font-semibold text-slate-800 mb-2">{{ t('admin.acquise.registeredOrgsTitle') }}</h2>
          <p class="text-slate-600 text-sm mb-2">{{ t('admin.acquise.registeredOrgsDescription') }}</p>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <input
              v-model="approvedSearch"
              type="search"
              :placeholder="t('admin.searchPlaceholder')"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
              @keyup.enter="loadApproved(1)"
            />
            <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadApproved(1)">{{ t('admin.search') }}</button>
          </div>
          <div v-if="loadingApproved" class="text-slate-600 text-sm py-4">{{ t('admin.loading') }}</div>
          <div v-else-if="approvedOrgs.length === 0" class="p-6 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm">
            {{ t('admin.noApproved') }}
          </div>
          <div v-else>
            <!-- Mobile: Cards -->
            <div class="sm:hidden space-y-3">
              <div v-for="org in approvedOrgs" :key="org.id" class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <NuxtLink v-if="org.slug" :to="`/org/${org.slug}`" class="text-amber-600 hover:underline font-semibold break-words">{{ org.name }}</NuxtLink>
                    <span v-else class="font-semibold text-slate-900 break-words">{{ org.name }}</span>
                    <div class="text-sm text-slate-600 break-all mt-1">{{ org.createdByUser?.email ?? org.contactEmail }}</div>
                    <div class="text-xs text-slate-500 mt-2">
                      {{ t('admin.acquise.userFlights') }}: {{ org.transportsCount }} ·
                      {{ t('admin.acquise.userCreated') }}: {{ new Date(org.createdAt).toLocaleDateString(locale) }}
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 shrink-0">
                    <span v-if="org.createdByUser?.emailVerified" class="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">E-Mail ✓</span>
                    <button
                      v-else-if="org.createdByUser"
                      type="button"
                      :disabled="verifyingUserId === org.createdByUser.id"
                      class="inline-flex px-2 py-1 rounded text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium disabled:opacity-50 min-h-[32px]"
                      @click="verifyOrgUser(org)"
                    >
                      {{ verifyingUserId === org.createdByUser.id ? '…' : t('admin.acquise.verifyButton') }}
                    </button>
                    <span class="inline-flex px-2 py-0.5 rounded text-xs" :class="org.profileComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'">
                      Profil: {{ org.profileComplete ? '✓' : '–' }}
                    </span>
                  </div>
                </div>
                <div v-if="org.createdByUser">
                  <label class="block text-xs font-medium text-slate-600 mb-1">{{ t('admin.acquise.userNotes') }}</label>
                  <input
                    type="text"
                    :value="org.createdByUser.adminNotes ?? ''"
                    :disabled="savingOrgUserNotesId === org.id"
                    class="w-full py-2 px-3 rounded-lg border border-slate-300 text-slate-800 text-sm min-h-[44px]"
                    :placeholder="t('admin.acquise.userNotesPlaceholder')"
                    @blur="saveOrgUserNotes(org, ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Orga-Sprache</label>
                  <select
                    :value="org.preferredLanguage || 'de'"
                    :disabled="savingOrgLanguageId === org.id"
                    class="w-full py-2 px-3 rounded-lg border border-slate-300 text-slate-800 text-sm min-h-[44px] bg-white"
                    @change="saveOrgLanguage(org, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div class="flex flex-wrap gap-2">
                  <NuxtLink
                    v-if="org.slug"
                    :to="`/org/${org.slug}`"
                    class="inline-flex items-center px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm"
                  >
                    {{ t('admin.viewProfile') }}
                  </NuxtLink>
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm"
                    @click="viewAsOrg(org.id)"
                  >
                    {{ t('admin.viewAsOrg') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Desktop: Table -->
            <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table class="w-full min-w-[900px] text-sm">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.tableOrg') }}</th>
                    <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.email') }}</th>
                    <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userEmailVerified') }}</th>
                    <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userProfileComplete') }}</th>
                    <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userFlights') }}</th>
                    <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userCreated') }}</th>
                    <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userLastLogin') }}</th>
                    <th class="text-left py-3 px-3 font-semibold text-slate-700">Orga-Sprache</th>
                    <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userNotes') }}</th>
                    <th class="text-right py-3 px-3 font-semibold text-slate-700">{{ t('admin.tableAction') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="org in approvedOrgs" :key="org.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td class="py-3 px-3">
                      <NuxtLink v-if="org.slug" :to="`/org/${org.slug}`" class="text-amber-600 hover:underline font-medium">{{ org.name }}</NuxtLink>
                      <span v-else class="font-medium text-slate-900">{{ org.name }}</span>
                    </td>
                    <td class="py-3 px-3 text-slate-600">{{ org.createdByUser?.email ?? org.contactEmail }}</td>
                    <td class="py-3 px-3 text-center">
                      <span v-if="org.createdByUser?.emailVerified" class="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">✓</span>
                      <button
                        v-else-if="org.createdByUser"
                        type="button"
                        :disabled="verifyingUserId === org.createdByUser.id"
                        class="inline-flex px-2 py-1 rounded text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium disabled:opacity-50"
                        @click="verifyOrgUser(org)"
                      >
                        {{ verifyingUserId === org.createdByUser.id ? '…' : t('admin.acquise.verifyButton') }}
                      </button>
                      <span v-else class="text-slate-400">–</span>
                    </td>
                    <td class="py-3 px-3 text-center">
                      <span v-if="org.profileComplete" class="text-green-600">✓</span>
                      <span v-else class="text-slate-400">–</span>
                    </td>
                    <td class="py-3 px-3 text-center text-slate-600">{{ org.transportsCount }}</td>
                    <td class="py-3 px-3 text-slate-600">{{ new Date(org.createdAt).toLocaleDateString(locale) }}</td>
                    <td class="py-3 px-3 text-slate-600">{{ org.createdByUser?.lastLoginAt ? new Date(org.createdByUser.lastLoginAt).toLocaleDateString(locale) : '–' }}</td>
                    <td class="py-3 px-3">
                      <select
                        :value="org.preferredLanguage || 'de'"
                        :disabled="savingOrgLanguageId === org.id"
                        class="w-full max-w-[150px] py-1.5 px-2 rounded border border-slate-300 text-slate-800 text-xs bg-white"
                        @change="saveOrgLanguage(org, ($event.target as HTMLSelectElement).value)"
                      >
                        <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </select>
                    </td>
                    <td class="py-3 px-3">
                      <input
                        v-if="org.createdByUser"
                        type="text"
                        :value="org.createdByUser.adminNotes ?? ''"
                        :disabled="savingOrgUserNotesId === org.id"
                        class="w-full max-w-[200px] py-1.5 px-2 rounded border border-slate-300 text-slate-800 text-xs"
                        :placeholder="t('admin.acquise.userNotesPlaceholder')"
                        @blur="saveOrgUserNotes(org, ($event.target as HTMLInputElement).value)"
                      />
                      <span v-else class="text-slate-400">–</span>
                    </td>
                    <td class="py-3 px-3 text-right">
                      <div class="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm"
                          @click="openOrgCrm(org.id)"
                        >
                          CRM
                        </button>
                        <NuxtLink
                          v-if="org.slug"
                          :to="`/org/${org.slug}`"
                          class="inline-flex items-center px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm"
                        >
                          {{ t('admin.viewProfile') }}
                        </NuxtLink>
                        <button
                          type="button"
                          class="inline-flex items-center px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium text-sm"
                          @click="viewAsOrg(org.id)"
                        >
                          {{ t('admin.viewAsOrg') }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="approvedTotal > 15" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p class="text-sm text-slate-600">{{ t('admin.acquise.pageInfo', { from: (approvedPage - 1) * approvedPageSize + 1, to: Math.min(approvedPage * approvedPageSize, approvedTotal), total: approvedTotal }) }}</p>
            <nav class="flex items-center gap-1" aria-label="Paginierung">
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage <= 1 || loadingApproved" :aria-label="t('admin.paginationFirst')" @click="goToApprovedPage(1)">«</button>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage <= 1 || loadingApproved" :aria-label="t('admin.acquise.prevPage')" @click="goToApprovedPage(approvedPage - 1)">&lt;</button>
              <template v-for="p in getPageNumbers(approvedPage, approvedTotalPages)" :key="String(p)">
                <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
                <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === approvedPage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loadingApproved" @click="goToApprovedPage(p)">{{ p }}</button>
              </template>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage >= approvedTotalPages || loadingApproved" :aria-label="t('admin.acquise.nextPage')" @click="goToApprovedPage(approvedPage + 1)">&gt;</button>
              <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="approvedPage >= approvedTotalPages || loadingApproved" :aria-label="t('admin.paginationLast')" @click="goToApprovedPage(approvedTotalPages)">»</button>
            </nav>
          </div>
        </section>
      </template>
    </div>

    <!-- Tab: Mailing -->
    <div v-show="activeTab === 'mailing'" class="space-y-6">
      <section v-show="mailingSubTab === 'flows'" class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('admin.mailing.subTabFlows') }}</h2>
          <p class="mt-1 text-sm text-slate-600">
            Versand, Audience und Automatisierung werden zentral im Mailflow verwaltet.
          </p>
          <div class="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              :class="mailflowMode === 'oneTime' ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-700'"
              @click="mailflowMode = 'oneTime'"
            >
              Einmalige E-Mail
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              :class="mailflowMode === 'workflows' ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-700'"
              @click="mailflowMode = 'workflows'"
            >
              Automatische E-Mails (Workflows)
            </button>
          </div>
          <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Hinweis: Das Mail-Archiv bleibt als eigener Bereich bestehen und dient als zentrale Auswertung fur Versandstatus und Verlauf.
          </div>
        </div>

        <AdminMailingCampaignPanel
          v-show="mailflowMode === 'oneTime'"
          :active="activeTab === 'mailing' && mailingSubTab === 'flows' && mailflowMode === 'oneTime'"
        />
        <AdminEmailSystemPanel
          v-show="mailflowMode === 'workflows'"
          :active="activeTab === 'mailing' && mailingSubTab === 'flows' && mailflowMode === 'workflows'"
          section="flows"
        />
      </section>
      <AdminEmailSystemPanel
        v-show="mailingSubTab === 'archive'"
        :active="activeTab === 'mailing' && mailingSubTab === 'archive'"
        section="archive"
      />
    </div>

    <!-- Tab: Einstellungen -->
    <div v-show="activeTab === 'settings'" class="space-y-6">
      <section class="p-4 sm:p-6 rounded-xl border-2 bg-amber-50 border-amber-200">
        <h2 class="text-lg font-semibold text-slate-800 mb-2">{{ t('admin.settings.maintenanceTitle') }}</h2>
        <p class="text-sm text-slate-600 mb-4">{{ t('admin.settings.maintenanceDescription') }}</p>
        <div v-if="loadingMaintenance" class="text-slate-500 text-sm">{{ t('admin.loading') }}</div>
        <div v-else class="flex items-center gap-4">
          <button
            type="button"
            :disabled="savingMaintenance"
            class="relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 min-h-[44px] min-w-[56px]"
            :class="maintenanceMode ? 'bg-amber-500' : 'bg-slate-200'"
            role="switch"
            :aria-checked="maintenanceMode"
            @click="setMaintenance(!maintenanceMode)"
          >
            <span
              class="pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition"
              :class="maintenanceMode ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
          <span class="font-medium text-slate-700">
            {{ maintenanceMode ? t('admin.settings.maintenanceOn') : t('admin.settings.maintenanceOff') }}
          </span>
        </div>
      </section>
    </div>

    <!-- Tab: Bewertungen -->
    <div v-show="activeTab === 'reviews'" class="space-y-6">
      <section>
        <h2 class="text-lg font-semibold text-slate-800 mb-2">{{ t('admin.reviews.titleAll') }}</h2>
        <p class="text-slate-600 text-sm mb-2">{{ t('admin.reviews.descriptionAll') }}</p>
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            v-model="reviewsSearch"
            type="search"
            :placeholder="t('admin.searchPlaceholder')"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
            @keyup.enter="loadAdminReviews(1)"
          />
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="reviewsHasReports" type="checkbox" class="rounded border-slate-300" @change="loadAdminReviews(1)" />
            <span class="text-sm text-slate-700">{{ t('admin.reviews.filterReported') }}</span>
          </label>
          <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadAdminReviews(1)">{{ t('admin.search') }}</button>
        </div>
        <div v-if="loadingAdminReviews" class="text-slate-600 text-sm py-4">{{ t('admin.loading') }}</div>
        <div v-else-if="adminReviews.length === 0" class="p-6 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm">
          {{ t('admin.reviews.empty') }}
        </div>
        <div v-else>
          <!-- Mobile: Cards -->
          <div class="sm:hidden space-y-3">
            <div v-for="r in adminReviews" :key="r.id" class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-1">
                    <span v-for="i in 5" :key="i" class="text-amber-500">{{ i <= r.rating ? '★' : '☆' }}</span>
                  </div>
                  <p v-if="r.comment" class="text-slate-700 mt-1 break-words">{{ r.comment }}</p>
                  <p class="text-xs text-slate-500 mt-1 break-words">{{ r.reviewerName }} · {{ r.requestTitle }}</p>
                  <div class="text-sm text-slate-600 mt-2">
                    <NuxtLink v-if="r.orgSlug" :to="`/org/${r.orgSlug}`" class="text-amber-600 hover:underline">{{ r.orgName }}</NuxtLink>
                    <span v-else>{{ r.orgName ?? '–' }}</span>
                  </div>
                </div>
                <span v-if="r.reportsCount > 0" class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 shrink-0">
                  {{ r.reportsCount }} {{ t('admin.reviews.reports') }}
                </span>
              </div>
              <button
                type="button"
                :disabled="deletingReviewId === r.id"
                class="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors disabled:opacity-50 min-h-[44px]"
                @click="deleteReview(r.id)"
              >
                {{ deletingReviewId === r.id ? '…' : t('admin.reviews.delete') }}
              </button>
            </div>
          </div>

          <!-- Desktop: Table -->
          <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table class="w-full min-w-[700px] text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.reviews.tableReview') }}</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.reviews.tableOrg') }}</th>
                <th class="text-left py-3 px-4 font-semibold text-slate-700">{{ t('admin.reviews.tableReports') }}</th>
                <th class="text-right py-3 px-4 font-semibold text-slate-700">{{ t('admin.tableAction') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in adminReviews" :key="r.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td class="py-3 px-4">
                  <div class="flex items-center gap-1">
                    <span v-for="i in 5" :key="i" class="text-amber-500">{{ i <= r.rating ? '★' : '☆' }}</span>
                  </div>
                  <p v-if="r.comment" class="text-slate-700 mt-1 max-w-xs truncate" :title="r.comment">{{ r.comment }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ r.reviewerName }} · {{ r.requestTitle }}</p>
                </td>
                <td class="py-3 px-4 text-slate-600">
                  <NuxtLink v-if="r.orgSlug" :to="`/org/${r.orgSlug}`" class="text-amber-600 hover:underline">{{ r.orgName }}</NuxtLink>
                  <span v-else>{{ r.orgName ?? '–' }}</span>
                </td>
                <td class="py-3 px-4">
                  <span
                    v-if="r.reportsCount > 0"
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"
                  >{{ r.reportsCount }} {{ t('admin.reviews.reports') }}</span>
                  <span v-else class="text-slate-400 text-xs">0</span>
                  <p v-if="r.reportReasons.length" class="text-xs text-slate-600 mt-1 max-w-xs truncate" :title="r.reportReasons.join('; ')">{{ r.reportReasons[0] }}</p>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    type="button"
                    :disabled="deletingReviewId === r.id"
                    class="inline-flex px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
                    @click="deleteReview(r.id)"
                  >
                    {{ deletingReviewId === r.id ? '…' : t('admin.reviews.delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
        <!-- Paginierung Bewertungen -->
        <div v-if="reviewsTotal > 15" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-600">
            {{ t('admin.acquise.pageInfo', { from: (reviewsPage - 1) * reviewsPageSize + 1, to: Math.min(reviewsPage * reviewsPageSize, reviewsTotal), total: reviewsTotal }) }}
          </p>
          <nav class="flex items-center gap-1" aria-label="Paginierung">
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="reviewsPage <= 1 || loadingAdminReviews" :aria-label="t('admin.paginationFirst')" @click="goToReviewsPage(1)">«</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="reviewsPage <= 1 || loadingAdminReviews" :aria-label="t('admin.acquise.prevPage')" @click="goToReviewsPage(reviewsPage - 1)">&lt;</button>
            <template v-for="p in getPageNumbers(reviewsPage, reviewsTotalPages)" :key="String(p)">
              <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
              <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === reviewsPage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loadingAdminReviews" @click="goToReviewsPage(p)">{{ p }}</button>
            </template>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="reviewsPage >= reviewsTotalPages || loadingAdminReviews" :aria-label="t('admin.acquise.nextPage')" @click="goToReviewsPage(reviewsPage + 1)">&gt;</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="reviewsPage >= reviewsTotalPages || loadingAdminReviews" :aria-label="t('admin.paginationLast')" @click="goToReviewsPage(reviewsTotalPages)">»</button>
          </nav>
        </div>
      </section>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Sidebar Overlay -->
  <div v-if="sidebarMobileOpen" class="md:hidden fixed inset-0 z-50">
    <div class="absolute inset-0 bg-slate-900/40" @click="sidebarMobileOpen = false"></div>
    <aside class="absolute left-0 top-0 bottom-0 w-72 bg-slate-50 border-r border-slate-200/80 overflow-y-auto">
      <div class="px-3 py-3 flex items-center justify-between gap-2 border-b border-slate-200/80">
        <div class="flex items-center gap-2 min-w-0">
          <span class="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-500 [&_svg]:h-5 [&_svg]:w-5" aria-hidden="true">
            <AdminSidebarGlyph name="overview" />
          </span>
          <span class="text-sm font-bold text-slate-900 truncate">Admin</span>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-200/80 hover:text-slate-800"
          aria-label="Sidebar schließen"
          @click="sidebarMobileOpen = false"
        >
          <span class="text-lg leading-none" aria-hidden="true">×</span>
        </button>
      </div>

      <nav class="flex flex-col gap-6 py-4 px-2 overflow-y-auto" aria-label="Admin Navigation">
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-left text-sm font-semibold border-l-[3px] transition-colors"
            :class="
              activeTab === 'overview'
                ? 'border-indigo-600 bg-indigo-50/90 text-slate-900'
                : 'border-transparent text-slate-700 hover:bg-slate-100/90'
            "
            @click="activeTab = 'overview'; loadStats(); sidebarMobileOpen = false"
          >
            <AdminSidebarGlyph
              name="overview"
              :class="activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'"
            />
            <span class="truncate">{{ t('admin.tabOverview') }}</span>
          </button>
        </div>

        <div>
          <p class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {{ t('admin.tabOrganizations') }}
          </p>
          <button
            type="button"
            class="w-full flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-left text-sm font-semibold border-l-[3px] border-transparent text-slate-800 hover:bg-slate-100/90 transition-colors"
            @click="toggleOrganizationsNav()"
          >
            <AdminSidebarGlyph name="building" class="text-slate-400" />
            <span class="truncate min-w-0 flex-1 text-left">{{ t('admin.tabOrganizations') }}</span>
            <AdminSidebarGlyph
              name="chevron-down"
              class="shrink-0 text-slate-400 transition-transform duration-200"
              :class="organizationsMenuOpen ? 'rotate-180' : ''"
            />
          </button>
          <div
            v-show="organizationsMenuOpen"
            class="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 ml-3 pl-2"
          >
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
              :class="
                activeTab === 'organizations'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100/80'
              "
              @click="activeTab = 'organizations'; sidebarMobileOpen = false"
            >
              <AdminSidebarGlyph
                name="building"
                :class="activeTab === 'organizations' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span class="truncate">{{ t('admin.orgNav.manageOrgs') }}</span>
            </button>
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
              :class="
                activeTab === 'requests'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100/80'
              "
              @click="activeTab = 'requests'; sidebarMobileOpen = false"
            >
              <AdminSidebarGlyph
                name="truck"
                :class="activeTab === 'requests' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span class="truncate">{{ t('admin.orgNav.transportRequests') }}</span>
            </button>
          </div>
        </div>

        <div>
          <p class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {{ t('admin.tabAcquise') }}
          </p>
          <button
            type="button"
            class="w-full flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-left text-sm font-semibold border-l-[3px] border-transparent text-slate-800 hover:bg-slate-100/90 transition-colors"
            @click="acquiseMenuOpen = !acquiseMenuOpen; if (activeTab !== 'acquise') activeTab = 'acquise'"
          >
            <AdminSidebarGlyph name="megaphone" class="text-slate-400" />
            <span class="truncate min-w-0 flex-1 text-left">{{ t('admin.tabAcquise') }}</span>
            <AdminSidebarGlyph
              name="chevron-down"
              class="shrink-0 text-slate-400 transition-transform duration-200"
              :class="acquiseMenuOpen ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="acquiseMenuOpen" class="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 ml-3 pl-2">
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
              :class="
                activeTab === 'acquise' && acquiseSubTab === 'users'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100/80'
              "
              @click="activeTab = 'acquise'; acquiseSubTab = 'users'; loadAdminUsers(1); sidebarMobileOpen = false"
            >
              <AdminSidebarGlyph
                name="users"
                :class="activeTab === 'acquise' && acquiseSubTab === 'users' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span class="truncate">{{ t('admin.acquise.tabUsers') }}</span>
            </button>
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
              :class="
                activeTab === 'acquise' && acquiseSubTab === 'registeredOrgs'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100/80'
              "
              @click="activeTab = 'acquise'; acquiseSubTab = 'registeredOrgs'; sidebarMobileOpen = false"
            >
              <AdminSidebarGlyph
                name="building-plus"
                :class="activeTab === 'acquise' && acquiseSubTab === 'registeredOrgs' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span class="truncate">{{ t('admin.acquise.tabRegisteredOrgs') }}</span>
            </button>
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
              :class="
                activeTab === 'acquise' && acquiseSubTab === 'orgaAquise'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100/80'
              "
              @click="activeTab = 'acquise'; acquiseSubTab = 'orgaAquise'; sidebarMobileOpen = false"
            >
              <AdminSidebarGlyph
                name="table"
                :class="activeTab === 'acquise' && acquiseSubTab === 'orgaAquise' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span class="truncate">{{ t('admin.orgaAquise.tabOrgaAquise') }}</span>
            </button>
          </div>
        </div>

        <div>
          <p class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {{ t('admin.tabReviews') }}
          </p>
          <button
            type="button"
            class="w-full flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-left text-sm font-semibold border-l-[3px] transition-colors"
            :class="
              activeTab === 'reviews'
                ? 'border-indigo-600 bg-indigo-50/90 text-slate-900'
                : 'border-transparent text-slate-700 hover:bg-slate-100/90'
            "
            @click="activeTab = 'reviews'; loadAdminReviews(1); sidebarMobileOpen = false"
          >
            <AdminSidebarGlyph
              name="star"
              :class="activeTab === 'reviews' ? 'text-indigo-600' : 'text-slate-400'"
            />
            <span class="truncate">{{ t('admin.tabReviews') }}</span>
          </button>
        </div>

        <div>
          <p class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {{ t('admin.tabMailing') }}
          </p>
          <button
            type="button"
            class="w-full flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-left text-sm font-semibold border-l-[3px] border-transparent text-slate-800 hover:bg-slate-100/90 transition-colors"
            @click="mailingMenuOpen = !mailingMenuOpen; if (activeTab !== 'mailing') activeTab = 'mailing'"
          >
            <AdminSidebarGlyph name="mail" class="text-slate-400" />
            <span class="truncate min-w-0 flex-1 text-left">{{ t('admin.tabMailing') }}</span>
            <AdminSidebarGlyph
              name="chevron-down"
              class="shrink-0 text-slate-400 transition-transform duration-200"
              :class="mailingMenuOpen ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="mailingMenuOpen" class="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 ml-3 pl-2">
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
              :class="
                activeTab === 'mailing' && mailingSubTab === 'flows'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100/80'
              "
              @click="activeTab = 'mailing'; mailingSubTab = 'flows'; sidebarMobileOpen = false"
            >
              <AdminSidebarGlyph
                name="cog"
                :class="activeTab === 'mailing' && mailingSubTab === 'flows' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span class="truncate">{{ t('admin.mailing.subTabFlows') }}</span>
            </button>
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-r-md py-2 pl-2 pr-2 text-left text-[13px] font-normal border-l-[3px] -ml-px transition-colors"
              :class="
                activeTab === 'mailing' && mailingSubTab === 'archive'
                  ? 'border-indigo-600 bg-indigo-50/90 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100/80'
              "
              @click="activeTab = 'mailing'; mailingSubTab = 'archive'; sidebarMobileOpen = false"
            >
              <AdminSidebarGlyph
                name="inbox"
                :class="activeTab === 'mailing' && mailingSubTab === 'archive' ? 'text-indigo-600' : 'text-slate-400'"
              />
              <span class="truncate">{{ t('admin.mailing.subTabArchive') }}</span>
            </button>
          </div>
        </div>

        <div>
          <p class="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {{ t('admin.tabSettings') }}
          </p>
          <button
            type="button"
            class="w-full flex items-center gap-2.5 rounded-md py-2 pl-2 pr-2 text-left text-sm font-semibold border-l-[3px] transition-colors"
            :class="
              activeTab === 'settings'
                ? 'border-indigo-600 bg-indigo-50/90 text-slate-900'
                : 'border-transparent text-slate-700 hover:bg-slate-100/90'
            "
            @click="activeTab = 'settings'; sidebarMobileOpen = false"
          >
            <AdminSidebarGlyph
              name="cog"
              :class="activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'"
            />
            <span class="truncate">{{ t('admin.tabSettings') }}</span>
          </button>
        </div>
      </nav>
    </aside>
  </div>
</template>
