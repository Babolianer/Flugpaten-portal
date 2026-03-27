<script setup lang="ts">
const { t, locale } = useI18n()

interface OrgaRow {
  id: string
  name: string
  instagramHandle: string | null
  kontaktStatus: string
  letzteKontaktaufnahme: string | null
  naechsteKontaktaufnahme: string | null
  notizen: string | null
  createdAt: string
}

const orgas = ref<OrgaRow[]>([])
const stats = ref<{
  total: number
  nichtKontaktiert: number
  keineAntwort: number
  interessiert: number
  overdueFollowUps: number
  conversionPct: number
} | null>(null)
const loading = ref(true)
const loadingStats = ref(true)
const message = ref('')
const page = ref(1)
const total = ref(0)
const totalPages = ref(0)
const pageSize = 25
const search = ref('')
const statusFilter = ref('')
const sortBy = ref<'name' | 'instagramHandle' | 'kontaktStatus' | 'letzteKontaktaufnahme' | 'naechsteKontaktaufnahme' | 'notizen'>('naechsteKontaktaufnahme')
const sortOrder = ref<'asc' | 'desc'>('asc')
const savingId = ref<string | null>(null)
const kontaktId = ref<string | null>(null)
const csvFile = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)
const newContact = ref({
  name: '',
  instagramHandle: '',
  kontaktStatus: 'nicht kontaktiert',
  naechsteKontaktaufnahme: '',
  notizen: '',
})

const STATUS_OPTIONS = [
  { value: 'nicht kontaktiert', labelKey: 'admin.orgaAquise.statusNichtKontaktiert' },
  { value: 'kontaktiert', labelKey: 'admin.orgaAquise.statusKontaktiert' },
  { value: 'keine antwort', labelKey: 'admin.orgaAquise.statusKeineAntwort' },
  { value: 'registriert', labelKey: 'admin.orgaAquise.statusInteressiert' },
]

function formatDate(d: string | null) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString(locale.value)
}

async function loadStats() {
  loadingStats.value = true
  try {
    stats.value = await $fetch('/api/admin/orga-aquise/stats')
  } catch {
    stats.value = null
  } finally {
    loadingStats.value = false
  }
}

async function loadOrgas(p = 1) {
  loading.value = true
  message.value = ''
  try {
    const params = new URLSearchParams()
    params.set('page', String(p))
    params.set('pageSize', String(pageSize))
    if (search.value.trim()) params.set('search', search.value.trim())
    if (statusFilter.value) params.set('status', statusFilter.value)
    params.set('sortBy', sortBy.value)
    params.set('sortOrder', sortOrder.value)
    const res = await $fetch<{
      orgas: OrgaRow[]
      pagination: { page: number; total: number; totalPages: number }
    }>('/api/admin/orga-aquise?' + params.toString())
    orgas.value = res.orgas
    page.value = res.pagination.page
    total.value = res.pagination.total
    totalPages.value = res.pagination.totalPages
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { message?: string } }
    if (err?.statusCode === 403) await navigateTo('/login')
    else message.value = err?.data?.message ?? t('admin.orgaAquise.loadError')
  } finally {
    loading.value = false
  }
}

async function ensureTasks() {
  try {
    await $fetch('/api/admin/orga-aquise/ensure-tasks', { method: 'POST' })
    await loadStats()
    await loadOrgas(page.value)
  } catch {
    // still load
  }
}

async function saveStatus(orga: OrgaRow, newStatus: string) {
  savingId.value = orga.id
  try {
    await $fetch(`/api/admin/orga-aquise/${orga.id}`, {
      method: 'PATCH',
      body: { kontaktStatus: newStatus },
    })
    orga.kontaktStatus = newStatus
  } catch {
    message.value = t('admin.orgaAquise.saveError')
  } finally {
    savingId.value = null
  }
}

async function saveNotizen(orga: OrgaRow, value: string) {
  savingId.value = orga.id
  try {
    await $fetch(`/api/admin/orga-aquise/${orga.id}`, {
      method: 'PATCH',
      body: { notizen: value || null },
    })
    orga.notizen = value || null
  } catch {
    message.value = t('admin.orgaAquise.saveError')
  } finally {
    savingId.value = null
  }
}

async function markKontaktErfolgt(orga: OrgaRow) {
  kontaktId.value = orga.id
  try {
    const res = await $fetch<{
      letzteKontaktaufnahme: string
      naechsteKontaktaufnahme: string | null
      kontaktStatus: string
    }>(`/api/admin/orga-aquise/${orga.id}/kontakt`, {
      method: 'POST',
      body: { kontaktStatus: orga.kontaktStatus },
    })
    orga.letzteKontaktaufnahme = res.letzteKontaktaufnahme
    orga.naechsteKontaktaufnahme = res.naechsteKontaktaufnahme
    orga.kontaktStatus = res.kontaktStatus
    await loadStats()
  } catch {
    message.value = t('admin.orgaAquise.kontaktError')
  } finally {
    kontaktId.value = null
  }
}

async function doImport() {
  const input = csvFile.value
  if (!input?.files?.length) {
    message.value = t('admin.orgaAquise.csvSelectFile')
    return
  }
  importing.value = true
  message.value = ''
  try {
    const formData = new FormData()
    formData.append('file', input.files[0])
    const res = await $fetch<{ imported: number }>('/api/admin/orga-aquise/import', {
      method: 'POST',
      body: formData,
    })
    message.value = t('admin.orgaAquise.csvImported', { count: res.imported })
    input.value = ''
    await loadStats()
    await loadOrgas(1)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.value = err?.data?.message ?? t('admin.orgaAquise.csvError')
  } finally {
    importing.value = false
  }
}

async function createContact() {
  if (!newContact.value.name.trim()) {
    message.value = 'Bitte einen Namen eingeben.'
    return
  }

  creating.value = true
  message.value = ''
  try {
    await $fetch('/api/admin/orga-aquise', {
      method: 'POST',
      body: {
        name: newContact.value.name.trim(),
        instagramHandle: newContact.value.instagramHandle.trim() || null,
        kontaktStatus: newContact.value.kontaktStatus,
        naechsteKontaktaufnahme: newContact.value.naechsteKontaktaufnahme
          ? new Date(newContact.value.naechsteKontaktaufnahme).toISOString()
          : null,
        notizen: newContact.value.notizen.trim() || null,
      },
    })
    newContact.value = {
      name: '',
      instagramHandle: '',
      kontaktStatus: 'nicht kontaktiert',
      naechsteKontaktaufnahme: '',
      notizen: '',
    }
    showCreateModal.value = false
    message.value = 'Kontakt wurde angelegt.'
    await loadStats()
    await loadOrgas(1)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.value = err?.data?.message ?? 'Kontakt konnte nicht angelegt werden.'
  } finally {
    creating.value = false
  }
}

function openCreateModal() {
  showCreateModal.value = true
}

function closeCreateModal() {
  if (creating.value) return
  showCreateModal.value = false
}

function triggerCsvInput() {
  csvFile.value?.click()
}

function toggleSort(column: typeof sortBy.value) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
  loadOrgas(1)
}

const SORTABLE_COLUMNS = [
  { key: 'name' as const, labelKey: 'admin.orgaAquise.colName' },
  { key: 'instagramHandle' as const, labelKey: 'admin.orgaAquise.colInstagram' },
  { key: 'kontaktStatus' as const, labelKey: 'admin.orgaAquise.colStatus' },
  { key: 'letzteKontaktaufnahme' as const, labelKey: 'admin.orgaAquise.colLastContact' },
  { key: 'naechsteKontaktaufnahme' as const, labelKey: 'admin.orgaAquise.colNextContact' },
] as const

const SORT_OPTIONS = [
  { value: 'name' as const, labelKey: 'admin.orgaAquise.colName' },
  { value: 'instagramHandle' as const, labelKey: 'admin.orgaAquise.colInstagram' },
  { value: 'kontaktStatus' as const, labelKey: 'admin.orgaAquise.colStatus' },
  { value: 'letzteKontaktaufnahme' as const, labelKey: 'admin.orgaAquise.colLastContact' },
  { value: 'naechsteKontaktaufnahme' as const, labelKey: 'admin.orgaAquise.colNextContact' },
  { value: 'notizen' as const, labelKey: 'admin.orgaAquise.colNotes' },
]

async function init() {
  await Promise.all([loadStats(), loadOrgas(1)])
  await ensureTasks()
}

onMounted(init)

defineExpose({ loadOrgas, loadStats, ensureTasks })
</script>

<template>
  <div class="space-y-6">
    <AdminOrgaAquiseStats :stats="stats" :loading="loadingStats" />

    <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 class="text-lg font-semibold text-slate-800">{{ t('admin.orgaAquise.title') }}</h2>
        <div class="flex flex-wrap items-center gap-2">
          <input
            ref="csvFile"
            type="file"
            accept=".csv"
            class="hidden"
            @change="doImport"
          />
          <button
            type="button"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            @click="openCreateModal"
          >
            Neue Orga
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
            :disabled="importing"
            @click="triggerCsvInput"
          >
            {{ importing ? t('admin.orgaAquise.csvImporting') : t('admin.orgaAquise.csvUpload') }}
          </button>
        </div>
      </div>

      <p
        v-if="message"
        class="mb-4 p-3 rounded text-sm"
        :class="message.includes('importiert') || message.includes('angelegt') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'"
      >
        {{ message }}
      </p>

      <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <input
          v-model="search"
          type="search"
          :placeholder="t('admin.orgaAquise.searchPlaceholder')"
          :aria-label="t('admin.orgaAquise.searchPlaceholder')"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white min-w-[200px] flex-1 max-w-[320px]"
          @keyup.enter="loadOrgas(1)"
        />
        <select
          v-model="statusFilter"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white min-w-[160px]"
          :aria-label="t('admin.orgaAquise.filterAll')"
          @change="loadOrgas(1)"
        >
          <option value="">{{ t('admin.orgaAquise.filterAll') }}</option>
          <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ t(s.labelKey) }}</option>
        </select>
        <select
          v-model="sortBy"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white min-w-[210px]"
          aria-label="Sortieren nach"
          @change="loadOrgas(1)"
        >
          <option v-for="s in SORT_OPTIONS" :key="s.value" :value="s.value">
            {{ t(s.labelKey) }}
          </option>
        </select>
        <select
          v-model="sortOrder"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white min-w-[150px]"
          aria-label="Sortierreihenfolge"
          @change="loadOrgas(1)"
        >
          <option value="asc">Aufsteigend</option>
          <option value="desc">Absteigend</option>
        </select>
        <button type="button" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 shrink-0" @click="loadOrgas(1)">
          {{ t('admin.orgaAquise.searchButton') }}
        </button>
      </div>

      <div v-if="loading" class="text-slate-600 text-sm py-4">{{ t('admin.loading') }}</div>
      <div v-else-if="orgas.length === 0" class="p-6 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm">
        {{ t('admin.orgaAquise.empty') }}
      </div>
      <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full min-w-[700px] text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th
                v-for="col in SORTABLE_COLUMNS"
                :key="col.key"
                class="text-left py-3 px-3 font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
                @click="toggleSort(col.key)"
              >
                <span class="inline-flex items-center gap-1">
                  {{ t(col.labelKey) }}
                  <span class="text-slate-400 text-xs" aria-hidden="true">
                    <span v-if="sortBy === col.key">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                    <span v-else>↕</span>
                  </span>
                </span>
              </th>
              <th class="text-left py-3 px-3 font-semibold text-slate-700">{{ t('admin.orgaAquise.colNotes') }}</th>
              <th class="text-right py-3 px-3 font-semibold text-slate-700">{{ t('admin.tableAction') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orgas" :key="o.id" class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
              <td class="py-3 px-3 font-medium text-slate-900">{{ o.name }}</td>
              <td class="py-3 px-3">
                <a
                  v-if="o.instagramHandle"
                  :href="`https://instagram.com/${o.instagramHandle.replace('@', '')}`"
                  target="_blank"
                  rel="noopener"
                  class="text-amber-600 hover:underline"
                >
                  {{ o.instagramHandle }}
                </a>
                <span v-else class="text-slate-400">–</span>
              </td>
              <td class="py-3 px-3">
                <select
                  :value="o.kontaktStatus"
                  :disabled="savingId === o.id"
                  class="rounded border border-slate-300 py-1.5 px-2 text-slate-800 text-xs bg-white min-w-[140px]"
                  @change="saveStatus(o, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ t(s.labelKey) }}</option>
                </select>
              </td>
              <td class="py-3 px-3 text-slate-600">{{ formatDate(o.letzteKontaktaufnahme) }}</td>
              <td class="py-3 px-3">
                <span :class="o.naechsteKontaktaufnahme && new Date(o.naechsteKontaktaufnahme) <= new Date() ? 'text-red-600 font-medium' : 'text-slate-600'">
                  {{ formatDate(o.naechsteKontaktaufnahme) }}
                </span>
              </td>
              <td class="py-3 px-3">
                <input
                  type="text"
                  :value="o.notizen ?? ''"
                  :disabled="savingId === o.id"
                  class="w-full max-w-[180px] py-1.5 px-2 rounded border border-slate-300 text-slate-800 text-xs"
                  :placeholder="t('admin.orgaAquise.notesPlaceholder')"
                  @blur="saveNotizen(o, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td class="py-3 px-3 text-right">
                <button
                  type="button"
                  :disabled="kontaktId === o.id"
                  class="inline-flex px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs disabled:opacity-50"
                  @click="markKontaktErfolgt(o)"
                >
                  {{ kontaktId === o.id ? '…' : t('admin.orgaAquise.btnKontakt') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total > pageSize" class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-600">
          {{ t('admin.acquise.pageInfo', { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), total }) }}
        </p>
        <nav class="flex items-center gap-1">
          <button
            type="button"
            class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            :disabled="page <= 1 || loading"
            @click="loadOrgas(page - 1)"
          >
            &lt;
          </button>
          <span class="px-2 text-slate-600 text-sm">{{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            class="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            :disabled="page >= totalPages || loading"
            @click="loadOrgas(page + 1)"
          >
            &gt;
          </button>
        </nav>
      </div>
    </section>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeCreateModal"
    >
      <div class="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="text-lg font-semibold text-slate-800">Neue Orga anlegen</h3>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            :disabled="creating"
            @click="closeCreateModal"
          >
            ✕
          </button>
        </div>

        <form class="space-y-3" @submit.prevent="createContact">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              v-model="newContact.name"
              type="text"
              required
              placeholder="Name *"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
            />
            <input
              v-model="newContact.instagramHandle"
              type="text"
              placeholder="Instagram (optional)"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
            />
            <select
              v-model="newContact.kontaktStatus"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
            >
              <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ t(s.labelKey) }}</option>
            </select>
            <input
              v-model="newContact.naechsteKontaktaufnahme"
              type="date"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
            />
          </div>
          <input
            v-model="newContact.notizen"
            type="text"
            placeholder="Notiz (optional)"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
          />

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              :disabled="creating"
              @click="closeCreateModal"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              :disabled="creating"
            >
              {{ creating ? 'Wird angelegt…' : 'Orga anlegen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
