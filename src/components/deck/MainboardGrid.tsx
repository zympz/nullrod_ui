import type { DeckCard } from '../../types/deck'
import type { SortMode } from '../../utils/deckUtils'
import { groupMainboard } from '../../utils/deckUtils'
import { TypeGroupBlock } from './TypeGroupBlock'
import styles from '../../pages/DeckPage.module.css'

interface MainboardGridProps {
  commanders: DeckCard[]
  cards: DeckCard[]
  isCommander: boolean
  sortMode: SortMode
  showPrices: boolean
  onCardClick: (name: string) => void
  onCardHover: (card: DeckCard | null) => void
  onCardFlip: (card: DeckCard) => void
}

export function MainboardGrid({ commanders, cards, isCommander, sortMode, showPrices, onCardClick, onCardHover, onCardFlip }: MainboardGridProps) {
  const groups = groupMainboard(commanders, cards)
  const lands = groups.find((g) => g.label === 'Lands')
  const nonLands = groups.filter((g) => g.label !== 'Lands')

  if (isCommander && lands) {
    return (
      <div className={styles.mainboardSplit}>
        <div className={styles.mainboardFlow}>
          {nonLands.map((group) => (
            <TypeGroupBlock key={group.label} group={group} sortMode={sortMode} showPrices={showPrices} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
          ))}
        </div>
        <div className={styles.mainboardLands}>
          <TypeGroupBlock group={lands} sortMode={sortMode} showPrices={showPrices} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.mainboardFlowFull}>
      {groups.map((group) => (
        <TypeGroupBlock key={group.label} group={group} sortMode={sortMode} showPrices={showPrices} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
      ))}
    </div>
  )
}
