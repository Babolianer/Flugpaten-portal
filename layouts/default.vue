<script setup lang="ts">
import favIcon from '~/assets/images/fav.png'

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: favIcon }],
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
    <LayoutHeader />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>
