<script setup lang="ts">
import type { HubApplication, HubTransportRequest } from './orgApplicationsHubTypes'

const props = defineProps<{
  organizationId: string
  /** Admin-Ansicht: orgId als Query mitschicken */
  queryOrgId?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  'edit-request': [requestId: string]
  error: [message: string]
}>()

const { t, locale } = useI18n()
const { getRequestStatusLabel } = useRequestStatus()

const hubLoading = ref(false)
const hubRequests = ref<HubTransportRequest[]>([])
const expanded = ref<Record<string, boolean>>({})
const inboxLoading = ref(false)
const inboxConversations = ref<
  {
    id: string
    requestId: string | null
    requestTitle: string | null
    userDisplayName: string | null
    lastMessage: { body: string; createdAt: string } | null
  }[]
>([])

const detailOpen = ref(false)
const detailRequest = ref<HubTransportRequest | null>(null)
const detailApp = ref<HubApplication | null>(null)

const acceptingId = ref<string | null>(null)
const applicationActionKey = ref<string | null>(null)
const rejectAllLoading = ref(false)
const unmatching = ref(false)
const applicationsEditorOpen = ref(false)
const editorAnchorId = ref<string | null>(null)
const rejectAllGroupLoading = ref(false)

function applicationActionBusy(appId: string, op: string) {
  return applicationActionKey.value === `${op}:${appId}`
}

function applicationStatusLabel(status: string) {
  switch (status) {
    case 'PENDING':
      return t('dashboard.applicationStatusPending')
    case 'ACCEPTED':
      return t('dashboard.applicationStatusAccepted')
    case 'REJECTED':
      return t('dashboard.applicationStatusRejected')
    case 'WAITING_LIST':
      return t('dashboard.applicationStatusWaitingList')
    default:
      return status
  }
}

function statusPillClass(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    case 'WAITING_LIST':
      return 'bg-amber-50 text-amber-900 border-amber-200'
    case 'REJECTED':
      return 'bg-red-50 text-red-800 border-red-200'
    case 'PENDING':
      return 'bg-slate-50 text-slate-800 border-slate-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function formatRoute(req: { originAirport: string; destAirport: string; destinations?: Array<{ airportCode: string }> }): string {
  const dests = req.destinations && req.destinations.length > 0
    ? req.destinations.map((d) => d.airportCode).join(', ')
    : req.destAirport
  return `${req.originAirport} → ${dests}`
}

function speciesLabel(species: string) {
  const map: Record<string, string> = {
    cat: 'orgDashboard.speciesCat',
    dog: 'orgDashboard.speciesDog',
    rabbit: 'orgDashboard.speciesRabbit',
    guinea_pig: 'orgDashboard.speciesGuineaPig',
    bird: 'orgDashboard.speciesBird',
    reptile: 'orgDashboard.speciesReptile',
    ferret: 'orgDashboard.speciesFerret',
    other: 'orgDashboard.speciesOther',
  }
  const k = map[species]
  return k ? t(k) : species
}

function toggleExpanded(id: string) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}

function waitingListFor(req: HubTransportRequest) {
  return req.applications.filter((a) => a.status === 'WAITING_LIST')
}

function mainApplicationsFor(req: HubTransportRequest) {
  return req.applications.filter((a) => a.status !== 'WAITING_LIST')
}

function hasRejectable(req: HubTransportRequest) {
  return req.applications.some((a) => a.status === 'PENDING' || a.status === 'WAITING_LIST')
}

const editorRequest = computed(() => {
  if (!editorAnchorId.value) return null
  return hubRequests.value.find((r) => r.id === editorAnchorId.value) ?? null
})

const editorGroupLegs = computed((): HubTransportRequest[] => {
  const anchor = editorRequest.value
  if (!anchor) return []
  if (!anchor.groupId) return [anchor]
  const legs = hubRequests.value.filter((r) => r.groupId === anchor.groupId)
  return legs.length ? [...legs].sort((a, b) => a.title.localeCompare(b.title)) : [anchor]
})

const editorAnyMatched = computed(() => editorGroupLegs.value.some((l) => l.status === 'MATCHED'))

const editorGroupHasRejectable = computed(() => editorGroupLegs.value.some((l) => hasRejectable(l)))

function canAcceptWhenOpen(leg: HubTransportRequest, app: HubApplication) {
  return (
    leg.status === 'OPEN' && ['PENDING', 'REJECTED', 'WAITING_LIST'].includes(app.status)
  )
}

function canRejectApplication(leg: HubTransportRequest, app: HubApplication) {
  return (
    (leg.status === 'OPEN' || leg.status === 'MATCHED') &&
    (app.status === 'PENDING' || app.status === 'WAITING_LIST')
  )
}

function acceptButtonLabel(app: HubApplication) {
  if (app.status === 'WAITING_LIST') return t('orgDashboard.applicationsChatPromote')
  if (app.status === 'REJECTED') return t('orgDashboard.applicationAcceptAgain')
  return t('request.accept')
}

function openApplicationsEditor(req: HubTransportRequest) {
  editorAnchorId.value = req.id
  applicationsEditorOpen.value = true
}

function closeApplicationsEditor() {
  applicationsEditorOpen.value = false
  editorAnchorId.value = null
}

function openTransportMetaFromEditor() {
  const r = editorRequest.value
  if (r) emit('edit-request', r.id)
  closeApplicationsEditor()
}

async function rejectAllGroupApplicants() {
  if (rejectAllGroupLoading.value) return
  if (!confirm(t('orgDashboard.confirmRejectAllGroup'))) return
  rejectAllGroupLoading.value = true
  try {
    for (const leg of editorGroupLegs.value) {
      if (hasRejectable(leg)) {
        await $fetch(`/api/org/dashboard/requests/${leg.id}/reject-all-applications`, { method: 'POST' })
      }
    }
    await reloadAll()
    closeDetail()
  } catch {
    emit('error', t('orgDashboard.errorSave'))
  } finally {
    rejectAllGroupLoading.value = false
  }
}

function applicationDataEntries(data: Record<string, unknown> | null): [string, unknown][] {
  if (!data || typeof data !== 'object') return []
  return Object.entries(data)
}

async function fetchHub(silent = false) {
  if (!props.organizationId) return
  if (!silent) hubLoading.value = true
  try {
    const query = props.queryOrgId ? { orgId: props.organizationId } : {}
    const res = await $fetch<{ requests: HubTransportRequest[] }>('/api/org/dashboard/applications-hub', { query })
    hubRequests.value = res.requests
  } catch {
    hubRequests.value = []
  } finally {
    if (!silent) hubLoading.value = false
  }
}

async function fetchInbox(silent = false) {
  if (!silent) inboxLoading.value = true
  try {
    const query = props.queryOrgId ? { orgId: props.organizationId } : {}
    const res = await $fetch<{
      conversations: {
        id: string
        requestId: string | null
        requestTitle: string | null
        userDisplayName: string | null
        lastMessage: { body: string; createdAt: string } | null
      }[]
    }>('/api/org/dashboard/conversations', { query })
    inboxConversations.value = res.conversations
  } catch {
    inboxConversations.value = []
  } finally {
    if (!silent) inboxLoading.value = false
  }
}

async function reloadAll(opts?: { silent?: boolean }) {
  const silent = opts?.silent ?? false
  await Promise.all([fetchHub(silent), fetchInbox(silent)])
  if (!silent) emit('refresh')
}

watch(
  () => props.organizationId,
  () => {
    void reloadAll()
  },
  { immediate: true },
)

function openDetail(req: HubTransportRequest, app: HubApplication) {
  detailRequest.value = req
  detailApp.value = app
  detailOpen.value = true
}

function closeDetail() {
  detailOpen.value = false
  detailRequest.value = null
  detailApp.value = null
}

async function acceptApplication(requestId: string, applicationId: string) {
  acceptingId.value = applicationId
  try {
    await $fetch(`/api/org/dashboard/requests/${requestId}/accept`, {
      method: 'POST',
      body: { applicationId },
    })
    await reloadAll()
    if (detailOpen.value && detailApp.value?.id === applicationId) {
      const r = hubRequests.value.find((x) => x.id === requestId)
      const a = r?.applications.find((x) => x.id === applicationId)
      if (r && a) {
        detailRequest.value = r
        detailApp.value = a
      } else closeDetail()
    }
  } catch {
    emit('error', t('orgDashboard.errorSave'))
  } finally {
    acceptingId.value = null
  }
}

async function unmatchRequest(requestId: string) {
  if (unmatching.value) return
  unmatching.value = true
  try {
    await $fetch(`/api/org/dashboard/requests/${requestId}/unmatch`, { method: 'POST' })
    await reloadAll()
    if (detailRequest.value?.id === requestId) closeDetail()
  } catch {
    emit('error', t('orgDashboard.errorSave'))
  } finally {
    unmatching.value = false
  }
}

async function runApplicationAction(
  requestId: string,
  applicationId: string,
  action: 'release_match' | 'set_waiting_list' | 'reject',
) {
  const key = `${action}:${applicationId}`
  applicationActionKey.value = key
  try {
    await $fetch(`/api/org/dashboard/requests/${requestId}/applications/${applicationId}/action`, {
      method: 'POST',
      body: { action },
    })
    await reloadAll()
    if (detailOpen.value && detailApp.value?.id === applicationId) {
      const r = hubRequests.value.find((x) => x.id === requestId)
      const a = r?.applications.find((x) => x.id === applicationId)
      if (r && a) {
        detailRequest.value = r
        detailApp.value = a
      }
    }
  } catch {
    emit('error', t('orgDashboard.errorSave'))
  } finally {
    if (applicationActionKey.value === key) applicationActionKey.value = null
  }
}

async function rejectAllApplicants(requestId: string) {
  if (rejectAllLoading.value) return
  if (!confirm(t('orgDashboard.confirmRejectAllApplicants'))) return
  rejectAllLoading.value = true
  try {
    await $fetch(`/api/org/dashboard/requests/${requestId}/reject-all-applications`, { method: 'POST' })
    await reloadAll()
    if (detailRequest.value?.id === requestId) closeDetail()
  } catch {
    emit('error', t('orgDashboard.errorSave'))
  } finally {
    rejectAllLoading.value = false
  }
}

defineExpose({ reloadAll })
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 class="text-base font-semibold text-slate-900">{{ t('orgDashboard.inboxChat') }}</h2>
      <p class="text-sm text-slate-600 mt-1">{{ t('orgDashboard.applicationsChatIntro') }}</p>

      <p v-if="hubLoading" class="text-sm text-slate-500 py-8">{{ t('orgDashboard.loading') }}</p>
      <div v-else-if="!hubRequests.length" class="text-sm text-slate-500 py-8">{{ t('orgDashboard.applicationsChatEmpty') }}</div>
      <div v-else class="mt-6 space-y-3">
        <div
          v-for="req in hubRequests"
          :key="req.id"
          class="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/40"
        >
          <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between bg-white border-b border-slate-100">
            <button type="button" class="text-left min-w-0 flex-1 group" @click="toggleExpanded(req.id)">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-slate-900 text-sm sm:text-base">{{ req.title }}</span>
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium border shrink-0"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': req.status === 'OPEN',
                    'bg-blue-50 text-blue-700 border-blue-200': req.status === 'MATCHED',
                    'bg-slate-100 text-slate-600 border-slate-200': req.status === 'COMPLETED',
                    'bg-red-50 text-red-700 border-red-200': req.status === 'CANCELLED',
                  }"
                >
                  {{ getRequestStatusLabel(req.status) }}
                </span>
                <span class="text-xs text-slate-500">{{ expanded[req.id] ? '▼' : '▶' }}</span>
              </div>
              <p class="text-sm text-slate-600 mt-1">{{ formatRoute(req) }}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ new Date(req.earliestDate).toLocaleDateString(locale) }} – {{ new Date(req.latestDate).toLocaleDateString(locale) }}
              </p>
              <p v-if="req.animal" class="text-xs text-slate-500 mt-1">
                {{ t('orgDashboard.animalLabel') }}: {{ req.animal.name }} ({{ speciesLabel(req.animal.species) }})
              </p>
            </button>
            <div class="flex flex-wrap gap-2 shrink-0">
              <NuxtLink
                :to="`/requests/${req.id}`"
                class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                @click.stop
              >
                {{ t('orgDashboard.applicationsChatPublicRequest') }}
              </NuxtLink>
              <button
                type="button"
                class="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm font-medium hover:bg-amber-100"
                @click.stop="openApplicationsEditor(req)"
              >
                {{ t('orgDashboard.editApplicationsShort') }}
              </button>
            </div>
          </div>

          <div v-show="expanded[req.id]" class="p-4 space-y-6">
            <div v-if="req.applications.length === 0" class="text-sm text-slate-500 py-2">{{ t('request.noApplications') }}</div>

            <template v-else>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('orgDashboard.applicationsChatBulk') }}</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="hasRejectable(req)"
                    type="button"
                    :disabled="rejectAllLoading || !!applicationActionKey || unmatching"
                    class="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                    @click="rejectAllApplicants(req.id)"
                  >
                    {{ rejectAllLoading ? '…' : t('orgDashboard.rejectAllApplicants') }}
                  </button>
                  <button
                    v-if="req.status === 'MATCHED'"
                    type="button"
                    :disabled="unmatching || !!applicationActionKey || rejectAllLoading"
                    class="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50"
                    @click="unmatchRequest(req.id)"
                  >
                    {{ unmatching ? '…' : t('orgDashboard.unmatchFull') }}
                  </button>
                </div>
              </div>

              <div v-if="waitingListFor(req).length" class="rounded-xl border-l-4 border-amber-400 bg-amber-50/40 border border-amber-100 p-4">
                <h3 class="text-sm font-semibold text-amber-900 mb-3">{{ t('orgDashboard.applicationsChatWaitingTitle') }}</h3>
                <p v-if="req.status === 'OPEN'" class="text-xs text-amber-800 mb-3">{{ t('orgDashboard.applicationsChatPromoteHint') }}</p>
                <ul class="space-y-2">
                  <li
                    v-for="app in waitingListFor(req)"
                    :key="app.id"
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-white border border-amber-100"
                  >
                    <div class="min-w-0">
                      <p class="font-medium text-slate-900 text-sm">{{ app.user?.displayName ?? t('request.unknown') }}</p>
                      <p class="text-xs text-slate-500 break-all">{{ app.user?.email }}</p>
                      <p class="text-xs text-slate-400 mt-1">{{ new Date(app.createdAt).toLocaleString(locale) }}</p>
                    </div>
                    <div class="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        class="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        @click="openDetail(req, app)"
                      >
                        {{ t('orgDashboard.applicationsChatDetails') }}
                      </button>
                      <NuxtLink
                        v-if="app.conversationId"
                        :to="`/inbox/${app.conversationId}`"
                        class="inline-flex items-center px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
                      >
                        {{ t('dashboard.openChat') }}
                      </NuxtLink>
                      <button
                        v-if="canAcceptWhenOpen(req, app)"
                        type="button"
                        :disabled="acceptingId === app.id || !!applicationActionKey || unmatching"
                        class="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
                        @click="acceptApplication(req.id, app.id)"
                      >
                        {{ acceptingId === app.id ? t('request.accepting') : acceptButtonLabel(app) }}
                      </button>
                      <button
                        type="button"
                        :disabled="applicationActionBusy(app.id, 'reject') || unmatching"
                        class="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        @click="runApplicationAction(req.id, app.id, 'reject')"
                      >
                        {{ applicationActionBusy(app.id, 'reject') ? '…' : t('orgDashboard.applicationReject') }}
                      </button>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-slate-800 mb-3">{{ t('orgDashboard.applicationsChatApplicationsTitle') }}</h3>
                <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table class="min-w-full text-sm">
                    <thead>
                      <tr class="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        <th class="px-3 py-2">{{ t('orgDashboard.applicationsChatColPerson') }}</th>
                        <th class="px-3 py-2 hidden sm:table-cell">{{ t('orgDashboard.applicationsChatColDate') }}</th>
                        <th class="px-3 py-2">{{ t('orgDashboard.applicationsChatColStatus') }}</th>
                        <th class="px-3 py-2 text-right">{{ t('orgDashboard.applicationsChatColActions') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="app in mainApplicationsFor(req)"
                        :key="app.id"
                        class="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td class="px-3 py-3 align-top">
                          <p class="font-medium text-slate-900">{{ app.user?.displayName ?? t('request.unknown') }}</p>
                          <p class="text-xs text-slate-500 break-all">{{ app.user?.email }}</p>
                          <p class="text-xs text-slate-400 mt-1 sm:hidden">{{ new Date(app.createdAt).toLocaleString(locale) }}</p>
                        </td>
                        <td class="px-3 py-3 align-top text-slate-600 hidden sm:table-cell whitespace-nowrap">
                          {{ new Date(app.createdAt).toLocaleString(locale) }}
                        </td>
                        <td class="px-3 py-3 align-top">
                          <span class="inline-flex text-xs font-medium px-2 py-1 rounded border" :class="statusPillClass(app.status)">
                            {{ applicationStatusLabel(app.status) }}
                          </span>
                        </td>
                        <td class="px-3 py-3 align-top text-right">
                          <div class="flex flex-wrap gap-1.5 justify-end">
                            <button
                              type="button"
                              class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100"
                              @click="openDetail(req, app)"
                            >
                              {{ t('orgDashboard.applicationsChatDetails') }}
                            </button>
                            <NuxtLink
                              v-if="app.conversationId"
                              :to="`/inbox/${app.conversationId}`"
                              class="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700"
                            >
                              {{ t('dashboard.openChat') }}
                            </NuxtLink>
                            <button
                              v-if="req.status === 'MATCHED' && app.status === 'ACCEPTED'"
                              type="button"
                              :disabled="!!applicationActionKey || unmatching || rejectAllLoading"
                              class="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 hover:bg-white disabled:opacity-50"
                              @click="runApplicationAction(req.id, app.id, 'release_match')"
                            >
                              {{ applicationActionBusy(app.id, 'release_match') ? '…' : t('orgDashboard.applicationReleaseMatch') }}
                            </button>
                            <button
                              v-if="
                                req.status === 'MATCHED' &&
                                req.waitingListEnabled &&
                                (app.status === 'PENDING' || app.status === 'REJECTED')
                              "
                              type="button"
                              :disabled="!!applicationActionKey || unmatching || rejectAllLoading"
                              class="px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-50 disabled:opacity-50"
                              @click="runApplicationAction(req.id, app.id, 'set_waiting_list')"
                            >
                              {{ applicationActionBusy(app.id, 'set_waiting_list') ? '…' : t('orgDashboard.applicationSetWaitingList') }}
                            </button>
                            <button
                              v-if="canAcceptWhenOpen(req, app)"
                              type="button"
                              :disabled="acceptingId === app.id || !!applicationActionKey || rejectAllLoading"
                              class="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
                              @click="acceptApplication(req.id, app.id)"
                            >
                              {{ acceptingId === app.id ? t('request.accepting') : acceptButtonLabel(app) }}
                            </button>
                            <button
                              v-if="canRejectApplication(req, app)"
                              type="button"
                              :disabled="!!applicationActionKey || unmatching || rejectAllLoading || acceptingId === app.id"
                              class="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                              @click="runApplicationAction(req.id, app.id, 'reject')"
                            >
                              {{ applicationActionBusy(app.id, 'reject') ? '…' : t('orgDashboard.applicationReject') }}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-800">{{ t('orgDashboard.applicationsChatChatsTitle') }}</h3>
      <p class="text-xs text-slate-500 mt-1">{{ t('orgDashboard.applicationsChatChatsHint') }}</p>
      <p v-if="inboxLoading" class="text-sm text-slate-500 py-4">{{ t('orgDashboard.inboxLoading') }}</p>
      <p v-else-if="!inboxConversations.length" class="text-sm text-slate-500 py-4">{{ t('orgDashboard.noInbox') }}</p>
      <ul v-else class="mt-4 space-y-2">
        <li v-for="c in inboxConversations" :key="c.id" class="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div class="min-w-0">
            <p class="font-medium text-slate-900 text-sm">{{ c.requestTitle ?? t('dashboard.request') }} – {{ c.userDisplayName ?? t('chat.user') }}</p>
            <p v-if="c.lastMessage" class="text-xs text-slate-500 truncate mt-0.5">{{ c.lastMessage.body }}</p>
          </div>
          <NuxtLink :to="`/inbox/${c.id}`" class="shrink-0 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 text-center">
            {{ t('dashboard.openChat') }}
          </NuxtLink>
        </li>
      </ul>
    </div>

    <Teleport to="body">
      <div
        v-if="detailOpen && detailRequest && detailApp"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
        @click.self="closeDetail"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:bg-slate-100"
            aria-label="Schließen"
            @click="closeDetail"
          >
            <span class="text-2xl leading-none">×</span>
          </button>

          <h3 class="text-lg font-bold text-slate-900 pr-10">{{ t('orgDashboard.applicationsChatDetailTitle') }}</h3>
          <p class="text-sm text-slate-600 mt-1">{{ detailRequest.title }}</p>

          <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-2">
            <p class="font-semibold text-slate-800">{{ t('orgDashboard.applicationsChatFlightBlock') }}</p>
            <p>
              <span class="text-slate-500">{{ t('orgDashboard.applicationsChatRoute') }}:</span>
              {{ formatRoute(detailRequest) }}
            </p>
            <p>
              <span class="text-slate-500">{{ t('orgDashboard.applicationsChatDates') }}:</span>
              {{ new Date(detailRequest.earliestDate).toLocaleDateString(locale) }} – {{ new Date(detailRequest.latestDate).toLocaleDateString(locale) }}
            </p>
            <p v-if="detailRequest.animal">
              <span class="text-slate-500">{{ t('orgDashboard.animalLabel') }}:</span>
              {{ detailRequest.animal.name }} ({{ speciesLabel(detailRequest.animal.species) }})
            </p>
            <p v-if="detailRequest.details" class="text-slate-700 whitespace-pre-wrap pt-2 border-t border-slate-200">{{ detailRequest.details }}</p>
          </div>

          <div class="mt-4 p-4 rounded-xl border border-slate-200">
            <div class="flex flex-wrap items-center gap-2 justify-between">
              <div>
                <p class="font-semibold text-slate-900">{{ detailApp.user?.displayName ?? t('request.unknown') }}</p>
                <p class="text-sm text-slate-600 break-all">{{ detailApp.user?.email }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ new Date(detailApp.createdAt).toLocaleString(locale) }}</p>
              </div>
              <span class="text-xs font-medium px-2 py-1 rounded border" :class="statusPillClass(detailApp.status)">
                {{ applicationStatusLabel(detailApp.status) }}
              </span>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <NuxtLink
                v-if="detailApp.conversationId"
                :to="`/inbox/${detailApp.conversationId}`"
                class="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
              >
                {{ t('dashboard.openChat') }}
              </NuxtLink>
              <NuxtLink
                :to="`/requests/${detailRequest.id}`"
                class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                {{ t('orgDashboard.applicationsChatPublicRequest') }}
              </NuxtLink>
            </div>
          </div>

          <div v-if="detailApp.message" class="mt-4">
            <p class="text-xs font-semibold uppercase text-slate-500 mb-1">{{ t('orgDashboard.applicationsChatMessageLabel') }}</p>
            <p class="text-sm text-slate-800 whitespace-pre-wrap p-3 rounded-lg bg-slate-50 border border-slate-100">{{ detailApp.message }}</p>
          </div>

          <div v-if="applicationDataEntries(detailApp.applicationData).length" class="mt-4">
            <p class="text-xs font-semibold uppercase text-slate-500 mb-2">{{ t('orgDashboard.applicationsChatFormData') }}</p>
            <dl class="grid gap-2 text-sm">
              <div v-for="([k, v]) in applicationDataEntries(detailApp.applicationData)" :key="k" class="flex flex-col sm:flex-row sm:gap-2 border-b border-slate-100 pb-2">
                <dt class="font-medium text-slate-600 shrink-0 sm:w-1/3">{{ k }}</dt>
                <dd class="text-slate-900 break-words">{{ typeof v === 'object' ? JSON.stringify(v) : String(v) }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="detailApp.attachmentPath" class="mt-4">
            <p class="text-xs font-semibold uppercase text-slate-500 mb-1">{{ t('orgDashboard.applicationsChatAttachment') }}</p>
            <a :href="detailApp.attachmentPath" target="_blank" rel="noopener noreferrer" class="text-amber-700 hover:underline text-sm font-medium break-all">
              {{ detailApp.attachmentPath }}
            </a>
          </div>

          <div class="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-200">
            <button
              v-if="detailRequest.status === 'MATCHED' && detailApp.status === 'ACCEPTED'"
              type="button"
              :disabled="!!applicationActionKey || unmatching"
              class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              @click="runApplicationAction(detailRequest.id, detailApp.id, 'release_match')"
            >
              {{ applicationActionBusy(detailApp.id, 'release_match') ? '…' : t('orgDashboard.applicationReleaseMatch') }}
            </button>
            <button
              v-if="
                detailRequest.status === 'MATCHED' &&
                detailRequest.waitingListEnabled &&
                (detailApp.status === 'PENDING' || detailApp.status === 'REJECTED')
              "
              type="button"
              :disabled="!!applicationActionKey"
              class="px-4 py-2 rounded-lg border border-amber-300 text-amber-900 text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
              @click="runApplicationAction(detailRequest.id, detailApp.id, 'set_waiting_list')"
            >
              {{ applicationActionBusy(detailApp.id, 'set_waiting_list') ? '…' : t('orgDashboard.applicationSetWaitingList') }}
            </button>
            <button
              v-if="canAcceptWhenOpen(detailRequest, detailApp)"
              type="button"
              :disabled="acceptingId === detailApp.id || !!applicationActionKey"
              class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
              @click="acceptApplication(detailRequest.id, detailApp.id)"
            >
              {{ acceptingId === detailApp.id ? t('request.accepting') : acceptButtonLabel(detailApp) }}
            </button>
            <button
              v-if="canRejectApplication(detailRequest, detailApp)"
              type="button"
              :disabled="!!applicationActionKey || acceptingId === detailApp.id"
              class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
              @click="runApplicationAction(detailRequest.id, detailApp.id, 'reject')"
            >
              {{ applicationActionBusy(detailApp.id, 'reject') ? '…' : t('orgDashboard.applicationReject') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="applicationsEditorOpen && editorRequest"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60"
        @click.self="closeApplicationsEditor"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 relative">
          <button
            type="button"
            class="absolute top-3 right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-600 hover:bg-slate-100"
            aria-label="Schließen"
            @click="closeApplicationsEditor"
          >
            <span class="text-2xl leading-none">×</span>
          </button>
          <h3 class="text-lg font-bold text-slate-900 pr-10">{{ t('orgDashboard.applicationsEditorTitle') }}</h3>
          <p class="text-sm text-slate-600 mt-1">{{ editorRequest.title }}</p>
          <div
            v-if="editorGroupLegs.length > 1"
            class="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
          >
            {{ t('orgDashboard.applicationsEditorGroupHint', { count: editorGroupLegs.length }) }}
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-if="editorGroupHasRejectable"
              type="button"
              :disabled="rejectAllGroupLoading || !!applicationActionKey || unmatching || rejectAllLoading"
              class="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              @click="rejectAllGroupApplicants"
            >
              {{ rejectAllGroupLoading ? '…' : t('orgDashboard.rejectAllGroupApplicants') }}
            </button>
            <button
              v-if="editorAnyMatched"
              type="button"
              :disabled="unmatching || !!applicationActionKey || rejectAllLoading || rejectAllGroupLoading"
              class="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50"
              @click="editorRequest && unmatchRequest(editorRequest.id)"
            >
              {{ unmatching ? '…' : t('orgDashboard.unmatchFull') }}
            </button>
          </div>

          <div v-for="leg in editorGroupLegs" :key="leg.id" class="mt-8 border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div>
              <h4 class="font-semibold text-slate-900">{{ formatRoute(leg) }}</h4>
              <p class="text-xs text-slate-500 mt-0.5">
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium border"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': leg.status === 'OPEN',
                    'bg-blue-50 text-blue-700 border-blue-200': leg.status === 'MATCHED',
                    'bg-slate-100 text-slate-600 border-slate-200': leg.status === 'COMPLETED',
                    'bg-red-50 text-red-700 border-red-200': leg.status === 'CANCELLED',
                  }"
                >
                  {{ getRequestStatusLabel(leg.status) }}
                </span>
                <span class="mx-1">·</span>
                {{ leg.title }}
              </p>
            </div>

            <div v-if="waitingListFor(leg).length" class="rounded-xl border-l-4 border-amber-400 bg-amber-50/50 border border-amber-100 p-3">
              <h5 class="text-xs font-semibold text-amber-900 mb-2">{{ t('orgDashboard.applicationsChatWaitingTitle') }}</h5>
              <p v-if="leg.status === 'OPEN'" class="text-xs text-amber-800 mb-2">{{ t('orgDashboard.applicationsChatPromoteHint') }}</p>
              <ul class="space-y-2">
                <li
                  v-for="app in waitingListFor(leg)"
                  :key="app.id"
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 rounded-lg bg-white border border-amber-100 text-sm"
                >
                  <div class="min-w-0">
                    <p class="font-medium text-slate-900">{{ app.user?.displayName ?? t('request.unknown') }}</p>
                    <p class="text-xs text-slate-500 break-all">{{ app.user?.email }}</p>
                    <p class="text-xs text-slate-400">{{ new Date(app.createdAt).toLocaleString(locale) }}</p>
                  </div>
                  <div class="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                      @click="openDetail(leg, app)"
                    >
                      {{ t('orgDashboard.applicationsChatDetails') }}
                    </button>
                    <NuxtLink
                      v-if="app.conversationId"
                      :to="`/inbox/${app.conversationId}`"
                      class="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium"
                    >
                      {{ t('dashboard.openChat') }}
                    </NuxtLink>
                    <button
                      v-if="canAcceptWhenOpen(leg, app)"
                      type="button"
                      :disabled="acceptingId === app.id || !!applicationActionKey || unmatching"
                      class="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50"
                      @click="acceptApplication(leg.id, app.id)"
                    >
                      {{ acceptingId === app.id ? t('request.accepting') : acceptButtonLabel(app) }}
                    </button>
                    <button
                      v-if="canRejectApplication(leg, app)"
                      type="button"
                      :disabled="applicationActionBusy(app.id, 'reject') || unmatching"
                      class="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                      @click="runApplicationAction(leg.id, app.id, 'reject')"
                    >
                      {{ applicationActionBusy(app.id, 'reject') ? '…' : t('orgDashboard.applicationReject') }}
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h5 class="text-xs font-semibold text-slate-700 mb-2">{{ t('orgDashboard.applicationsChatApplicationsTitle') }}</h5>
              <div v-if="!mainApplicationsFor(leg).length && !waitingListFor(leg).length" class="text-sm text-slate-500 py-2">
                {{ t('request.noApplications') }}
              </div>
              <div v-else-if="mainApplicationsFor(leg).length" class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                      <th class="px-3 py-2">{{ t('orgDashboard.applicationsChatColPerson') }}</th>
                      <th class="px-3 py-2 hidden sm:table-cell">{{ t('orgDashboard.applicationsChatColDate') }}</th>
                      <th class="px-3 py-2">{{ t('orgDashboard.applicationsChatColStatus') }}</th>
                      <th class="px-3 py-2 text-right">{{ t('orgDashboard.applicationsChatColActions') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="app in mainApplicationsFor(leg)"
                      :key="app.id"
                      class="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <td class="px-3 py-2 align-top">
                        <p class="font-medium text-slate-900">{{ app.user?.displayName ?? t('request.unknown') }}</p>
                        <p class="text-xs text-slate-500 break-all">{{ app.user?.email }}</p>
                      </td>
                      <td class="px-3 py-2 align-top text-slate-600 hidden sm:table-cell whitespace-nowrap">
                        {{ new Date(app.createdAt).toLocaleString(locale) }}
                      </td>
                      <td class="px-3 py-2 align-top">
                        <span class="inline-flex text-xs font-medium px-2 py-1 rounded border" :class="statusPillClass(app.status)">
                          {{ applicationStatusLabel(app.status) }}
                        </span>
                      </td>
                      <td class="px-3 py-2 align-top text-right">
                        <div class="flex flex-wrap gap-1 justify-end">
                          <button
                            type="button"
                            class="px-2 py-1 rounded-lg border border-slate-200 text-xs"
                            @click="openDetail(leg, app)"
                          >
                            {{ t('orgDashboard.applicationsChatDetails') }}
                          </button>
                          <NuxtLink
                            v-if="app.conversationId"
                            :to="`/inbox/${app.conversationId}`"
                            class="inline-flex px-2 py-1 rounded-lg bg-slate-800 text-white text-xs"
                          >
                            {{ t('dashboard.openChat') }}
                          </NuxtLink>
                          <button
                            v-if="leg.status === 'MATCHED' && app.status === 'ACCEPTED'"
                            type="button"
                            :disabled="!!applicationActionKey || unmatching"
                            class="px-2 py-1 rounded-lg border border-slate-300 text-xs"
                            @click="runApplicationAction(leg.id, app.id, 'release_match')"
                          >
                            {{ applicationActionBusy(app.id, 'release_match') ? '…' : t('orgDashboard.applicationReleaseMatch') }}
                          </button>
                          <button
                            v-if="
                              leg.status === 'MATCHED' &&
                              leg.waitingListEnabled &&
                              (app.status === 'PENDING' || app.status === 'REJECTED')
                            "
                            type="button"
                            :disabled="!!applicationActionKey || unmatching"
                            class="px-2 py-1 rounded-lg border border-amber-300 text-amber-900 text-xs"
                            @click="runApplicationAction(leg.id, app.id, 'set_waiting_list')"
                          >
                            {{ applicationActionBusy(app.id, 'set_waiting_list') ? '…' : t('orgDashboard.applicationSetWaitingList') }}
                          </button>
                          <button
                            v-if="canAcceptWhenOpen(leg, app)"
                            type="button"
                            :disabled="acceptingId === app.id || !!applicationActionKey || unmatching"
                            class="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs disabled:opacity-50"
                            @click="acceptApplication(leg.id, app.id)"
                          >
                            {{ acceptingId === app.id ? t('request.accepting') : acceptButtonLabel(app) }}
                          </button>
                          <button
                            v-if="canRejectApplication(leg, app)"
                            type="button"
                            :disabled="!!applicationActionKey || unmatching || acceptingId === app.id"
                            class="px-2 py-1 rounded-lg border border-slate-300 text-xs"
                            @click="runApplicationAction(leg.id, app.id, 'reject')"
                          >
                            {{ applicationActionBusy(app.id, 'reject') ? '…' : t('orgDashboard.applicationReject') }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-4 border-t border-slate-200">
            <button type="button" class="text-sm text-amber-700 font-medium hover:underline" @click="openTransportMetaFromEditor">
              {{ t('orgDashboard.editTransportMetaLink') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
