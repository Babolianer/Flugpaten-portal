/** Variable names without braces; matches {{key}} in templates. */
export const PLACEHOLDER_GROUPS = [
  { cat: 'user', keys: ['userDisplayName', 'userEmail'] as const },
  { cat: 'org', keys: ['orgName', 'orgSlug', 'orgContactEmail', 'orgUserEmail'] as const },
  { cat: 'request', keys: ['requestTitle', 'originAirport', 'destAirport', 'applicantMessage'] as const },
  { cat: 'links', keys: ['inboxUrl', 'requestUrl', 'appUrl', 'adminUrl'] as const },
  { cat: 'auth', keys: ['verifyUrl', 'resetUrl'] as const },
  { cat: 'system', keys: ['loginAt'] as const },
] as const

export type PlaceholderVarKey = (typeof PLACEHOLDER_GROUPS)[number]['keys'][number]

export function placeholderCode(key: string): string {
  return `{{${key}}}`
}
