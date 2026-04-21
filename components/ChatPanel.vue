<script setup lang="ts">
/**
 * Dedizierte Chat-Komponente für Konversationen zwischen Flugpaten und Organisationen.
 * Technisch sauber strukturiert, wiederverwendbar, nutzerfreundliche UX/UI.
 */
interface Message {
  id: string
  body: string
  createdAt: string
  senderUserId: string
  senderDisplayName: string | null
  isOwn: boolean
}

interface Props {
  conversationId: string
  messages: Message[]
  loading?: boolean
  sending?: boolean
  currentUserId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sending: false,
  currentUserId: null,
})

const emit = defineEmits<{
  send: [text: string]
  loadMessages: []
}>()

const { t, locale } = useI18n()
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const localeCode = computed(() => (locale.value === 'de' ? 'de-DE' : 'en-US'))

function formatMessageTime(dateString: string) {
  return new Date(dateString).toLocaleString(localeCode.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function send() {
  const text = newMessage.value.trim()
  if (!text || props.sending) return
  emit('send', text)
  newMessage.value = ''
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

// Auto-scroll bei neuen Nachrichten
watch(
  () => props.messages.length,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      nextTick(() => {
        messagesContainer.value?.scrollTo({
          top: messagesContainer.value!.scrollHeight,
          behavior: 'smooth',
        })
      })
    }
  }
)

// Initial scroll
onMounted(() => {
  nextTick(() => {
    if (messagesContainer.value && props.messages.length) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})
</script>

<template>
  <div class="chat-panel flex flex-col h-full min-h-0 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
    <!-- Nachrichtenbereich -->
    <div
      ref="messagesContainer"
      class="chat-messages flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-[280px] max-h-[55vh] bg-gradient-to-b from-slate-50/80 to-white"
      role="log"
      aria-live="polite"
      aria-label="Chat-Nachrichten"
    >
      <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-slate-500">
        <div class="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p class="text-sm">{{ t('chat.loading') }}</p>
      </div>

      <p
        v-else-if="!messages.length"
        class="text-slate-500 text-sm text-center py-12 px-4 rounded-xl bg-slate-50/50 border border-slate-100"
      >
        {{ t('chat.noMessages') }}
      </p>

      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="m in messages"
          :key="m.id"
          :class="[
            'flex',
            m.isOwn ? 'justify-end' : 'justify-start',
          ]"
        >
          <div
            :class="[
              'group max-w-[85%] sm:max-w-[75%]',
              m.isOwn ? 'order-2' : 'order-1',
            ]"
          >
            <p
              v-if="!m.isOwn && m.senderDisplayName"
              class="text-xs font-medium text-amber-600 mb-1 px-1"
            >
              {{ m.senderDisplayName }}
            </p>
            <div
              :class="[
                'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                m.isOwn
                  ? 'bg-amber-500 text-slate-900 rounded-br-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
              ]"
            >
              <p class="whitespace-pre-wrap break-words">{{ m.body }}</p>
              <p
                :class="[
                  'text-[11px] mt-1.5',
                  m.isOwn ? 'text-slate-700/80' : 'text-slate-400'
                ]"
              >
                {{ formatMessageTime(m.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Eingabebereich -->
    <form
      class="p-4 border-t border-slate-200 bg-white"
      @submit.prevent="send"
    >
      <div class="flex gap-2 sm:gap-3 items-end">
        <textarea
          ref="textareaRef"
          v-model="newMessage"
          :placeholder="t('chat.placeholder')"
          :disabled="sending || loading"
          rows="1"
          class="flex-1 min-h-[44px] max-h-32 rounded-xl border border-slate-300 px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:opacity-60 disabled:bg-slate-50"
          :aria-label="t('chat.placeholder')"
          @keydown="handleKeydown"
        />
        <button
          type="submit"
          :disabled="sending || loading || !newMessage.trim()"
          class="shrink-0 px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center gap-2"
          :aria-label="sending ? t('chat.sending') : t('chat.send')"
        >
          <span v-if="sending" class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span class="hidden sm:inline">{{ sending ? t('chat.sending') : t('chat.send') }}</span>
        </button>
      </div>
      <p class="text-[11px] text-slate-400 mt-1.5 px-1">
        {{ t('chat.enterToSend') }}
      </p>
    </form>
  </div>
</template>
