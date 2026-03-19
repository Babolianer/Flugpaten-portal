<script setup lang="ts">
const { t } = useI18n()

const block1Ref = ref<HTMLElement | null>(null)
const block2Ref = ref<HTMLElement | null>(null)
const block3Ref = ref<HTMLElement | null>(null)

// Step 1 map animation: start when block 1 is in view (run once)
const step1Revealed = ref(false)
const step1Cursor = ref(false)
const step1Route = ref(false)
const step1Plane = ref(false)
const step1Tag = ref(false)
let step1TimelineStarted = false

function startStep1Timeline() {
  if (step1TimelineStarted) return
  step1TimelineStarted = true
  step1Revealed.value = true
  setTimeout(() => { step1Cursor.value = true }, 400)
  setTimeout(() => { step1Route.value = true }, 1800)
  setTimeout(() => { step1Plane.value = true }, 2200)
  setTimeout(() => { step1Tag.value = true }, 3800)
}

// Step 2 card animation when block 2 is in view
const step2CardVisible = ref(false)
const step2PriceVisible = ref(false)
const step2Expanded = ref(false)
let step2TimelineStarted = false

function startStep2Timeline() {
  if (step2TimelineStarted) return
  step2TimelineStarted = true
  step2CardVisible.value = true
  setTimeout(() => { step2PriceVisible.value = true }, 600)
  setTimeout(() => { step2Expanded.value = true }, 1800)
}

// Step 3 scenes when block 3 is in view
const step3Plane = ref(false)
const step3Silhouette = ref(false)
const step3Family = ref(false)
let step3TimelineStarted = false

function startStep3Timeline() {
  if (step3TimelineStarted) return
  step3TimelineStarted = true
  step3Plane.value = true
  setTimeout(() => { step3Silhouette.value = true }, 2200)
  setTimeout(() => { step3Family.value = true }, 4000)
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const id = (entry.target as HTMLElement).dataset.block
          if (id === '1') startStep1Timeline()
          if (id === '2') startStep2Timeline()
          if (id === '3') startStep3Timeline()
        })
      },
      { threshold: 0.4, rootMargin: '0px' }
    )
    if (block1Ref.value) observer.observe(block1Ref.value)
    if (block2Ref.value) observer.observe(block2Ref.value)
    if (block3Ref.value) observer.observe(block3Ref.value)
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="how-it-works-cinematic overflow-x-hidden" aria-label="So funktioniert's">
    <!-- Page 1: Step 1 – Map (dark) -->
    <section
      ref="block1Ref"
      data-block="1"
      class="how-block min-h-screen flex flex-col px-4 sm:px-6 py-12 sm:py-16 md:py-24 bg-gradient-step1"
    >
      <div class="text-center mb-8 md:mb-12">
        <h2 class="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4 break-words px-1">
          {{ t('home.howItWorksTitle') }}
        </h2>
        <p class="text-base sm:text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto px-1">
          {{ t('home.howItWorksSubtitle') }}
        </p>
      </div>
      <div class="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 min-h-0">
        <div class="flex flex-col justify-center order-2 md:order-1 text-center md:text-left max-w-md">
          <h3
            class="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 transition-all duration-700 break-words"
            :class="step1Revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          >
            {{ t('home.step1Title') }}
          </h3>
          <p
            class="text-slate-200 text-base sm:text-lg transition-all duration-700 delay-150"
            :class="step1Revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          >
            {{ t('home.step1Description') }}
          </p>
        </div>
        <div class="order-1 md:order-2 w-full max-w-xl">
          <HowItWorksStep1Map
            :revealed="step1Revealed"
            :cursor-visible="step1Cursor"
            :route-drawn="step1Route"
            :plane-flying="step1Plane"
            :tag-visible="step1Tag"
          />
        </div>
      </div>
    </section>

    <!-- Page 2: Step 2 – Card (light) -->
    <section
      ref="block2Ref"
      data-block="2"
      class="how-block min-h-screen flex flex-col px-4 sm:px-6 py-12 sm:py-16 md:py-24 bg-gradient-to-b from-slate-100 to-white"
    >
      <div class="text-center mb-8 md:mb-12">
        <h2 class="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4 break-words px-1">
          {{ t('home.howItWorksTitle') }}
        </h2>
        <p class="text-base sm:text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto px-1">
          {{ t('home.howItWorksSubtitle') }}
        </p>
      </div>
      <div class="flex-1 flex flex-col items-center justify-center gap-8 min-h-0">
        <div class="text-center mb-6">
          <h3
            class="text-xl sm:text-2xl md:text-4xl font-bold text-slate-900 mb-2 transition-all duration-700 break-words"
            :class="step2CardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          >
            {{ t('home.step2Title') }}
          </h3>
          <p
            class="text-slate-600 text-base sm:text-lg transition-all duration-700 delay-150"
            :class="step2CardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          >
            {{ t('home.step2Description') }}
          </p>
        </div>
        <HowItWorksStep2Card
          :visible="step2CardVisible"
          :price-visible="step2PriceVisible"
          :expanded="step2Expanded"
        />
      </div>
    </section>

    <!-- Page 3: Step 3 – Accompany (warm) -->
    <section
      ref="block3Ref"
      data-block="3"
      class="how-block min-h-screen flex flex-col px-4 sm:px-6 py-12 sm:py-16 md:py-24 bg-gradient-warm"
    >
      <div class="text-center mb-8 md:mb-12">
        <h2 class="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4 break-words px-1">
          {{ t('home.howItWorksTitle') }}
        </h2>
        <p class="text-base sm:text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto px-1">
          {{ t('home.howItWorksSubtitle') }}
        </p>
      </div>
      <div class="flex-1 flex flex-col items-center justify-center gap-8 min-h-0">
        <div class="text-center mb-6">
          <h3
            class="text-xl sm:text-2xl md:text-4xl font-bold text-slate-900 mb-2 transition-all duration-700 break-words"
            :class="step3Family ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          >
            {{ t('home.step3Title') }}
          </h3>
          <p
            class="text-slate-600 text-base sm:text-lg transition-all duration-700 delay-150"
            :class="step3Family ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
          >
            {{ t('home.step3Description') }}
          </p>
        </div>
        <HowItWorksStep3Scene
          :plane-scene="step3Plane"
          :silhouette-scene="step3Silhouette"
          :family-scene="step3Family"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.how-it-works-cinematic {
  position: relative;
}

.how-block {
  scroll-margin-top: 0;
}

.bg-gradient-step1 {
  background: linear-gradient(
    180deg,
    theme('colors.slate.900') 0%,
    theme('colors.slate.700') 35%,
    theme('colors.slate.500') 70%,
    theme('colors.slate.300') 100%
  );
}

.bg-gradient-warm {
  background: linear-gradient(
    180deg,
    theme('colors.amber.50') 0%,
    theme('colors.white') 100%
  );
}
</style>
