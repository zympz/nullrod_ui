import type { OracleCard } from '../types/card'
import { CardTile } from './CardTile'
import styles from './CardGrid.module.css'

interface CardGridProps {
  cards: OracleCard[]
  total: number
  page: number
  pageSize: number
  onCardClick: (card: OracleCard) => void
  onPageChange: (page: number) => void
}

export function CardGrid({ cards, total, page, pageSize, onCardClick, onPageChange }: CardGridProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (cards.length === 0) {
    return <div className={styles.empty}>No cards found</div>
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>
        {total.toLocaleString()} cards — page {page} of {totalPages}
      </div>
      <div className={styles.grid}>
        {cards.map((card) => (
          <CardTile key={card.oracle_id} card={card} onClick={onCardClick} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
