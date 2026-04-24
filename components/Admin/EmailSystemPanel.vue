<script setup lang="ts">
import EmailPlaceholderPickerModal from '~/components/Admin/EmailPlaceholderPickerModal.vue'
import EmailRecipientKindField from '~/components/Admin/EmailRecipientKindField.vue'
import { PLACEHOLDER_GROUPS, placeholderCode } from '~/components/Admin/emailTriggerPlaceholders'

const props = withDefaults(
  defineProps<{ active: boolean; section?: 'flows' | 'archive' | 'both' }>(),
  { section: 'both' }
)

const { t, locale } = useI18n()

interface RuleRow {
  triggerKey: string
  labelDe: string
  descriptionDe: string | null
  enabled: boolean
  deliveryMode: 'IMMEDIATE' | 'QUEUED'
  recipientKind: 'ORG_CONTACT_EMAIL' | 'USER_SELF' | 'ADMIN_EMAIL'
  subjectTemplate: string
  bodyTemplate: string
  subjectTemplateEn: string
  bodyTemplateEn: string
  sortOrder: number
}

interface ArchiveRow {
  id: string
  triggerKey: string
  status: string
  toEmail: string
  subject: string
  bodyPlain: string | null
  deliveryStatus: string | null
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
  organizationId: string | null
  requestId: string | null
  userId: string | null
}

const subTab = ref<'triggers' | 'archive'>('triggers')
const rules = ref<RuleRow[]>([])
const loadingRules = ref(false)
const savingKey = ref<string | null>(null)
const ruleSaveError = ref<string | null>(null)
const ruleSaveSuccess = ref<string | null>(null)
const editDraft = ref<Record<string, RuleRow>>({})

type TriggerTab = 'content' | 'conditions' | 'settings'

const triggerSearch = ref('')
const selectedTriggerKey = ref<string | null>(null)
const selectedTriggerTab = ref<TriggerTab>('content')

const canActivateSelected = computed(() => {
  const key = selectedTriggerKey.value
  if (!key) return false
  const d = editDraft.value[key]
  if (!d) return false
  return d.subjectTemplate.trim().length > 0 && d.bodyTemplate.trim().length > 0
})

const enableToggleDisabled = computed(() => {
  const key = selectedTriggerKey.value
  if (!key) return true
  const d = editDraft.value[key]
  if (!d) return true
  // Aktivieren nur möglich, wenn Betreff + Text gesetzt sind.
  if (d.enabled) return false // immer inaktivierbar
  return !canActivateSelected.value
})

watch(selectedTriggerKey, () => {
  ruleSaveError.value = null
  ruleSaveSuccess.value = null
})

const archiveItems = ref<ArchiveRow[]>([])
const archiveTotal = ref(0)
const archivePage = ref(1)
const archivePageSize = ref(20)
const archiveTotalPages = ref(1)
const loadingArchive = ref(false)
const filterTrigger = ref('')
const filterStatus = ref('')
const filterQ = ref('')
const filterFrom = ref('')
const filterTo = ref('')

// E-Mail-Archiv bereinigen
const purgeDays = ref<number>(30)
const purgingArchive = ref(false)
const purgeDeletedCount = ref<number | null>(null)
const digestSending = ref(false)
const digestProcessedUsers = ref<number | null>(null)

const detailId = ref<string | null>(null)
const detail = ref<{
  id: string
  triggerKey: string
  status: string
  toEmail: string
  subject: string
  bodyHtml: string
  bodyPlain: string | null
  deliveryStatus: string | null
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
} | null>(null)
const detailEditTo = ref('')
const detailEditSubject = ref('')
const detailEditBody = ref('')
const detailBusy = ref(false)

watch(rules, (list) => {
  const next: Record<string, RuleRow> = {}
  for (const r of list) {
    const row = r as RuleRow & { subjectTemplateEn?: string | null; bodyTemplateEn?: string | null }
    next[r.triggerKey] = {
      ...r,
      subjectTemplateEn: row.subjectTemplateEn ?? '',
      bodyTemplateEn: row.bodyTemplateEn ?? '',
    }
  }
  editDraft.value = next
  // Default-Auswahl: erstes Element. Auswahl beibehalten, wenn möglich.
  if (!selectedTriggerKey.value && list.length > 0) {
    selectedTriggerKey.value = list[0].triggerKey
  } else if (selectedTriggerKey.value) {
    const stillExists = list.some((r) => r.triggerKey === selectedTriggerKey.value)
    if (!stillExists) selectedTriggerKey.value = list[0]?.triggerKey ?? null
  }
}, { immediate: true })

const filteredRules = computed(() => {
  const q = triggerSearch.value.trim().toLowerCase()
  if (!q) return rules.value
  return rules.value.filter((r) => r.labelDe.toLowerCase().includes(q) || r.triggerKey.toLowerCase().includes(q))
})

const selectedRule = computed(() => {
  const key = selectedTriggerKey.value
  if (!key) return null
  return rules.value.find((r) => r.triggerKey === key) ?? null
})

function saveSelectedRule() {
  if (!selectedTriggerKey.value) return
  saveRule(selectedTriggerKey.value)
}

function deliveryLabel(mode: RuleRow['deliveryMode']): string {
  return mode === 'IMMEDIATE' ? t('admin.emails.deliveryImmediate') : t('admin.emails.deliveryQueued')
}

function recipientLabel(kind: RuleRow['recipientKind']): string {
  if (kind === 'ORG_CONTACT_EMAIL') return t('admin.emails.recipientOrg')
  if (kind === 'USER_SELF') return t('admin.emails.recipientUser')
  return t('admin.emails.recipientAdmin')
}

async function loadRules() {
  loadingRules.value = true
  try {
    const res = await $fetch<{ rules: RuleRow[] }>('/api/admin/email-rules')
    rules.value = res.rules
  } catch (e) {
    console.error(e)
  } finally {
    loadingRules.value = false
  }
}

async function loadArchive(page = 1) {
  loadingArchive.value = true
  archivePage.value = page
  try {
    const query: Record<string, string> = {
      page: String(page),
      pageSize: String(archivePageSize.value),
    }
    if (filterTrigger.value.trim()) query.triggerKey = filterTrigger.value.trim()
    if (filterStatus.value) query.status = filterStatus.value
    if (filterQ.value.trim()) query.q = filterQ.value.trim()
    if (filterFrom.value) query.from = filterFrom.value
    if (filterTo.value) query.to = filterTo.value
    const res = await $fetch<{
      items: ArchiveRow[]
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>('/api/admin/email-archive', { query })
    archiveItems.value = res.items
    archiveTotal.value = res.total
    archiveTotalPages.value = res.totalPages
  } catch (e) {
    console.error(e)
  } finally {
    loadingArchive.value = false
  }
}

async function purgeEmailArchive() {
  const days = Number(purgeDays.value)
  if (!Number.isFinite(days) || days < 0) return
  if (purgingArchive.value) return

  const ok = window.confirm(t('admin.emails.archivePurgeConfirm', { days }))
  if (!ok) return

  purgingArchive.value = true
  purgeDeletedCount.value = null
  try {
    const res = await $fetch<{ deletedCount: number; days: number; cutoff: string }>(
      '/api/admin/email-archive/cleanup',
      {
        method: 'POST',
        body: { days },
      }
    )
    purgeDeletedCount.value = res.deletedCount
    await loadArchive(1)
  } catch (e) {
    console.error(e)
  } finally {
    purgingArchive.value = false
  }
}

async function sendRouteDigestNow() {
  if (digestSending.value) return
  digestSending.value = true
  digestProcessedUsers.value = null
  try {
    const res = await $fetch<{ processedUsers: number }>('/api/admin/email-archive/route-digest/send', {
      method: 'POST',
    })
    digestProcessedUsers.value = res.processedUsers
    await loadArchive(1)
  } catch (e) {
    console.error(e)
  } finally {
    digestSending.value = false
  }
}

async function saveRule(key: string) {
  const d = editDraft.value[key]
  if (!d) return
  ruleSaveError.value = null
  ruleSaveSuccess.value = null

  const subject = d.subjectTemplate.trim()
  const body = d.bodyTemplate.trim()
  if (d.enabled && (!subject || !body)) {
    ruleSaveError.value = 'Aktivieren erfordert einen ausgefüllten Betreff und Text.'
    return
  }

  savingKey.value = key
  try {
    const payload: Record<string, unknown> = {
      enabled: d.enabled,
      deliveryMode: d.deliveryMode,
      recipientKind: d.recipientKind,
    }

    // Patch validiert `min(1)` nur, wenn Werte wirklich mitgeschickt werden.
    // So kann auch „Inaktiv“ gespeichert werden, ohne dass Betreff/Text zwingend gesetzt sein müssen.
    if (subject) payload.subjectTemplate = d.subjectTemplate
    if (body) payload.bodyTemplate = d.bodyTemplate
    payload.subjectTemplateEn = d.subjectTemplateEn.trim() || null
    payload.bodyTemplateEn = d.bodyTemplateEn.trim() || null

    await $fetch(`/api/admin/email-rules/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: payload,
    })
    await loadRules()

    ruleSaveSuccess.value = 'Gespeichert.'
  } catch (e) {
    const err = e as { data?: { message?: string } }
    ruleSaveError.value = err?.data?.message ?? 'Fehler beim Speichern.'
    console.error(e)
  } finally {
    savingKey.value = null
  }
}

async function openDetail(id: string) {
  detailId.value = id
  detailBusy.value = true
  try {
    const res = await $fetch<{ email: Record<string, unknown> }>(`/api/admin/email-archive/${id}`)
    const e = res.email
    detail.value = {
      id: String(e.id),
      triggerKey: String(e.triggerKey),
      status: String(e.status),
      toEmail: String(e.toEmail),
      subject: String(e.subject),
      bodyHtml: String(e.bodyHtml),
      bodyPlain: e.bodyPlain != null ? String(e.bodyPlain) : null,
      deliveryStatus: e.deliveryStatus != null ? String(e.deliveryStatus) : null,
      errorMessage: e.errorMessage != null ? String(e.errorMessage) : null,
      sentAt: e.sentAt != null ? String(e.sentAt) : null,
      createdAt: String(e.createdAt),
    }
    detailEditTo.value = detail.value.toEmail
    detailEditSubject.value = detail.value.subject
    detailEditBody.value = detail.value.bodyPlain ?? ''
  } catch (err) {
    console.error(err)
    detail.value = null
  } finally {
    detailBusy.value = false
  }
}

function closeDetail() {
  detailId.value = null
  detail.value = null
}

const detailEditable = computed(
  () => detail.value && (detail.value.status === 'QUEUED' || detail.value.status === 'FAILED')
)

async function saveDetail() {
  if (!detail.value) return
  detailBusy.value = true
  try {
    await $fetch(`/api/admin/email-archive/${detail.value.id}`, {
      method: 'PATCH',
      body: {
        toEmail: detailEditTo.value,
        subject: detailEditSubject.value,
        bodyPlain: detailEditBody.value,
        resetToQueued: detail.value.status === 'FAILED',
      },
    })
    await openDetail(detail.value.id)
    await loadArchive(archivePage.value)
  } catch (e) {
    console.error(e)
  } finally {
    detailBusy.value = false
  }
}

async function sendDetail() {
  if (!detail.value) return
  detailBusy.value = true
  try {
    await $fetch(`/api/admin/email-archive/${detail.value.id}/send`, { method: 'POST' })
    await openDetail(detail.value.id)
    await loadArchive(archivePage.value)
  } catch (e) {
    console.error(e)
  } finally {
    detailBusy.value = false
  }
}

async function cancelDetail() {
  if (!detail.value) return
  detailBusy.value = true
  try {
    await $fetch(`/api/admin/email-archive/${detail.value.id}/cancel`, { method: 'POST' })
    closeDetail()
    await loadArchive(archivePage.value)
  } catch (e) {
    console.error(e)
  } finally {
    detailBusy.value = false
  }
}

const showTabBar = computed(() => props.section === 'both')
const showFlows = computed(
  () => props.section === 'flows' || (props.section === 'both' && subTab.value === 'triggers')
)
const showArchive = computed(
  () => props.section === 'archive' || (props.section === 'both' && subTab.value === 'archive')
)
const showAdminHint = computed(() => props.section !== 'archive')

watch(
  () => props.active,
  (v) => {
    if (!v) return
    if (props.section === 'flows' || props.section === 'both') loadRules()
    if (props.section === 'archive' || props.section === 'both') loadArchive(1)
  },
  { immediate: true }
)

/** Platzhalter-Modal: welche Regel + Betreff vs. Text */
const phPickerContext = ref<{ triggerKey: string; field: 'subject' | 'body' | 'subjectEn' | 'bodyEn' } | null>(null)
const lastFocusedField = ref<Record<string, 'subject' | 'body' | 'subjectEn' | 'bodyEn'>>({})
const subjectRefs = ref<Record<string, HTMLInputElement | null>>({})
const bodyRefs = ref<Record<string, HTMLTextAreaElement | null>>({})
const subjectEnRefs = ref<Record<string, HTMLInputElement | null>>({})
const bodyEnRefs = ref<Record<string, HTMLTextAreaElement | null>>({})

watch(selectedTriggerKey, (key) => {
  // Modal schließen, sobald ein anderer Trigger ausgewählt wird.
  if (!key) phPickerContext.value = null
  else if (phPickerContext.value && phPickerContext.value.triggerKey !== key) phPickerContext.value = null
})

function setSubjectRef(key: string, el: unknown) {
  subjectRefs.value[key] = el instanceof HTMLInputElement ? el : null
}

function setBodyRef(key: string, el: unknown) {
  bodyRefs.value[key] = el instanceof HTMLTextAreaElement ? el : null
}

function setSubjectEnRef(key: string, el: unknown) {
  subjectEnRefs.value[key] = el instanceof HTMLInputElement ? el : null
}

function setBodyEnRef(key: string, el: unknown) {
  bodyEnRefs.value[key] = el instanceof HTMLTextAreaElement ? el : null
}

function openPhPicker(triggerKey: string, field: 'subject' | 'body' | 'subjectEn' | 'bodyEn') {
  phPickerContext.value = { triggerKey, field }
}

function onPhPickerOpen(v: boolean) {
  if (!v) phPickerContext.value = null
}

function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null | undefined,
  current: string,
  snippet: string,
  apply: (next: string) => void
) {
  if (!el) {
    apply(current + snippet)
    return
  }
  const start = el.selectionStart ?? current.length
  const end = el.selectionEnd ?? current.length
  const next = current.slice(0, start) + snippet + current.slice(end)
  apply(next)
  nextTick(() => {
    el.focus()
    const pos = start + snippet.length
    el.setSelectionRange(pos, pos)
  })
}

function applySnippet(triggerKey: string, field: 'subject' | 'body' | 'subjectEn' | 'bodyEn', code: string) {
  const d = editDraft.value[triggerKey]
  if (!d) return
  if (field === 'subject') {
    insertAtCursor(subjectRefs.value[triggerKey], d.subjectTemplate, code, (v) => {
      d.subjectTemplate = v
    })
  } else if (field === 'body') {
    insertAtCursor(bodyRefs.value[triggerKey], d.bodyTemplate, code, (v) => {
      d.bodyTemplate = v
    })
  } else if (field === 'subjectEn') {
    insertAtCursor(subjectEnRefs.value[triggerKey], d.subjectTemplateEn, code, (v) => {
      d.subjectTemplateEn = v
    })
  } else {
    insertAtCursor(bodyEnRefs.value[triggerKey], d.bodyTemplateEn, code, (v) => {
      d.bodyTemplateEn = v
    })
  }
}

function onPlaceholderPicked(code: string) {
  const ctx = phPickerContext.value
  if (!ctx) return
  applySnippet(ctx.triggerKey, ctx.field, code)
}

function quickInsertPlaceholder(triggerKey: string, varKey: string) {
  const field = lastFocusedField.value[triggerKey] ?? 'body'
  applySnippet(triggerKey, field, placeholderCode(varKey))
}

function trackFocus(triggerKey: string, field: 'subject' | 'body' | 'subjectEn' | 'bodyEn') {
  lastFocusedField.value = { ...lastFocusedField.value, [triggerKey]: field }
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="showAdminHint"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      {{ t('admin.emails.adminNotifyHint') }}
    </div>

    <div v-if="showTabBar" class="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="subTab === 'triggers' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 border border-slate-200'"
        @click="subTab = 'triggers'"
      >
        {{ t('admin.emails.tabTriggers') }}
      </button>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="subTab === 'archive' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 border border-slate-200'"
        @click="subTab = 'archive'"
      >
        {{ t('admin.emails.tabArchive') }}
      </button>
    </div>

    <!-- Trigger -->
    <div v-show="showFlows" class="space-y-6">
      <p class="text-sm text-slate-600 max-w-3xl leading-relaxed">{{ t('admin.emails.triggersIntro') }}</p>
      <div v-if="loadingRules" class="text-slate-500 text-sm">{{ t('admin.loading') }}</div>
      <div v-else class="flex flex-col lg:flex-row gap-6 min-h-[420px]">
        <!-- Left: compact list -->
        <aside class="w-full lg:w-80 lg:flex-shrink-0">
          <div class="sticky top-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-sm font-semibold text-slate-900">{{ t('admin.emails.trigger.listTitle') }}</h3>
              <span class="mt-0.5 text-xs text-slate-500">{{ filteredRules.length }}</span>
            </div>

            <input
              v-model="triggerSearch"
              type="search"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2"
              :placeholder="t('admin.emails.trigger.listSearchPlaceholder')"
            />

            <div class="overflow-y-auto pr-1 max-h-[calc(90vh-220px)] space-y-2">
              <button
                v-for="r in filteredRules"
                :key="r.triggerKey"
                type="button"
                class="w-full rounded-xl border px-3 py-3 text-left transition-colors"
                :class="
                  selectedTriggerKey === r.triggerKey
                    ? 'border-slate-400 bg-slate-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                "
                @click="selectedTriggerKey = r.triggerKey"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-slate-900">{{ r.labelDe }}</p>
                    <p class="mt-1 font-mono text-[11px] text-slate-400 break-all">{{ r.triggerKey }}</p>
                    <p
                      v-if="r.descriptionDe"
                      class="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-2"
                    >
                      {{ r.descriptionDe }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    :class="
                      r.enabled
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    "
                  >
                    {{ r.enabled ? t('admin.emails.trigger.enabledOn') : t('admin.emails.trigger.enabledOff') }}
                  </span>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {{ deliveryLabel(r.deliveryMode) }}
                  </span>
                  <span class="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {{ recipientLabel(r.recipientKind) }}
                  </span>
                </div>
              </button>
              <p v-if="filteredRules.length === 0" class="text-sm text-slate-500 px-2 py-3">{{ t('admin.emails.trigger.listNoResults') }}</p>
            </div>
          </div>
        </aside>

        <!-- Right: detail view -->
        <main class="flex-1 min-w-0">
          <div
            v-if="!selectedTriggerKey || !editDraft[selectedTriggerKey]"
            class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"
          >
            {{ t('admin.emails.trigger.selectHint') }}
          </div>

          <div
            v-else
            class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[calc(90vh-190px)]"
          >
            <header
              class="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-slate-50/40 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="min-w-0 flex-1 space-y-1">
                <h3 class="text-lg font-semibold text-slate-900">
                  {{ selectedRule?.labelDe ?? '' }}
                </h3>
                <p class="font-mono text-[11px] text-slate-400 break-all">
                  {{ selectedRule?.triggerKey ?? '' }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <button
                  type="button"
                  class="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
                  :disabled="savingKey === selectedTriggerKey"
                  @click="saveSelectedRule"
                >
                  {{ savingKey === selectedTriggerKey ? '…' : t('admin.emails.saveDraft') }}
                </button>
                <p
                  v-if="ruleSaveError"
                  class="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 max-w-[28rem]"
                >
                  {{ ruleSaveError }}
                </p>
                <p
                  v-else-if="ruleSaveSuccess"
                  class="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 max-w-[28rem]"
                >
                  {{ ruleSaveSuccess }}
                </p>
              </div>
            </header>

            <div class="px-5 pt-4">
              <nav class="flex flex-wrap gap-2 border-b border-slate-100">
                <button
                  type="button"
                  class="rounded-t-lg px-4 py-2 text-sm font-medium transition-colors"
                  :class="selectedTriggerTab === 'content' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 border border-slate-200 border-b-0'"
                  @click="selectedTriggerTab = 'content'"
                >
                  {{ t('admin.emails.trigger.tabs.content') }}
                </button>
                <button
                  type="button"
                  class="rounded-t-lg px-4 py-2 text-sm font-medium transition-colors"
                  :class="selectedTriggerTab === 'conditions' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 border border-slate-200 border-b-0'"
                  @click="selectedTriggerTab = 'conditions'"
                >
                  {{ t('admin.emails.trigger.tabs.conditions') }}
                </button>
                <button
                  type="button"
                  class="rounded-t-lg px-4 py-2 text-sm font-medium transition-colors"
                  :class="selectedTriggerTab === 'settings' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 border border-slate-200 border-b-0'"
                  @click="selectedTriggerTab = 'settings'"
                >
                  {{ t('admin.emails.trigger.tabs.settings') }}
                </button>
              </nav>
            </div>

            <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <!-- Content -->
              <section v-if="selectedTriggerTab === 'content'" class="space-y-6">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-end justify-between gap-2">
                    <label class="block min-w-[200px] flex-1 text-xs font-medium text-slate-600" :for="`subj-${selectedTriggerKey}`">
                      {{ t('admin.emails.subject') }}
                    </label>
                    <button
                      type="button"
                      class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                      @click="openPhPicker(selectedTriggerKey, 'subject')"
                    >
                      {{ t('admin.emails.trigger.insertPlaceholder') }}
                    </button>
                  </div>
                  <input
                    :id="`subj-${selectedTriggerKey}`"
                    :ref="(el) => setSubjectRef(selectedTriggerKey, el)"
                    v-model="editDraft[selectedTriggerKey].subjectTemplate"
                    type="text"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2"
                    @focus="trackFocus(selectedTriggerKey, 'subject')"
                  />
                </div>

                <div class="space-y-2">
                  <div class="flex flex-wrap items-end justify-between gap-2">
                    <label class="block min-w-[200px] flex-1 text-xs font-medium text-slate-600" :for="`body-${selectedTriggerKey}`">
                      {{ t('admin.emails.body') }}
                    </label>
                    <button
                      type="button"
                      class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                      @click="openPhPicker(selectedTriggerKey, 'body')"
                    >
                      {{ t('admin.emails.trigger.insertPlaceholder') }}
                    </button>
                  </div>
                  <textarea
                    :id="`body-${selectedTriggerKey}`"
                    :ref="(el) => setBodyRef(selectedTriggerKey, el)"
                    v-model="editDraft[selectedTriggerKey].bodyTemplate"
                    rows="14"
                    class="min-h-[280px] w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm font-mono leading-relaxed text-slate-900 shadow-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2"
                    @focus="trackFocus(selectedTriggerKey, 'body')"
                  />
                </div>

                <div class="space-y-4 border-t border-slate-200 pt-5">
                  <p class="text-xs text-slate-600">{{ t('admin.emails.trigger.enBlockHint') }}</p>
                  <div class="space-y-2">
                    <div class="flex flex-wrap items-end justify-between gap-2">
                      <label class="block min-w-[200px] flex-1 text-xs font-medium text-slate-600" :for="`subj-en-${selectedTriggerKey}`">
                        {{ t('admin.emails.subjectEn') }}
                      </label>
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                        @click="openPhPicker(selectedTriggerKey, 'subjectEn')"
                      >
                        {{ t('admin.emails.trigger.insertPlaceholder') }}
                      </button>
                    </div>
                    <input
                      :id="`subj-en-${selectedTriggerKey}`"
                      :ref="(el) => setSubjectEnRef(selectedTriggerKey, el)"
                      v-model="editDraft[selectedTriggerKey].subjectTemplateEn"
                      type="text"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2"
                      @focus="trackFocus(selectedTriggerKey, 'subjectEn')"
                    />
                  </div>
                  <div class="space-y-2">
                    <div class="flex flex-wrap items-end justify-between gap-2">
                      <label class="block min-w-[200px] flex-1 text-xs font-medium text-slate-600" :for="`body-en-${selectedTriggerKey}`">
                        {{ t('admin.emails.bodyEn') }}
                      </label>
                      <button
                        type="button"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                        @click="openPhPicker(selectedTriggerKey, 'bodyEn')"
                      >
                        {{ t('admin.emails.trigger.insertPlaceholder') }}
                      </button>
                    </div>
                    <textarea
                      :id="`body-en-${selectedTriggerKey}`"
                      :ref="(el) => setBodyEnRef(selectedTriggerKey, el)"
                      v-model="editDraft[selectedTriggerKey].bodyTemplateEn"
                      rows="10"
                      class="min-h-[200px] w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm font-mono leading-relaxed text-slate-900 shadow-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2"
                      @focus="trackFocus(selectedTriggerKey, 'bodyEn')"
                    />
                  </div>
                </div>

                <div class="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4">
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {{ t('admin.emails.trigger.placeholderRefTitle') }}
                  </h4>
                  <p class="mt-1 text-xs text-slate-500">{{ t('admin.emails.trigger.placeholderRefHint') }}</p>
                  <p class="mt-2 text-xs text-slate-500">{{ t('admin.emails.placeholdersHint') }}</p>

                  <div class="mt-4 space-y-5">
                    <section v-for="g in PLACEHOLDER_GROUPS" :key="g.cat">
                      <h5 class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {{ t(`admin.emails.trigger.phCat.${g.cat}`) }}
                      </h5>
                      <div class="grid gap-2 sm:grid-cols-2">
                        <button
                          v-for="key in g.keys"
                          :key="key"
                          type="button"
                          class="flex flex-col rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                          :title="t(`admin.emails.trigger.ph.${key}.hint`)"
                          @click="quickInsertPlaceholder(selectedTriggerKey, key)"
                        >
                          <span class="text-sm font-medium text-slate-800">
                            {{ t(`admin.emails.trigger.ph.${key}.label`) }}
                          </span>
                          <code class="mt-0.5 text-xs font-mono text-slate-500">{{ placeholderCode(key) }}</code>
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </section>

              <!-- Conditions -->
              <section v-else-if="selectedTriggerTab === 'conditions'" class="space-y-6">
                <div class="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4">
                  <h4 class="text-sm font-semibold text-slate-900">{{ t('admin.emails.trigger.conditionsTitle') }}</h4>
                  <p class="mt-2 text-sm text-slate-700 leading-relaxed">
                    {{ selectedRule?.descriptionDe ?? t('admin.emails.trigger.conditionsEmpty') }}
                  </p>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-xl border border-slate-100 bg-white px-4 py-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('admin.emails.deliveryMode') }}</p>
                    <p class="mt-1 text-sm text-slate-800 font-medium">
                      {{ deliveryLabel(editDraft[selectedTriggerKey].deliveryMode) }}
                    </p>
                  </div>
                  <div class="rounded-xl border border-slate-100 bg-white px-4 py-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('admin.emails.recipient') }}</p>
                    <p class="mt-1 text-sm text-slate-800 font-medium">
                      {{ recipientLabel(editDraft[selectedTriggerKey].recipientKind) }}
                    </p>
                  </div>
                </div>
              </section>

              <!-- Settings -->
              <section v-else class="space-y-6">
                <div class="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="space-y-1">
                      <p class="text-sm font-semibold text-slate-900">{{ t('admin.emails.enabled') }}</p>
                      <p class="text-xs text-slate-600 leading-relaxed">{{ t('admin.emails.trigger.enabledDescription') }}</p>
                    </div>
                    <label
                      class="inline-flex cursor-pointer items-center gap-3"
                      :class="enableToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
                    >
                      <input
                        v-model="editDraft[selectedTriggerKey].enabled"
                        type="checkbox"
                        class="peer sr-only"
                        :disabled="enableToggleDisabled"
                      />
                      <span
                        class="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-400 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
                        aria-hidden="true"
                      />
                    </label>
                  </div>
                  <p
                    v-if="enableToggleDisabled"
                    class="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                  >
                    Aktivieren ist nur möglich, wenn Betreff und Text ausgefüllt sind.
                  </p>
                </div>

                <div class="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start">
                  <label class="block">
                    <span class="mb-1.5 block text-xs font-medium text-slate-600">{{ t('admin.emails.deliveryMode') }}</span>
                    <select
                      v-model="editDraft[selectedTriggerKey].deliveryMode"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2"
                    >
                      <option value="IMMEDIATE">{{ t('admin.emails.deliveryImmediate') }}</option>
                      <option value="QUEUED">{{ t('admin.emails.deliveryQueued') }}</option>
                    </select>
                  </label>
                  <EmailRecipientKindField v-model="editDraft[selectedTriggerKey].recipientKind" />
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>

    <EmailPlaceholderPickerModal
      :open="phPickerContext !== null"
      @update:open="onPhPickerOpen"
      @pick="onPlaceholderPicked"
    />

    <!-- Archiv -->
    <div v-show="showArchive" class="space-y-4">
      <div class="flex flex-wrap gap-3 items-end">
        <label class="text-sm block">
          <span class="text-slate-600">{{ t('admin.emails.filterTrigger') }}</span>
          <input
            v-model="filterTrigger"
            type="text"
            class="mt-1 block w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="TRANSPORT_…"
          />
        </label>
        <label class="text-sm block">
          <span class="text-slate-600">{{ t('admin.emails.filterStatus') }}</span>
          <select v-model="filterStatus" class="mt-1 block w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">{{ t('admin.filterAll') }}</option>
            <option value="QUEUED">QUEUED</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
        <label class="text-sm block">
          <span class="text-slate-600">{{ t('admin.search') }}</span>
          <input
            v-model="filterQ"
            type="search"
            class="mt-1 block w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label class="text-sm block">
          <span class="text-slate-600">{{ t('admin.emails.filterFrom') }}</span>
          <input v-model="filterFrom" type="date" class="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label class="text-sm block">
          <span class="text-slate-600">{{ t('admin.emails.filterTo') }}</span>
          <input v-model="filterTo" type="date" class="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button
          type="button"
          class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
          @click="loadArchive(1)"
        >
          {{ t('admin.search') }}
        </button>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div class="space-y-1">
            <h4 class="text-sm font-semibold text-slate-900">{{ t('admin.emails.archivePurgeTitle') }}</h4>
            <p class="text-xs text-slate-600 leading-relaxed">{{ t('admin.emails.archivePurgeHint') }}</p>
          </div>
          <div class="inline-flex items-center gap-2">
            <span v-if="purgingArchive" class="text-xs text-slate-500">{{ t('admin.loading') }}</span>
            <span
              v-if="purgeDeletedCount !== null"
              class="text-xs font-medium rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800"
            >
              {{ t('admin.emails.archivePurgeSuccess', { count: purgeDeletedCount }) }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <label class="text-sm block">
            <span class="text-slate-600">{{ t('admin.emails.archivePurgeDays') }}</span>
            <input
              v-model.number="purgeDays"
              type="number"
              min="0"
              max="36500"
              class="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600"
            :disabled="purgingArchive"
            @click="purgeEmailArchive"
          >
            {{ t('admin.emails.archivePurgeButton') }}
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div class="space-y-1">
            <h4 class="text-sm font-semibold text-slate-900">Strecken-Digest ausfuehren</h4>
            <p class="text-xs text-slate-600 leading-relaxed">
              Sendet alle faelligen Sammelbenachrichtigungen aus Strecken-Abos sofort.
            </p>
          </div>
          <span v-if="digestSending" class="text-xs text-slate-500">{{ t('admin.loading') }}</span>
          <span
            v-else-if="digestProcessedUsers !== null"
            class="text-xs font-medium rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800"
          >
            {{ digestProcessedUsers }} Nutzer verarbeitet
          </span>
        </div>
        <button
          type="button"
          class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          :disabled="digestSending"
          @click="sendRouteDigestNow"
        >
          Jetzt senden
        </button>
      </div>

      <p class="text-sm text-slate-600">{{ t('admin.emails.archiveTotal', { total: archiveTotal }) }}</p>
      <div v-if="loadingArchive" class="text-slate-500 text-sm">{{ t('admin.loading') }}</div>
      <div v-else class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-left">
              <th class="py-2 px-3 font-semibold text-slate-700">{{ t('admin.emails.colCreated') }}</th>
              <th class="py-2 px-3 font-semibold text-slate-700">{{ t('admin.emails.colTrigger') }}</th>
              <th class="py-2 px-3 font-semibold text-slate-700">{{ t('admin.emails.colStatus') }}</th>
              <th class="py-2 px-3 font-semibold text-slate-700">{{ t('admin.emails.colTo') }}</th>
              <th class="py-2 px-3 font-semibold text-slate-700">{{ t('admin.emails.colSubject') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in archiveItems"
              :key="row.id"
              class="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer"
              @click="openDetail(row.id)"
            >
              <td class="py-2 px-3 text-slate-600 whitespace-nowrap">
                {{ new Date(row.createdAt).toLocaleString(locale) }}
              </td>
              <td class="py-2 px-3 font-mono text-xs">{{ row.triggerKey }}</td>
              <td class="py-2 px-3">
                <span class="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">{{
                  row.status
                }}</span>
                <span v-if="row.deliveryStatus" class="ml-1 text-xs text-slate-500">({{ row.deliveryStatus }})</span>
              </td>
              <td class="py-2 px-3 text-slate-700 max-w-[180px] truncate">{{ row.toEmail }}</td>
              <td class="py-2 px-3 text-slate-700 max-w-[240px] truncate">{{ row.subject }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav v-if="archiveTotalPages > 1" class="flex items-center gap-2">
        <button
          type="button"
          class="rounded border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
          :disabled="archivePage <= 1"
          @click="loadArchive(archivePage - 1)"
        >
          ‹
        </button>
        <span class="text-sm text-slate-600">{{ archivePage }} / {{ archiveTotalPages }}</span>
        <button
          type="button"
          class="rounded border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
          :disabled="archivePage >= archiveTotalPages"
          @click="loadArchive(archivePage + 1)"
        >
          ›
        </button>
      </nav>
    </div>

    <!-- Detail-Overlay -->
    <div
      v-if="detailId"
      class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40"
      @click.self="closeDetail"
    >
      <div
        class="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4"
      >
        <div class="flex justify-between items-start gap-2">
          <h3 class="text-lg font-semibold text-slate-900">{{ t('admin.emails.detailTitle') }}</h3>
          <button type="button" class="text-slate-500 hover:text-slate-800 text-sm" @click="closeDetail">
            {{ t('common.close') }}
          </button>
        </div>
        <div v-if="detailBusy && !detail" class="text-slate-500 text-sm">{{ t('admin.loading') }}</div>
        <template v-else-if="detail">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt class="text-slate-500">{{ t('admin.emails.colTrigger') }}</dt>
              <dd class="font-mono text-xs">{{ detail.triggerKey }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">{{ t('admin.emails.colStatus') }}</dt>
              <dd>{{ detail.status }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">{{ t('admin.emails.colCreated') }}</dt>
              <dd>{{ new Date(detail.createdAt).toLocaleString(locale) }}</dd>
            </div>
            <div v-if="detail.sentAt">
              <dt class="text-slate-500">{{ t('admin.emails.sentAt') }}</dt>
              <dd>{{ new Date(detail.sentAt).toLocaleString(locale) }}</dd>
            </div>
            <div v-if="detail.deliveryStatus">
              <dt class="text-slate-500">{{ t('admin.emails.deliveryStatus') }}</dt>
              <dd>{{ detail.deliveryStatus }}</dd>
            </div>
          </dl>
          <p v-if="detail.errorMessage" class="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
            {{ detail.errorMessage }}
          </p>
          <template v-if="detailEditable">
            <label class="block text-sm">
              <span class="text-slate-600">{{ t('admin.emails.colTo') }}</span>
              <input v-model="detailEditTo" type="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block text-sm">
              <span class="text-slate-600">{{ t('admin.emails.subject') }}</span>
              <input v-model="detailEditSubject" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label class="block text-sm">
              <span class="text-slate-600">{{ t('admin.emails.body') }}</span>
              <textarea v-model="detailEditBody" rows="10" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono" />
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                :disabled="detailBusy"
                @click="saveDetail"
              >
                {{ t('admin.emails.saveDraft') }}
              </button>
              <button
                v-if="detail.status === 'QUEUED'"
                type="button"
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                :disabled="detailBusy"
                @click="sendDetail"
              >
                {{ t('admin.emails.sendNow') }}
              </button>
              <button
                v-if="detail.status === 'QUEUED'"
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
                :disabled="detailBusy"
                @click="cancelDetail"
              >
                {{ t('admin.emails.cancelSend') }}
              </button>
            </div>
          </template>
          <iframe :srcdoc="detail.bodyHtml" title="E-Mail-Vorschau" class="w-full min-h-[240px] border border-slate-100 rounded-lg bg-white" />
        </template>
      </div>
    </div>
  </div>
</template>
