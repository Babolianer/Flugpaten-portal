export interface HubApplication {
  id: string
  status: string
  message: string | null
  applicationData: Record<string, unknown> | null
  attachmentPath: string | null
  createdAt: string
  user: {
    id: string
    displayName: string
    email: string
    profile: {
      city: string | null
      countryCode: string | null
      aboutMe: string | null
      languages: string[]
      frequentAirports: string[]
    } | null
  } | null
  conversationId: string | null
}

export interface HubTransportRequest {
  id: string
  title: string
  details: string | null
  status: string
  waitingListEnabled: boolean
  earliestDate: string
  latestDate: string
  originAirport: string
  destAirport: string
  originLat: number | null
  originLng: number | null
  destLat: number | null
  destLng: number | null
  destinations?: Array<{ airportCode: string }>
  animalCanFlyInCargo: boolean
  animalCanFlyInCabin: boolean
  animal: { id: string; name: string; species: string } | null
  groupId: string | null
  applications: HubApplication[]
}
