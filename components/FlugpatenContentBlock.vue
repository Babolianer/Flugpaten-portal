<script setup lang="ts">
import type { FlugpateSection } from '~/content/flugpate/types'

defineProps<{
  sections: FlugpateSection[]
}>()
</script>

<template>
  <div class="flugpaten-content space-y-10">
    <template v-for="(section, idx) in sections" :key="section.id || idx">
      <section :id="section.id" class="scroll-mt-24">
        <h2 class="text-xl sm:text-2xl font-semibold text-slate-900 mb-3 sm:mb-4 break-words">
          {{ section.title }}
        </h2>
        <template v-if="section.paragraphs?.length">
          <p
            v-for="(p, i) in section.paragraphs"
            :key="i"
            class="text-slate-600 text-base leading-relaxed mb-4 break-words"
          >
            {{ p }}
          </p>
        </template>
        <template v-if="section.subs?.length">
          <div class="space-y-6">
            <div
              v-for="(sub, subIdx) in section.subs"
              :key="subIdx"
              class="pl-0"
            >
              <h3 class="text-base sm:text-lg font-medium text-slate-800 mb-2 break-words">
                {{ sub.title }}
              </h3>
              <p
                v-for="(para, pi) in sub.paragraphs"
                :key="pi"
                class="text-slate-600 text-base leading-relaxed mb-2 break-words"
              >
                {{ para }}
              </p>
            </div>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>
