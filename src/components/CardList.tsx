import { Link } from 'react-router-dom'
import type { OracleCard } from '../types/card'
import { ManaCost } from './ManaSymbol'
import styles from './CardList.module.css'

interface CardListProps {
  cards: OracleCard[]
  total: number
  page: number
  pageSize: number
  onCardClick: (card: OracleCard) => void
  onPageChange: (page: number) => void
}

export function CardList({ cards, total, page, pageSize, onCardClick, onPageChange }: CardListProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (cards.length === 0) {
    return <div className={styles.empty}>No cards found</div>
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>
        {total.toLocaleString()} cards — page {page} of {totalPages}
      </div>
      <div className={styles.list}>
        <div className={styles.header}>
          <span className={styles.colName}>Name</span>
          <span className={styles.colMana}>Mana</span>
          <span className={styles.colType}>Type</span>
          <span className={styles.colStats}>P/T</span>
        </div>
        {cards.map((card) => (
          <button
            key={card.oracle_id}
            className={styles.row}
            onClick={() => onCardClick(card)}
            type="button"
          >
            <span className={styles.colName}>
              <Link
                to={`/cards/${card.oracle_id}`}
                className={styles.nameLink}
                onClick={(e) => e.stopPropagation()}
              >
                {card.name}
              </Link>
            </span>
            <span className={styles.colMana}>
              {card.mana_cost && <ManaCost cost={card.mana_cost} size={14} />}
            </span>
            <span className={styles.colType}>{card.type_line}</span>
            <span className={styles.colStats}>
              {card.power != null && card.toughness != null
                ? `${card.power}/${card.toughness}`
                : card.loyalty != null
                  ? card.loyalty
                  : ''}
            </span>
          </button>
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
