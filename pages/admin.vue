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

type AcquisitionStatus = 'OPEN' | 'CONTACTED' | 'REPLIED' | 'REGISTERED' | 'REJECTED'
type MediationType = 'ANIMALS' | 'HUMANITARIAN' | 'MEDICAL' | 'MIXED'
type MediatesGermany = 'YES' | 'NO' | 'UNKNOWN'

type MailStatus = 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED' | 'COMPLAINED' | null

interface AcquisitionContactRow {
  id: string
  name: string
  country: string
  continent: string
  websiteLanguage: string
  websiteUrl: string | null
  email: string | null
  contactFormUrl: string | null
  mediationType: MediationType
  mediatesToGermany: MediatesGermany
  mediatesFromGermany: MediatesGermany
  notes: string | null
  noted: boolean
  emailSent: boolean
  status: AcquisitionStatus
  lastMailStatus: MailStatus
  lastMailSentAt: string | null
  createdAt: string
  updatedAt: string
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
const acquisitionContacts = ref<AcquisitionContactRow[]>([])
const acquisePage = ref(1)
const acquiseTotal = ref(0)
const acquiseTotalPages = ref(0)
const acquisePageSize = ref(15)
const acquiseSearch = ref('')
const acquiseStatusFilter = ref<string>('')
const loading = ref(true)
const loadingApproved = ref(true)
const loadingBlocked = ref(true)
const loadingRequests = ref(true)
const loadingAcquise = ref(true)
const message = ref('')
const activeTab = ref<'overview' | 'organizations' | 'requests' | 'acquise' | 'reviews' | 'settings'>('overview')
const savingId = ref<string | null>(null)
const sendingMail = ref(false)
const mailResult = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showTestPanel = ref(false)
const testRecipient = ref('')
const testEmailCustom = ref('')

const DEFAULT_MAIL_SUBJECT = 'Beta-Tester gesucht: Flugpaten-Portal'
const DEFAULT_MAIL_BODY = `Hallo {{Tierschutzorga.}},

mein Name ist Aaron und ich beschäftige mich aktuell intensiv mit dem Thema Tierschutz. Dabei ist mir aufgefallen, dass es bislang kein modernes, internationales Portal gibt, über das Flugpaten und Tierschutzorganisationen unkompliziert zusammenfinden können.

Aus dieser Überlegung heraus habe ich eine Beta-Version einer Plattform entwickelt, auf der sich sowohl Flugpaten als auch Organisationen registrieren können. Flugpaten können ihre Flugdaten eintragen und erhalten passende Vermittlungsanfragen zu weltweit hinterlegten Flügen. Ziel ist es, den Prozess transparenter, einfacher und international zugänglich zu machen.

Aktuell suche ich engagierte Organisationen, die Interesse hätten, die Plattform als Beta-Tester auszuprobieren, Feedback zu geben und aktiv mitzugestalten. Langfristig plane ich, das Portal über Social Media gezielt zu bewerben, um möglichst viele Flugpaten zu erreichen und so die Reichweite für teilnehmende Organisationen deutlich zu erhöhen.

Ich würde mich sehr freuen, wenn ihr euch vorstellen könntet, Teil dieses Projekts zu werden. Eure Meinung und euer Feedback wären für mich unglaublich wertvoll.

Ihr leistet großartige Arbeit – vielleicht können wir hier gemeinsam etwas bewegen.

Herzliche Grüße
Aaron`

const mailSubject = ref(DEFAULT_MAIL_SUBJECT)
const mailBody = ref(DEFAULT_MAIL_BODY)
const mailFooterText = ref('Aaron Löchner · aaron.loechner@gmx.de · 015224822057')
const loadingMailSettings = ref(false)
const savingMailSettings = ref(false)
const mailSettingsSaved = ref(false)
const maintenanceMode = ref(false)
const loadingMaintenance = ref(false)
const savingMaintenance = ref(false)
const acquiseSubTab = ref<'contacts' | 'users' | 'registeredOrgs'>('contacts')

interface AdminUserRow {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
  adminNotes: string | null
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
const adminUsersSearch = ref('')
const savingUserNotesId = ref<string | null>(null)
const savingOrgUserNotesId = ref<string | null>(null)
const verifyingUserId = ref<string | null>(null)

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

async function loadMailSettings() {
  loadingMailSettings.value = true
  try {
    const res = await $fetch<{ subject: string; body: string; footerText: string }>('/api/admin/acquisition/mail-settings')
    if (res.subject) mailSubject.value = res.subject
    if (res.body) mailBody.value = res.body
    mailFooterText.value = res.footerText || 'Aaron Löchner · aaron.loechner@gmx.de · 015224822057'
  } catch {
    // Tabelle ggf. noch nicht vorhanden
  } finally {
    loadingMailSettings.value = false
  }
}

async function saveMailSettings() {
  savingMailSettings.value = true
  mailSettingsSaved.value = false
  try {
    await $fetch('/api/admin/acquisition/mail-settings', {
      method: 'PATCH',
      body: {
        subject: mailSubject.value,
        body: mailBody.value,
        footerText: mailFooterText.value,
      },
    })
    mailSettingsSaved.value = true
    setTimeout(() => { mailSettingsSaved.value = false }, 3000)
  } catch {
    message.value = 'Fehler beim Speichern der E-Mail-Einstellungen'
  } finally {
    savingMailSettings.value = false
  }
}

async function loadAcquise(page = 1) {
  loadingAcquise.value = true
  if (activeTab.value === 'acquise') message.value = ''
  try {
    const query: Record<string, string | number> = { page, pageSize: acquisePageSize.value }
    if (acquiseSearch.value.trim()) query.search = acquiseSearch.value.trim()
    if (acquiseStatusFilter.value) query.status = acquiseStatusFilter.value
    const [res] = await Promise.all([
      $fetch<{
        contacts: AcquisitionContactRow[]
        pagination: { page: number; pageSize: number; total: number; totalPages: number }
      }>('/api/admin/acquisition', { query }),
      loadMailSettings(),
    ])
    acquisitionContacts.value = res.contacts
    acquisePage.value = res.pagination.page
    acquiseTotal.value = res.pagination.total
    acquiseTotalPages.value = res.pagination.totalPages
  } catch (e: unknown) {
    if ((e as { statusCode?: number })?.statusCode === 403) await navigateTo('/login')
    else if (activeTab.value === 'acquise') message.value = (e as { data?: { message?: string } })?.data?.message ?? 'Fehler beim Laden der Acquise-Kontakte'
  } finally {
    loadingAcquise.value = false
  }
}

function goToAcquisePage(p: number) {
  if (p < 1 || p > acquiseTotalPages.value) return
  loadAcquise(p)
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
    if (adminUsersSearch.value.trim()) params.set('search', adminUsersSearch.value.trim())
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

function shortenUrl(url: string | null): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname === '/' ? '' : u.pathname
    const s = host + path
    return s.length > 45 ? s.slice(0, 42) + '…' : s
  } catch {
    return url.length > 45 ? url.slice(0, 42) + '…' : url
  }
}

async function load() {
  loading.value = true
  loadingApproved.value = true
  loadingBlocked.value = true
  loadingRequests.value = true
  loadingAcquise.value = true
  await Promise.all([loadPending(), loadApproved(), loadBlocked(), loadRequests(), loadAcquise()])
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

function acquisitionStatusLabel(s: AcquisitionStatus | string): string {
  const key: Record<string, string> = {
    OPEN: 'admin.acquise.statusOpen',
    CONTACTED: 'admin.acquise.statusContacted',
    REPLIED: 'admin.acquise.statusReplied',
    REGISTERED: 'admin.acquise.statusRegistered',
    REJECTED: 'admin.acquise.statusRejected',
  }
  return key[s] ? t(key[s]) : String(s)
}

function mediationTypeLabel(m: MediationType | string): string {
  const key: Record<string, string> = {
    ANIMALS: 'admin.acquise.typeAnimals',
    HUMANITARIAN: 'admin.acquise.typeHumanitarian',
    MEDICAL: 'admin.acquise.typeMedical',
    MIXED: 'admin.acquise.typeMixed',
  }
  return key[m] ? t(key[m]) : String(m)
}

function mediatesLabel(m: MediatesGermany | string): string {
  const key: Record<string, string> = {
    YES: 'admin.acquise.mediatesYes',
    NO: 'admin.acquise.mediatesNo',
    UNKNOWN: 'admin.acquise.mediatesUnknown',
  }
  return key[m] ? t(key[m]) : String(m)
}

function mailStatusLabel(status: MailStatus): string {
  if (!status) return t('admin.acquise.mailStatusNone')
  const key: Record<string, string> = {
    SENT: 'admin.acquise.mailStatusSent',
    DELIVERED: 'admin.acquise.mailStatusDelivered',
    BOUNCED: 'admin.acquise.mailStatusBounced',
    FAILED: 'admin.acquise.mailStatusFailed',
    COMPLAINED: 'admin.acquise.mailStatusComplained',
  }
  return key[status] ? t(key[status]) : String(status)
}

function mailStatusColor(status: MailStatus): string {
  if (!status) return 'bg-slate-100 text-slate-600'
  const colors: Record<string, string> = {
    SENT: 'bg-blue-100 text-blue-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    BOUNCED: 'bg-red-100 text-red-700',
    FAILED: 'bg-red-100 text-red-700',
    COMPLAINED: 'bg-orange-100 text-orange-700',
  }
  return colors[status] || 'bg-slate-100 text-slate-600'
}

async function updateAcquisition(
  id: string,
  patch: { noted?: boolean; emailSent?: boolean; status?: AcquisitionStatus; notes?: string | null }
) {
  savingId.value = id
  try {
    await $fetch(`/api/admin/acquisition/${id}`, {
      method: 'PATCH',
      body: patch,
    })
    const idx = acquisitionContacts.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      if (patch.noted !== undefined) acquisitionContacts.value[idx].noted = patch.noted
      if (patch.emailSent !== undefined) acquisitionContacts.value[idx].emailSent = patch.emailSent
      if (patch.status !== undefined) acquisitionContacts.value[idx].status = patch.status
      if ('notes' in patch) acquisitionContacts.value[idx].notes = patch.notes ?? null
    }
  } catch {
    message.value = 'Fehler beim Speichern'
  } finally {
    savingId.value = null
  }
}

function toggleNoted(c: AcquisitionContactRow) {
  updateAcquisition(c.id, { noted: !c.noted })
}

function toggleEmailSent(c: AcquisitionContactRow) {
  updateAcquisition(c.id, { emailSent: !c.emailSent })
}

function setStatus(c: AcquisitionContactRow, status: AcquisitionStatus) {
  updateAcquisition(c.id, { status })
}

const contactsWithEmail = computed(() => acquisitionContacts.value.filter((c) => c.email))

async function sendBulkMail() {
  if (sendingMail.value) return
  mailResult.value = null
  sendingMail.value = true
  try {
    const res = await $fetch<{ sent: number; failed: number; total: number; errors?: string[] }>('/api/admin/acquisition/send-mail', {
      method: 'POST',
      body: { subject: mailSubject.value, body: mailBody.value },
    })
    mailResult.value = res.failed === 0
      ? { type: 'success', text: t('admin.acquise.mailSuccess', { count: res.sent }) }
      : { type: 'error', text: `${res.sent} versendet, ${res.failed} fehlgeschlagen.${res.errors?.length ? ' ' + res.errors.slice(0, 3).join('; ') : ''}` }
    await loadAcquise(acquisePage.value)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    mailResult.value = { type: 'error', text: err?.data?.message ?? t('admin.acquise.mailError') }
  } finally {
    sendingMail.value = false
  }
}

function openTestPanel() {
  showTestPanel.value = true
  mailResult.value = null
  testRecipient.value = ''
  testEmailCustom.value = ''
}

async function sendTestMail() {
  const email = testRecipient.value === '__other__' ? testEmailCustom.value.trim() : testRecipient.value
  if (!email) {
    mailResult.value = { type: 'error', text: t('admin.acquise.mailTestSelectOrEnter') }
    return
  }
  if (testRecipient.value === '__other__' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mailResult.value = { type: 'error', text: t('admin.acquise.mailTestInvalidEmail') }
    return
  }
  const name = testRecipient.value === '__other__' ? 'Test-Organisation' : (contactsWithEmail.value.find((c) => c.email === testRecipient.value)?.name ?? 'Test-Organisation')
  if (sendingMail.value) return
  mailResult.value = null
  sendingMail.value = true
  try {
    await $fetch('/api/admin/acquisition/send-mail', {
      method: 'POST',
      body: { subject: mailSubject.value, body: mailBody.value, testTo: email, testName: name },
    })
    mailResult.value = { type: 'success', text: t('admin.acquise.mailTestSent') }
    showTestPanel.value = false
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    mailResult.value = { type: 'error', text: err?.data?.message ?? t('admin.acquise.mailError') }
  } finally {
    sendingMail.value = false
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

watch([adminUsersFilterNew, adminUsersFilterUnverified, adminUsersFilterActive, adminUsersSearch], () => {
  if (activeTab.value === 'acquise' && acquiseSubTab.value === 'users') loadAdminUsers(1)
})

onMounted(() => {
  load()
  loadMaintenance()
  loadStats()
})
</script>

<template>
  <div class="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
    <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">{{ t('admin.title') }}</h1>
    <div v-if="message" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
      {{ message }}
    </div>

    <!-- Tab navigation -->
    <div class="sm:hidden mb-4">
      <label class="block text-sm font-medium text-slate-700 mb-1">Bereich</label>
      <select v-model="activeTab" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
        <option value="overview">{{ t('admin.tabOverview') }}</option>
        <option value="organizations">{{ t('admin.tabOrganizations') }}</option>
        <option value="requests">{{ t('admin.tabTransportRequests') }}</option>
        <option value="acquise">{{ t('admin.tabAcquise') }}</option>
        <option value="reviews">{{ t('admin.tabReviews') }}</option>
        <option value="settings">{{ t('admin.tabSettings') }}</option>
      </select>
    </div>

    <nav class="hidden sm:flex flex-wrap gap-2 mb-6 border-b border-slate-200" aria-label="Admin-Bereiche">
      <button
        type="button"
        class="px-4 py-2.5 rounded-t-lg font-medium transition-colors -mb-px"
        :class="activeTab === 'overview' ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        @click="activeTab = 'overview'; loadStats()"
      >
        {{ t('admin.tabOverview') }}
      </button>
      <button
        type="button"
        class="px-4 py-2.5 rounded-t-lg font-medium transition-colors -mb-px"
        :class="activeTab === 'organizations' ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        @click="activeTab = 'organizations'"
      >
        {{ t('admin.tabOrganizations') }}
      </button>
      <button
        type="button"
        class="px-4 py-2.5 rounded-t-lg font-medium transition-colors -mb-px"
        :class="activeTab === 'requests' ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        @click="activeTab = 'requests'"
      >
        {{ t('admin.tabTransportRequests') }}
      </button>
      <button
        type="button"
        class="px-4 py-2.5 rounded-t-lg font-medium transition-colors -mb-px"
        :class="activeTab === 'acquise' ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        @click="activeTab = 'acquise'"
      >
        {{ t('admin.tabAcquise') }}
      </button>
      <button
        type="button"
        class="px-4 py-2.5 rounded-t-lg font-medium transition-colors -mb-px"
        :class="activeTab === 'reviews' ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        @click="activeTab = 'reviews'; loadAdminReviews(1)"
      >
        {{ t('admin.tabReviews') }}
      </button>
      <button
        type="button"
        class="px-4 py-2.5 rounded-t-lg font-medium transition-colors -mb-px"
        :class="activeTab === 'settings' ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        @click="activeTab = 'settings'"
      >
        {{ t('admin.tabSettings') }}
      </button>
    </nav>

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
          <option value="contacts">{{ t('admin.acquise.tabContacts') }}</option>
          <option value="users">{{ t('admin.acquise.tabUsers') }}</option>
          <option value="registeredOrgs">{{ t('admin.acquise.tabRegisteredOrgs') }}</option>
        </select>
      </div>

      <div class="hidden sm:flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          :class="acquiseSubTab === 'contacts' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          @click="acquiseSubTab = 'contacts'"
        >
          {{ t('admin.acquise.tabContacts') }}
        </button>
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
      </div>

      <!-- Sub-Tab: Kontakte -->
      <template v-if="acquiseSubTab === 'contacts'">
      <!-- E-Mail-Versand -->
      <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-1">{{ t('admin.acquise.mailTitle') }}</h2>
        <p class="text-slate-600 text-sm mb-4">{{ t('admin.acquise.mailDescription') }}</p>
        <div v-if="mailResult" class="mb-4 p-3 rounded text-sm" :class="mailResult.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'">
          {{ mailResult.text }}
        </div>
        <div class="space-y-3">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">{{ t('admin.acquise.mailSubject') }}</span>
            <input v-model="mailSubject" type="text" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" placeholder="Betreff" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">{{ t('admin.acquise.mailBody') }}</span>
            <textarea v-model="mailBody" rows="14" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono text-sm" :placeholder="t('admin.acquise.mailPlaceholder')" />
          </label>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ t('admin.acquise.mailFooter') }}</span>
              <textarea
                v-model="mailFooterText"
                rows="2"
                class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm"
                :placeholder="t('admin.acquise.mailFooterPlaceholder')"
              />
            </label>
            <p class="mt-1 text-xs text-slate-500">{{ t('admin.acquise.mailFooterHint') }}</p>
            <div class="mt-2 flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
                :disabled="savingMailSettings || loadingMailSettings"
                @click="saveMailSettings"
              >
                {{ savingMailSettings ? t('admin.acquise.mailSaving') : t('admin.acquise.mailSaveTemplate') }}
              </button>
              <span v-if="mailSettingsSaved" class="text-sm text-emerald-600">{{ t('admin.acquise.saved') }}</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-slate-900 hover:bg-amber-600 disabled:opacity-50"
              :disabled="sendingMail"
              @click="sendBulkMail"
            >
              {{ sendingMail ? t('admin.acquise.mailSending') : t('admin.acquise.mailSend') }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="sendingMail"
              @click="openTestPanel"
            >
              {{ t('admin.acquise.mailTestSend') }}
            </button>
          </div>

          <!-- Test-E-Mail: Auswahl -->
          <div v-if="showTestPanel" class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="mb-2 text-sm font-medium text-slate-700">{{ t('admin.acquise.mailTestTo') }}</p>
            <select
              v-model="testRecipient"
              class="mb-3 block w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              <option value="">{{ t('admin.acquise.mailTestChoose') }}</option>
              <option v-for="c in contactsWithEmail" :key="c.id" :value="c.email">
                {{ c.name }} ({{ c.email }})
              </option>
              <option value="__other__">{{ t('admin.acquise.mailTestOther') }}</option>
            </select>
            <input
              v-if="testRecipient === '__other__'"
              v-model="testEmailCustom"
              type="email"
              class="mb-3 block w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              :placeholder="t('admin.acquise.mailTestEmailPlaceholder')"
            />
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-amber-600"
                :disabled="sendingMail || !testRecipient || (testRecipient === '__other__' && !testEmailCustom.trim())"
                @click="sendTestMail"
              >
                {{ t('admin.acquise.mailTestSubmit') }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                @click="showTestPanel = false"
              >
                {{ t('admin.acquise.mailTestCancel') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-slate-800 mb-2">{{ t('admin.acquise.title') }}</h2>
        <p class="text-slate-600 text-sm mb-2">{{ t('admin.acquise.description') }}</p>
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            v-model="acquiseSearch"
            type="search"
            :placeholder="t('admin.searchPlaceholder')"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 max-w-[220px]"
            @keyup.enter="loadAcquise(1)"
          />
          <select
            v-model="acquiseStatusFilter"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
            @change="loadAcquise(1)"
          >
            <option value="">{{ t('admin.filterAll') }}</option>
            <option value="OPEN">{{ t('admin.acquise.statusOpen') }}</option>
            <option value="CONTACTED">{{ t('admin.acquise.statusContacted') }}</option>
            <option value="REPLIED">{{ t('admin.acquise.statusReplied') }}</option>
            <option value="REGISTERED">{{ t('admin.acquise.statusRegistered') }}</option>
            <option value="REJECTED">{{ t('admin.acquise.statusRejected') }}</option>
          </select>
          <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadAcquise(1)">{{ t('admin.search') }}</button>
        </div>
        <div v-if="loadingAcquise" class="text-slate-600 text-sm">{{ t('admin.acquise.loading') }}</div>
        <div v-else-if="acquisitionContacts.length === 0" class="p-6 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm">
          {{ t('admin.acquise.empty') }}
        </div>
        <div v-else>
          <!-- Mobile: Cards -->
          <div class="sm:hidden space-y-3">
            <div v-for="c in acquisitionContacts" :key="c.id" class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-semibold text-slate-900 break-words">{{ c.name }}</div>
                  <div class="text-sm text-slate-600 mt-1">{{ c.country }} · {{ c.websiteLanguage }}</div>
                  <div class="text-sm text-slate-600 mt-1 break-all">
                    <a v-if="c.email" :href="`mailto:${c.email}`" class="text-amber-600 hover:underline">{{ c.email }}</a>
                    <span v-else class="text-slate-400">–</span>
                  </div>
                </div>
                <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 shrink-0">
                  {{ acquisitionStatusLabel(c.status) }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium min-h-[44px]"
                  :class="c.noted ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-600'"
                  :disabled="savingId === c.id"
                  @click="toggleNoted(c)"
                >
                  {{ t('admin.acquise.noted') }}: {{ c.noted ? '✓' : '–' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium min-h-[44px]"
                  :class="c.emailSent ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-100 border-slate-200 text-slate-600'"
                  :disabled="savingId === c.id"
                  @click="toggleEmailSent(c)"
                >
                  {{ t('admin.acquise.emailSent') }}: {{ c.emailSent ? '✓' : '–' }}
                </button>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">{{ t('admin.acquise.status') }}</label>
                <select
                  :value="c.status"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  :disabled="savingId === c.id"
                  @change="setStatus(c, ($event.target as HTMLSelectElement).value as AcquisitionStatus)"
                >
                  <option value="OPEN">{{ t('admin.acquise.statusOpen') }}</option>
                  <option value="CONTACTED">{{ t('admin.acquise.statusContacted') }}</option>
                  <option value="REPLIED">{{ t('admin.acquise.statusReplied') }}</option>
                  <option value="REGISTERED">{{ t('admin.acquise.statusRegistered') }}</option>
                  <option value="REJECTED">{{ t('admin.acquise.statusRejected') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Desktop: Table -->
          <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table class="w-full min-w-[900px] text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.name') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.country') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.language') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.website') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.email') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.type') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.toDE') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.fromDE') }}</th>
                <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.noted') }}</th>
                <th class="text-center py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.emailSent') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.mailStatus') }}</th>
                <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in acquisitionContacts" :key="c.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td class="py-3 px-3 text-slate-900 font-medium">{{ c.name }}</td>
                <td class="py-3 px-3 text-slate-600">{{ c.country }}</td>
                <td class="py-3 px-3 text-slate-600">{{ c.websiteLanguage }}</td>
                <td class="py-3 px-3 max-w-[200px]">
                  <a v-if="c.websiteUrl" :href="c.websiteUrl" :title="c.websiteUrl" target="_blank" rel="noopener noreferrer" class="text-amber-600 hover:underline truncate block">{{ shortenUrl(c.websiteUrl) }}</a>
                  <span v-else class="text-slate-400">–</span>
                </td>
                <td class="py-3 px-3 max-w-[180px]">
                  <a v-if="c.email" :href="`mailto:${c.email}`" class="text-amber-600 hover:underline truncate block" :title="c.email">{{ c.email.length > 30 ? c.email.slice(0, 27) + '…' : c.email }}</a>
                  <span v-else class="text-slate-400">–</span>
                </td>
                <td class="py-3 px-3 text-slate-600">{{ mediationTypeLabel(c.mediationType) }}</td>
                <td class="py-3 px-3 text-slate-600">{{ mediatesLabel(c.mediatesToGermany) }}</td>
                <td class="py-3 px-3 text-slate-600">{{ mediatesLabel(c.mediatesFromGermany) }}</td>
                <td class="py-3 px-3 text-center">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 rounded border transition-colors"
                    :class="c.noted ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'"
                    :aria-label="t('admin.acquise.noted')"
                    :disabled="savingId === c.id"
                    @click="toggleNoted(c)"
                  >
                    <span v-if="c.noted">✓</span>
                    <span v-else>–</span>
                  </button>
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 rounded border transition-colors"
                    :class="c.emailSent ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'"
                    :aria-label="t('admin.acquise.emailSent')"
                    :disabled="savingId === c.id"
                    @click="toggleEmailSent(c)"
                  >
                    <span v-if="c.emailSent">✓</span>
                    <span v-else>–</span>
                  </button>
                </td>
                <td class="py-3 px-3">
                  <div v-if="c.lastMailStatus" class="flex flex-col gap-1">
                    <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium" :class="mailStatusColor(c.lastMailStatus)">
                      {{ mailStatusLabel(c.lastMailStatus) }}
                    </span>
                    <span v-if="c.lastMailSentAt" class="text-xs text-slate-500">
                      {{ new Date(c.lastMailSentAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) }}
                    </span>
                  </div>
                  <span v-else class="text-slate-400 text-xs">–</span>
                </td>
                <td class="py-3 px-3">
                  <select
                    :value="c.status"
                    class="w-full min-w-[120px] py-1.5 px-2 rounded border border-slate-300 text-slate-800 text-xs bg-white"
                    :disabled="savingId === c.id"
                    @change="setStatus(c, ($event.target as HTMLSelectElement).value as AcquisitionStatus)"
                  >
                    <option value="OPEN">{{ t('admin.acquise.statusOpen') }}</option>
                    <option value="CONTACTED">{{ t('admin.acquise.statusContacted') }}</option>
                    <option value="REPLIED">{{ t('admin.acquise.statusReplied') }}</option>
                    <option value="REGISTERED">{{ t('admin.acquise.statusRegistered') }}</option>
                    <option value="REJECTED">{{ t('admin.acquise.statusRejected') }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
        <!-- Paginierung -->
        <div v-if="acquiseTotal > 15" class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-600">
            {{ t('admin.acquise.pageInfo', { from: (acquisePage - 1) * acquisePageSize + 1, to: Math.min(acquisePage * acquisePageSize, acquiseTotal), total: acquiseTotal }) }}
          </p>
          <nav class="flex items-center gap-1" aria-label="Paginierung">
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="acquisePage <= 1 || loadingAcquise" :aria-label="t('admin.paginationFirst')" @click="goToAcquisePage(1)">«</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="acquisePage <= 1 || loadingAcquise" :aria-label="t('admin.acquise.prevPage')" @click="goToAcquisePage(acquisePage - 1)">&lt;</button>
            <template v-for="p in getPageNumbers(acquisePage, acquiseTotalPages)" :key="String(p)">
              <span v-if="p === 'ellipsis'" class="px-1.5 text-slate-400">…</span>
              <button v-else type="button" class="min-w-[32px] rounded px-2.5 py-1.5 text-sm font-medium transition-colors" :class="p === acquisePage ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'" :disabled="loadingAcquise" @click="goToAcquisePage(p)">{{ p }}</button>
            </template>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="acquisePage >= acquiseTotalPages || loadingAcquise" :aria-label="t('admin.acquise.nextPage')" @click="goToAcquisePage(acquisePage + 1)">&gt;</button>
            <button type="button" class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="acquisePage >= acquiseTotalPages || loadingAcquise" :aria-label="t('admin.paginationLast')" @click="goToAcquisePage(acquiseTotalPages)">»</button>
          </nav>
        </div>
      </section>
      </template>

      <!-- Sub-Tab: Nutzer -->
      <template v-else-if="acquiseSubTab === 'users'">
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
            <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600" @click="loadAdminUsers(1)">{{ t('admin.search') }}</button>
          </div>
          <div v-if="loadingAdminUsers" class="text-slate-600 text-sm py-4">{{ t('admin.acquise.loading') }}</div>
          <div v-else-if="adminUsers.length === 0" class="p-6 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm">
            {{ t('admin.acquise.usersEmpty') }}
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
                  <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.acquise.userNotes') }}</th>
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
                    <input
                      type="text"
                      :value="u.adminNotes ?? ''"
                      :disabled="savingUserNotesId === u.id"
                      class="w-full max-w-[200px] py-1.5 px-2 rounded border border-slate-300 text-slate-800 text-xs"
                      :placeholder="t('admin.acquise.userNotesPlaceholder')"
                      @blur="saveUserNotes(u, ($event.target as HTMLInputElement).value)"
                    />
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
</template>
