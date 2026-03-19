<script setup lang="ts">
import type { FlugpateFaq } from '~/content/flugpate/types'

const { t } = useI18n()

const props = defineProps<{
  faqs: FlugpateFaq[]
  title?: string
}>()

const openIndex = ref<number | null>(null)

const faqSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: props.faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}))

useHead(
  computed(() => ({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(faqSchema.value),
      },
    ],
  })),
)
</script>

<template>
  <section v-if="faqs.length" class="flugpaten-faq">
    <h2 class="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 break-words">
      {{ title || t('flugpate.faqTitle') }}
    </h2>
    <ul class="space-y-2">
      <li
        v-for="(faq, index) in faqs"
        :key="index"
        class="border border-slate-200 rounded-lg overflow-hidden bg-white"
      >
        <button
          type="button"
          class="w-full text-left py-4 px-4 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors"
          :aria-expanded="openIndex === index"
          :aria-controls="`faq-answer-${index}`"
          :id="`faq-question-${index}`"
          @click="openIndex = openIndex === index ? null : index"
        >
          <span class="font-medium text-slate-900 pr-8">{{ faq.question }}</span>
          <span
            class="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg leading-none"
            aria-hidden="true"
          >
            {{ openIndex === index ? '−' : '+' }}
          </span>
        </button>
        <div
          :id="`faq-answer-${index}`"
          :aria-labelledby="`faq-question-${index}`"
          class="border-t border-slate-100 px-4 pb-4 pt-0"
          :class="openIndex === index ? 'block' : 'hidden'"
        >
          <p class="text-slate-600 leading-relaxed pt-2 whitespace-pre-line">
            {{ faq.answer }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
