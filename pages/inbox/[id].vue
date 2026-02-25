<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface Message {
  id: string
  body: string
  createdAt: string
  senderUserId: string
  senderDisplayName: string | null
  isOwn: boolean
  readAt: string | null
}

interface ConversationInfo {
  id: string
  requestId: string | null
  requestTitle: string | null
  orgName: string | null
  orgSlug: string | null
  userName: string | null
}

const route = useRoute()
const conversationId = computed(() => route.params.id as string)

const { user, fetchUser } = useAuth()
const { t, locale } = useI18n()
const conversation = ref<ConversationInfo | null>(null)
const messages = ref<Message[]>([])
const newMessage = ref('')
const sending = ref(false)
const loading = ref(true)
const messagesContainer = ref<HTMLElement | null>(null)
const pollingInterval = ref<NodeJS.Timeout | null>(null)
const lastMessageId = ref<string | null>(null)
const isPageVisible = ref(true)

async function loadConversation() {
  if (!conversationId.value) return
  try {
    conversation.value = await $fetch<ConversationInfo>(`/api/conversations/${conversationId.value}`)
  } catch (e: unknown) {
    if ((e as { statusCode?: number })?.statusCode === 403) await navigateTo('/login')
    if ((e as { statusCode?: number })?.statusCode === 404) await navigateTo('/inbox')
    conversation.value = null
  }
}

async function loadMessages(onlyNew = false) {
  if (!conversationId.value) return
  try {
    const res = await $fetch<{ messages: Message[] }>(`/api/conversations/${conversationId.value}/messages`)
    const previousLength = messages.value.length
    const wasAtBottom = messagesContainer.value
      ? messagesContainer.value.scrollHeight - messagesContainer.value.scrollTop - messagesContainer.value.clientHeight < 100
      : true
    
    messages.value = res.messages
    
    // Update last message ID for polling
    if (res.messages.length > 0) {
      lastMessageId.value = res.messages[res.messages.length - 1].id
    }
    
    // Auto-scroll: beim ersten Laden immer unten; bei Updates nur wenn User schon unten war
    const shouldScroll = !onlyNew || (res.messages.length > previousLength && wasAtBottom)
    if (shouldScroll) {
      nextTick(() => {
        messagesContainer.value?.scrollTo({ top: messagesContainer.value!.scrollHeight, behavior: onlyNew ? 'smooth' : 'auto' })
      })
    }
  } catch {
    if (!onlyNew) {
      messages.value = []
    }
  }
}

async function sendMessage() {
  const text = newMessage.value.trim()
  if (!text || sending.value || !conversationId.value) return
  sending.value = true
  newMessage.value = ''
  try {
    const res = await $fetch<{ message: Message }>(`/api/conversations/${conversationId.value}/messages`, {
      method: 'POST',
      body: { body: text },
    })
    messages.value.push(res.message)
    lastMessageId.value = res.message.id
    nextTick(() => {
      messagesContainer.value?.scrollTo({ top: messagesContainer.value!.scrollHeight, behavior: 'smooth' })
    })
    // Reload messages after sending to get any updates
    await loadMessages(true)
  } catch {
    newMessage.value = text
  } finally {
    sending.value = false
  }
}

function startPolling() {
  if (pollingInterval.value) return
  
  pollingInterval.value = setInterval(async () => {
    // Only poll if page is visible
    if (isPageVisible.value && conversationId.value) {
      await loadMessages(true)
    }
  }, 1500) // Poll alle 1,5 s für Echtzeit-Updates
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
    // Immediately load messages when page becomes visible
    loadMessages(true)
  }
}

function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  })
}

const chatTitle = computed(() => {
  if (!conversation.value) return t('chat.title')
  if (user.value?.role === 'ORG_USER' || user.value?.role === 'ADMIN') {
    return `${conversation.value.requestTitle ?? t('chat.request')} – ${conversation.value.userName ?? t('chat.user')}`
  }
  return `${conversation.value.requestTitle ?? t('chat.request')} – ${conversation.value.orgName ?? t('chat.organization')}`
})

onMounted(async () => {
  await fetchUser()
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  loading.value = true
  await loadConversation()
  await loadMessages()
  loading.value = false
  // Nach dem Wechsel von Loading zu Chat: zum Ende scrollen
  scrollToBottom()

  // Beim Öffnen alle ungelesenen Nachrichten als gelesen markieren
  try {
    await $fetch(`/api/conversations/${conversationId.value}/messages/read`, { method: 'PATCH' })
    await loadMessages(true)
  } catch {
    // ignore
  }
  
  // Start polling for new messages (Echtzeit-Updates)
  startPolling()
  
  // Listen for page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(conversationId, async () => {
  stopPolling()
  if (conversationId.value) {
    await loadConversation()
    await loadMessages()
    scrollToBottom()
    try {
      await $fetch(`/api/conversations/${conversationId.value}/messages/read`, { method: 'PATCH' })
      await loadMessages(true)
    } catch {
      // ignore
    }
    startPolling()
  }
})
</script>

<template>
  <div class="container mx-auto w-4/5 max-w-full px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
    <div class="max-w-2xl mx-auto">
      <NuxtLink to="/inbox" class="inline-flex items-center gap-1 text-amber-600 hover:underline text-sm mb-4">
        {{ t('chat.back') }}
      </NuxtLink>
      <NuxtLink v-if="conversation?.requestId" :to="`/requests/${conversation.requestId}`" class="inline-flex items-center gap-1 text-slate-500 hover:underline text-sm ml-4">
        {{ t('chat.toRequest') }}
      </NuxtLink>

      <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        {{ t('chat.loading') }}
      </div>

      <div v-else-if="conversation" class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <h1 class="text-lg font-semibold text-slate-900 p-4 border-b border-slate-200">
          {{ chatTitle }}
        </h1>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[50vh] bg-slate-50">
          <p v-if="!messages.length" class="text-slate-500 text-sm text-center py-4">{{ t('chat.noMessages') }}</p>
          <div
            v-for="m in messages"
            :key="m.id"
            :class="m.isOwn ? 'ml-8 flex justify-end' : 'mr-8'"
          >
            <div
              :class="[
                'rounded-2xl px-4 py-2 max-w-[85%] text-sm',
                m.isOwn ? 'bg-amber-500 text-slate-900' : 'bg-white border border-slate-200 text-slate-800'
              ]"
            >
              <p v-if="!m.isOwn && m.senderDisplayName" class="text-xs font-medium text-slate-500 mb-0.5">{{ m.senderDisplayName }}</p>
              <p class="whitespace-pre-wrap">{{ m.body }}</p>
              <p class="text-xs opacity-70 mt-1 flex items-center gap-2 flex-wrap">
                <span>{{ new Date(m.createdAt).toLocaleString(locale.value === 'de' ? 'de-DE' : 'en-US') }}</span>
                <span v-if="m.isOwn" :class="m.readAt ? 'text-emerald-600' : 'text-slate-500'">
                  {{ m.readAt ? t('chat.statusRead') : t('chat.statusSent') }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <form class="p-4 border-t border-slate-200 bg-white" @submit.prevent="sendMessage">
          <div class="flex gap-2">
            <textarea
              v-model="newMessage"
              :placeholder="t('chat.placeholder')"
              rows="2"
              class="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              :disabled="sending"
            />
            <button
              type="submit"
              class="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm disabled:opacity-50"
              :disabled="sending || !newMessage.trim()"
            >
              {{ sending ? t('chat.sending') : t('chat.send') }}
            </button>
          </div>
        </form>
      </div>

      <div v-else class="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        {{ t('chat.notFound') }}
      </div>
    </div>
  </div>
</template>
