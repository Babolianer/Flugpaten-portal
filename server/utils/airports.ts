export interface Airport {
  id: string
  name: string
  code: string
  region?: string
  country: string
  lat: number
  lng: number
}

export const airportRegions: { id: string; label: string; airportIds: string[] }[] = [
  { id: 'de-south', label: 'Deutschland Süd', airportIds: ['MUC', 'STR', 'NUE', 'FKB'] },
  { id: 'de-all', label: 'Alle deutschen Flughäfen', airportIds: ['MUC', 'STR', 'NUE', 'FKB', 'FRA', 'BER', 'HAM', 'CGN', 'DUS', 'LEJ', 'HAJ', 'BRE', 'DRS', 'SCN'] },
  { id: 'cyprus', label: 'Zypern (Larnaka)', airportIds: ['LCA'] },
]

export const airports: Airport[] = [
  { id: 'MUC', name: 'München', code: 'MUC', region: 'Deutschland Süd', country: 'DE', lat: 48.3538, lng: 11.7751 },
  { id: 'STR', name: 'Stuttgart', code: 'STR', region: 'Deutschland Süd', country: 'DE', lat: 48.6899, lng: 9.2219 },
  { id: 'NUE', name: 'Nürnberg', code: 'NUE', country: 'DE', lat: 49.4987, lng: 11.0781 },
  { id: 'FKB', name: 'Karlsruhe/Baden-Baden', code: 'FKB', country: 'DE', lat: 48.7794, lng: 8.0805 },
  { id: 'FRA', name: 'Frankfurt', code: 'FRA', country: 'DE', lat: 50.0379, lng: 8.5622 },
  { id: 'TXL', name: 'Berlin Tegel (geschlossen)', code: 'TXL', country: 'DE', lat: 52.5597, lng: 13.2877 },
  { id: 'BER', name: 'Berlin Brandenburg', code: 'BER', country: 'DE', lat: 52.3622, lng: 13.5007 },
  { id: 'HAM', name: 'Hamburg', code: 'HAM', country: 'DE', lat: 53.6304, lng: 9.9882 },
  { id: 'CGN', name: 'Köln/Bonn', code: 'CGN', country: 'DE', lat: 50.8659, lng: 7.1427 },
  { id: 'DUS', name: 'Düsseldorf', code: 'DUS', country: 'DE', lat: 51.2895, lng: 6.7668 },
  { id: 'LEJ', name: 'Leipzig/Halle', code: 'LEJ', country: 'DE', lat: 51.4239, lng: 12.2364 },
  { id: 'HAJ', name: 'Hannover', code: 'HAJ', country: 'DE', lat: 52.4611, lng: 9.6851 },
  { id: 'BRE', name: 'Bremen', code: 'BRE', country: 'DE', lat: 53.0474, lng: 8.7867 },
  { id: 'DRS', name: 'Dresden', code: 'DRS', country: 'DE', lat: 51.1326, lng: 13.7672 },
  { id: 'SCN', name: 'Saarbrücken', code: 'SCN', country: 'DE', lat: 49.2146, lng: 7.1095 },
  { id: 'LCA', name: 'Larnaka (Zypern)', code: 'LCA', region: 'Zypern', country: 'CY', lat: 34.8751, lng: 33.6249 },
  { id: 'PFO', name: 'Paphos (Zypern)', code: 'PFO', country: 'CY', lat: 34.7180, lng: 32.4857 },
  { id: 'VIE', name: 'Wien', code: 'VIE', country: 'AT', lat: 48.1103, lng: 16.5697 },
  { id: 'ZRH', name: 'Zürich', code: 'ZRH', country: 'CH', lat: 47.4647, lng: 8.5492 },
  { id: 'MXP', name: 'Mailand Malpensa', code: 'MXP', country: 'IT', lat: 45.6301, lng: 8.7281 },
  { id: 'BCN', name: 'Barcelona', code: 'BCN', country: 'ES', lat: 41.2971, lng: 2.0785 },
  { id: 'MAD', name: 'Madrid', code: 'MAD', country: 'ES', lat: 40.4983, lng: -3.5676 },
  { id: 'LIS', name: 'Lissabon', code: 'LIS', country: 'PT', lat: 38.7813, lng: -9.1359 },
  { id: 'ATH', name: 'Athen', code: 'ATH', country: 'GR', lat: 37.9364, lng: 23.9445 },
  { id: 'JFK', name: 'New York JFK', code: 'JFK', country: 'US', lat: 40.6413, lng: -73.7781 },
  { id: 'LAX', name: 'Los Angeles', code: 'LAX', country: 'US', lat: 33.9425, lng: -118.4081 },
]

export function getAirportByCode(code: string): Airport | undefined {
  return airports.find((a) => a.code.toUpperCase() === code.toUpperCase())
}
