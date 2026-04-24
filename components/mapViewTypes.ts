export interface MapViewPin {
  id: string
  type: 'request' | 'org'
  lat: number
  lng: number
  title?: string
  requestId?: string
  orgId?: string
  organization?: { name: string; slug: string }
  animal?: { name: string; species: string }
  matchType?: 'DIRECT' | 'RADIUS' | 'COUNTRY'
  distanceKm?: number
}

export interface MapViewConnection {
  from: [number, number]
  to: [number, number]
}

/** Bei ausgewählter Route: Start- und Zielpunkt markieren und gestrichelt verbinden */
export interface SelectedRoute {
  from: [number, number]
  to: [number, number]
}
