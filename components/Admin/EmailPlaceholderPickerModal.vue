<script setup lang="ts">
import { PLACEHOLDER_GROUPS, placeholderCode } from './emailTriggerPlaceholders'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  pick: [code: string]
}>()

const { t } = useI18n()
const search = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
watch(
  () => props.open,
  (v) => {
    if (v) {
      search.value = ''
      nextTick(() => searchInput.value?.focus())
    }
  }
)

function close() {
  emit('update:open', false)
}

function labelForKey(key: string): string {
  return t(`admin.emails.trigger.ph.${key}.label`)
}

function hintForKey(key: string): string {
  return t(`admin.emails.trigger.ph.${key}.hint`)
}

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  return PLACEHOLDER_GROUPS.map((g) => {
    const keys = q
      ? g.keys.filter((k) => {
          const code = placeholderCode(k).toLowerCase()
          return (
            code.includes(q) ||
            labelForKey(k).toLowerCase().includes(q) ||
            hintForKey(k).toLowerCase().includes(q)
          )
        })
      : [...g.keys]
    return { cat: g.cat, keys }
  }).filter((g) => g.keys.length > 0)
})

function onPick(key: string) {
  emit('pick', placeholderCode(key))
}

</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[70] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      :aria-label="t('admin.emails.trigger.placeholderModalTitle')"
    >
      <div
        class="absolute inset-0"
        aria-hidden="true"
        @click="close"
      />
      <div
        class="relative z-10 flex max-h-[min(90vh,640px)] w-full sm:max-w-lg flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl"
        @click.stop
      >
        <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 class="text-base font-semibold text-slate-900">
            {{ t('admin.emails.trigger.placeholderModalTitle') }}
          </h2>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            :aria-label="t('common.close')"
            @click="close"
          >
            <span class="sr-only">{{ t('common.close') }}</span>
            <span aria-hidden="true" class="text-lg leading-none">×</span>
          </button>
        </div>
        <div class="border-b border-slate-100 px-4 py-2">
          <input
            ref="searchInput"
            v-model="search"
            type="search"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2"
            :placeholder="t('admin.emails.trigger.placeholderSearch')"
            autocomplete="off"
            @keydown.escape.stop.prevent="close"
          />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-5">
          <p v-if="filteredGroups.length === 0" class="text-sm text-slate-500">
            {{ t('admin.emails.trigger.placeholderNoResults') }}
          </p>
          <section v-for="g in filteredGroups" :key="g.cat">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {{ t(`admin.emails.trigger.phCat.${g.cat}`) }}
            </h3>
            <ul class="space-y-1">
              <li v-for="key in g.keys" :key="key">
                <button
                  type="button"
                  class="flex w-full flex-col items-stretch rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors hover:border-slate-200 hover:bg-slate-50"
                  :title="hintForKey(key)"
                  @click="onPick(key)"
                >
                  <span class="font-medium text-slate-900">
                    {{ labelForKey(key) }}
                    <span class="text-slate-400 font-normal"> – </span>
                    <code class="text-xs font-mono text-slate-600">{{ placeholderCode(key) }}</code>
                  </span>
                  <span class="mt-0.5 text-xs text-slate-500 line-clamp-2">{{ hintForKey(key) }}</span>
                </button>
              </li>
            </ul>
          </section>
        </div>
        <div class="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            class="w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
            @click="close"
          >
            {{ t('admin.emails.trigger.placeholderDone') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
