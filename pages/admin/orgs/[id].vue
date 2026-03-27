<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const { locale } = useI18n()

type CrmData = {
  organization: {
    id: string
    name: string
    slug: string
    status: string
    preferredLanguage: string
    contactEmail: string
    website: string | null
    description: string | null
    createdAt: string
    updatedAt: string
  }
  emails: Array<{
    id: string
    triggerKey: string
    status: string
    deliveryStatus: string | null
    toEmail: string
    subject: string
    errorMessage: string | null
    sentAt: string | null
    createdAt: string
  }>
  notes: Array<{
    id: string
    content: string
    createdByAdminId: string | null
    createdAt: string
  }>
  tasks: Array<{
    id: string
    title: string
    description: string | null
    dueDate: string | null
    status: 'offen' | 'erledigt'
    createdAt: string
  }>
}

const loading = ref(true)
const error = ref('')
const data = ref<CrmData | null>(null)
const noteInput = ref('')
const taskTitle = ref('')
const taskDescription = ref('')
const taskDueDate = ref('')
const saving = ref(false)

const orgId = computed(() => String(route.params.id || ''))

async function loadCrm() {
  if (!orgId.value) return
  loading.value = true
  error.value = ''
  try {
    data.value = await $fetch(`/api/admin/orgs/${orgId.value}/crm`)
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { message?: string } }
    if (err?.statusCode === 401 || err?.statusCode === 403) return navigateTo('/login')
    error.value = err?.data?.message ?? 'CRM-Daten konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function addNote() {
  if (!noteInput.value.trim() || !orgId.value) return
  saving.value = true
  try {
    await $fetch(`/api/admin/orgs/${orgId.value}/notes`, {
      method: 'POST',
      body: { content: noteInput.value.trim() },
    })
    noteInput.value = ''
    await loadCrm()
  } finally {
    saving.value = false
  }
}

async function addTask() {
  if (!taskTitle.value.trim() || !orgId.value) return
  saving.value = true
  try {
    await $fetch(`/api/admin/orgs/${orgId.value}/tasks`, {
      method: 'POST',
      body: {
        title: taskTitle.value.trim(),
        description: taskDescription.value.trim() || null,
        dueDate: taskDueDate.value ? new Date(`${taskDueDate.value}T00:00:00.000Z`).toISOString() : null,
      },
    })
    taskTitle.value = ''
    taskDescription.value = ''
    taskDueDate.value = ''
    await loadCrm()
  } finally {
    saving.value = false
  }
}

async function toggleTask(taskId: string, done: boolean) {
  if (!orgId.value) return
  await $fetch(`/api/admin/orgs/${orgId.value}/tasks/${taskId}`, {
    method: 'PATCH',
    body: { status: done ? 'erledigt' : 'offen' },
  })
  await loadCrm()
}

onMounted(loadCrm)
</script>

<template>
  <div class="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <NuxtLink to="/admin" class="text-sm text-slate-600 hover:text-slate-900">← Zurück zu Admin</NuxtLink>
        <h1 class="mt-1 text-2xl font-semibold text-slate-900">Organisation CRM</h1>
      </div>
      <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="loadCrm">
        Aktualisieren
      </button>
    </div>

    <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-600">Lade CRM-Daten…</p>

    <template v-else-if="data">
      <section class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-semibold text-slate-800">{{ data.organization.name }}</h2>
        <div class="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <div><span class="text-slate-500">Status:</span> {{ data.organization.status }}</div>
          <div><span class="text-slate-500">Sprache:</span> {{ data.organization.preferredLanguage }}</div>
          <div><span class="text-slate-500">Kontakt:</span> {{ data.organization.contactEmail }}</div>
          <div><span class="text-slate-500">Website:</span> {{ data.organization.website || '–' }}</div>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 class="text-lg font-semibold text-slate-800">Notizen</h2>
        <textarea v-model="noteInput" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" placeholder="Neue interne Notiz..." />
        <button type="button" :disabled="saving || !noteInput.trim()" class="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50" @click="addNote">
          Notiz speichern
        </button>
        <div class="space-y-2">
          <div v-for="n in data.notes" :key="n.id" class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p class="whitespace-pre-wrap text-slate-800">{{ n.content }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ new Date(n.createdAt).toLocaleString(locale) }}</p>
          </div>
          <p v-if="data.notes.length === 0" class="text-sm text-slate-500">Noch keine Notizen vorhanden.</p>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 class="text-lg font-semibold text-slate-800">Aufgaben</h2>
        <div class="grid gap-2 md:grid-cols-3">
          <input v-model="taskTitle" type="text" class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" placeholder="Aufgabentitel" />
          <input v-model="taskDueDate" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
          <button type="button" :disabled="saving || !taskTitle.trim()" class="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-amber-600 disabled:opacity-50" @click="addTask">
            Aufgabe anlegen
          </button>
        </div>
        <textarea v-model="taskDescription" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" placeholder="Beschreibung (optional)" />
        <div class="space-y-2">
          <div v-for="task in data.tasks" :key="task.id" class="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div>
              <p class="text-sm font-medium" :class="task.status === 'erledigt' ? 'text-slate-500 line-through' : 'text-slate-900'">{{ task.title }}</p>
              <p v-if="task.description" class="text-sm text-slate-600">{{ task.description }}</p>
              <p class="text-xs text-slate-500">Fällig: {{ task.dueDate ? new Date(task.dueDate).toLocaleDateString(locale) : '–' }}</p>
            </div>
            <button
              type="button"
              class="rounded-lg border px-2.5 py-1.5 text-xs font-medium"
              :class="task.status === 'erledigt' ? 'border-slate-300 bg-white text-slate-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'"
              @click="toggleTask(task.id, task.status !== 'erledigt')"
            >
              {{ task.status === 'erledigt' ? 'Als offen markieren' : 'Erledigen' }}
            </button>
          </div>
          <p v-if="data.tasks.length === 0" class="text-sm text-slate-500">Noch keine Aufgaben vorhanden.</p>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 class="text-lg font-semibold text-slate-800">E-Mail-Verläufe</h2>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left">
              <tr>
                <th class="px-3 py-2 font-semibold text-slate-700">Zeit</th>
                <th class="px-3 py-2 font-semibold text-slate-700">Empfänger</th>
                <th class="px-3 py-2 font-semibold text-slate-700">Betreff</th>
                <th class="px-3 py-2 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mail in data.emails" :key="mail.id" class="border-t border-slate-100">
                <td class="px-3 py-2 text-slate-600">{{ new Date(mail.createdAt).toLocaleString(locale) }}</td>
                <td class="px-3 py-2 font-mono text-xs text-slate-700">{{ mail.toEmail }}</td>
                <td class="px-3 py-2 text-slate-800">{{ mail.subject }}</td>
                <td class="px-3 py-2 text-slate-700">{{ mail.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="data.emails.length === 0" class="text-sm text-slate-500">Keine E-Mails gefunden.</p>
      </section>
    </template>
  </div>
</template>
