<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title: string
  requestId: string
  revieweeUserId?: string | null
  revieweeOrgId?: string | null
}>()
const emit = defineEmits<{ close: []; submitted: [] }>()
const { t } = useI18n()
const rating = ref(5)
const comment = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        requestId: props.requestId,
        revieweeUserId: props.revieweeUserId || undefined,
        revieweeOrgId: props.revieweeOrgId || undefined,
        rating: rating.value,
        comment: comment.value.trim() || null,
      },
    })
    emit('submitted')
    emit('close')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err?.data?.message || t('review.submitError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="emit('close')">
      <div class="w-full max-w-md rounded-xl bg-white shadow-xl p-6" @click.stop>
        <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ title }}</h2>
        <div v-if="error" class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{{ error }}</div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('review.rating') }}</label>
            <div class="flex gap-1">
              <button
                v-for="i in 5"
                :key="i"
                type="button"
                :class="i <= rating ? 'text-amber-500' : 'text-slate-300'"
                @click="rating = i"
              >
                ★
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('review.commentOptional') }}</label>
            <textarea
              v-model="comment"
              rows="3"
              class="w-full border border-slate-300 rounded px-3 py-2"
              :placeholder="t('review.commentPlaceholder')"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              :disabled="loading"
              class="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium disabled:opacity-50"
              @click="submit"
            >
              {{ loading ? t('review.submitting') : t('review.submit') }}
            </button>
            <button
              type="button"
              class="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              @click="emit('close')"
            >
              {{ t('review.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
