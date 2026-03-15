import type { Format, Color } from './types/card'

export const FORMAT_ORDER: readonly Format[] = [
  'standard', 'pioneer', 'modern', 'legacy', 'vintage',
  'commander', 'pauper', 'explorer', 'historic', 'timeless',
  'alchemy', 'brawl', 'oathbreaker', 'duel', 'gladiator',
  'penny', 'oldschool', 'premodern', 'future',
]

export const BRACKET_LABELS: Record<string, string> = {
  E: 'Extra Spicy',
  S: 'Spicy',
  R: 'Regular',
  P: 'Precon',
}

export function identityColors(identity: string): Color[] {
  return identity.split('') as Color[]
}
