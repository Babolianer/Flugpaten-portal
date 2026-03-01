export type RequestStatusValue = 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED'

export function useRequestStatus() {
  const { t } = useI18n()

  function getRequestStatusLabel(status: string, publicContext = false): string {
    const key = (publicContext && status === 'MATCHED' ? 'requestStatus.MATCHED_PUBLIC' : `requestStatus.${status}`) as const
    const translated = t(key)
    return translated !== key ? translated : status
  }

  const statusOptions = computed(() => [
    { value: 'OPEN' as const, label: t('requestStatus.OPEN') },
    { value: 'MATCHED' as const, label: t('requestStatus.MATCHED') },
    { value: 'COMPLETED' as const, label: t('requestStatus.COMPLETED') },
    { value: 'CANCELLED' as const, label: t('requestStatus.CANCELLED') },
  ])

  return { getRequestStatusLabel, statusOptions }
}
