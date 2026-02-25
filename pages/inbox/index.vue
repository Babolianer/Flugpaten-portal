<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface Conversation {
  id: string
  requestId: string | null
  requestTitle: string | null
  orgName: string | null
  orgSlug: string | null
  lastMessage: { body: string; createdAt: string; senderUserId: string; readAt: string | null } | null
  updatedAt: string
}

const { user, fetchUser } = useAuth()
const { t, locale } = useI18n()
const conversations = ref<Conversation[]>([])
const loading = ref(true)
const pollingInterval = ref<NodeJS.Timeout | null>(null)
const isPageVisible = ref(true)

const unreadConversations = computed(() => {
  if (!user.value) return []
  return conversations.value.filter(
    (c) =>
      c.lastMessage &&
      c.lastMessage.senderUserId !== user.value!.id &&
      !c.lastMessage.readAt
  )
})

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('inbox.timeJustNow')
  if (diffMins < 60) return t('inbox.timeMinutesAgo').replace('{count}', String(diffMins))
  if (diffHours < 24) return t('inbox.timeHoursAgo').replace('{count}', String(diffHours))
  if (diffDays < 7) {
    const key = diffDays > 1 ? 'inbox.timeDaysAgoPlural' : 'inbox.timeDaysAgo'
    return t(key).replace('{count}', String(diffDays))
  }
  const localeCode = locale.value === 'de' ? 'de-DE' : 'en-US'
  return date.toLocaleDateString(localeCode, { day: 'numeric', month: 'long', year: 'numeric' })
}

async function loadConversations() {
  try {
    let res: { conversations: Array<Record<string, unknown>> }
    if (user.value?.role === 'ORG_USER') {
      res = await $fetch<{ conversations: Array<Record<string, unknown>> }>('/api/org/dashboard/conversations')
      // Normalize: org API returns userDisplayName, map to orgName for display
      conversations.value = (res.conversations || []).map((c) => ({
        id: c.id,
        requestId: c.requestId,
        requestTitle: c.requestTitle,
        orgName: c.userDisplayName ?? c.orgName ?? null,
        orgSlug: null,
        lastMessage: c.lastMessage as Conversation['lastMessage'],
        updatedAt: c.updatedAt,
      })) as Conversation[]
    } else {
      res = await $fetch<{ conversations: Conversation[] }>('/api/user/conversations')
      conversations.value = res.conversations ?? []
    }
  } catch {
    conversations.value = []
  }
}

function startPolling() {
  if (pollingInterval.value) return
  pollingInterval.value = setInterval(async () => {
    if (isPageVisible.value && (user.value?.role === 'USER' || user.value?.role === 'ORG_USER')) {
      await loadConversations()
    }
  }, 2500) // Poll alle 2,5 s für Echtzeit-Updates der Chatliste
}

function stopPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

function handleVisibilityChange() {
  isPageVisible.value = !document.hidden
  if (isPageVisible.value) {
    loadConversations()
  }
}

onMounted(async () => {
  await fetchUser()
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  loading.value = true
  await loadConversations()
  loading.value = false
  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
    <div class="max-w-4xl mx-auto">
      <NuxtLink :to="user?.role === 'ORG_USER' ? '/org/dashboard' : '/dashboard'" class="inline-flex items-center gap-1 text-amber-600 hover:underline text-sm mb-6">
        {{ t('inbox.backToDashboard') }}
      </NuxtLink>

      <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{{ t('inbox.title') }}</h1>
      <p class="text-slate-600 mb-6">{{ t('inbox.subtitle') }}</p>

      <div v-if="loading" class="text-center py-12">
        <div class="text-4xl mb-2">💬</div>
        <p class="text-slate-600">{{ t('inbox.loading') }}</p>
      </div>

      <div v-else-if="conversations.length === 0" class="p-12 rounded-xl bg-slate-50 border-2 border-slate-200 text-center">
        <div class="text-5xl mb-4">📭</div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">{{ t('inbox.emptyTitle') }}</h2>
        <p class="text-slate-600 mb-6">{{ t('inbox.emptyText') }}</p>
        <NuxtLink
          :to="user?.role === 'ORG_USER' ? '/org/dashboard' : '/map'"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-colors"
        >
          {{ t('inbox.emptyCta') }}
        </NuxtLink>
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="conv in conversations"
          :key="conv.id"
          :to="`/inbox/${conv.id}`"
          class="block p-5 rounded-xl bg-white border-2 transition-all cursor-pointer group"
          :class="
            conv.lastMessage && conv.lastMessage.senderUserId !== user?.id && !conv.lastMessage.readAt
              ? 'border-blue-300 shadow-lg hover:shadow-xl'
              : 'border-slate-200 hover:border-amber-300 hover:shadow-md'
          "
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                  {{ conv.requestTitle ?? t('dashboard.request') }} – {{ conv.orgName ?? (user?.role === 'ORG_USER' ? t('chat.user') : t('dashboard.organization')) }}
                </h3>
                <span
                  v-if="conv.lastMessage && conv.lastMessage.senderUserId !== user?.id && !conv.lastMessage.readAt"
                  class="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500"
                ></span>
              </div>
              <p v-if="conv.lastMessage" class="text-sm text-slate-600 mb-2 line-clamp-2">
                {{ conv.lastMessage.body }}
              </p>
              <div class="flex items-center gap-3 text-xs text-slate-400">
                <span>{{ formatRelativeTime(conv.lastMessage?.createdAt ?? conv.updatedAt) }}</span>
                <span v-if="conv.requestId" class="text-slate-300">•</span>
                <NuxtLink
                  v-if="conv.requestId"
                  :to="`/requests/${conv.requestId}`"
                  class="text-amber-600 hover:text-amber-700 hover:underline"
                  @click.stop
                >
                  {{ t('inbox.toRequestLink') }}
                </NuxtLink>
              </div>
            </div>
            <div class="shrink-0 text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
              →
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
