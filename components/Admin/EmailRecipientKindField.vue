<script setup lang="ts">
export type RecipientKindValue = 'ORG_CONTACT_EMAIL' | 'USER_SELF' | 'ADMIN_EMAIL'

const model = defineModel<RecipientKindValue>({ required: true })

const { t } = useI18n()
const open = ref(false)
const search = ref('')
const root = ref<HTMLElement | null>(null)
const panelId = `recipient-panel-${Math.random().toString(36).slice(2, 9)}`

const OPTIONS: {
  category: 'user' | 'org' | 'system'
  value: RecipientKindValue
  labelKey: string
  hintKey: string
}[] = [
  {
    category: 'user',
    value: 'USER_SELF',
    labelKey: 'admin.emails.trigger.recipientOptUser',
    hintKey: 'admin.emails.trigger.recipientOptUserHint',
  },
  {
    category: 'org',
    value: 'ORG_CONTACT_EMAIL',
    labelKey: 'admin.emails.recipientOrg',
    hintKey: 'admin.emails.trigger.recipientOptOrgHint',
  },
  {
    category: 'system',
    value: 'ADMIN_EMAIL',
    labelKey: 'admin.emails.recipientAdmin',
    hintKey: 'admin.emails.trigger.recipientOptAdminHint',
  },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return OPTIONS
  return OPTIONS.filter((o) => {
    const label = t(o.labelKey).toLowerCase()
    const hint = t(o.hintKey).toLowerCase()
    return label.includes(q) || hint.includes(q) || o.value.toLowerCase().includes(q)
  })
})

const grouped = computed(() => {
  const order: ('user' | 'org' | 'system')[] = ['user', 'org', 'system']
  return order
    .map((category) => ({
      category,
      items: filtered.value.filter((o) => o.category === category),
    }))
    .filter((g) => g.items.length > 0)
})

const currentLabel = computed(() => {
  const o = OPTIONS.find((x) => x.value === model.value)
  return o ? t(o.labelKey) : model.value
})

function select(v: RecipientKindValue) {
  model.value = v
  open.value = false
  search.value = ''
}

function clearChip() {
  open.value = true
  nextTick(() => searchInput.value?.focus())
}

const searchInput = ref<HTMLInputElement | null>(null)

watch(open, (v) => {
  if (v) {
    search.value = ''
    nextTick(() => searchInput.value?.focus())
  }
})

function onDocPointerDown(e: MouseEvent | TouchEvent) {
  if (!open.value || !root.value) return
  const t = e.target
  if (t instanceof Node && root.value.contains(t)) return
  open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
})
</script>

<template>
  <div ref="root" class="relative">
    <span class="mb-1.5 block text-xs font-medium text-slate-600">{{ t('admin.emails.recipient') }}</span>

    <p class="mb-2 text-xs text-slate-500 leading-snug">
      {{ t('admin.emails.trigger.recipientSingleHint') }}
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <span
        class="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm text-slate-800"
      >
        <span class="truncate">{{ currentLabel }}</span>
        <button
          type="button"
          class="shrink-0 rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          :title="t('admin.emails.trigger.recipientChange')"
          :aria-label="t('admin.emails.trigger.recipientChange')"
          @click="clearChip"
        >
          ×
        </button>
      </span>
      <button
        type="button"
        class="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
        :aria-expanded="open"
        :aria-controls="panelId"
        @click="open = !open"
      >
        {{ t('admin.emails.trigger.recipientOpen') }}
      </button>
    </div>

    <div
      v-show="open"
      :id="panelId"
      class="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      role="listbox"
    >
      <div class="border-b border-slate-100 p-2">
        <input
          ref="searchInput"
          v-model="search"
          type="search"
          class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          :placeholder="t('admin.emails.trigger.recipientSearch')"
          autocomplete="off"
          @keydown.escape.stop.prevent="open = false"
        />
      </div>
      <div class="max-h-52 overflow-y-auto p-2 space-y-3">
        <template v-for="g in grouped" :key="g.category">
          <div>
            <p class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {{ t(`admin.emails.trigger.recipientCat.${g.category}`) }}
            </p>
            <ul class="space-y-0.5">
              <li v-for="o in g.items" :key="o.value">
                <button
                  type="button"
                  class="flex w-full flex-col rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                  :class="model === o.value ? 'bg-slate-100' : ''"
                  role="option"
                  :aria-selected="model === o.value"
                  :title="t(o.hintKey)"
                  @click="select(o.value)"
                >
                  <span class="font-medium text-slate-900">{{ t(o.labelKey) }}</span>
                  <span class="text-xs text-slate-500">{{ t(o.hintKey) }}</span>
                </button>
              </li>
            </ul>
          </div>
        </template>
        <p v-if="grouped.length === 0" class="px-2 py-3 text-sm text-slate-500">
          {{ t('admin.emails.trigger.placeholderNoResults') }}
        </p>
      </div>
    </div>

    <div class="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {{ t('admin.emails.trigger.recipientCustomTitle') }}
      </p>
      <p class="mt-1 text-xs text-slate-600 leading-relaxed">
        {{ t('admin.emails.trigger.recipientCustomNote') }}
      </p>
    </div>
  </div>
</template>
