const SPECIES_KEYS: Record<string, string> = {
  dog: 'map.speciesDog',
  cat: 'map.speciesCat',
  rabbit: 'map.speciesRabbit',
  guinea_pig: 'map.speciesGuineaPig',
  bird: 'map.speciesBird',
  reptile: 'map.speciesReptile',
  ferret: 'map.speciesFerret',
  other: 'map.speciesOther',
}

export function useSpeciesLabel() {
  const { t } = useI18n()
  const getSpeciesLabel = (species: string) => {
    const key = SPECIES_KEYS[species]
    return key ? t(key) : species
  }
  return { getSpeciesLabel }
}
