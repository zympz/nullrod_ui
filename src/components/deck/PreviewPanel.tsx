import type { DeckCard, DeckCardPrices } from '../../types/deck'
import { cardPrice } from '../../utils/deckUtils'
import { frontFace, backFace } from '../../utils/cardName'
import styles from '../../pages/DeckPage.module.css'

interface PreviewPanelProps {
  hoveredCard: DeckCard | null
  previewFrontUrl: string | null
  previewBackUrl: string | null
  previewFace: number
  pricesMap: Map<string, DeckCardPrices>
  onFlip: () => void
}

export function PreviewPanel({ hoveredCard, previewFrontUrl, previewBackUrl, previewFace, pricesMap, onFlip }: PreviewPanelProps) {
  const isDfc = hoveredCard != null && hoveredCard.name.includes(' // ')
  const otherFaceName = hoveredCard ? (previewFace === 0 ? backFace(hoveredCard.name) : frontFace(hoveredCard.name)) : null

  const imgUrl = isDfc && previewFace === 1 ? (previewBackUrl ?? previewFrontUrl) : previewFrontUrl

  const usd = hoveredCard ? cardPrice(hoveredCard, pricesMap) : null
  const priceDisplay = usd != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(usd))
    : null

  return (
    <div className={styles.previewPanel}>
      {imgUrl ? (
        <img src={imgUrl} alt="Card preview" className={styles.previewImage} />
      ) : (
        <div className={styles.previewEmpty}>Hover a card to preview</div>
      )}
      {hoveredCard && (
        <div className={styles.previewMeta}>
          <span className={styles.previewPrice}>{priceDisplay ?? '—'}</span>
        </div>
      )}
      {isDfc && otherFaceName && (
        <button type="button" className={styles.flipBtn} onClick={onFlip}>
          ↻ {otherFaceName}
        </button>
      )}
    </div>
  )
}
