export interface OrgLocation {
  id: string
  title: string
  city: string
  countryCode: string
  lat: number
  lng: number
}

export interface OrgListItem {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  locationCount: number
  locations: OrgLocation[]
}

export interface OrgsMapPin {
  id: string
  type: 'org'
  lat: number
  lng: number
  title?: string
  orgId?: string
  organization?: { name: string; slug: string }
}
