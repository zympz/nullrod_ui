import type { DeckCard, DeckFormat } from '../types/deck'
import type { OracleCard } from '../types/card'
import { frontFace } from './cardName'

export type SortMode = 'cmc' | 'name' | 'price'

export const COMMANDER_FORMATS: DeckFormat[] = ['commander', 'brawl', 'oathbreaker', 'duel']

export const TYPE_GROUPS = [
  { label: 'Commander', match: (_: DeckCard) => false as boolean },
  { label: 'Planeswalkers', match: (c: DeckCard) => c.type_line.includes('Planeswalker') },
  { label: 'Creatures', match: (c: DeckCard) => c.type_line.includes('Creature') },
  { label: 'Sorceries', match: (c: DeckCard) => c.type_line.includes('Sorcery') },
  { label: 'Instants', match: (c: DeckCard) => c.type_line.includes('Instant') },
  { label: 'Artifacts', match: (c: DeckCard) => c.type_line.includes('Artifact') && !c.type_line.includes('Creature') },
  { label: 'Enchantments', match: (c: DeckCard) => c.type_line.includes('Enchantment') && !c.type_line.includes('Creature') },
  { label: 'Lands', match: (c: DeckCard) => c.type_line.includes('Land') },
] as const

export const COLOR_META: Record<string, { label: string; symbol: string; bg: string }> = {
  W: { label: 'White', symbol: '{W}', bg: '#F9FAF4' },
  U: { label: 'Blue', symbol: '{U}', bg: '#0E68AB' },
  B: { label: 'Black', symbol: '{B}', bg: '#150B00' },
  R: { label: 'Red', symbol: '{R}', bg: '#D3202A' },
  G: { label: 'Green', symbol: '{G}', bg: '#00733E' },
  C: { label: 'Colorless', symbol: '{C}', bg: '#8888aa' },
}

export const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G', 'C']

export function cardPrice(card: DeckCard): string | null {
  return (card.foil ? card.prices?.usd_foil : null) ?? card.prices?.usd ?? null
}

export function groupMainboard(commanders: DeckCard[], cards: DeckCard[]): { label: string; cards: DeckCard[] }[] {
  const groups: { label: string; cards: DeckCard[] }[] = []
  const used = new Set<number>()

  if (commanders.length > 0) {
    groups.push({ label: 'Commander', cards: commanders })
  }

  for (const group of TYPE_GROUPS) {
    if (group.label === 'Commander') continue
    const matched: DeckCard[] = []
    cards.forEach((card, idx) => {
      if (!used.has(idx) && group.match(card)) {
        matched.push(card)
        used.add(idx)
      }
    })
    if (matched.length > 0) {
      groups.push({ label: group.label, cards: matched })
    }
  }

  const other = cards.filter((_, idx) => !used.has(idx))
  if (other.length > 0) {
    groups.push({ label: 'Other', cards: other })
  }

  return groups
}

export function groupByType(cards: DeckCard[]): { label: string; cards: DeckCard[] }[] {
  return groupMainboard([], cards)
}

export function sortCards(cards: DeckCard[], mode: SortMode): DeckCard[] {
  return [...cards].sort((a, b) => {
    if (mode === 'name') return frontFace(a.name).localeCompare(frontFace(b.name))
    if (mode === 'price') {
      const pa = parseFloat(cardPrice(a) ?? '-1')
      const pb = parseFloat(cardPrice(b) ?? '-1')
      return pb - pa
    }
    return a.cmc - b.cmc
  })
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type ColorDistEntry = {
  key: string; count: number; pct: number; avgCmc: number
  label: string; symbol: string; bg: string
}

export type ManaProdEntry = {
  key: string; count: number; pct: number
  label: string; symbol: string; bg: string
}

export type ManaCurveEntry = { label: string; count: number }

export type DeckAnalysis = {
  landCount: number; spellCount: number; totalCards: number
  spellBreakdown: { label: string; count: number }[]
  avgPower: number; avgToughness: number; creatureCount: number
  drawCount: number; interactionCount: number
  uniqueCards: number; totalSlots: number
}

export function getColorDistribution(cards: DeckCard[]): ColorDistEntry[] {
  const counts: Record<string, number> = {}
  const cmcTotals: Record<string, number> = {}
  const spells = cards.filter((c) => !c.type_line.includes('Land'))
  for (const card of spells) {
    if (card.colors.length === 0) {
      counts.C = (counts.C ?? 0) + card.quantity
      cmcTotals.C = (cmcTotals.C ?? 0) + card.cmc * card.quantity
    } else {
      for (const c of card.colors) {
        counts[c] = (counts[c] ?? 0) + card.quantity
        cmcTotals[c] = (cmcTotals[c] ?? 0) + card.cmc * card.quantity
      }
    }
  }
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  if (total === 0) return []
  return COLOR_ORDER
    .filter((c) => (counts[c] ?? 0) > 0)
    .map((c) => ({
      key: c, count: counts[c], pct: Math.round((counts[c] / total) * 100),
      avgCmc: counts[c] > 0 ? cmcTotals[c] / counts[c] : 0,
      ...COLOR_META[c],
    }))
}

export function getManaProduction(cards: DeckCard[]): ManaProdEntry[] {
  const lands = cards.filter((c) => c.type_line.includes('Land'))
  const counts: Record<string, number> = {}
  for (const land of lands) {
    if (land.color_identity.length === 0) {
      counts.C = (counts.C ?? 0) + land.quantity
    } else {
      for (const c of land.color_identity) {
        counts[c] = (counts[c] ?? 0) + land.quantity
      }
    }
  }
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  if (total === 0) return []
  return COLOR_ORDER
    .filter((c) => (counts[c] ?? 0) > 0)
    .map((c) => ({
      key: c, count: counts[c], pct: Math.round((counts[c] / total) * 100),
      ...COLOR_META[c],
    }))
}

export function getManaCurve(cards: DeckCard[]): ManaCurveEntry[] {
  const buckets: Record<string, number> = {}
  for (const card of cards) {
    if (card.type_line.includes('Land')) continue
    const key = card.cmc >= 6 ? '6+' : String(Math.floor(card.cmc))
    buckets[key] = (buckets[key] ?? 0) + card.quantity
  }
  const labels = ['0', '1', '2', '3', '4', '5', '6+']
  return labels.map((l) => ({ label: l, count: buckets[l] ?? 0 }))
}

export function getDeckAnalysis(cards: DeckCard[]): DeckAnalysis {
  const totalCards = cards.reduce((s, c) => s + c.quantity, 0)
  const lands = cards.filter((c) => c.type_line.includes('Land'))
  const landCount = lands.reduce((s, c) => s + c.quantity, 0)
  const spellCount = totalCards - landCount

  const spellTypes = [
    { label: 'Creatures', match: (c: DeckCard) => c.type_line.includes('Creature') },
    { label: 'Planeswalkers', match: (c: DeckCard) => c.type_line.includes('Planeswalker') && !c.type_line.includes('Creature') },
    { label: 'Instants', match: (c: DeckCard) => c.type_line.includes('Instant') },
    { label: 'Sorceries', match: (c: DeckCard) => c.type_line.includes('Sorcery') },
    { label: 'Artifacts', match: (c: DeckCard) => c.type_line.includes('Artifact') && !c.type_line.includes('Creature') },
    { label: 'Enchantments', match: (c: DeckCard) => c.type_line.includes('Enchantment') && !c.type_line.includes('Creature') },
  ]
  const used = new Set<number>()
  const spellBreakdown: { label: string; count: number }[] = []
  const nonLands = cards.filter((c) => !c.type_line.includes('Land'))
  for (const type of spellTypes) {
    let count = 0
    nonLands.forEach((card, idx) => {
      if (!used.has(idx) && type.match(card)) { count += card.quantity; used.add(idx) }
    })
    if (count > 0) spellBreakdown.push({ label: type.label, count })
  }
  const otherSpells = nonLands.filter((_, idx) => !used.has(idx)).reduce((s, c) => s + c.quantity, 0)
  if (otherSpells > 0) spellBreakdown.push({ label: 'Other', count: otherSpells })

  const creatures = cards.filter((c) => c.type_line.includes('Creature'))
  let totalPower = 0, totalToughness = 0, creatureCount = 0
  for (const c of creatures) {
    const p = parseFloat(c.power ?? ''); const t = parseFloat(c.toughness ?? '')
    if (!isNaN(p) && !isNaN(t)) { totalPower += p * c.quantity; totalToughness += t * c.quantity; creatureCount += c.quantity }
  }

  const drawPatterns = /\bdraw|draws\b/i
  const interactionPatterns = /\bdestroy|destroys|exile|exiles|counter target\b/i
  let drawCount = 0, interactionCount = 0
  for (const card of cards) {
    if (card.type_line.includes('Land')) continue
    const text = card.oracle_text ?? ''
    if (drawPatterns.test(text)) drawCount += card.quantity
    if (interactionPatterns.test(text)) interactionCount += card.quantity
  }

  return {
    landCount, spellCount, totalCards, spellBreakdown,
    avgPower: creatureCount > 0 ? totalPower / creatureCount : 0,
    avgToughness: creatureCount > 0 ? totalToughness / creatureCount : 0,
    creatureCount, drawCount, interactionCount,
    uniqueCards: cards.length, totalSlots: totalCards,
  }
}

/** P(at least 1 success in `drawn` cards) via hypergeometric distribution */
export function pAtLeastOne(deckSize: number, successes: number, drawn: number): number {
  if (successes <= 0 || drawn <= 0 || deckSize <= 0) return 0
  let p0 = 1
  for (let i = 0; i < drawn; i++) {
    p0 *= (deckSize - successes - i) / (deckSize - i)
    if (p0 <= 0) return 1
  }
  return 1 - p0
}

export function drawSampleHand(cards: DeckCard[], count = 7): DeckCard[] {
  const pool: DeckCard[] = []
  for (const card of cards) {
    for (let i = 0; i < card.quantity; i++) pool.push(card)
  }
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

/** Find the best matching oracle card for a deck card name from search results. */
export function pickOracleCard(name: string, results: OracleCard[]): OracleCard | undefined {
  return results.find((c) => c.name === name || c.name.startsWith(frontFace(name) + ' // '))
    ?? results.find((c) => c.name === frontFace(name))
    ?? results[0]
}
