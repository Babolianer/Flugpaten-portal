<script setup lang="ts">
defineProps<{
  email?: string | null
  website?: string | null
  phone?: string | null
  instagram?: string | null
  facebook?: string | null
}>()
</script>

<template>
  <div
    v-if="email || website || phone || instagram || facebook"
    class="rounded-xl p-5 text-white text-sm"
    style="background: #a67c52;"
  >
    <div v-if="email" class="flex items-center gap-3 mb-3">
      <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </span>
      <a :href="`mailto:${email}`" class="hover:underline break-all">{{ email }}</a>
    </div>
    <div v-if="website" class="flex items-center gap-3 mb-3">
      <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </span>
      <a :href="website.startsWith('http') ? website : `https://${website}`" target="_blank" rel="noopener" class="hover:underline break-all">{{ website }}</a>
    </div>
    <div v-if="phone" class="flex items-center gap-3 mb-3">
      <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </span>
      <a :href="`tel:${phone.replace(/\s/g, '')}`" class="hover:underline">{{ phone }}</a>
    </div>
    <div v-if="instagram" class="flex items-center gap-3 mb-3">
      <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </span>
      <a :href="`https://instagram.com/${instagram.replace(/^@/, '')}`" target="_blank" rel="noopener" class="hover:underline">{{ instagram }}</a>
    </div>
    <div v-if="facebook" class="flex items-center gap-3">
      <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </span>
      <a :href="facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`" target="_blank" rel="noopener" class="hover:underline break-all">{{ facebook }}</a>
    </div>
  </div>
</template>
