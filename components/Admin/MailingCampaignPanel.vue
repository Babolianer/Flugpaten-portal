<script setup lang="ts">
const props = defineProps<{ active: boolean }>()

const { t } = useI18n()

type Segment =
  | 'ACQUISITION_CONTACTS'
  | 'ALL_FLUGPATEN'
  | 'ORG_ACCOUNT_HOLDERS'
  | 'APPROVED_ORG_CONTACT_EMAILS'
  | 'NEWSLETTER_FLUGPATEN'
  | 'NEWSLETTER_ORG_USERS'

const DEFAULT_SUBJECT = 'Beta-Tester gesucht: Flugpaten-Portal'
const DEFAULT_BODY = `Hallo {{Tierschutzorga.}},

mein Name ist Aaron und ich beschäftige mich aktuell intensiv mit dem Thema Tierschutz. Dabei ist mir aufgefallen, dass es bislang kein modernes, internationales Portal gibt, über das Flugpaten und Tierschutzorganisationen unkompliziert zusammenfinden können.

Aus dieser Überlegung heraus habe ich eine Beta-Version einer Plattform entwickelt, auf der sich sowohl Flugpaten als auch Organisationen registrieren können. Flugpaten können ihre Flugdaten eintragen und erhalten passende Vermittlungsanfragen zu weltweit hinterlegten Flügen. Ziel ist es, den Prozess transparenter, einfacher und international zugänglich zu machen.

Aktuell suche ich engagierte Organisationen, die Interesse hätten, die Plattform als Beta-Tester auszuprobieren, Feedback zu geben und aktiv mitzugestalten. Langfristig plane ich, das Portal über Social Media gezielt zu bewerben, um möglichst viele Flugpaten zu erreichen und so die Reichweite für teilnehmende Organisationen deutlich zu erhöhen.

Ich würde mich sehr freuen, wenn ihr euch vorstellen könntet, Teil dieses Projekts zu werden. Eure Meinung und euer Feedback wären für mich unglaublich wertvoll.

Ihr leistet großartige Arbeit – vielleicht können wir hier gemeinsam etwas bewegen.

Herzliche Grüße
Aaron`

const segment = ref<Segment>('ACQUISITION_CONTACTS')
const audienceMode = ref<'suggestions' | 'manual' | 'template'>('suggestions')
const manualAudienceText = ref('')
const mailSubject = ref(DEFAULT_SUBJECT)
const mailBody = ref(DEFAULT_BODY)
const mailFooterText = ref('Aaron Löchner · aaron.loechner@gmx.de · 015224822057')
const mailFooterHtml = ref('')
const mailFooterTextDe = ref('Aaron Löchner · aaron.loechner@gmx.de · 015224822057')
const mailFooterTextEn = ref('Aaron Löchner · aaron.loechner@gmx.de · +49 …')
const mailFooterHtmlDe = ref('')
const mailFooterHtmlEn = ref('')
const loadingMailSettings = ref(false)
const savingMailSettings = ref(false)
const mailSettingsSaved = ref(false)
const sendingMail = ref(false)
const mailResult = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showTestPanel = ref(false)
const testEmail = ref('')
const testName = ref('Test-Empfänger')
const audienceTemplateName = ref('')

interface AudienceTemplate {
  id: string
  name: string
  description?: string
  mode: 'suggestions' | 'manual'
  segment: Segment
  language: 'all' | 'de' | 'en' | 'fr' | 'es' | 'it' | 'pl'
  filters: {
    user: {
      emailVerified: 'all' | 'verified' | 'unverified'
      doubleOptIn: 'all' | 'only' | 'exclude'
      newsletter: 'all' | 'optIn' | 'optOut'
      blocked: 'exclude' | 'all' | 'only'
    }
    org: {
      status: 'all' | 'PENDING' | 'APPROVED' | 'CANCELLED' | 'REJECTED'
      hasWebsite: boolean
      hasDescription: boolean
      excludeAquiseStatuses: Array<'nicht kontaktiert' | 'kontaktiert' | 'keine antwort' | 'registriert'>
      excludeContactedWithinDays: number | null
    }
  }
  manualAudienceText: string
  createdAt: string
}

interface AudiencePreviewRow {
  email: string
  name: string
  type: 'USER' | 'ORG_USER' | 'ORG_CONTACT' | 'ACQUISITION_CONTACT' | 'MANUAL'
}

const audienceTemplates = ref<AudienceTemplate[]>([])
const selectedAudienceTemplateId = ref('')
const AUDIENCE_TEMPLATES_KEY = 'admin-mail-audience-templates-v1'
const audienceLanguage = ref<'all' | 'de' | 'en' | 'fr' | 'es' | 'it' | 'pl'>('all')
const audiencePreviewLoading = ref(false)
const audiencePreviewError = ref('')
const audiencePreviewTotal = ref(0)
const audiencePreviewRows = ref<AudiencePreviewRow[]>([])
const audiencePreviewHasMore = ref(false)
const audienceUserEmailVerified = ref<'all' | 'verified' | 'unverified'>('all')
const audienceUserDoubleOptIn = ref<'all' | 'only' | 'exclude'>('all')
const audienceUserNewsletter = ref<'all' | 'optIn' | 'optOut'>('all')
const audienceUserBlocked = ref<'exclude' | 'all' | 'only'>('exclude')
const audienceOrgStatus = ref<'all' | 'PENDING' | 'APPROVED' | 'CANCELLED' | 'REJECTED'>('all')
const audienceOrgHasWebsite = ref(false)
const audienceOrgHasDescription = ref(false)
const audienceOrgExcludeAquiseStatuses = ref<Array<'nicht kontaktiert' | 'kontaktiert' | 'keine antwort' | 'registriert'>>([])
const audienceOrgExcludeContactedWithinDays = ref<number | null>(null)
const selectedAudienceKey = ref<string>('builtin:ALL_FLUGPATEN')
const showAudienceModal = ref(false)
const modalOnlyOnce = ref(false)
const editingAudienceTemplateId = ref<string | null>(null)
const audienceDescription = ref('')
const draftAudienceName = ref('')
const draftAudienceDescription = ref('')
const draftSegment = ref<Segment>('ALL_FLUGPATEN')
const draftLanguage = ref<'all' | 'de' | 'en' | 'fr' | 'es' | 'it' | 'pl'>('all')
const draftUserEmailVerified = ref<'all' | 'verified' | 'unverified'>('all')
const draftUserDoubleOptIn = ref<'all' | 'only' | 'exclude'>('all')
const draftUserNewsletter = ref<'all' | 'optIn' | 'optOut'>('all')
const draftUserBlocked = ref<'exclude' | 'all' | 'only'>('exclude')
const draftOrgStatus = ref<'all' | 'PENDING' | 'APPROVED' | 'CANCELLED' | 'REJECTED'>('all')
const draftOrgHasWebsite = ref(false)
const draftOrgHasDescription = ref(false)
const draftOrgExcludeAquiseStatuses = ref<Array<'nicht kontaktiert' | 'kontaktiert' | 'keine antwort' | 'registriert'>>([])
const draftOrgExcludeContactedWithinDays = ref<number | null>(null)

const segments: { value: Segment; labelKey: string }[] = [
  { value: 'ACQUISITION_CONTACTS', labelKey: 'admin.mailing.segmentAcquisition' },
  { value: 'ALL_FLUGPATEN', labelKey: 'admin.mailing.segmentAllFlugpaten' },
  { value: 'ORG_ACCOUNT_HOLDERS', labelKey: 'admin.mailing.segmentOrgAccounts' },
  { value: 'APPROVED_ORG_CONTACT_EMAILS', labelKey: 'admin.mailing.segmentApprovedOrgContacts' },
  { value: 'NEWSLETTER_FLUGPATEN', labelKey: 'admin.mailing.segmentNewsletterFlugpaten' },
  { value: 'NEWSLETTER_ORG_USERS', labelKey: 'admin.mailing.segmentNewsletterOrg' },
]

async function loadMailSettings() {
  loadingMailSettings.value = true
  try {
    const res = await $fetch<{
      subject: string
      body: string
      footerText: string
      footerHtml?: string
      footerTextDe?: string
      footerTextEn?: string
      footerHtmlDe?: string
      footerHtmlEn?: string
    }>(
      '/api/admin/acquisition/mail-settings'
    )
    if (res.subject) mailSubject.value = res.subject
    if (res.body) mailBody.value = res.body
    mailFooterText.value = res.footerText || mailFooterText.value
    mailFooterHtml.value = res.footerHtml || ''
    mailFooterTextDe.value = res.footerTextDe || res.footerText || mailFooterTextDe.value
    mailFooterTextEn.value = res.footerTextEn || res.footerText || mailFooterTextEn.value
    mailFooterHtmlDe.value = res.footerHtmlDe || res.footerHtml || ''
    mailFooterHtmlEn.value = res.footerHtmlEn || res.footerHtml || ''
  } catch {
    // Tabelle ggf. noch nicht vorhanden
  } finally {
    loadingMailSettings.value = false
  }
}

async function saveMailSettings() {
  savingMailSettings.value = true
  mailSettingsSaved.value = false
  try {
    await $fetch('/api/admin/acquisition/mail-settings', {
      method: 'PATCH',
      body: {
        subject: mailSubject.value,
        body: mailBody.value,
        footerText: mailFooterText.value,
        footerHtml: mailFooterHtml.value,
        footerTextDe: mailFooterTextDe.value,
        footerTextEn: mailFooterTextEn.value,
        footerHtmlDe: mailFooterHtmlDe.value,
        footerHtmlEn: mailFooterHtmlEn.value,
      },
    })
    mailSettingsSaved.value = true
    setTimeout(() => {
      mailSettingsSaved.value = false
    }, 3000)
  } catch {
    mailResult.value = { type: 'error', text: t('admin.mailing.saveTemplateError') }
  } finally {
    savingMailSettings.value = false
  }
}

async function sendBulk() {
  if (sendingMail.value) return
  mailResult.value = null
  sendingMail.value = true
  try {
    const activeTemplate = selectedAudienceTemplateId.value
      ? audienceTemplates.value.find((it) => it.id === selectedAudienceTemplateId.value) ?? null
      : null

    const effectiveMode = audienceMode.value === 'template' ? activeTemplate?.mode : audienceMode.value
    const effectiveSegment = audienceMode.value === 'template' ? activeTemplate?.segment : segment.value
    const effectiveLanguage = audienceMode.value === 'template' ? (activeTemplate?.language ?? 'all') : audienceLanguage.value
    const effectiveFilters = audienceMode.value === 'template'
      ? activeTemplate?.filters ?? {
          user: { emailVerified: 'all', doubleOptIn: 'all', newsletter: 'all', blocked: 'exclude' },
          org: { status: 'all', hasWebsite: false, hasDescription: false, excludeAquiseStatuses: [], excludeContactedWithinDays: null },
        }
      : {
          user: {
            emailVerified: audienceUserEmailVerified.value,
            doubleOptIn: audienceUserDoubleOptIn.value,
            newsletter: audienceUserNewsletter.value,
            blocked: audienceUserBlocked.value,
          },
          org: {
            status: audienceOrgStatus.value,
            hasWebsite: audienceOrgHasWebsite.value,
            hasDescription: audienceOrgHasDescription.value,
            excludeAquiseStatuses: audienceOrgExcludeAquiseStatuses.value,
            excludeContactedWithinDays: audienceOrgExcludeContactedWithinDays.value,
          },
        }
    const effectiveManualText = audienceMode.value === 'template' ? (activeTemplate?.manualAudienceText ?? '') : manualAudienceText.value
    const manualRecipients = parseManualRecipients(effectiveManualText)

    if (audienceMode.value === 'template' && !activeTemplate) {
      mailResult.value = { type: 'error', text: 'Bitte eine gespeicherte Zielgruppe auswählen.' }
      return
    }
    if (effectiveMode === 'manual' && manualRecipients.length === 0) {
      mailResult.value = { type: 'error', text: 'Bitte mindestens eine gültige E-Mail-Adresse manuell eingeben.' }
      return
    }

    const res = await $fetch<{
      sent: number
      failed: number
      total: number
      errors?: string[]
      message?: string
    }>('/api/admin/mailing/send-segment', {
      method: 'POST',
      body: {
        segment: effectiveMode === 'suggestions' ? effectiveSegment : undefined,
        language: effectiveMode === 'suggestions' && effectiveLanguage !== 'all' ? effectiveLanguage : undefined,
        filters: effectiveMode === 'suggestions' ? effectiveFilters : undefined,
        manualRecipients: effectiveMode === 'manual' ? manualRecipients : undefined,
        subject: mailSubject.value,
        body: mailBody.value,
        footerText: mailFooterText.value,
        footerHtml: mailFooterHtml.value,
        footerTextDe: mailFooterTextDe.value,
        footerTextEn: mailFooterTextEn.value,
        footerHtmlDe: mailFooterHtmlDe.value,
        footerHtmlEn: mailFooterHtmlEn.value,
      },
    })
    if (res.total === 0 && res.message) {
      mailResult.value = { type: 'error', text: res.message }
    } else {
      mailResult.value =
        res.failed === 0
          ? { type: 'success', text: t('admin.mailing.bulkSuccess', { count: res.sent }) }
          : {
              type: 'error',
              text: `${res.sent} ${t('admin.mailing.sent')}, ${res.failed} ${t('admin.mailing.failed')}.${res.errors?.length ? ' ' + res.errors.slice(0, 3).join('; ') : ''}`,
            }
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    mailResult.value = { type: 'error', text: err?.data?.message ?? t('admin.mailing.sendError') }
  } finally {
    sendingMail.value = false
  }
}

function openTestPanel() {
  showTestPanel.value = true
  mailResult.value = null
  testEmail.value = ''
  testName.value = 'Test-Empfänger'
}

async function sendTest() {
  const email = testEmail.value.trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mailResult.value = { type: 'error', text: t('admin.mailing.testInvalidEmail') }
    return
  }
  if (sendingMail.value) return
  mailResult.value = null
  sendingMail.value = true
  try {
    const activeTemplate = selectedAudienceTemplateId.value
      ? audienceTemplates.value.find((it) => it.id === selectedAudienceTemplateId.value) ?? null
      : null
    const effectiveMode = audienceMode.value === 'template' ? activeTemplate?.mode : audienceMode.value
    const effectiveSegment = audienceMode.value === 'template' ? activeTemplate?.segment : segment.value
    const effectiveLanguage = audienceMode.value === 'template' ? (activeTemplate?.language ?? 'all') : audienceLanguage.value
    const effectiveFilters = audienceMode.value === 'template'
      ? activeTemplate?.filters ?? {
          user: { emailVerified: 'all', doubleOptIn: 'all', newsletter: 'all', blocked: 'exclude' },
          org: { status: 'all', hasWebsite: false, hasDescription: false, excludeAquiseStatuses: [], excludeContactedWithinDays: null },
        }
      : {
          user: {
            emailVerified: audienceUserEmailVerified.value,
            doubleOptIn: audienceUserDoubleOptIn.value,
            newsletter: audienceUserNewsletter.value,
            blocked: audienceUserBlocked.value,
          },
          org: {
            status: audienceOrgStatus.value,
            hasWebsite: audienceOrgHasWebsite.value,
            hasDescription: audienceOrgHasDescription.value,
            excludeAquiseStatuses: audienceOrgExcludeAquiseStatuses.value,
            excludeContactedWithinDays: audienceOrgExcludeContactedWithinDays.value,
          },
        }
    const effectiveManualText = audienceMode.value === 'template' ? (activeTemplate?.manualAudienceText ?? '') : manualAudienceText.value
    const manualRecipients = parseManualRecipients(effectiveManualText)

    if (audienceMode.value === 'template' && !activeTemplate) {
      mailResult.value = { type: 'error', text: 'Bitte eine gespeicherte Zielgruppe auswählen.' }
      return
    }

    await $fetch('/api/admin/mailing/send-segment', {
      method: 'POST',
      body: {
        segment: effectiveMode === 'suggestions' ? effectiveSegment : undefined,
        language: effectiveMode === 'suggestions' && effectiveLanguage !== 'all' ? effectiveLanguage : undefined,
        filters: effectiveMode === 'suggestions' ? effectiveFilters : undefined,
        manualRecipients: effectiveMode === 'manual' ? manualRecipients : undefined,
        subject: mailSubject.value,
        body: mailBody.value,
        footerText: mailFooterText.value,
        footerHtml: mailFooterHtml.value,
        footerTextDe: mailFooterTextDe.value,
        footerTextEn: mailFooterTextEn.value,
        footerHtmlDe: mailFooterHtmlDe.value,
        footerHtmlEn: mailFooterHtmlEn.value,
        testTo: email,
        testName: testName.value.trim() || 'Test-Empfänger',
      },
    })
    mailResult.value = { type: 'success', text: t('admin.mailing.testSent') }
    showTestPanel.value = false
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    mailResult.value = { type: 'error', text: err?.data?.message ?? t('admin.mailing.sendError') }
  } finally {
    sendingMail.value = false
  }
}

function parseManualRecipients(sourceText = manualAudienceText.value): string[] {
  return sourceText
    .split(/\r?\n|,|;/)
    .map((s) => s.trim().toLowerCase())
    .filter((s, idx, arr) => s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && arr.indexOf(s) === idx)
}

function previewTypeLabel(type: AudiencePreviewRow['type']): string {
  if (type === 'USER') return 'Nutzer'
  if (type === 'ORG_USER') return 'Orga-Konto'
  if (type === 'ORG_CONTACT') return 'Orga-Kontakt'
  if (type === 'ACQUISITION_CONTACT') return 'Kontakt'
  return 'Manuell'
}

function loadManualAudiencePreview() {
  const recipients = parseManualRecipients()
  audiencePreviewTotal.value = recipients.length
  audiencePreviewHasMore.value = recipients.length > 25
  audiencePreviewRows.value = recipients.slice(0, 25).map((email) => ({
    email,
    name: email.split('@')[0] || 'Empfänger',
    type: 'MANUAL',
  }))
  audiencePreviewError.value = ''
}

async function loadAudiencePreview() {
  if (!props.active) return
  const activeTemplate = selectedAudienceTemplateId.value
    ? audienceTemplates.value.find((it) => it.id === selectedAudienceTemplateId.value) ?? null
    : null
  const effectiveMode = audienceMode.value === 'template' ? activeTemplate?.mode : audienceMode.value
  const effectiveSegment = audienceMode.value === 'template' ? activeTemplate?.segment : segment.value
  const effectiveLanguage = audienceMode.value === 'template' ? (activeTemplate?.language ?? 'all') : audienceLanguage.value
  const effectiveFilters = audienceMode.value === 'template'
    ? activeTemplate?.filters ?? {
        user: { emailVerified: 'all', doubleOptIn: 'all', newsletter: 'all', blocked: 'exclude' },
        org: { status: 'all', hasWebsite: false, hasDescription: false, excludeAquiseStatuses: [], excludeContactedWithinDays: null },
      }
    : {
        user: {
          emailVerified: audienceUserEmailVerified.value,
          doubleOptIn: audienceUserDoubleOptIn.value,
          newsletter: audienceUserNewsletter.value,
          blocked: audienceUserBlocked.value,
        },
        org: {
          status: audienceOrgStatus.value,
          hasWebsite: audienceOrgHasWebsite.value,
          hasDescription: audienceOrgHasDescription.value,
          excludeAquiseStatuses: audienceOrgExcludeAquiseStatuses.value,
          excludeContactedWithinDays: audienceOrgExcludeContactedWithinDays.value,
        },
      }
  const effectiveManualText = audienceMode.value === 'template' ? (activeTemplate?.manualAudienceText ?? '') : manualAudienceText.value

  if (audienceMode.value === 'template' && !activeTemplate) {
    audiencePreviewTotal.value = 0
    audiencePreviewRows.value = []
    audiencePreviewHasMore.value = false
    audiencePreviewError.value = 'Bitte eine gespeicherte Zielgruppe auswählen.'
    return
  }

  if (effectiveMode === 'manual') {
    const recipients = parseManualRecipients(effectiveManualText)
    audiencePreviewTotal.value = recipients.length
    audiencePreviewHasMore.value = recipients.length > 25
    audiencePreviewRows.value = recipients.slice(0, 25).map((email) => ({
      email,
      name: email.split('@')[0] || 'Empfänger',
      type: 'MANUAL',
    }))
    audiencePreviewError.value = ''
    return
  }

  audiencePreviewLoading.value = true
  audiencePreviewError.value = ''
  try {
    const res = await $fetch<{
      total: number
      preview: AudiencePreviewRow[]
      hasMore: boolean
    }>('/api/admin/mailing/audience-preview', {
      method: 'POST',
      body: {
        segment: effectiveSegment,
        language: effectiveLanguage !== 'all' ? effectiveLanguage : undefined,
        filters: effectiveFilters,
        limit: 25,
      },
    })
    audiencePreviewTotal.value = res.total
    audiencePreviewRows.value = res.preview
    audiencePreviewHasMore.value = res.hasMore
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    audiencePreviewError.value = err?.data?.message ?? 'Audience-Vorschau konnte nicht geladen werden.'
    audiencePreviewTotal.value = 0
    audiencePreviewRows.value = []
    audiencePreviewHasMore.value = false
  } finally {
    audiencePreviewLoading.value = false
  }
}

function applySuggestedAudience(nextSegment: Segment) {
  audienceMode.value = 'suggestions'
  selectedAudienceTemplateId.value = ''
  segment.value = nextSegment
}

function applySuggestedAudienceWithLanguage(nextSegment: Segment, language: 'all' | 'de' | 'en' | 'fr' | 'es' | 'it' | 'pl') {
  audienceMode.value = 'suggestions'
  selectedAudienceTemplateId.value = ''
  segment.value = nextSegment
  audienceLanguage.value = language
}

function applyBuiltinAudience(key: string) {
  audienceMode.value = 'suggestions'
  selectedAudienceTemplateId.value = ''
  audienceLanguage.value = 'all'
  if (key === 'ALL_FLUGPATEN') segment.value = 'ALL_FLUGPATEN'
  else if (key === 'ORG_ACCOUNT_HOLDERS') segment.value = 'ORG_ACCOUNT_HOLDERS'
  else segment.value = 'APPROVED_ORG_CONTACT_EMAILS'
}

function openAudienceCreateModal() {
  editingAudienceTemplateId.value = null
  draftAudienceName.value = ''
  draftAudienceDescription.value = ''
  draftSegment.value = segment.value
  draftLanguage.value = audienceLanguage.value
  draftUserEmailVerified.value = audienceUserEmailVerified.value
  draftUserDoubleOptIn.value = audienceUserDoubleOptIn.value
  draftUserNewsletter.value = audienceUserNewsletter.value
  draftUserBlocked.value = audienceUserBlocked.value
  draftOrgStatus.value = audienceOrgStatus.value
  draftOrgHasWebsite.value = audienceOrgHasWebsite.value
  draftOrgHasDescription.value = audienceOrgHasDescription.value
  draftOrgExcludeAquiseStatuses.value = [...audienceOrgExcludeAquiseStatuses.value]
  draftOrgExcludeContactedWithinDays.value = audienceOrgExcludeContactedWithinDays.value
  modalOnlyOnce.value = false
  showAudienceModal.value = true
}

function openAudienceEditModal(templateId: string) {
  const template = audienceTemplates.value.find((it) => it.id === templateId)
  if (!template) return
  editingAudienceTemplateId.value = templateId
  draftAudienceName.value = template.name
  draftAudienceDescription.value = template.description ?? ''
  draftSegment.value = template.segment
  draftLanguage.value = template.language
  draftUserEmailVerified.value = template.filters.user.emailVerified
  draftUserDoubleOptIn.value = template.filters.user.doubleOptIn
  draftUserNewsletter.value = template.filters.user.newsletter
  draftUserBlocked.value = template.filters.user.blocked
  draftOrgStatus.value = template.filters.org.status
  draftOrgHasWebsite.value = template.filters.org.hasWebsite
  draftOrgHasDescription.value = template.filters.org.hasDescription
  draftOrgExcludeAquiseStatuses.value = [...template.filters.org.excludeAquiseStatuses]
  draftOrgExcludeContactedWithinDays.value = template.filters.org.excludeContactedWithinDays
  modalOnlyOnce.value = false
  showAudienceModal.value = true
}

function handleAudienceSelectionChange() {
  if (selectedAudienceKey.value === '__create__') {
    openAudienceCreateModal()
    return
  }
  if (selectedAudienceKey.value.startsWith('template:')) {
    const templateId = selectedAudienceKey.value.replace('template:', '')
    applyAudienceTemplate(templateId)
    return
  }
  if (selectedAudienceKey.value.startsWith('builtin:')) {
    const builtin = selectedAudienceKey.value.replace('builtin:', '')
    applyBuiltinAudience(builtin)
  }
}

function loadAudienceTemplatesFromStorage() {
  if (!process.client) return
  try {
    const raw = localStorage.getItem(AUDIENCE_TEMPLATES_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Array<Partial<AudienceTemplate>>
    audienceTemplates.value = Array.isArray(parsed)
      ? parsed.map((item, idx) => ({
          id: item.id ?? `${Date.now()}-${idx}`,
          name: item.name ?? `Vorlage ${idx + 1}`,
          mode: item.mode === 'manual' ? 'manual' : 'suggestions',
          segment: item.segment ?? 'ACQUISITION_CONTACTS',
          language: item.language ?? 'all',
          filters: {
            user: {
              emailVerified: item.filters?.user?.emailVerified ?? 'all',
              doubleOptIn: item.filters?.user?.doubleOptIn ?? 'all',
              newsletter: item.filters?.user?.newsletter ?? 'all',
              blocked: item.filters?.user?.blocked ?? 'exclude',
            },
            org: {
              status: item.filters?.org?.status ?? 'all',
              hasWebsite: item.filters?.org?.hasWebsite ?? false,
              hasDescription: item.filters?.org?.hasDescription ?? false,
              excludeAquiseStatuses: item.filters?.org?.excludeAquiseStatuses ?? [],
              excludeContactedWithinDays: item.filters?.org?.excludeContactedWithinDays ?? null,
            },
          },
          manualAudienceText: item.manualAudienceText ?? '',
          createdAt: item.createdAt ?? new Date().toISOString(),
        }))
      : []
    audienceTemplates.value = audienceTemplates.value.map((tpl) => ({ ...tpl, description: tpl.description ?? '' }))
  } catch {
    audienceTemplates.value = []
  }
}

function persistAudienceTemplates() {
  if (!process.client) return
  localStorage.setItem(AUDIENCE_TEMPLATES_KEY, JSON.stringify(audienceTemplates.value))
}

function saveCurrentAudienceAsTemplate() {
  const name = audienceTemplateName.value.trim()
  if (!name) {
    mailResult.value = { type: 'error', text: 'Bitte einen Namen für die Audience-Vorlage eingeben.' }
    return
  }
  const template: AudienceTemplate = {
    id: `${Date.now()}`,
    name,
    mode: audienceMode.value,
    segment: segment.value,
    language: audienceLanguage.value,
    filters: {
      user: {
        emailVerified: audienceUserEmailVerified.value,
        doubleOptIn: audienceUserDoubleOptIn.value,
        newsletter: audienceUserNewsletter.value,
        blocked: audienceUserBlocked.value,
      },
      org: {
        status: audienceOrgStatus.value,
        hasWebsite: audienceOrgHasWebsite.value,
        hasDescription: audienceOrgHasDescription.value,
        excludeAquiseStatuses: audienceOrgExcludeAquiseStatuses.value,
        excludeContactedWithinDays: audienceOrgExcludeContactedWithinDays.value,
      },
    },
    manualAudienceText: manualAudienceText.value,
    createdAt: new Date().toISOString(),
  }
  audienceTemplates.value = [template, ...audienceTemplates.value].slice(0, 30)
  persistAudienceTemplates()
  audienceTemplateName.value = ''
  mailResult.value = { type: 'success', text: 'Audience-Vorlage gespeichert.' }
}

function saveAudienceFromModal() {
  const name = draftAudienceName.value.trim()
  if (!name && !modalOnlyOnce.value) {
    mailResult.value = { type: 'error', text: 'Bitte einen Namen für die Zielgruppe eingeben.' }
    return
  }

  audienceMode.value = 'suggestions'
  selectedAudienceTemplateId.value = ''
  segment.value = draftSegment.value
  audienceLanguage.value = draftLanguage.value
  audienceUserEmailVerified.value = draftUserEmailVerified.value
  audienceUserDoubleOptIn.value = draftUserDoubleOptIn.value
  audienceUserNewsletter.value = draftUserNewsletter.value
  audienceUserBlocked.value = draftUserBlocked.value
  audienceOrgStatus.value = draftOrgStatus.value
  audienceOrgHasWebsite.value = draftOrgHasWebsite.value
  audienceOrgHasDescription.value = draftOrgHasDescription.value
  audienceOrgExcludeAquiseStatuses.value = [...draftOrgExcludeAquiseStatuses.value]
  audienceOrgExcludeContactedWithinDays.value = draftOrgExcludeContactedWithinDays.value
  audienceDescription.value = draftAudienceDescription.value.trim()

  if (!modalOnlyOnce.value && editingAudienceTemplateId.value) {
    audienceTemplates.value = audienceTemplates.value.map((tpl) => {
      if (tpl.id !== editingAudienceTemplateId.value) return tpl
      return {
        ...tpl,
        name,
        description: draftAudienceDescription.value.trim() || undefined,
        mode: 'suggestions',
        segment: draftSegment.value,
        language: draftLanguage.value,
        filters: {
          user: {
            emailVerified: draftUserEmailVerified.value,
            doubleOptIn: draftUserDoubleOptIn.value,
            newsletter: draftUserNewsletter.value,
            blocked: draftUserBlocked.value,
          },
          org: {
            status: draftOrgStatus.value,
            hasWebsite: draftOrgHasWebsite.value,
            hasDescription: draftOrgHasDescription.value,
            excludeAquiseStatuses: [...draftOrgExcludeAquiseStatuses.value],
            excludeContactedWithinDays: draftOrgExcludeContactedWithinDays.value,
          },
        },
      }
    })
    persistAudienceTemplates()
    selectedAudienceTemplateId.value = editingAudienceTemplateId.value
    selectedAudienceKey.value = `template:${editingAudienceTemplateId.value}`
    audienceMode.value = 'template'
    editingAudienceTemplateId.value = null
  } else if (!modalOnlyOnce.value) {
    const template: AudienceTemplate = {
      id: `${Date.now()}`,
      name,
      description: draftAudienceDescription.value.trim() || undefined,
      mode: 'suggestions',
      segment: draftSegment.value,
      language: draftLanguage.value,
      filters: {
        user: {
          emailVerified: draftUserEmailVerified.value,
          doubleOptIn: draftUserDoubleOptIn.value,
          newsletter: draftUserNewsletter.value,
          blocked: draftUserBlocked.value,
        },
        org: {
          status: draftOrgStatus.value,
          hasWebsite: draftOrgHasWebsite.value,
          hasDescription: draftOrgHasDescription.value,
          excludeAquiseStatuses: [...draftOrgExcludeAquiseStatuses.value],
          excludeContactedWithinDays: draftOrgExcludeContactedWithinDays.value,
        },
      },
      manualAudienceText: '',
      createdAt: new Date().toISOString(),
    }
    audienceTemplates.value = [template, ...audienceTemplates.value].slice(0, 30)
    persistAudienceTemplates()
    selectedAudienceTemplateId.value = template.id
    selectedAudienceKey.value = `template:${template.id}`
    audienceMode.value = 'template'
  } else {
    selectedAudienceKey.value = `builtin:${draftSegment.value}`
  }

  showAudienceModal.value = false
}

function applyAudienceTemplate(templateId: string) {
  const template = audienceTemplates.value.find((it) => it.id === templateId)
  if (!template) return
  selectedAudienceTemplateId.value = templateId
  selectedAudienceKey.value = `template:${templateId}`
  audienceMode.value = 'template'
  segment.value = template.segment
  audienceLanguage.value = template.language
  manualAudienceText.value = template.manualAudienceText
  audienceUserEmailVerified.value = template.filters.user.emailVerified
  audienceUserDoubleOptIn.value = template.filters.user.doubleOptIn ?? 'all'
  audienceUserNewsletter.value = template.filters.user.newsletter
  audienceUserBlocked.value = template.filters.user.blocked
  audienceOrgStatus.value = template.filters.org.status
  audienceOrgHasWebsite.value = template.filters.org.hasWebsite
  audienceOrgHasDescription.value = template.filters.org.hasDescription
  audienceOrgExcludeAquiseStatuses.value = template.filters.org.excludeAquiseStatuses ?? []
  audienceOrgExcludeContactedWithinDays.value = template.filters.org.excludeContactedWithinDays ?? null
}

function deleteAudienceTemplate(templateId: string) {
  audienceTemplates.value = audienceTemplates.value.filter((it) => it.id !== templateId)
  persistAudienceTemplates()
  if (selectedAudienceTemplateId.value === templateId) {
    selectedAudienceTemplateId.value = ''
    selectedAudienceKey.value = 'builtin:ALL_FLUGPATEN'
    applyBuiltinAudience('ALL_FLUGPATEN')
  }
}

onMounted(() => {
  loadAudienceTemplatesFromStorage()
  selectedAudienceKey.value = 'builtin:ALL_FLUGPATEN'
  applyBuiltinAudience('ALL_FLUGPATEN')
})

function getSegmentLabel(value: Segment): string {
  const match = segments.find((s) => s.value === value)
  return match ? t(match.labelKey) : value
}

watch(
  () => props.active,
  (v) => {
    if (v) {
      loadMailSettings()
      loadAudiencePreview()
    }
  },
  { immediate: true }
)

watch([audienceMode, segment, audienceLanguage, selectedAudienceTemplateId, audienceUserEmailVerified, audienceUserDoubleOptIn, audienceUserNewsletter, audienceUserBlocked, audienceOrgStatus, audienceOrgHasWebsite, audienceOrgHasDescription, audienceOrgExcludeAquiseStatuses, audienceOrgExcludeContactedWithinDays], () => {
  loadAudiencePreview()
})

watch(manualAudienceText, () => {
  if (audienceMode.value === 'manual') loadManualAudiencePreview()
})
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 class="text-lg font-semibold text-slate-800 mb-1">{{ t('admin.mailing.title') }}</h2>
      <p class="text-slate-600 text-sm mb-4">{{ t('admin.mailing.description') }}</p>

      <div v-if="mailResult" class="mb-4 p-3 rounded text-sm" :class="mailResult.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'">
        {{ mailResult.text }}
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4 mb-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Schritt 1 · Zielgruppe</p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <select v-model="selectedAudienceKey" class="block w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" @change="handleAudienceSelectionChange">
              <option value="builtin:ALL_FLUGPATEN">Alle Flugpaten</option>
              <option value="builtin:ORG_ACCOUNT_HOLDERS">Organisations-Konten</option>
              <option value="builtin:APPROVED_ORG_CONTACT_EMAILS">Freigegebene Org-Kontakte</option>
              <option v-if="audienceTemplates.length > 0" disabled>────────</option>
              <option v-for="tpl in audienceTemplates" :key="tpl.id" :value="`template:${tpl.id}`">🗂 {{ tpl.name }}</option>
              <option disabled>────────</option>
              <option value="__create__">+ Neue Zielgruppe erstellen</option>
            </select>
          </div>
          <p v-if="audienceDescription" class="mt-1 text-xs text-slate-500">{{ audienceDescription }}</p>
        </div>

        <div v-if="audienceTemplates.length > 0" class="rounded-lg border border-slate-200 bg-white p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Gespeicherte Segmente</p>
          <div class="mt-2 overflow-x-auto rounded-lg border border-slate-100">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="bg-slate-50 text-left text-slate-600">
                  <th class="px-3 py-2 font-semibold">Name</th>
                  <th class="px-3 py-2 font-semibold">Segment</th>
                  <th class="px-3 py-2 font-semibold">Sprache</th>
                  <th class="px-3 py-2 font-semibold">Beschreibung</th>
                  <th class="px-3 py-2 font-semibold text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tpl in audienceTemplates" :key="tpl.id" class="border-t border-slate-100">
                  <td class="px-3 py-2 text-slate-800">{{ tpl.name }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ getSegmentLabel(tpl.segment) }}</td>
                  <td class="px-3 py-2 text-slate-700 uppercase">{{ tpl.language }}</td>
                  <td class="px-3 py-2 text-slate-600">{{ tpl.description || '–' }}</td>
                  <td class="px-3 py-2 text-right">
                    <div class="inline-flex items-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        @click="openAudienceEditModal(tpl.id)"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        @click="deleteAudienceTemplate(tpl.id)"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-semibold text-slate-800">Schritt 2 · Zielgruppen-Vorschau</p>
            <span class="text-xs rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
              {{ audiencePreviewTotal }} Empfänger
            </span>
          </div>

          <p v-if="audiencePreviewLoading" class="mt-2 text-xs text-slate-500">Lade Zielgruppe…</p>
          <p v-else-if="audiencePreviewError" class="mt-2 text-xs text-rose-700">{{ audiencePreviewError }}</p>
          <p v-else-if="audiencePreviewRows.length === 0" class="mt-2 text-xs text-slate-500">
            Keine Empfänger in dieser Zielgruppe.
          </p>

          <div v-else class="mt-3 overflow-x-auto rounded-lg border border-slate-100">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="bg-slate-50 text-left text-slate-600">
                  <th class="px-3 py-2 font-semibold">E-Mail</th>
                  <th class="px-3 py-2 font-semibold">Name</th>
                  <th class="px-3 py-2 font-semibold">Typ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in audiencePreviewRows" :key="row.email" class="border-t border-slate-100">
                  <td class="px-3 py-2 font-mono text-slate-700">{{ row.email }}</td>
                  <td class="px-3 py-2 text-slate-700">{{ row.name }}</td>
                  <td class="px-3 py-2 text-slate-600">{{ previewTypeLabel(row.type) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="audiencePreviewHasMore" class="mt-2 text-xs text-slate-500">
            Es werden die ersten 25 Empfänger angezeigt.
          </p>
        </div>
      </div>

      <div v-if="showAudienceModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div class="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-lg font-semibold text-slate-900">{{ editingAudienceTemplateId ? 'Segment bearbeiten' : 'Neue Zielgruppe' }}</h3>
            <button type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700" @click="showAudienceModal = false">Schließen</button>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Name der Zielgruppe *</span>
              <input v-model="draftAudienceName" type="text" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Sprache</span>
              <select v-model="draftLanguage" class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                <option value="all">Alle Sprachen</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
                <option value="pl">Polski</option>
              </select>
            </label>
            <label class="block md:col-span-2">
              <span class="text-sm font-medium text-slate-700">Beschreibung (optional)</span>
              <input v-model="draftAudienceDescription" type="text" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Segment</span>
              <select v-model="draftSegment" class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                <option v-for="s in segments" :key="s.value" :value="s.value">{{ t(s.labelKey) }}</option>
              </select>
            </label>
          </div>

          <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter</p>
            <div class="mt-2 grid gap-3 md:grid-cols-2">
              <label class="block"><span class="text-xs text-slate-600">Nutzer: E-Mail verifiziert</span><select v-model="draftUserEmailVerified" class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"><option value="all">Alle</option><option value="verified">Verifiziert</option><option value="unverified">Nicht verifiziert</option></select></label>
              <label class="block"><span class="text-xs text-slate-600">Nutzer: Double-Opt-In</span><select v-model="draftUserDoubleOptIn" class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"><option value="all">Alle</option><option value="only">Nur mit Double-Opt-In</option><option value="exclude">Double-Opt-In ausschließen</option></select></label>
              <label class="block"><span class="text-xs text-slate-600">Nutzer: Newsletter</span><select v-model="draftUserNewsletter" class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"><option value="all">Alle</option><option value="optIn">Opt-in</option><option value="optOut">Opt-out</option></select></label>
              <label class="block"><span class="text-xs text-slate-600">Nutzer: Sperrstatus</span><select v-model="draftUserBlocked" class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"><option value="exclude">Gesperrte ausschließen</option><option value="all">Alle</option><option value="only">Nur gesperrte</option></select></label>
              <label class="block"><span class="text-xs text-slate-600">Orgas: Status</span><select v-model="draftOrgStatus" class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"><option value="all">Alle</option><option value="APPROVED">APPROVED</option><option value="PENDING">PENDING</option><option value="CANCELLED">CANCELLED</option><option value="REJECTED">REJECTED</option></select></label>
              <label class="inline-flex items-center gap-2"><input v-model="draftOrgHasWebsite" type="checkbox" class="rounded border-slate-300" /><span class="text-xs text-slate-700">Orgas nur mit Website</span></label>
              <label class="inline-flex items-center gap-2"><input v-model="draftOrgHasDescription" type="checkbox" class="rounded border-slate-300" /><span class="text-xs text-slate-700">Orgas nur mit Beschreibung</span></label>
              <label class="block md:col-span-2">
                <span class="text-xs text-slate-600">Orga Aquise: Status ausschließen</span>
                <div class="mt-2 flex flex-wrap gap-2">
                  <label class="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"><input v-model="draftOrgExcludeAquiseStatuses" type="checkbox" value="nicht kontaktiert" class="rounded border-slate-300" />Nicht kontaktiert</label>
                  <label class="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"><input v-model="draftOrgExcludeAquiseStatuses" type="checkbox" value="kontaktiert" class="rounded border-slate-300" />Kontaktiert</label>
                  <label class="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"><input v-model="draftOrgExcludeAquiseStatuses" type="checkbox" value="keine antwort" class="rounded border-slate-300" />Keine Antwort</label>
                  <label class="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"><input v-model="draftOrgExcludeAquiseStatuses" type="checkbox" value="registriert" class="rounded border-slate-300" />Registriert</label>
                </div>
              </label>
              <label class="block md:col-span-2">
                <span class="text-xs text-slate-600">Orga Aquise: in den letzten X Tagen kontaktiert ausschließen</span>
                <input :value="draftOrgExcludeContactedWithinDays ?? ''" type="number" min="1" max="3650" class="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" placeholder="z.B. 14" @input="draftOrgExcludeContactedWithinDays = ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null" />
              </label>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
            <label v-if="!editingAudienceTemplateId" class="inline-flex items-center gap-2 text-sm text-slate-700">
              <input v-model="modalOnlyOnce" type="checkbox" class="rounded border-slate-300" />
              Nur einmal verwenden (nicht speichern)
            </label>
            <span v-else class="text-xs text-slate-500">Änderungen werden in diesem Segment gespeichert.</span>
            <button type="button" class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" @click="saveAudienceFromModal">
              {{ editingAudienceTemplateId ? 'Änderungen speichern' : (modalOnlyOnce ? 'Übernehmen' : 'Speichern als Zielgruppe') }}
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Schritt 3 · E-Mail schreiben & senden</p>
        <label class="block">
          <span class="text-sm font-medium text-slate-700">{{ t('admin.acquise.mailSubject') }}</span>
          <input v-model="mailSubject" type="text" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-slate-700">{{ t('admin.acquise.mailBody') }}</span>
          <textarea v-model="mailBody" rows="14" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono text-sm" :placeholder="t('admin.acquise.mailPlaceholder')" />
        </label>
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p class="text-sm font-semibold text-slate-800">Globaler E-Mail-Footer</p>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">{{ t('admin.acquise.mailFooter') }} (DE)</span>
            <textarea
              v-model="mailFooterTextDe"
              rows="2"
              class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm"
              :placeholder="t('admin.acquise.mailFooterPlaceholder')"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">{{ t('admin.acquise.mailFooter') }} (EN)</span>
            <textarea
              v-model="mailFooterTextEn"
              rows="2"
              class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm"
              placeholder="e.g. Your Name · your.email@example.com · +49 ..."
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Legacy / Fallback Footer-Text</span>
            <textarea
              v-model="mailFooterText"
              rows="2"
              class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm"
              :placeholder="t('admin.acquise.mailFooterPlaceholder')"
            />
          </label>
          <p class="mt-1 text-xs text-slate-500">{{ t('admin.acquise.mailFooterHint') }}</p>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Footer als HTML (DE, optional)</span>
            <textarea
              v-model="mailFooterHtmlDe"
              rows="5"
              class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm font-mono"
              placeholder="<p><strong>Dein Team</strong><br><a href='mailto:mail@domain.de'>mail@domain.de</a></p>"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Footer als HTML (EN, optional)</span>
            <textarea
              v-model="mailFooterHtmlEn"
              rows="5"
              class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm font-mono"
              placeholder="<p><strong>Your Team</strong><br><a href='mailto:mail@domain.com'>mail@domain.com</a></p>"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-slate-700">Legacy / Fallback Footer-HTML (optional)</span>
            <textarea
              v-model="mailFooterHtml"
              rows="5"
              class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm font-mono"
              placeholder="<p><strong>Dein Team</strong><br><a href='mailto:mail@domain.de'>mail@domain.de</a></p>"
            />
          </label>
          <p class="text-xs text-slate-500">
            Dieser Footer wird einheitlich für den gesamten einmaligen Versand verwendet.
          </p>
          <div class="mt-2 flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
              :disabled="savingMailSettings || loadingMailSettings"
              @click="saveMailSettings"
            >
              {{ savingMailSettings ? t('admin.acquise.mailSaving') : t('admin.acquise.mailSaveTemplate') }}
            </button>
            <span v-if="mailSettingsSaved" class="text-sm text-emerald-600">{{ t('admin.acquise.saved') }}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-slate-900 hover:bg-amber-600 disabled:opacity-50"
            :disabled="sendingMail"
            @click="sendBulk"
          >
            {{ sendingMail ? t('admin.acquise.mailSending') : t('admin.mailing.sendToSegment') }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            :disabled="sendingMail"
            @click="openTestPanel"
          >
            {{ t('admin.acquise.mailTestSend') }}
          </button>
        </div>

        <div v-if="showTestPanel" class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p class="text-sm font-medium text-slate-700">{{ t('admin.mailing.testIntro') }}</p>
          <label class="block text-sm">
            <span class="text-slate-600">{{ t('admin.mailing.testEmail') }}</span>
            <input v-model="testEmail" type="email" class="mt-1 block w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </label>
          <label class="block text-sm">
            <span class="text-slate-600">{{ t('admin.mailing.testNamePlaceholder') }}</span>
            <input v-model="testName" type="text" class="mt-1 block w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-amber-600 disabled:opacity-50"
              :disabled="sendingMail || !testEmail.trim()"
              @click="sendTest"
            >
              {{ t('admin.acquise.mailTestSubmit') }}
            </button>
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="showTestPanel = false">
              {{ t('admin.acquise.mailTestCancel') }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
