import { Link } from 'react-router-dom'
import type { OracleCard } from '../types/card'
import { ManaCost } from './ManaSymbol'
import styles from './CardList.module.css'

interface CardListProps {
  cards: OracleCard[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function CardList({ cards, total, page, pageSize, onPageChange }: CardListProps) {
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
          <span className={styles.colType}>Type</span>
          <span className={styles.colCmc}>CMC</span>
          <span className={styles.colMana}>Mana</span>
        </div>
        {cards.map((card) => (
          <div key={card.oracle_id} className={styles.row}>
            <span className={styles.colName}>
              <Link
                to={`/cards/${card.oracle_id}`}
                className={styles.nameLink}
              >
                {card.name}
              </Link>
            </span>
            <span className={styles.colType}>{card.type_line}</span>
            <span className={styles.colCmc}>{card.cmc}</span>
            <span className={styles.colMana}>
              {card.mana_cost && <ManaCost cost={card.mana_cost} size={14} />}
            </span>
          </div>
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
