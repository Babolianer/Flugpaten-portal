/**
 * Generiert data/airports.json aus OpenFlights airports.dat
 * Download: https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat
 * Nutzung: node scripts/generate-airports.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      current += c
    } else if (c === ',') {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

async function main() {
  let content
  try {
    content = readFileSync(join(__dirname, '../data/airports.dat'), 'utf-8')
  } catch {
    console.log('Downloading airports.dat...')
    const res = await fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat')
    content = await res.text()
  }
  const lines = content.split('\n').filter(Boolean)
  const airports = []
  const seen = new Set()
  for (const line of lines) {
    const cols = parseLine(line)
    if (cols.length < 8) continue
    const [, name, city, country, iata, , latStr, lonStr] = cols
    const iataClean = (iata || '').trim()
    if (iataClean === '\\N' || !iataClean || iataClean.length !== 3) continue
    const lat = parseFloat(latStr)
    const lon = parseFloat(lonStr)
    if (isNaN(lat) || isNaN(lon)) continue
    const key = iataClean.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    airports.push({
      iata: key,
      name: (name || '').replace(/"/g, ''),
      city: (city || '').replace(/"/g, ''),
      country: (country || '').replace(/"/g, ''),
      lat: Math.round(lat * 10000) / 10000,
      lon: Math.round(lon * 10000) / 10000,
    })
  }
  const outPath = join(__dirname, '../data/airports.json')
  writeFileSync(outPath, JSON.stringify(airports, null, 0), 'utf-8')
  console.log(`Written ${airports.length} airports to ${outPath}`)
}

main().catch(console.error)
